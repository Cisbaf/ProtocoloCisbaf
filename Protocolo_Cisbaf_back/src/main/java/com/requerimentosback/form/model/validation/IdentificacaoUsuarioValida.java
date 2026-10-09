package com.requerimentosback.form.model.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = IdentificacaoUsuarioValidator.class)
public @interface IdentificacaoUsuarioValida {
    String message() default "Identificação inválida";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
