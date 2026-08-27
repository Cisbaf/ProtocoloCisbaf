package com.requerimentosback.form.model.erros;

import lombok.Getter;

@Getter
public class CampoDuplicadoException extends RuntimeException {
    private final String campo;

    public CampoDuplicadoException(String campo, String mensagem) {
        super(mensagem);
        this.campo = campo;
    }
}
