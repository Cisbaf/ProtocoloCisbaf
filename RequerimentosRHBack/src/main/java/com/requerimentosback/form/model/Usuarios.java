package com.requerimentosback.form.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import lombok.*;
import org.hibernate.validator.constraints.br.CPF;

import java.util.Date;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Usuarios {
    @Id
    @Column(nullable = false, unique = true, updatable = false)
    @CPF
    private String cpf;

    @Column(nullable = false, length = 100)
    private String nome;

    @Column(nullable = false, unique = true, length = 20)
    private String rg;

    @Column(nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd")
    private Date dataNascimento;

    @Column(length = 20)
    private String sexo;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Pattern(
            regexp = "^$|\\(?\\d{2}\\)?\\s?\\d{4,5}-?\\d{4}",
            message = "Telefone inválido"
    )
    private String telefone;

    @Pattern(
            regexp = "^\\+?[0-9()\\-\\s]{10,20}$",
            message = "Telefone inválido"
    )
    private String celular;

    @Email
    private String emailAlt;

    @Column(nullable = false, unique = true, length = 30)
    private String matricula;

    @Column(nullable = false, length = 100)
    private String cargo;

    @Column(length = 20)
    private String cor;

    @Column(nullable = false, length = 100)
    private String unidade;

    @Embedded
    private Endereco endereco;
}
