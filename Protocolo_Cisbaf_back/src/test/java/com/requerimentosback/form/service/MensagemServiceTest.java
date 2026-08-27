package com.requerimentosback.form.service;

import com.requerimentosback.admin.service.AdminDisplayNameService;
import com.requerimentosback.form.model.Formulario;
import com.requerimentosback.form.model.Mensagem;
import com.requerimentosback.form.model.MensagemRequestDTO;
import com.requerimentosback.form.model.enuns.TipoRemetente;
import com.requerimentosback.form.repository.FormularioRepository;
import com.requerimentosback.form.repository.MensagemRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.security.Principal;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MensagemServiceTest {

    @Mock
    private MensagemRepository mensagemRepository;
    @Mock
    private FormularioRepository formularioRepository;
    @Mock
    private EmailService emailService;
    @Mock
    private DiscoService discoService;

    private MensagemService service;

    @BeforeEach
    void setUp() {
        var displayNameService = new AdminDisplayNameService(Map.of("login.bizonho", "Maria Silva"));
        service = new MensagemService(
                mensagemRepository,
                formularioRepository,
                emailService,
                discoService,
                displayNameService
        );
    }

    @Test
    void deveSalvarNomeAmigavelDoAdministradorAutenticado() {
        var formulario = Formulario.builder().id("REQ-1").build();
        var dto = new MensagemRequestDTO("Resposta", TipoRemetente.ADMIN, null);
        Principal principal = () -> "LOGIN.BIZONHO";

        when(mensagemRepository.findFirstByFormularioIdAndRemetenteOrderByDataEnvioDesc(
                "REQ-1",
                TipoRemetente.ADMIN
        )).thenReturn(Optional.empty());
        when(formularioRepository.findById("REQ-1")).thenReturn(Optional.of(formulario));
        when(mensagemRepository.save(any(Mensagem.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Mensagem mensagem = service.enviar("REQ-1", dto, null, principal);

        assertEquals("Maria Silva", mensagem.getNomeRemetente());
        verify(emailService).enviarEmailPorCadaMensagemAdmin(formulario);
    }

    @Test
    void naoDeveAceitarMensagemDeAdministradorSemAutenticacao() {
        var dto = new MensagemRequestDTO("Resposta", TipoRemetente.ADMIN, null);

        assertThrows(AccessDeniedException.class, () -> service.enviar("REQ-1", dto, null, null));
    }
}
