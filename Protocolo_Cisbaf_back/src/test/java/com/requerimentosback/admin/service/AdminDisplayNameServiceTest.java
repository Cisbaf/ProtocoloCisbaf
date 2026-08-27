package com.requerimentosback.admin.service;

import org.junit.jupiter.api.Test;

import java.security.Principal;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

class AdminDisplayNameServiceTest {

    @Test
    void deveResolverNomeAmigavelIgnorandoMaiusculasEMinusculas() {
        var service = new AdminDisplayNameService(Map.of("usuario.bizonho", "Maria Silva"));
        Principal principal = () -> "USUARIO.BIZONHO";

        assertEquals("Maria Silva", service.resolver(principal));
    }

    @Test
    void naoDeveExporUsernameSemMapeamento() {
        var service = new AdminDisplayNameService(Map.of());
        Principal principal = () -> "login-que-nao-deve-aparecer";

        assertEquals("Administrador", service.resolver(principal));
    }
}
