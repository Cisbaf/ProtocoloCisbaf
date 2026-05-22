package com.requerimentosback.form.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.requerimentosback.form.model.enuns.Cores;
import com.requerimentosback.form.model.enuns.Sexos;
import com.requerimentosback.form.model.enuns.Unidades;
import jakarta.persistence.*;
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
    @CPF
    @Column(nullable = false, unique = true, updatable = false)
    private String cpf;

    @Column(nullable = false, length = 100)
    private String nome;

    @Column(nullable = false, unique = true, length = 20)
    private String rg;

    @Column(nullable = false)
    @JsonFormat(pattern = "dd/MM/yyyy")
    private Date dataNascimento;

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

    @Enumerated(EnumType.STRING)
    private Cores cor;

    @Enumerated(EnumType.STRING)
    private Sexos sexo;

    @Enumerated(EnumType.STRING)
    private Unidades unidade;

    @Embedded
    private Endereco endereco;
}
