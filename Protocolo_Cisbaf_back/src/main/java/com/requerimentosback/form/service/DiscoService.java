package com.requerimentosback.form.service;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.attribute.BasicFileAttributes;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Service
public class DiscoService {

    // Define onde os arquivos vão ficar (ex: pasta 'uploads' na raiz do projeto)
    @Value("${app.upload.dir:./uploads}")
    private String diretorioUpload;
    private Path raiz;

    @PostConstruct
    public void init() {
        this.raiz = Paths.get(diretorioUpload).toAbsolutePath().normalize();
        try {
            if (!Files.exists(raiz)) {
                Files.createDirectories(raiz);
            }
        } catch (IOException e) {
            throw new RuntimeException("Erro ao criar o diretório de uploads", e);
        }
    }

    public String salvarArquivo(MultipartFile arquivo) {
        try {
            String nomeArquivo = UUID.randomUUID() + "_" + arquivo.getOriginalFilename();
            Path caminhoDestino = this.raiz.resolve(nomeArquivo).normalize();

            Files.copy(arquivo.getInputStream(), caminhoDestino);

            return nomeArquivo;
        } catch (IOException e) {
            throw new RuntimeException("Erro ao salvar arquivo localmente", e);
        }
    }

    @Scheduled(cron = "0 0 0 * * ?")
    @EventListener(ApplicationReadyEvent.class)
    public void comprimirArquivosAntigos() {
        Path raiz = Paths.get(diretorioUpload).toAbsolutePath().normalize();

        // Define o limite de tempo: arquivos criados há mais de 90 dias
        Instant limiteTempo = Instant.now().minus(90, ChronoUnit.DAYS);

        // Nome do arquivo zip baseado no mês anterior para organização
        String sufixoMes = LocalDate.now().minusMonths(1).format(DateTimeFormatter.ofPattern("yyyy-MM"));
        Path caminhoZip = raiz.resolve("backup_arquivos_" + sufixoMes + ".zip");

        try (DirectoryStream<Path> stream = Files.newDirectoryStream(raiz)) {

            // Abre o arquivo Zip para escrita
            try (ZipOutputStream zos = new ZipOutputStream(new FileOutputStream(caminhoZip.toFile()))) {
                boolean temArquivoParaCompactar = false;

                for (Path arquivo : stream) {
                    // Ignora subpastas e arquivos .zip já criados anteriormente
                    if (Files.isDirectory(arquivo) || arquivo.toString().endsWith(".zip")) {
                        continue;
                    }

                    // Verifica a data de criação/modificação do arquivo
                    BasicFileAttributes attrs = Files.readAttributes(arquivo, BasicFileAttributes.class);
                    Instant tempoModificacao = attrs.lastModifiedTime().toInstant();

                    if (tempoModificacao.isBefore(limiteTempo)) {
                        temArquivoParaCompactar = true;

                        // Adiciona o arquivo no ZIP
                        ZipEntry zipEntry = new ZipEntry(arquivo.getFileName().toString());
                        zos.putNextEntry(zipEntry);
                        Files.copy(arquivo, zos);
                        zos.closeEntry();

                        // Remove o arquivo original com segurança após compactá-lo
                        Files.delete(arquivo);
                    }
                }
            }

        } catch (IOException e) {
            // Em produção, use um Logger estruturado (ex: LoggerFactory.getLogger)
            System.err.println("Erro ao processar rotina de compressão de arquivos: " + e.getMessage());
        }
    }
}