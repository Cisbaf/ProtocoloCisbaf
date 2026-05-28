package com.requerimentosback.form.model;

import lombok.Builder;

@Builder
public record CepResponse(
        String cep,
        String logradouro,
        String complemento,
        String unidade,
        String bairro,
        String localidade,
        String uf,
        String estado) {
}
