package com.requerimentosback.form.model;

import com.requerimentosback.form.model.enuns.TipoRemetente;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record MensagemRequestDTO(
        @NotBlank String conteudo,
        @NotNull TipoRemetente remetente,
        @NotBlank String nomeRemetente
) {}

