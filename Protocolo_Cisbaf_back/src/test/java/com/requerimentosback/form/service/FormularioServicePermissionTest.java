package com.requerimentosback.form.service;

import com.requerimentosback.admin.model.AdminEntity;
import com.requerimentosback.admin.repository.AdminRepository;
import com.requerimentosback.form.model.Formulario;
import com.requerimentosback.form.model.enuns.Unidades;
import com.requerimentosback.form.repository.FormularioRepository;
import com.requerimentosback.form.repository.MensagemRepository;
import com.requerimentosback.form.repository.UsuariosRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.security.Principal;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FormularioServicePermissionTest {

    @Mock
    private FormularioRepository repository;
    @Mock
    private UsuariosRepository usuariosRepository;
    @Mock
    private DiscoService discoService;
    @Mock
    private EmailService emailService;
    @Mock
    private AdminRepository adminRepository;
    @Mock
    private MensagemRepository mensagemRepository;
    @InjectMocks
    private FormularioService service;

    private final Principal principal = () -> "jardim.iris";

    @Test
    void usuarioRestritoBuscaSomenteAssuntosSelecionados() {
        Set<String> assuntos = Set.of("Folha de Pagamento", "Desligamento");
        var admin = AdminEntity.builder().username("jardim.iris").assuntosPermitidos(assuntos).build();
        var esperado = List.of(Formulario.builder().assunto("Folha de Pagamento").build());
        when(adminRepository.findByUsername("jardim.iris")).thenReturn(Optional.of(admin));
        when(repository.findByAssuntoIn(assuntos)).thenReturn(esperado);

        var resultado = service.findByAdmin(principal);

        assertSame(esperado, resultado);
        verify(repository).findByAssuntoIn(assuntos);
        verify(repository, never()).findAll();
    }

    @Test
    void usuarioComAcessoTotalBuscaTodos() {
        var admin = AdminEntity.builder().username("jardim.iris").acessoTotal(true).build();
        var esperado = List.of(Formulario.builder().assunto("Ouvidoria").build());
        when(adminRepository.findByUsername("jardim.iris")).thenReturn(Optional.of(admin));
        when(repository.findAll()).thenReturn(esperado);

        assertSame(esperado, service.findByAdmin(principal));
    }

    @Test
    void usuarioLegadoContinuaFiltradoPelaBase() {
        var admin = AdminEntity.builder().username("jardim.iris").base(Unidades.IRIS).build();
        var esperado = List.of(Formulario.builder().assunto("Atestado").build());
        when(adminRepository.findByUsername("jardim.iris")).thenReturn(Optional.of(admin));
        when(repository.findByUnidade(Unidades.IRIS)).thenReturn(esperado);

        assertSame(esperado, service.findByAdmin(principal));
    }

    @Test
    void usuarioRestritoNaoPodeAlterarOutroAssunto() {
        var admin = AdminEntity.builder()
                .username("jardim.iris")
                .assuntosPermitidos(Set.of("Folha de Pagamento"))
                .build();
        var formulario = Formulario.builder().id("123").assunto("Ouvidoria").build();
        when(adminRepository.findByUsername("jardim.iris")).thenReturn(Optional.of(admin));
        when(repository.findById("123")).thenReturn(Optional.of(formulario));

        assertThrows(org.springframework.security.access.AccessDeniedException.class,
                () -> service.updateByAdmin("123", formulario, principal));
        verify(repository, never()).saveAndFlush(org.mockito.ArgumentMatchers.any());
    }
}
