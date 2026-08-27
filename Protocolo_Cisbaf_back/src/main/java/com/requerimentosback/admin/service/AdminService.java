package com.requerimentosback.admin.service;

import com.requerimentosback.admin.model.AdminEntity;
import com.requerimentosback.admin.model.dtos.AdminRequest;
import com.requerimentosback.admin.model.dtos.AdminResponse;
import com.requerimentosback.admin.repository.AdminRepository;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.Principal;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AdminService implements UserDetailsService {
    public static final String ACESSO_TOTAL = "ACESSO_TOTAL";
    public static final String ACESSO_RESTRITO = "ACESSO_RESTRITO";

    private static final Set<String> ASSUNTOS_VALIDOS = Set.of(
            "Atestado",
            "Benefício",
            "Desligamento",
            "Folha de Pagamento",
            "Ouvidoria",
            "Responsáveis Técnicos",
            "Assuntos Administrativos"
    );

    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;
    private final AdminMapper adminMapper;


    public AdminResponse findByUsername(@NonNull String username) {
        return adminRepository.findByUsername(username).map(adminMapper::toAdminResponse).orElse(null);
    }

    public AdminResponse findCurrent(Principal principal) {
        return adminMapper.toAdminResponse(findEntity(principal));
    }

    public List<AdminResponse> findAll(Principal principal) {
        requireAcessoTotal(principal);
        return adminRepository.findAll().stream().map(adminMapper::toAdminResponse).toList();
    }

    public synchronized AdminResponse create(AdminRequest request, Principal principal) {
        boolean primeiroUsuario = adminRepository.count() == 0;
        if (!primeiroUsuario) {
            requireAcessoTotal(principal);
        }
        if (request == null || request.username() == null || request.username().isBlank()
                || request.password() == null || request.password().isBlank()) {
            throw new IllegalArgumentException("Usuário e senha são obrigatórios");
        }
        if (adminRepository.existsByUsername(request.username().trim())) {
            throw new IllegalArgumentException("Usuário já cadastrado");
        }

        Set<String> assuntos = normalizarAssuntos(request.assuntosPermitidos());
        boolean acessoTotal = request.acessoTotal() || assuntos.isEmpty();
        if (primeiroUsuario && !acessoTotal) {
            throw new IllegalArgumentException("O primeiro usuário deve ter acesso total");
        }

        var normalizedRequest = new AdminRequest(
                request.username().trim(),
                request.password(),
                assuntos,
                acessoTotal
        );
        String password = passwordEncoder.encode(request.password().trim());
        var entity = adminMapper.toAdminEntity(normalizedRequest);

        entity.setPassword(password);
        var savedEntity = adminRepository.save(entity);

        return adminMapper.toAdminResponse(savedEntity);
    }

    public AdminResponse update(@NonNull String username, AdminRequest request, Principal principal) {
        var current = requireAcessoTotal(principal);
        if (request == null) {
            throw new IllegalArgumentException("Dados do usuário são obrigatórios");
        }

        var entity = adminRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado: " + username));
        Set<String> assuntos = normalizarAssuntos(request.assuntosPermitidos());
        boolean acessoTotal = request.acessoTotal() || assuntos.isEmpty();

        if (current.getUsername().equalsIgnoreCase(entity.getUsername()) && !acessoTotal) {
            throw new IllegalArgumentException("Você não pode remover seu próprio acesso de administrador");
        }

        entity.setAssuntosPermitidos(new LinkedHashSet<>(assuntos));
        entity.setAcessoTotal(acessoTotal);
        if (request.password() != null && !request.password().isBlank()) {
            entity.setPassword(passwordEncoder.encode(request.password().trim()));
        }

        return adminMapper.toAdminResponse(adminRepository.save(entity));
    }


    public void delete(@NonNull String username, Principal principal) {
        var current = requireAcessoTotal(principal);
        if (current.getUsername().equalsIgnoreCase(username)) {
            throw new IllegalArgumentException("Você não pode excluir o usuário que está conectado");
        }
        Optional<AdminEntity> adminEntity = adminRepository.findByUsername(username);
        adminEntity.ifPresent(adminRepository::delete);
    }

    public AdminEntity findEntity(Principal principal) {
        if (principal == null || principal.getName() == null) {
            throw new AccessDeniedException("Usuário não autenticado");
        }
        return adminRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado: " + principal.getName()));
    }

    private AdminEntity requireAcessoTotal(Principal principal) {
        var admin = findEntity(principal);
        if (!admin.podeVerTudo()) {
            throw new AccessDeniedException("Apenas usuários com acesso total podem gerenciar usuários");
        }
        return admin;
    }

    private Set<String> normalizarAssuntos(Set<String> assuntos) {
        if (assuntos == null) {
            return Set.of();
        }

        Set<String> normalizados = new LinkedHashSet<>();
        for (String assunto : assuntos) {
            if (assunto == null) {
                continue;
            }
            String assuntoValido = ASSUNTOS_VALIDOS.stream()
                    .filter(valor -> valor.equalsIgnoreCase(assunto.trim()))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("Assunto inválido: " + assunto));
            normalizados.add(assuntoValido);
        }
        return normalizados;
    }

    @Override
    public UserDetails loadUserByUsername(@NonNull String username) throws UsernameNotFoundException {
        try {
            AdminEntity user = adminRepository.findByUsername(username)
                    .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado: " + username));

            String permission = user.podeVerTudo() ? ACESSO_TOTAL : ACESSO_RESTRITO;
            List<GrantedAuthority> authorities = List.of(new SimpleGrantedAuthority(permission));
            return new User(username, user.getPassword(), authorities);
        } catch (UsernameNotFoundException e) {
            throw new UsernameNotFoundException(e.getMessage());
        }

    }
}
