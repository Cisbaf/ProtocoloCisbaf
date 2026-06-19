package com.requerimentosback.form.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.requerimentosback.form.model.enuns.TipoRemetente;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Mensagem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "formulario_id", nullable = false)
    private Formulario formulario;

    @Lob
    @Column(nullable = false)
    private String conteudo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TipoRemetente remetente;

    @Column(nullable = false, length = 150)
    private String nomeRemetente;

    private LocalDateTime dataEnvio;

    @PrePersist
    public void preencherDataEnvio() {
        if (dataEnvio == null) {
            dataEnvio = LocalDateTime.now();
        }
    }
}
