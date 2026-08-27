package com.requerimentosback.form.service;

import com.requerimentosback.admin.repository.AdminRepository;
import com.requerimentosback.form.model.AssinaturaProcesso;
import com.requerimentosback.form.model.DadoGraficoDTO;
import com.requerimentosback.form.model.Formulario;
import com.requerimentosback.form.model.Usuarios;
import com.requerimentosback.form.model.enuns.FinArq;
import com.requerimentosback.form.model.enuns.TipoGrafico;
import com.requerimentosback.form.model.enuns.Unidades;
import com.requerimentosback.form.model.erros.CampoDuplicadoException;
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
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

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
        normalizarEValidarUsuario(usuarioRequest);

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
        formulario.setHistoricoAssinaturas(new java.util.ArrayList<>());
        formulario.setUnidade(formulario.getUnidade() != null ? formulario.getUnidade() : Unidades.OUVIDORIA);

        formulario = repository.saveAndFlush(formulario);

        emailService.enviarEmailNovoFormulario(formulario);
        return formulario;
    }

    private void normalizarEValidarUsuario(Usuarios usuario) {
        if (usuario.getEmail() != null) {
            usuario.setEmail(usuario.getEmail().trim());
            usuariosRepository.findByEmailIgnoreCase(usuario.getEmail())
                    .filter(cadastrado -> !cadastrado.getCpf().equals(usuario.getCpf()))
                    .ifPresent(cadastrado -> {
                        throw new CampoDuplicadoException("email", "Este e-mail já está cadastrado para outro usuário.");
                    });
        }

        if (usuario.getMatricula() != null && usuario.getMatricula().isBlank()) {
            usuario.setMatricula(null);
        } else if (usuario.getMatricula() != null) {
            usuario.setMatricula(usuario.getMatricula().trim());
            usuariosRepository.findByMatricula(usuario.getMatricula())
                    .filter(cadastrado -> !cadastrado.getCpf().equals(usuario.getCpf()))
                    .ifPresent(cadastrado -> {
                        throw new CampoDuplicadoException("matricula", "Esta matrícula já está cadastrada para outro usuário.");
                    });
        }
    }

    @Transactional
    public void deleteById(String id, Principal principal) {
        var admin = adminRepository.findByUsername(principal.getName()).orElseThrow(EntityNotFoundException::new);
        if (!admin.podeVerTudo()) {
            throw new AccessDeniedException("Apenas administradores com acesso total podem excluir requerimentos");
        }
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

        String assinatura = obterUltimaAssinaturaEnviada(formDaRequisicao, statusNovo);
        return atualizarStatus(existing, statusAntigo, statusNovo, assinatura);
    }

    @Transactional
    public Formulario updateStatusByAdmin(
            String id,
            FinArq novoStatus,
            String assinatura,
            Principal principal
    ) {
        validarAcessoAoFormulario(id, principal);
        Formulario existing = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Formulário não encontrado para o ID: " + id));
        return atualizarStatus(existing, existing.getFinalizarArquivar(), novoStatus, assinatura);
    }

    private Formulario atualizarStatus(
            Formulario formulario,
            FinArq statusAntigo,
            FinArq statusNovo,
            String assinatura
    ) {
        boolean mudouParaFinalizado = false;

        if (statusAntigo != statusNovo) {
            if (statusNovo == FinArq.EM_ANALISE) {
                adicionarEventoAssinado(formulario, "REABRIU", validarAssinatura(assinatura, "reabrir"));
                formulario.setDataMudanca(null);
            } else {
                formulario.setDataMudanca(new Date());
            }

            if (statusNovo == FinArq.FINALIZADO) {
                adicionarEventoAssinado(formulario, "FINALIZADO", validarAssinatura(assinatura, "finalizar"));
                mudouParaFinalizado = true;
            }
        }

        formulario.setFinalizarArquivar(statusNovo);
        var salvo = repository.saveAndFlush(formulario);

        if (mudouParaFinalizado) {
            try {
                emailService.enviarEmailFinalizacaoFormulario(formulario);
            } catch (Exception e) {
                log.error("Erro ao enviar email de finalização para o form {}", formulario.getId(), e);
            }
        }

        return salvo;
    }

    private String obterUltimaAssinaturaEnviada(Formulario formulario, FinArq statusNovo) {
        if (formulario.getHistoricoAssinaturas() == null || formulario.getHistoricoAssinaturas().isEmpty()) {
            return null;
        }
        String acao = statusNovo == FinArq.FINALIZADO ? "FINALIZADO" : "REABRIU";
        return formulario.getHistoricoAssinaturas().reversed().stream()
                .filter(evento -> acao.equals(evento.getAcao()))
                .map(AssinaturaProcesso::getNome)
                .findFirst()
                .orElse(null);
    }

    private String validarAssinatura(String assinatura, String verbo) {
        if (assinatura == null || assinatura.isBlank()) {
            throw new IllegalArgumentException("A assinatura é obrigatória para " + verbo + " o requerimento");
        }
        String assinaturaNormalizada = assinatura.trim();
        if (!assinaturaNormalizada.matches("[\\p{L} ]+")) {
            throw new IllegalArgumentException("A assinatura deve conter apenas letras e espaços");
        }
        assinaturaNormalizada = assinaturaNormalizada.replaceAll(" +", " ");
        long quantidadeLetras = assinaturaNormalizada.codePoints().filter(Character::isLetter).count();
        if (quantidadeLetras < 3) {
            throw new IllegalArgumentException("A assinatura deve ter no mínimo 3 letras");
        }
        return assinaturaNormalizada;
    }

    private void adicionarEventoAssinado(Formulario formulario, String acao, String assinatura) {
        if (formulario.getHistoricoAssinaturas() == null) {
            formulario.setHistoricoAssinaturas(new java.util.ArrayList<>());
        }
        formulario.getHistoricoAssinaturas().add(AssinaturaProcesso.builder()
                .acao(acao)
                .nome(assinatura)
                .data(LocalDateTime.now(ZoneId.of("America/Sao_Paulo")))
                .build());
    }

    @Transactional
    public Formulario updateByAdmin(String id, Formulario formulario, Principal principal) {
        validarAcessoAoFormulario(id, principal);
        return update(id, formulario);
    }

    public List<Formulario> findByAdmin(Principal principal) {
        var admin = adminRepository.findByUsername(principal.getName()).orElseThrow(EntityNotFoundException::new);
        if (admin.podeVerTudo()) {
            return repository.findAll();
        }
        if (admin.getAssuntosPermitidos() != null && !admin.getAssuntosPermitidos().isEmpty()) {
            return repository.findByAssuntoIn(admin.getAssuntosPermitidos());
        }
        if (admin.getBase() != null) {
            return repository.findByUnidade(admin.getBase());
        }
        return List.of();
    }

    public List<DadoGraficoDTO> buscarDadosParaGrafico(TipoGrafico tipo, Date inicio, Date fim, Unidades unidade, Principal principal) {
        var admin = adminRepository.findByUsername(principal.getName()).orElseThrow(EntityNotFoundException::new);

        if (!admin.podeVerTudo()) {
            List<Formulario> formularios = findByAdmin(principal).stream()
                    .filter(form -> form.getDataCriacao() != null
                            && !form.getDataCriacao().before(inicio)
                            && !form.getDataCriacao().after(fim))
                    .filter(form -> unidade == null || form.getUnidade() == unidade)
                    .toList();
            return agruparDados(tipo, formularios);
        }

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

    private List<DadoGraficoDTO> agruparDados(TipoGrafico tipo, List<Formulario> formularios) {
        Function<Formulario, String> agrupador = switch (tipo) {
            case RANKING_UNIDADES -> form -> form.getUnidade().toString();
            case EVOLUCAO_DIARIA -> form -> form.getDataCriacao().toInstant()
                    .atZone(ZoneId.systemDefault())
                    .toLocalDate()
                    .format(DateTimeFormatter.ISO_LOCAL_DATE);
            case VOLUME_CARGO -> form -> form.getUsuario() != null ? form.getUsuario().getCargo() : null;
        };

        Map<String, Long> dados = formularios.stream()
                .filter(form -> agrupador.apply(form) != null)
                .collect(Collectors.groupingBy(agrupador, Collectors.counting()));

        Comparator<Map.Entry<String, Long>> ordenacao = tipo == TipoGrafico.EVOLUCAO_DIARIA
                ? Map.Entry.comparingByKey()
                : Map.Entry.<String, Long>comparingByValue().reversed();

        return dados.entrySet().stream()
                .sorted(ordenacao)
                .map(entry -> new DadoGraficoDTO(entry.getKey(), entry.getValue()))
                .toList();
    }

    private void validarAcessoAoFormulario(String id, Principal principal) {
        var admin = adminRepository.findByUsername(principal.getName()).orElseThrow(EntityNotFoundException::new);
        var formulario = repository.findById(id).orElseThrow(EntityNotFoundException::new);
        if (!admin.podeVerAssunto(formulario.getAssunto())) {
            throw new org.springframework.security.access.AccessDeniedException("Sem acesso a este assunto");
        }
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
