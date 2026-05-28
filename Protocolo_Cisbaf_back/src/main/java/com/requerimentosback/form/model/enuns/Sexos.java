package com.requerimentosback.form.model.enuns;

import lombok.Getter;

@Getter
public enum Sexos {
    MASCULINO("M"),
    FEMININO("F"),
    NAO_BINARIO("NB"),
    NAO_INFORMADO("Nao_Informado");

    private final String sexos;

    Sexos(String sexos) {
        this.sexos = sexos;
    }
}
