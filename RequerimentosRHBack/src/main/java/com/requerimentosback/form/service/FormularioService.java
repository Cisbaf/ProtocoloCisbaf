package com.requerimentosback.form.service;

import com.requerimentosback.admin.repository.AdminRepository;
import com.requerimentosback.form.model.Formulario;
import com.requerimentosback.form.model.Usuarios;
import com.requerimentosback.form.model.enuns.Unidades;
import com.requerimentosback.form.repository.FormularioRepository;
import com.requerimentosback.form.repository.UsuariosRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.Date;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class FormularioService {

    private final FormularioRepository repository;
    private final UsuariosRepository usuariosRepository;
    private final DiscoService discoService;
    private final EmailService emailService;
    private final AdminRepository adminRepository;

    public List<Formulario> findAll() {
        return repository.findAll();
    }

    public Optional<Formulario> findById(String id) {
        return repository.findById(id);
    }

    @Transactional
    public Formulario save(Formulario formulario, MultipartFile arquivo) {

        if (arquivo != null && !arquivo.isEmpty()) {
            String nomeArquivo = discoService.salvarArquivo(arquivo);
            formulario.setArquivoPath(nomeArquivo);
        }

        Usuarios usuarioRequest = formulario.getUsuario();

        Usuarios usuario = usuariosRepository
                .findById(usuarioRequest.getCpf())
                .map(usuarioExistente -> {
                    usuarioExistente.setNome(usuarioRequest.getNome());
                    usuarioExistente.setSobrenome(usuarioRequest.getSobrenome());
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
                    usuarioExistente.setEndereco(usuarioRequest.getEndereco());
                    return usuariosRepository.save(usuarioExistente);
                })
                .orElseGet(() -> usuariosRepository.save(usuarioRequest));

        formulario.setUsuario(usuario);
        formulario.setDataCriacao(new Date());

        formulario = repository.saveAndFlush(formulario);

        emailService.enviarEmailNovoFormulario(formulario);

        return formulario;
    }

    public void deleteById(String id) {
        repository.deleteById(id);
    }

    @Transactional
    public Formulario update(String id, Formulario formDaRequisicao) {
        Formulario existing = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Formulário não encontrado para o ID: " + id));

        existing.setAssunto(formDaRequisicao.getAssunto() != null ? formDaRequisicao.getAssunto() : existing.getAssunto());
        existing.setBeneficio(formDaRequisicao.getBeneficio() != null ? formDaRequisicao.getBeneficio() : existing.getBeneficio());
        existing.setDescricao(formDaRequisicao.getDescricao() != null ? formDaRequisicao.getDescricao() : existing.getDescricao());
        existing.setPrioridade(formDaRequisicao.getPrioridade() != null ? formDaRequisicao.getPrioridade() : existing.getPrioridade());
        existing.setConfirmacao(formDaRequisicao.getConfirmacao() != null ? formDaRequisicao.getConfirmacao() : existing.getConfirmacao());
        existing.setMotivo(formDaRequisicao.getMotivo() != null ? formDaRequisicao.getMotivo() : existing.getMotivo());
        existing.setArquivoPath(formDaRequisicao.getArquivoPath() != null ? formDaRequisicao.getArquivoPath() : existing.getArquivoPath());
        existing.setUnidade(formDaRequisicao.getUnidade() != null ? formDaRequisicao.getUnidade() : existing.getUnidade());

        var salvo = repository.save(existing);

        if (salvo.getConfirmacao() != null) {
            try {
                emailService.enviarEmailFinalizacaoFormulario(salvo);
            } catch (Exception e) {
                log.error("Erro ao enviar email de finalização para o form {}", id, e);
            }
        }

        return salvo;
    }

    public List<Formulario> findByAdmin(Principal principal) {
        var admin = adminRepository.findByUsername(principal.getName()).orElseThrow(EntityNotFoundException::new);
        var baseName = admin.getBase();

        if (baseName == Unidades.ADMIN) {
            return repository.findAll();
        }
        return repository.findByUnidade(baseName);
    }
}