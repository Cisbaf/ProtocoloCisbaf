package com.requerimentosback.form.model;

import com.requerimentosback.form.model.enuns.Unidades;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Date;
import java.util.concurrent.ThreadLocalRandom;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Formulario {
    @Id
    @Column(nullable = false, updatable = false, length = 30)
    private String id;

    private Date dataCriacao;

    @Column(nullable = false, length = 100)
    private String assunto;

    private String beneficio;

    @Lob
    private String descricao;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 100)
    private Unidades unidade;

    private String prioridade;

    private String arquivoPath;

    @Builder.Default
    private Boolean confirmacao = null;

    private String motivo;

    @ManyToOne(cascade = CascadeType.PERSIST)
    @JoinColumn(name = "userId")
    private Usuarios usuario;

    @PrePersist
    public void gerarIdSeNaoExistente() {
        if (id == null || id.isBlank()) {
            String timestamp = LocalDateTime.now()
                    .format(DateTimeFormatter.ofPattern("yyMMddHHmmssSSS"));

            int random = ThreadLocalRandom.current().nextInt(1000, 9999);

            id = timestamp + random;
        }
    }
}