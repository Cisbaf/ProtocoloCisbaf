package com.requerimentosback.form.model;

import com.requerimentosback.form.model.enuns.FinArq;
import com.requerimentosback.form.model.enuns.Unidades;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@ToString
public class Formulario {
    @Id
    @Column(nullable = false, updatable = false, length = 30)
    private String id;

    private Date dataCriacao;

    private Date dataMudanca;

    @Column(nullable = false, length = 100)
    private String assunto;

    private String beneficio;

    @Lob
    private String descricao;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 100)
    private Unidades unidade;

    @Column(length = 1000)
    private String arquivoPath;

    @Builder.Default
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "formulario_historico_assinaturas", joinColumns = @JoinColumn(name = "formulario_id"))
    @OrderColumn(name = "ordem")
    private List<AssinaturaProcesso> historicoAssinaturas = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FinArq finalizarArquivar;

    @ManyToOne(cascade = CascadeType.PERSIST)
    @JoinColumn(name = "userId")
    private Usuarios usuario;

    @PrePersist
    public void gerarIdSeNaoExistente() {
        if (id == null || id.isBlank()) {
            String timestamp = LocalDateTime.now()
                    .format(DateTimeFormatter.ofPattern("yyMMssSS"));

            int random = ThreadLocalRandom.current().nextInt(1000, 9999);

            id = timestamp + random;
        }
    }
}
