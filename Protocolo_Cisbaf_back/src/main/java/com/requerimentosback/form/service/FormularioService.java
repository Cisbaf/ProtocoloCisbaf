package com.requerimentosback.form.service;

import com.requerimentosback.admin.repository.AdminRepository;
import com.requerimentosback.form.model.DadoGraficoDTO;
import com.requerimentosback.form.model.Formulario;
import com.requerimentosback.form.model.Usuarios;
import com.requerimentosback.form.model.enuns.FinArq;
import com.requerimentosback.form.model.enuns.TipoGrafico;
import com.requerimentosback.form.model.enuns.Unidades;
import com.requerimentosback.form.repository.FormularioRepository;
import com.requerimentosback.form.repository.MensagemRepository;
import com.requerimentosback.form.repository.UsuariosRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.time.LocalDateTime;
import java.time.ZoneId;
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
    private final MensagemRepository mensagemRepository;

    public List<Formulario> findAll() {
        return repository.findAll();
    }

    public Optional<Formulario> findById(String id) {
        return repository.findById(id);
    }

    @Transactional
    public Formulario save(Formulario formulario, List<MultipartFile> arquivos) {

        if (arquivos != null && !arquivos.isEmpty()) {
            java.util.List<String> nomesArquivos = new java.util.ArrayList<>();
            for (MultipartFile arquivo : arquivos) {
                if (arquivo != null && !arquivo.isEmpty()) {
                    nomesArquivos.add(discoService.salvarArquivo(arquivo));
                }
            }
            if (!nomesArquivos.isEmpty()) {
                formulario.setArquivoPath(String.join(";", nomesArquivos));
            }
        }

        Usuarios usuarioRequest = formulario.getUsuario();

        Usuarios usuario = usuariosRepository
                .findById(usuarioRequest.getCpf())
                .map(usuarioExistente -> {
                    usuarioExistente.setNome(usuarioRequest.getNome());
                    usuarioExistente.setSobrenome(usuarioRequest.getSobrenome());
                    usuarioExistente.setEmail(usuarioRequest.getEmail());

                    usuarioExistente.setTelefone(usuarioRequest.getTelefone() != null
                            ? usuarioRequest.getTelefone().replaceAll("\\D", "") : null);
                    usuarioExistente.setCelular(usuarioRequest.getCelular() != null
                            ? usuarioRequest.getCelular().replaceAll("\\D", "") : null);

                    usuarioExistente.setEmailAlt(usuarioRequest.getEmailAlt());
                    usuarioExistente.setMatricula(usuarioRequest.getMatricula());
                    usuarioExistente.setCargo(usuarioRequest.getCargo());
                    return usuariosRepository.save(usuarioExistente);
                })
                .orElseGet(() -> usuariosRepository.save(usuarioRequest));

        formulario.setUsuario(usuario);
        formulario.setDataCriacao(new Date());
        formulario.setFinalizarArquivar(FinArq.EM_ANALISE);
        formulario.setUnidade(formulario.getUnidade() != null ? formulario.getUnidade() : Unidades.OUVIDORIA);

        formulario = repository.saveAndFlush(formulario);

        emailService.enviarEmailNovoFormulario(formulario);
        return formulario;
    }

    @Transactional
    public void deleteById(String id) {
        mensagemRepository.deleteByFormularioId(id);
        repository.deleteById(id);
    }

    @Transactional
    public Formulario update(String id, Formulario formDaRequisicao) {
        Formulario existing = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Formulário não encontrado para o ID: " + id));

        FinArq statusAntigo = existing.getFinalizarArquivar();
        FinArq statusNovo = formDaRequisicao.getFinalizarArquivar() != null ? formDaRequisicao.getFinalizarArquivar() : statusAntigo;

        existing.setAssunto(formDaRequisicao.getAssunto() != null ? formDaRequisicao.getAssunto() : existing.getAssunto());
        existing.setBeneficio(formDaRequisicao.getBeneficio() != null ? formDaRequisicao.getBeneficio() : existing.getBeneficio());
        existing.setDescricao(formDaRequisicao.getDescricao() != null ? formDaRequisicao.getDescricao() : existing.getDescricao());
        existing.setArquivoPath(formDaRequisicao.getArquivoPath() != null ? formDaRequisicao.getArquivoPath() : existing.getArquivoPath());
        existing.setUnidade(formDaRequisicao.getUnidade() != null ? formDaRequisicao.getUnidade() : existing.getUnidade());

        existing.setFinalizarArquivar(statusNovo);

        boolean mudouParaFinalizado = false;

        if (statusAntigo != statusNovo) {
            if(statusNovo == FinArq.EM_ANALISE){
                existing.setDataMudanca(null);
            }else{
                existing.setDataMudanca(new Date());
            }

            if (statusNovo == FinArq.FINALIZADO) {
                mudouParaFinalizado = true;
            }
        }

        var salvo = repository.saveAndFlush(existing);

        if (mudouParaFinalizado) {
            try {
                emailService.enviarEmailFinalizacaoFormulario(existing);
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

    public List<DadoGraficoDTO> buscarDadosParaGrafico(TipoGrafico tipo, Date inicio, Date fim, Unidades unidade) {

        // Se a unidade não foi enviada (ou é "all"), busca o geral
        if (unidade == null) {
            return switch (tipo) {
                case RANKING_UNIDADES -> repository.obterVolumePorUnidade(inicio, fim);
                case EVOLUCAO_DIARIA -> repository.obterEvolucaoTemporal(inicio, fim);
                case VOLUME_CARGO -> repository.obterVolumePorCargo(inicio, fim);
            };
        }

        // Se tem unidade, usa as queries filtradas
        return switch (tipo) {
            case RANKING_UNIDADES -> repository.obterVolumePorUnidadeFiltrado(inicio, fim, unidade);
            case EVOLUCAO_DIARIA -> repository.obterEvolucaoTemporalFiltrado(inicio, fim, unidade);
            case VOLUME_CARGO -> repository.obterVolumePorCargoFiltrado(inicio, fim, unidade);
        };
    }

    @Transactional
    @Scheduled(cron = "0 0 0 * * *") // Roda todos os dias à 00:00
    @EventListener(ApplicationReadyEvent.class) // Roda assim que o projeto ligar
    public void atualizarStatusParaTerminado() {
        log.info("Iniciando tarefa agendada para verificar formulários a terminar...");

        // Define o limite de 14 dias atrás
        LocalDateTime limite = LocalDateTime.now().minusDays(14);
        Date dataLimite = Date.from(limite.atZone(ZoneId.systemDefault()).toInstant());

        // Busca todos que estão FINALIZADOS e foram mudados há mais de 14 dias
        List<Formulario> paraTerminar = repository.findByFinalizarArquivarAndDataMudancaBefore(
                FinArq.FINALIZADO,
                dataLimite
        );

        if (!paraTerminar.isEmpty()) {
            for (Formulario f : paraTerminar) {
                f.setFinalizarArquivar(FinArq.TERMINADO);
                f.setDataMudanca(new Date()); // Atualiza a data da mudança para o momento atual
            }
            repository.saveAll(paraTerminar);
            log.info("Sucesso: {} formulários foram marcados como TERMINADO.", paraTerminar.size());
        } else {
            log.info("Nenhum formulário para ser terminado hoje.");
        }
    }
}