package com.requerimentosback.form.model.enuns;

import lombok.Getter;

@Getter
public enum Cores {
    BRANCA("Branca"),
    PRETA("Preta"),
    AMARELA("Amarela"),
    PARDA("Parda"),
    INDIGENA("Indigena"),
    NAO_INFORMADO("Nao_Informado"),;

    private final String coresNome;

    Cores(String coresNome) {
        this.coresNome = coresNome;
    }
}
