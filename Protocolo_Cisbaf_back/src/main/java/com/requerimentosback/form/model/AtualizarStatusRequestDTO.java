package com.requerimentosback.form.model;

import com.requerimentosback.form.model.enuns.FinArq;
import jakarta.validation.constraints.NotNull;

public record AtualizarStatusRequestDTO(
        @NotNull FinArq finalizarArquivar,
        String assinatura
) {
}
