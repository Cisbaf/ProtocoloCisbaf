package com.requerimentosback.form.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Embeddable
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssinaturaProcesso {

    @Column(name = "acao", nullable = false, length = 30)
    private String acao;

    @Column(name = "nome", nullable = false, length = 150)
    private String nome;

    @Column(name = "data_evento", nullable = false)
    private LocalDateTime data;
}
