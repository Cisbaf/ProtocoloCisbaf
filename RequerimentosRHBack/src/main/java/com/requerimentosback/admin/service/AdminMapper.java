package com.requerimentosback.admin.service;

import com.requerimentosback.admin.model.AdminEntity;
import com.requerimentosback.admin.model.dtos.AdminRequest;
import com.requerimentosback.admin.model.dtos.AdminResponse;
import com.requerimentosback.form.model.enuns.Unidades;
import org.springframework.stereotype.Service;

@Service
public class AdminMapper {

    protected AdminEntity toAdminEntity(AdminRequest request) {
        if (request == null) {
            return AdminEntity.builder().build();
        }
        return AdminEntity.builder()
                .username(request.username())
                .password(request.password())
                .base(Unidades.valueOf(request.base().toUpperCase()))
                .build();
    }
    protected AdminResponse toAdminResponse(AdminEntity adminEntity) {
        if (adminEntity == null) {
            return AdminResponse.builder().build();
        }
        return AdminResponse.builder()
                .id(adminEntity.getId())
                .username(adminEntity.getUsername())
                .base(adminEntity.getBase().toString())
                .build();
    }
}
