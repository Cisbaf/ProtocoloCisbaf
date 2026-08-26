package com.requerimentosback.admin.service;

import com.requerimentosback.admin.model.dtos.AdminRequest;
import com.requerimentosback.admin.model.AdminEntity;
import com.requerimentosback.admin.model.dtos.AdminResponse;
import com.requerimentosback.admin.repository.AdminRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.security.Principal;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.any;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock
    private AdminRepository adminRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private AdminMapper adminMapper;
    @InjectMocks
    private AdminService service;

    @Test
    void primeiroUsuarioPrecisaTerAcessoTotal() {
        when(adminRepository.count()).thenReturn(0L);
        var request = new AdminRequest("jardim.iris", "senha", Set.of("Folha de Pagamento"), false);

        var exception = assertThrows(IllegalArgumentException.class, () -> service.create(request, null));

        assertEquals("O primeiro usuário deve ter acesso total", exception.getMessage());
        verify(adminRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void arrayVazioConcedeAcessoTotal() {
        when(adminRepository.count()).thenReturn(0L);
        when(adminRepository.existsByUsername("administrador")).thenReturn(false);
        when(passwordEncoder.encode("senha")).thenReturn("senha-criptografada");
        var entity = AdminEntity.builder().username("administrador").acessoTotal(true).build();
        var response = new AdminResponse(1L, "administrador", Set.of(), true);
        when(adminMapper.toAdminEntity(any(AdminRequest.class))).thenReturn(entity);
        when(adminRepository.save(entity)).thenReturn(entity);
        when(adminMapper.toAdminResponse(entity)).thenReturn(response);

        var resultado = service.create(new AdminRequest("administrador", "senha", Set.of(), false), null);

        assertEquals(true, resultado.acessoTotal());
        var requestCaptor = org.mockito.ArgumentCaptor.forClass(AdminRequest.class);
        verify(adminMapper).toAdminEntity(requestCaptor.capture());
        assertEquals(true, requestCaptor.getValue().acessoTotal());
    }

    @Test
    void usuarioNaoAutenticadoNaoPodeCadastrarDepoisDoBootstrap() {
        when(adminRepository.count()).thenReturn(1L);
        var request = new AdminRequest("jardim.iris", "senha", Set.of("Desligamento"), false);

        assertThrows(org.springframework.security.access.AccessDeniedException.class,
                () -> service.create(request, (Principal) null));
    }
}
