package com.requerimentosback.form.model.enuns;

import lombok.Getter;

@Getter
public enum Unidades {
    CISBAF("Sede CISBAF"),
    CRUR("CRUR/BF"),
    QUEIMADOS("Base SAMU Queimados"),
    NILOPOLIS("Base SSAMU Nilópolis"),
    IRIS("UPA Jardim Íris");

    private final String unidade;
    Unidades(String unidade) {
        this.unidade = unidade;
    }
}
