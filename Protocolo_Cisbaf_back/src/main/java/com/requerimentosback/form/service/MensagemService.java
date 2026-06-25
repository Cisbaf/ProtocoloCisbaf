package com.requerimentosback.form.service;

import com.requerimentosback.form.model.Formulario;
import com.requerimentosback.form.model.Mensagem;
import com.requerimentosback.form.model.MensagemRequestDTO;
import com.requerimentosback.form.repository.FormularioRepository;
import com.requerimentosback.form.repository.MensagemRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MensagemService {

    private final MensagemRepository mensagemRepository;
    private final FormularioRepository formularioRepository;
    private final EmailService emailService;
    private final DiscoService discoService;
    private static final String NOME_ADMIN = "Administrador";

    public List<Mensagem> listarPorFormulario(String formularioId) {
        return mensagemRepository.findByFormularioIdOrderByDataEnvioAsc(formularioId);
    }

    public Mensagem enviar(String formularioId, MensagemRequestDTO dto) {
        return enviar(formularioId, dto, null);
    }

    @Transactional
    public Mensagem enviar(String formularioId, MensagemRequestDTO dto, List<MultipartFile> arquivos) {
        boolean deveEnviarEmail = false;

        if (NOME_ADMIN.equalsIgnoreCase(dto.nomeRemetente())) {
            var ultimaMensagemOpt = mensagemRepository.findFirstByFormularioIdAndNomeRemetenteOrderByDataEnvioDesc(formularioId, NOME_ADMIN);

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
                .nomeRemetente(dto.nomeRemetente())
                .arquivoPath(arquivoPath)
                .build();

        mensagem = mensagemRepository.save(mensagem);

        if (NOME_ADMIN.equalsIgnoreCase(mensagem.getNomeRemetente()) && deveEnviarEmail) {
            String emailConteudo = mensagem.getConteudo() != null && !mensagem.getConteudo().isBlank()
                    ? mensagem.getConteudo()
                    : "[Arquivos Anexados]";
            emailService.enviarEmailPorCadaMensagemAdmin(formulario, emailConteudo);
        }

        return mensagem;
    }
}
