package com.requerimentosback.admin.service;

import com.requerimentosback.admin.model.AdminEntity;
import com.requerimentosback.admin.model.dtos.AdminRequest;
import com.requerimentosback.admin.model.dtos.AdminResponse;
import com.requerimentosback.admin.repository.AdminRepository;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import javax.naming.AuthenticationException;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AdminService implements UserDetailsService {
    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;
    private final AdminMapper adminMapper;


    public AdminResponse findByUsername(@NonNull String username) {
        return adminRepository.findByUsername(username).map(adminMapper::toAdminResponse).orElse(null);
    }

    private AdminEntity findEntity(@NonNull String username) {
        return adminRepository.findByUsername(username).orElse(null);
    }

    public AdminResponse create(AdminRequest request) throws AuthenticationException {
        if (request == null || request.username() == null) {
            return null;
        }
        var exist = adminRepository.findByUsername(request.username()).isEmpty();
        if (!exist) {
            throw new AuthenticationException("Usuário já cadastrado");
        }
        String password = passwordEncoder.encode(request.password());

        var entity = adminMapper.toAdminEntity(request);

        entity.setPassword(passwordEncoder.encode(password));

        return adminMapper.toAdminResponse(entity);
    }


    public void delete(@NonNull String username) {
        Optional<AdminEntity> adminEntity = adminRepository.findByUsername(username);
        adminEntity.ifPresent(adminRepository::delete);
    }

    @Override
    public UserDetails loadUserByUsername(@NonNull String username) throws UsernameNotFoundException {
        try {
            AdminEntity user = adminRepository.findByUsername(username)
                    .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado: " + username));

            var userBase = user.getBase() != null
                    ? user.getBase()
                    : "ADMINISTRACAO";

            List<GrantedAuthority> authorities = List.of(new SimpleGrantedAuthority(userBase.toString()));
            return new User(username, user.getPassword(), authorities);
        } catch (UsernameNotFoundException e) {
            throw new UsernameNotFoundException(e.getMessage());
        }

    }
}
