package com.requerimentosback.admin.service;

import com.requerimentosback.admin.model.AdminEntity;
import com.requerimentosback.admin.model.dtos.AdminRequest;
import com.requerimentosback.admin.model.dtos.AdminResponse;
import com.requerimentosback.form.model.enuns.Unidades;
import org.springframework.stereotype.Service;

import java.util.LinkedHashSet;
import java.util.Set;
import java.util.stream.Collectors;

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
                .basesPermitidas(toUnidades(request.basesPermitidas()))
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
                .basesPermitidas(adminEntity.basesEfetivas().stream()
                        .map(Enum::name)
                        .collect(Collectors.toCollection(LinkedHashSet::new)))
                .acessoTotal(adminEntity.podeVerTudo())
                .build();
    }

    /** Converte nomes já validados pelo {@link AdminService} para o enum de unidades. */
    protected Set<Unidades> toUnidades(Set<String> nomes) {
        if (nomes == null) {
            return new LinkedHashSet<>();
        }
        return nomes.stream()
                .map(Unidades::valueOf)
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }
}
