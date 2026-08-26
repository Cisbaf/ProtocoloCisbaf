package com.requerimentosback.admin.model;

import com.requerimentosback.form.model.enuns.Unidades;
import jakarta.persistence.*;
import lombok.*;

import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AdminEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String username;
    private String password;

    @Builder.Default
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "admin_assuntos_permitidos", joinColumns = @JoinColumn(name = "admin_id"))
    @Column(name = "assunto", nullable = false, length = 100)
    private Set<String> assuntosPermitidos = new LinkedHashSet<>();

    @Builder.Default
    @Column(nullable = false)
    private boolean acessoTotal = false;

    // Mantido para que os usuários existentes continuem funcionando durante a migração.
    @Enumerated(EnumType.STRING)
    private Unidades base;

    public boolean podeVerTudo() {
        return acessoTotal || base == Unidades.ADMIN;
    }

    public boolean podeVerAssunto(String assunto) {
        return podeVerTudo() || (assunto != null && assuntosPermitidos != null && assuntosPermitidos.stream()
                .anyMatch(permitido -> permitido.equalsIgnoreCase(assunto.trim())));
    }
}
