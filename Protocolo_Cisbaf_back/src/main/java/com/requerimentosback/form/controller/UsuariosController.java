package com.requerimentosback.form.controller;

import com.requerimentosback.form.model.Usuarios;
import com.requerimentosback.form.service.UsuariosService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UsuariosController {

    private final UsuariosService service;

    @GetMapping
    public List<Usuarios> findAll() {
        return service.findAll();
    }

    @GetMapping("/{cpf}")
    public ResponseEntity<Usuarios> findById(@PathVariable String cpf) {
        return service.findById(cpf)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Usuarios save(@RequestBody Usuarios usuario) {
        return service.save(usuario);
    }

    @PutMapping("/{cpf}")
    public ResponseEntity<Usuarios> update(@PathVariable String cpf, @RequestBody Usuarios usuario) {
        try {
            return ResponseEntity.ok(service.update(cpf, usuario));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{cpf}")
    public ResponseEntity<Void> deleteById(@PathVariable String cpf) {
        service.deleteById(cpf);
        return ResponseEntity.noContent().build();
    }
}
