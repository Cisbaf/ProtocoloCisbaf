package com.requerimentosback.form.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class DiscoService {

    // Define onde os arquivos vão ficar (ex: pasta 'uploads' na raiz do projeto)
    private final Path raiz = Paths.get("uploads");

    public String salvarArquivo(MultipartFile arquivo) {
        try {
            // Cria a pasta se não existir
            if (!Files.exists(raiz)) Files.createDirectory(raiz);

            // Gera um nome único pra não sobrescrever
            String nomeArquivo = UUID.randomUUID() + "_" + arquivo.getOriginalFilename();
            Files.copy(arquivo.getInputStream(), this.raiz.resolve(nomeArquivo));

            return nomeArquivo; // Retorna o nome pra salvar no banco
        } catch (IOException e) {
            throw new RuntimeException("Erro ao salvar arquivo localmente", e);
        }
    }

}