package com.requerimentosback.admin.model.dtos;

import lombok.Builder;

@Builder
public record LoginDTO(
        String username,
        String password
) {
}
