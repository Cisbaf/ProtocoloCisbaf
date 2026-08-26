package com.requerimentosback.admin.model.dtos;

import lombok.Builder;

import java.util.Set;

@Builder

public record AdminResponse(
        Long id,
        String username,
        Set<String> assuntosPermitidos,
        boolean acessoTotal
) {
}
