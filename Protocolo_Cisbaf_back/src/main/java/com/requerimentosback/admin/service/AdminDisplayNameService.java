package com.requerimentosback.admin.service;

import org.springframework.stereotype.Service;

import java.security.Principal;
import java.util.Locale;
import java.util.Map;

@Service
public class AdminDisplayNameService {

    private static final String NOME_PADRAO = "Administrador";

    // Cadastre os logins em letras minúsculas e os respectivos nomes de exibição.
    private static final Map<String, String> NOMES_POR_USUARIO = Map.ofEntries(
            // Map.entry("login-do-administrador", "Nome do Administrador")
            Map.entry("!@Financeiro@!Cisbaf", "Financeiro Cisbaf"),
            Map.entry("#!Rh_Cisbaf@@", "RH Cisbaf"),
            Map.entry("#@Ouv!doria@!", "Ouvidoria Cisbaf")
    );

    private final Map<String, String> nomesPorUsuario;

    public AdminDisplayNameService() {
        this(NOMES_POR_USUARIO);
    }

    public AdminDisplayNameService(Map<String, String> nomesPorUsuario) {
        this.nomesPorUsuario = nomesPorUsuario;
    }

    public String resolver(Principal principal) {
        if (principal == null || principal.getName() == null || principal.getName().isBlank()) {
            return NOME_PADRAO;
        }

        return nomesPorUsuario.getOrDefault(
                principal.getName().trim().toLowerCase(Locale.ROOT),
                NOME_PADRAO
        );
    }
}
