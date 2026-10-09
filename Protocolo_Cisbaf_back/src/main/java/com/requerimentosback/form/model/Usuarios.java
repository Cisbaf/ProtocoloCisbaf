package com.requerimentosback.form.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.requerimentosback.form.model.enuns.TipoDocumento;
import com.requerimentosback.form.model.validation.IdentificacaoUsuarioValida;
import jakarta.persistence.*;
import jakarta.validation.constraints.Pattern;
import lombok.*;

@Entity
@IdentificacaoUsuarioValida
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Usuarios {
    @Id
    @Column(nullable = false, unique = true, updatable = false)
    private String cpf;

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private TipoDocumento tipoDocumento;

    @Column(nullable = false, length = 100)
    private String nome;

    @Column(nullable = false, length = 100)
    private String sobrenome;

    @Column(length = 100)
    private String nomeFantasia;

    @Column(unique = true, length = 30)
    private String matricula;

    @Column(length = 100)
    private String cargo;

    @Pattern(
            regexp = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$",
            message = "E-mail inválido."
    )
    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Pattern(
            regexp = "^$|\\(?\\d{2}\\)?\\s?\\d{4,5}-?\\d{4}",
            message = "Número de telefone inválido"
    )
    private String telefone;

    @Pattern(
            regexp = "^\\+?[0-9()\\-\\s]{10,20}$",
            message = "Número de celular inválido"
    )
    private String celular;

    @Pattern(
            regexp = "^$|^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$",
            message = "E-mail inválido."
    )
    private String emailAlt;

    @JsonIgnore
    @Transient
    public TipoDocumento getTipoDocumentoEfetivo() {
        if (tipoDocumento != null) return tipoDocumento;
        String documento = cpf == null ? "" : cpf.replaceAll("\\D", "");
        return documento.length() == 14 ? TipoDocumento.CNPJ : TipoDocumento.CPF;
    }

    @JsonIgnore
    @Transient
    public String getNomeExibicao() {
        if (getTipoDocumentoEfetivo() == TipoDocumento.CNPJ) {
            return nomeFantasia != null && !nomeFantasia.isBlank() ? nomeFantasia : nome;
        }
        return ((nome == null ? "" : nome) + " " + (sobrenome == null ? "" : sobrenome)).trim();
    }
}
