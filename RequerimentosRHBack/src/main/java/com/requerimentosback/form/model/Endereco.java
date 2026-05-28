package com.requerimentosback.form.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Embeddable
@Data
public class Endereco {

    @Column(nullable = false, length = 9)
    @Pattern(regexp = "^\\d{5}-?\\d{3}$", message = "CEP inválido. Use o formato 00000000")
    private String cep;

    @Column(nullable = false, length = 200)
    private String endereco;

    private Integer numero;

    @Column(length = 100)
    private String complemento;

    @Column(nullable = false, length = 100)
    private String bairro;

    @Column(nullable = false, length = 100)
    private String cidade;

    @Column(nullable = false, length = 2)
    private String estado;
}