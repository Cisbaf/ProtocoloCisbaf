package com.requerimentosback.form.service;

import com.requerimentosback.form.model.Usuarios;
import com.requerimentosback.form.repository.UsuariosRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UsuariosService {

    private final UsuariosRepository repository;

    public List<Usuarios> findAll() {
        return repository.findAll();
    }

    public Optional<Usuarios> findById(String cpf) {
        return repository.findById(cpf);
    }

    public Optional<Usuarios> findByIdAndNomeAndSobrenome(String cpf, String nome, String sobrenome) {
        return repository.findByCpfAndNomeAndSobrenome(cpf, nome.trim(), sobrenome.trim());

    }

    public Usuarios save(Usuarios usuario) {

        return repository.save(usuario);
    }

    public void deleteById(String cpf) {
        repository.deleteById(cpf);
    }

    public Usuarios update(String cpf, Usuarios updatedUsuario) {
        return repository.findById(cpf)
                .map(existing -> {
                    updatedUsuario.setCpf(cpf);
                    return repository.save(updatedUsuario);
                })
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
    }
}
