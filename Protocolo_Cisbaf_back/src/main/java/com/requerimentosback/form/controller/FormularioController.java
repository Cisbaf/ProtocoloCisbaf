package com.requerimentosback.form.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.requerimentosback.form.model.*;
import com.requerimentosback.form.model.enuns.TipoGrafico;
import com.requerimentosback.form.model.enuns.Unidades;
import com.requerimentosback.form.service.CepClient;
import com.requerimentosback.form.service.FormularioService;
import com.requerimentosback.form.service.MensagemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.Principal;
import java.util.Date;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/form")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FormularioController {

    private final FormularioService service;
    private final MensagemService mensagemService;
    private final CepClient cepClient;

    @Value("${app.upload.dir:./uploads}")
    private String diretorioUpload;

    @GetMapping
    public List<Formulario> findAll() {
        return service.findAll();
    }

    @GetMapping("/admin")
    public List<Formulario> findAllAdmin(Principal principal) {
        return service.findByAdmin(principal);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Formulario> findById(@PathVariable String id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/cep/{cep}")
    public ResponseEntity<CepResponse> findAddress(@PathVariable String cep) {
        return ResponseEntity.ok(cepClient.findAddress(cep));
    }

    @GetMapping("/graficos")
    public ResponseEntity<List<DadoGraficoDTO>> obterDadosGrafico(
            @RequestParam TipoGrafico tipo,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date inicio,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date fim,
            @RequestParam(required = false) String unidade // Recebe como ‘String’ porque pode vir "all"
    ) {
        Unidades filtroUnidade = (unidade != null && !unidade.equals("all"))
                ? Unidades.valueOf(unidade)
                : null;

        List<DadoGraficoDTO> dados = service.buscarDadosParaGrafico(tipo, inicio, fim, filtroUnidade);
        return ResponseEntity.ok(dados);
    }

    @GetMapping("/arquivos/download/{nomeArquivo:.+}")
    public ResponseEntity<Resource> baixarArquivo(@PathVariable String nomeArquivo) {
        try {
            log.info("Baixando arquivo {}", nomeArquivo);
            String nomeDecodificado = URLDecoder.decode(nomeArquivo, StandardCharsets.UTF_8);
            log.info("Baixando arquivo {}", nomeDecodificado);

            Path raiz = Paths.get(diretorioUpload).toAbsolutePath().normalize();
            Path caminhoArquivo = raiz.resolve(nomeDecodificado).normalize();

            System.out.println("Tentando ler o arquivo no caminho: " + caminhoArquivo.toAbsolutePath());

            Resource resource = new UrlResource(caminhoArquivo.toUri());

            if (!resource.exists()) {
                System.out.println("ERRO: O arquivo não existe nesse caminho!");
                return ResponseEntity.notFound().build();
            }

            // Tenta descobrir o tipo do arquivo (PDF, JPG, DOCX, etc)
            String contentType = Files.probeContentType(caminhoArquivo);
            if (contentType == null) {
                contentType = "application/octet-stream";
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                    .body(resource);

        } catch (Exception e) {
            System.out.println("Erro interno ao baixar: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> save(
            @RequestPart("formulario") String formularioJson,
            @RequestPart(value = "arquivo", required = false) MultipartFile arquivo) {

        try {
            ObjectMapper mapper = new ObjectMapper();
            Formulario formulario = mapper.readValue(formularioJson, Formulario.class);

            return ResponseEntity.ok(service.save(formulario, arquivo));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));

        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            e.getMostSpecificCause();
            String msg = e.getMostSpecificCause().getMessage();
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "Erro de integridade (banco de dados): " + msg));

        } catch (Exception e) {
            Throwable rootCause = e;

            while (rootCause != null) {
                if (rootCause instanceof jakarta.validation.ConstraintViolationException constraintEx) {
                    throw constraintEx;
                }
                rootCause = rootCause.getCause();
            }

            return ResponseEntity.internalServerError().body(java.util.Map.of("error", "Erro interno no servidor: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Formulario> update(@PathVariable String id, @RequestBody Formulario formulario) {
        try {
            System.out.println(formulario.toString());
            return ResponseEntity.ok(service.update(id, formulario));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteById(@PathVariable String id) {
        service.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ── Endpoints de Chat ─────────────────────────────────────────────────────

    @GetMapping("/{id}/mensagens")
    public ResponseEntity<List<Mensagem>> listarMensagens(@PathVariable String id) {
        return ResponseEntity.ok(mensagemService.listarPorFormulario(id));
    }

    @PostMapping("/{id}/mensagens")
    public ResponseEntity<Mensagem> enviarMensagem(
            @PathVariable String id,
            @RequestBody @Valid MensagemRequestDTO dto) {
        try {
            return ResponseEntity.ok(mensagemService.enviar(id, dto));
        } catch (jakarta.persistence.EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
