package com.requerimentosback.form.service;

import com.requerimentosback.form.model.Usuarios;
import com.requerimentosback.form.model.enuns.TipoDocumento;
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

    public Optional<Usuarios> findByIdAndIdentificacao(
            String documento,
            TipoDocumento tipoDocumento,
            String nome,
            String sobrenome,
            String nomeFantasia
    ) {
        return repository.findById(documento).filter(usuario -> {
            TipoDocumento tipoEfetivo = usuario.getTipoDocumentoEfetivo();
            if (tipoDocumento != null && tipoDocumento != tipoEfetivo) return false;

            if (tipoEfetivo == TipoDocumento.CNPJ) {
                String fantasiaCadastrada = usuario.getNomeFantasia() != null
                        ? usuario.getNomeFantasia()
                        : usuario.getNome();
                return iguaisIgnorandoCaixa(fantasiaCadastrada, nomeFantasia);
            }
            return iguaisIgnorandoCaixa(usuario.getNome(), nome)
                    && iguaisIgnorandoCaixa(usuario.getSobrenome(), sobrenome);
        });
    }

    private boolean iguaisIgnorandoCaixa(String primeiro, String segundo) {
        return primeiro != null && segundo != null && primeiro.trim().equalsIgnoreCase(segundo.trim());
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
