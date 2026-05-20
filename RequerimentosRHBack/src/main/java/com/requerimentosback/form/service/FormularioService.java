package com.requerimentosback.form.service;

import com.requerimentosback.form.model.Formulario;
import com.requerimentosback.form.model.Usuarios;
import com.requerimentosback.form.repository.FormularioRepository;
import com.requerimentosback.form.repository.UsuariosRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class FormularioService {

    private final FormularioRepository repository;
    private final UsuariosRepository usuariosRepository;
    private final DiscoService discoService;


    public List<Formulario> findAll() {
        return repository.findAll();
    }

    public Optional<Formulario> findById(String id) {
        return repository.findById(id);
    }

    @Transactional
    public Formulario save(Formulario formulario, MultipartFile arquivo) {

        // 1. Salva o arquivo primeiro e pega o nome/caminho
        if (arquivo != null && !arquivo.isEmpty()) {
            String nomeArquivo = discoService.salvarArquivo(arquivo);
            formulario.setArquivoPath(nomeArquivo); // Seta o nome no campo da entidade
        }

        Usuarios usuarioRequest = formulario.getUsuario();

        Usuarios usuario = usuariosRepository
                .findById(usuarioRequest.getCpf())
                .map(usuarioExistente -> {

                    usuarioExistente.setNome(usuarioRequest.getNome());
                    usuarioExistente.setRg(usuarioRequest.getRg());
                    usuarioExistente.setDataNascimento(usuarioRequest.getDataNascimento());
                    usuarioExistente.setSexo(usuarioRequest.getSexo());
                    usuarioExistente.setEmail(usuarioRequest.getEmail());
                    usuarioExistente.setTelefone(usuarioRequest.getTelefone().replaceAll("\\D", ""));
                    usuarioExistente.setCelular(usuarioRequest.getCelular().replaceAll("\\D", ""));
                    usuarioExistente.setEmailAlt(usuarioRequest.getEmailAlt());
                    usuarioExistente.setMatricula(usuarioRequest.getMatricula());
                    usuarioExistente.setCargo(usuarioRequest.getCargo());
                    usuarioExistente.setCor(usuarioRequest.getCor());
                    usuarioExistente.setUnidade(usuarioRequest.getUnidade());
                    usuarioExistente.setEndereco(usuarioRequest.getEndereco());

                    return usuariosRepository.save(usuarioExistente);
                })
                .orElseGet(() -> usuariosRepository.save(usuarioRequest));

        formulario.setUsuario(usuario);

        return repository.save(formulario);
    }

    public void deleteById(String id) {
        repository.deleteById(id);
    }

    public Formulario update(String id, Formulario updatedFormulario) {
        return repository.findById(id)
                .map(existing -> {
                    updatedFormulario.setId(id);
                    return repository.save(updatedFormulario);
                })
                .orElseThrow(() -> new RuntimeException("Formulário não encontrado"));
    }
}
