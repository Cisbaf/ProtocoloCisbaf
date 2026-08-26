package com.requerimentosback.admin.model.dtos;

import lombok.Builder;

import java.util.Set;

@Builder
public record AdminRequest(
        String username,
        String password,
        Set<String> assuntosPermitidos,
        boolean acessoTotal
) {
}
