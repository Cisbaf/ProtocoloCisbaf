package com.requerimentosback.admin.service;

import com.requerimentosback.admin.model.AdminEntity;
import com.requerimentosback.admin.model.dtos.AdminRequest;
import com.requerimentosback.admin.model.dtos.AdminResponse;
import org.springframework.stereotype.Service;

import java.util.LinkedHashSet;
import java.util.Set;

@Service
public class AdminMapper {

    protected AdminEntity toAdminEntity(AdminRequest request) {
        if (request == null) {
            return AdminEntity.builder().build();
        }
        return AdminEntity.builder()
                .username(request.username().trim())
                .password(request.password().trim())
                .assuntosPermitidos(new LinkedHashSet<>(request.assuntosPermitidos()))
                .acessoTotal(request.acessoTotal())
                .build();
    }
    protected AdminResponse toAdminResponse(AdminEntity adminEntity) {
        if (adminEntity == null) {
            return AdminResponse.builder().build();
        }
        return AdminResponse.builder()
                .id(adminEntity.getId())
                .username(adminEntity.getUsername())
                .assuntosPermitidos(adminEntity.getAssuntosPermitidos() == null
                        ? Set.of()
                        : new LinkedHashSet<>(adminEntity.getAssuntosPermitidos()))
                .acessoTotal(adminEntity.podeVerTudo())
                .build();
    }
}
