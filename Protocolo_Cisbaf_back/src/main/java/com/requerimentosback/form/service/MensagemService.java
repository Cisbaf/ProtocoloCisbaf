package com.requerimentosback.form.service;

import com.requerimentosback.admin.service.AdminDisplayNameService;
import com.requerimentosback.form.model.Formulario;
import com.requerimentosback.form.model.Mensagem;
import com.requerimentosback.form.model.MensagemRequestDTO;
import com.requerimentosback.form.model.enuns.TipoRemetente;
import com.requerimentosback.form.repository.FormularioRepository;
import com.requerimentosback.form.repository.MensagemRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MensagemService {

    private final MensagemRepository mensagemRepository;
    private final FormularioRepository formularioRepository;
    private final EmailService emailService;
    private final DiscoService discoService;
    private final AdminDisplayNameService adminDisplayNameService;

    public List<Mensagem> listarPorFormulario(String formularioId) {
        return mensagemRepository.findByFormularioIdOrderByDataEnvioAsc(formularioId);
    }

    public Mensagem enviar(String formularioId, MensagemRequestDTO dto) {
        return enviar(formularioId, dto, null, null);
    }

    @Transactional
    public Mensagem enviar(String formularioId, MensagemRequestDTO dto, List<MultipartFile> arquivos) {
        return enviar(formularioId, dto, arquivos, null);
    }

    @Transactional
    public Mensagem enviar(
            String formularioId,
            MensagemRequestDTO dto,
            List<MultipartFile> arquivos,
            Principal principal
    ) {
        boolean deveEnviarEmail = false;
        boolean mensagemAdmin = TipoRemetente.ADMIN.equals(dto.remetente());
        String nomeRemetente = resolverNomeRemetente(dto, principal, mensagemAdmin);

        if (mensagemAdmin) {
            var ultimaMensagemOpt = mensagemRepository.findFirstByFormularioIdAndRemetenteOrderByDataEnvioDesc(
                    formularioId,
                    TipoRemetente.ADMIN
            );

            if (ultimaMensagemOpt.isEmpty() || (ultimaMensagemOpt.get().getDataEnvio() != null &&
                    java.time.LocalDateTime.now().minusMinutes(5).isAfter(ultimaMensagemOpt.get().getDataEnvio()))) {
                deveEnviarEmail = true;
            }
        }

        Formulario formulario = formularioRepository.findById(formularioId)
                .orElseThrow(() -> new EntityNotFoundException("Requerimento não encontrado: " + formularioId));

        String arquivoPath = null;
        if (arquivos != null && !arquivos.isEmpty()) {
            List<String> nomesArquivos = new ArrayList<>();
            for (MultipartFile arquivo : arquivos) {
                if (arquivo != null && !arquivo.isEmpty()) {
                    nomesArquivos.add(discoService.salvarArquivo(arquivo));
                }
            }
            if (!nomesArquivos.isEmpty()) {
                arquivoPath = String.join(";", nomesArquivos);
            }
        }

        Mensagem mensagem = Mensagem.builder()
                .formulario(formulario)
                .conteudo(dto.conteudo())
                .remetente(dto.remetente())
                .nomeRemetente(nomeRemetente)
                .arquivoPath(arquivoPath)
                .build();

        mensagem = mensagemRepository.save(mensagem);

        if (mensagemAdmin && deveEnviarEmail) {
            emailService.enviarEmailPorCadaMensagemAdmin(formulario);
        }

        return mensagem;
    }

    private String resolverNomeRemetente(
            MensagemRequestDTO dto,
            Principal principal,
            boolean mensagemAdmin
    ) {
        if (mensagemAdmin) {
            if (principal == null) {
                throw new AccessDeniedException("Apenas administradores autenticados podem enviar mensagens como administrador");
            }
            return adminDisplayNameService.resolver(principal);
        }

        if (dto.nomeRemetente() == null || dto.nomeRemetente().isBlank()) {
            throw new IllegalArgumentException("O nome do remetente é obrigatório");
        }
        return dto.nomeRemetente().trim();
    }
}
