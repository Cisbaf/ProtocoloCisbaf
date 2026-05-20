package com.requerimentosback.admin.model.dtos;

import lombok.Builder;

@Builder

public record AdminResponse(
        Long id,
        String username,
        String base
) {
}
