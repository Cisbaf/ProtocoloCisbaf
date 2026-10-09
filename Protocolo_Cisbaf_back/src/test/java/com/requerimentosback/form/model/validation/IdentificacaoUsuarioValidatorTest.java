package com.requerimentosback.form.model.validation;

import com.requerimentosback.form.model.Usuarios;
import com.requerimentosback.form.model.enuns.TipoDocumento;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class IdentificacaoUsuarioValidatorTest {

    private static Validator validator;

    @BeforeAll
    static void criarValidator() {
        validator = Validation.buildDefaultValidatorFactory().getValidator();
    }

    @Test
    void aceitaCpfComNomeESobrenome() {
        var usuario = usuarioBase()
                .cpf("12345678909")
                .tipoDocumento(TipoDocumento.CPF)
                .nome("Maria")
                .sobrenome("Silva")
                .build();

        assertTrue(validator.validate(usuario).isEmpty());
    }

    @Test
    void aceitaCnpjComNomeFantasia() {
        var usuario = usuarioBase()
                .cpf("11222333000181")
                .tipoDocumento(TipoDocumento.CNPJ)
                .nome("Empresa Exemplo")
                .sobrenome("")
                .nomeFantasia("Empresa Exemplo")
                .build();

        assertTrue(validator.validate(usuario).isEmpty());
    }

    @Test
    void rejeitaCnpjInvalidoEAusenciaDeNomeFantasia() {
        var usuario = usuarioBase()
                .cpf("11222333000180")
                .tipoDocumento(TipoDocumento.CNPJ)
                .nome("Empresa Exemplo")
                .sobrenome("")
                .build();

        var campos = validator.validate(usuario).stream()
                .map(violacao -> violacao.getPropertyPath().toString())
                .toList();

        assertEquals(2, campos.size());
        assertTrue(campos.contains("cpf"));
        assertTrue(campos.contains("nomeFantasia"));
    }

    private static Usuarios.UsuariosBuilder usuarioBase() {
        return Usuarios.builder()
                .email("teste@example.com");
    }
}
