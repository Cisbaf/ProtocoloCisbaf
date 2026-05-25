package com.requerimentosback.form.model;

import com.requerimentosback.form.model.enuns.Unidades;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
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

    @Column(nullable = false, length = 100)
    private String assunto;

    private String beneficio;

    @Lob
    private String descricao;

    private String prioridade;

    @Builder.Default
    private Boolean confirmacao = null;

    private String motivo;

    private String arquivoPath;

    @Enumerated(EnumType.STRING)
    private Unidades unidade;

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