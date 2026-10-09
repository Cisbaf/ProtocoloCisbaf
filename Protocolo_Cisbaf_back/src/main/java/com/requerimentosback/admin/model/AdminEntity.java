package com.requerimentosback.admin.model;

import com.requerimentosback.form.model.Formulario;
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

    // Bases (unidades) cujos requerimentos o usuário pode ver. Vazio = sem restrição por base.
    @Builder.Default
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "admin_bases_permitidas", joinColumns = @JoinColumn(name = "admin_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "base", nullable = false, length = 30)
    private Set<Unidades> basesPermitidas = new LinkedHashSet<>();

    @Builder.Default
    @Column(nullable = false)
    private boolean acessoTotal = false;

    // Mantido para que os usuários existentes continuem funcionando durante a migração.
    @Enumerated(EnumType.STRING)
    private Unidades base;

    public boolean podeVerTudo() {
        return acessoTotal || base == Unidades.ADMIN;
    }

    private boolean temAssuntosRestritos() {
        return assuntosPermitidos != null && !assuntosPermitidos.isEmpty();
    }

    /**
     * Bases em vigor para este usuário. Usa a lista nova; se ela estiver vazia e o usuário não tiver
     * assuntos, aproveita o campo legado {@code base} (comportamento anterior à lista de bases).
     */
    public Set<Unidades> basesEfetivas() {
        if (basesPermitidas != null && !basesPermitidas.isEmpty()) {
            return basesPermitidas;
        }
        if (!temAssuntosRestritos() && base != null && base != Unidades.ADMIN) {
            return Set.of(base);
        }
        return Set.of();
    }

    /**
     * Sem acesso total, os dois filtros se somam (E): lista vazia só significa "qualquer valor" naquele
     * filtro se o outro estiver preenchido. Sem nenhum dos dois, o usuário não vê nada.
     */
    public boolean podeVerAssunto(String assunto) {
        if (podeVerTudo()) {
            return true;
        }
        if (!temAssuntosRestritos()) {
            return !basesEfetivas().isEmpty();
        }
        return assunto != null && assuntosPermitidos.stream()
                .anyMatch(permitido -> permitido.equalsIgnoreCase(assunto.trim()));
    }

    public boolean podeVerBase(Unidades unidade) {
        if (podeVerTudo()) {
            return true;
        }
        Set<Unidades> bases = basesEfetivas();
        if (bases.isEmpty()) {
            return temAssuntosRestritos();
        }
        return unidade != null && bases.contains(unidade);
    }

    public boolean podeVer(Formulario formulario) {
        return formulario != null && podeVerAssunto(formulario.getAssunto()) && podeVerBase(formulario.getUnidade());
    }
}
