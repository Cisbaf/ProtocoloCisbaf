package com.requerimentosback.form.service;

import com.requerimentosback.admin.repository.AdminRepository;
import com.requerimentosback.form.model.Formulario;
import com.requerimentosback.form.model.Mensagem;
import com.requerimentosback.form.repository.FormularioRepository;
import com.requerimentosback.form.repository.MensagemRepository;
import com.requerimentosback.form.repository.UsuariosRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FormularioServiceArquivoTest {

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

    @Test
    void permiteArquivoAnexadoEmMensagemDoFormulario() {
        var formulario = Formulario.builder().id("REQ-1").build();
        var mensagem = Mensagem.builder().arquivoPath("uuid_resposta.pdf;uuid_imagem com espaco.png").build();
        when(repository.findById("REQ-1")).thenReturn(Optional.of(formulario));
        when(mensagemRepository.findByFormularioIdOrderByDataEnvioAsc("REQ-1")).thenReturn(List.of(mensagem));

        assertTrue(service.possuiArquivo("REQ-1", "uuid_imagem com espaco.png"));
    }

    @Test
    void permiteArquivoOriginalDoFormulario() {
        var formulario = Formulario.builder().id("REQ-1").arquivoPath("uuid_documento.pdf").build();
        when(repository.findById("REQ-1")).thenReturn(Optional.of(formulario));

        assertTrue(service.possuiArquivo("REQ-1", "uuid_documento.pdf"));
    }

    @Test
    void rejeitaArquivoQueNaoPertenceAoFormulario() {
        var formulario = Formulario.builder().id("REQ-1").build();
        when(repository.findById("REQ-1")).thenReturn(Optional.of(formulario));
        when(mensagemRepository.findByFormularioIdOrderByDataEnvioAsc("REQ-1")).thenReturn(List.of());

        assertFalse(service.possuiArquivo("REQ-1", "uuid_de_outro_formulario.pdf"));
    }
}
