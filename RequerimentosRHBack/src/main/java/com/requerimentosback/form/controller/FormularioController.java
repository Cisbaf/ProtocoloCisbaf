package com.requerimentosback.form.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.requerimentosback.form.model.CepResponse;
import com.requerimentosback.form.model.Formulario;
import com.requerimentosback.form.service.CepClient;
import com.requerimentosback.form.service.FormularioService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
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
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/form")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FormularioController {

    private final FormularioService service;
    private final CepClient cepClient;
    private final Path raiz = Paths.get("uploads");


    @GetMapping
    public List<Formulario> findAll() {
        return service.findAll();
    }

    @GetMapping("/admin")
    public List<Formulario> findAllAdmin(Principal  principal) {
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

    @GetMapping("/arquivos/download/{nomeArquivo:.+}")
    public ResponseEntity<Resource> baixarArquivo(@PathVariable String nomeArquivo) {
        try {
            // 1. Decodifica a URL (Transforma os %20 de volta em espaços e ajusta o 'ç')
            log.info("Baixando arquivo {}", nomeArquivo);
            String nomeDecodificado = URLDecoder.decode(nomeArquivo, StandardCharsets.UTF_8);
            log.info("Baixando arquivo {}", nomeDecodificado);

            // 2. Monta o caminho do arquivo
            Path caminhoArquivo = Paths.get(raiz.toString()).resolve(nomeDecodificado).normalize();

            // 🚨 DEBUG: Isso vai aparecer no console do seu Spring Boot!
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
    public ResponseEntity<Formulario> save(
            @RequestPart("formulario") String formularioJson,
            @RequestPart(value = "arquivo", required = false) MultipartFile arquivo) throws JsonProcessingException {

        // Converte a String JSON que veio do front pro objeto Formulario
        ObjectMapper mapper = new ObjectMapper();
        Formulario formulario = mapper.readValue(formularioJson, Formulario.class);

        return ResponseEntity.ok(service.save(formulario, arquivo));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Formulario> update(@PathVariable String id, @RequestBody Formulario formulario) {
        try {
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
}
