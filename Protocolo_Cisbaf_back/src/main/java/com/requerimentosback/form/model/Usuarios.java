package com.requerimentosback.form.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Pattern;
import lombok.*;
import org.hibernate.validator.constraints.br.CPF;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Usuarios {
    @Id
    @CPF(message = "CPF inválido")
    @Column(nullable = false, unique = true, updatable = false)
    private String cpf;

    @Column(nullable = false, length = 100)
    private String nome;

    @Column(nullable = false, length = 100)
    private String sobrenome;

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
}
