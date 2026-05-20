package com.requerimentosback.admin.model.dtos;

import lombok.Builder;

@Builder
public record AdminRequest(
        String username,
        String password,
        String base
) {
}
