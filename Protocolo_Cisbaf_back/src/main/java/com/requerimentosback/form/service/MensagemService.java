package com.requerimentosback.form.service;

import com.requerimentosback.form.model.Formulario;
import com.requerimentosback.form.model.Mensagem;
import com.requerimentosback.form.model.MensagemRequestDTO;
import com.requerimentosback.form.repository.FormularioRepository;
import com.requerimentosback.form.repository.MensagemRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MensagemService {

    private final MensagemRepository mensagemRepository;
    private final FormularioRepository formularioRepository;

    public List<Mensagem> listarPorFormulario(String formularioId) {
        return mensagemRepository.findByFormularioIdOrderByDataEnvioAsc(formularioId);
    }

    // Now accepts the DTO and maps it to a safe new Entity
    public Mensagem enviar(String formularioId, MensagemRequestDTO dto) {
        Formulario formulario = formularioRepository.findById(formularioId)
                .orElseThrow(() -> new EntityNotFoundException("Requerimento não encontrado: " + formularioId));

        Mensagem mensagem = Mensagem.builder()
                .formulario(formulario)
                .conteudo(dto.conteudo())
                .remetente(dto.remetente())
                .nomeRemetente(dto.nomeRemetente())
                .build();

        return mensagemRepository.save(mensagem);
    }
}
