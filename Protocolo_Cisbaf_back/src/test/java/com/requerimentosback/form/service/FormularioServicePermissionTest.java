package com.requerimentosback.form.service;

import com.requerimentosback.admin.model.AdminEntity;
import com.requerimentosback.admin.repository.AdminRepository;
import com.requerimentosback.form.model.Formulario;
import com.requerimentosback.form.model.Usuarios;
import com.requerimentosback.form.model.enuns.FinArq;
import com.requerimentosback.form.model.enuns.Unidades;
import com.requerimentosback.form.model.erros.CampoDuplicadoException;
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
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.any;

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

    private void prepararAtualizacaoStatus(Formulario formulario) {
        var admin = AdminEntity.builder().username("jardim.iris").acessoTotal(true).build();
        when(adminRepository.findByUsername("jardim.iris")).thenReturn(Optional.of(admin));
        when(repository.findById("123")).thenReturn(Optional.of(formulario));
    }

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

    @Test
    void usuarioRestritoNaoPodeExcluirRequerimento() {
        var admin = AdminEntity.builder().username("jardim.iris").acessoTotal(false).build();
        when(adminRepository.findByUsername("jardim.iris")).thenReturn(Optional.of(admin));

        assertThrows(org.springframework.security.access.AccessDeniedException.class,
                () -> service.deleteById("123", principal));

        verify(mensagemRepository, never()).deleteByFormularioId("123");
        verify(repository, never()).deleteById("123");
    }

    @Test
    void usuarioComAcessoTotalPodeExcluirRequerimento() {
        var admin = AdminEntity.builder().username("jardim.iris").acessoTotal(true).build();
        when(adminRepository.findByUsername("jardim.iris")).thenReturn(Optional.of(admin));

        service.deleteById("123", principal);

        verify(mensagemRepository).deleteByFormularioId("123");
        verify(repository).deleteById("123");
    }

    @Test
    void exigeAssinaturaAoFinalizarRequerimento() {
        var existente = Formulario.builder().id("123").finalizarArquivar(FinArq.EM_ANALISE).build();
        prepararAtualizacaoStatus(existente);

        var exception = assertThrows(IllegalArgumentException.class,
                () -> service.updateStatusByAdmin("123", FinArq.FINALIZADO, "   ", principal));

        assertEquals("A assinatura é obrigatória para finalizar o requerimento", exception.getMessage());
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    void salvaAssinaturaNormalizadaAoFinalizarRequerimento() {
        var existente = Formulario.builder().id("123").finalizarArquivar(FinArq.EM_ANALISE).build();
        prepararAtualizacaoStatus(existente);
        when(repository.saveAndFlush(any(Formulario.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var resultado = service.updateStatusByAdmin(
                "123",
                FinArq.FINALIZADO,
                "  Maria da Silva  ",
                principal
        );

        assertEquals("Maria da Silva", resultado.getHistoricoAssinaturas().getFirst().getNome());
        assertEquals("FINALIZADO", resultado.getHistoricoAssinaturas().getFirst().getAcao());
        org.junit.jupiter.api.Assertions.assertNotNull(resultado.getHistoricoAssinaturas().getFirst().getData());
        assertEquals(FinArq.FINALIZADO, resultado.getFinalizarArquivar());
    }

    @Test
    void exigeNoMinimoTresLetrasNaAssinatura() {
        var existente = Formulario.builder().id("123").finalizarArquivar(FinArq.EM_ANALISE).build();
        prepararAtualizacaoStatus(existente);

        var exception = assertThrows(IllegalArgumentException.class,
                () -> service.updateStatusByAdmin("123", FinArq.FINALIZADO, "A B", principal));

        assertEquals("A assinatura deve ter no mínimo 3 letras", exception.getMessage());
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    void rejeitaNumerosNaAssinatura() {
        var existente = Formulario.builder().id("123").finalizarArquivar(FinArq.EM_ANALISE).build();
        prepararAtualizacaoStatus(existente);

        var exception = assertThrows(IllegalArgumentException.class,
                () -> service.updateStatusByAdmin("123", FinArq.FINALIZADO, "Maria 123", principal));

        assertEquals("A assinatura deve conter apenas letras e espaços", exception.getMessage());
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    void rejeitaCaracteresEspeciaisNaAssinatura() {
        var existente = Formulario.builder().id("123").finalizarArquivar(FinArq.EM_ANALISE).build();
        prepararAtualizacaoStatus(existente);

        var exception = assertThrows(IllegalArgumentException.class,
                () -> service.updateStatusByAdmin("123", FinArq.FINALIZADO, "Maria@Silva", principal));

        assertEquals("A assinatura deve conter apenas letras e espaços", exception.getMessage());
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    void mantemDezReaberturasNoHistoricoComNomeEData() {
        var existente = Formulario.builder().id("123").finalizarArquivar(FinArq.EM_ANALISE).build();
        prepararAtualizacaoStatus(existente);
        when(repository.saveAndFlush(any(Formulario.class))).thenAnswer(invocation -> invocation.getArgument(0));

        for (int i = 1; i <= 10; i++) {
            service.updateStatusByAdmin("123", FinArq.FINALIZADO, "Maria Silva", principal);
            service.updateStatusByAdmin("123", FinArq.EM_ANALISE, "João Souza", principal);
        }

        assertEquals(20, existente.getHistoricoAssinaturas().size());
        assertEquals(10, existente.getHistoricoAssinaturas().stream()
                .filter(evento -> "REABRIU".equals(evento.getAcao()))
                .count());
        org.junit.jupiter.api.Assertions.assertTrue(existente.getHistoricoAssinaturas().stream()
                .allMatch(evento -> evento.getNome() != null && evento.getData() != null));
    }

    @Test
    void exigeAssinaturaAoReabrirRequerimento() {
        var existente = Formulario.builder().id("123").finalizarArquivar(FinArq.FINALIZADO).build();
        prepararAtualizacaoStatus(existente);

        var exception = assertThrows(IllegalArgumentException.class,
                () -> service.updateStatusByAdmin("123", FinArq.EM_ANALISE, null, principal));

        assertEquals("A assinatura é obrigatória para reabrir o requerimento", exception.getMessage());
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    void exigeAssinaturaAoArquivarRequerimento() {
        var existente = Formulario.builder().id("123").finalizarArquivar(FinArq.EM_ANALISE).build();
        prepararAtualizacaoStatus(existente);

        var exception = assertThrows(IllegalArgumentException.class,
                () -> service.updateStatusByAdmin("123", FinArq.ARQUIVADO, null, principal));

        assertEquals("A assinatura é obrigatória para arquivar o requerimento", exception.getMessage());
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    void adicionaArquivamentoAssinadoAoHistorico() {
        var existente = Formulario.builder().id("123").finalizarArquivar(FinArq.EM_ANALISE).build();
        prepararAtualizacaoStatus(existente);
        when(repository.saveAndFlush(any(Formulario.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var resultado = service.updateStatusByAdmin(
                "123",
                FinArq.ARQUIVADO,
                "Carlos Souza",
                principal
        );

        var evento = resultado.getHistoricoAssinaturas().getFirst();
        assertEquals("ARQUIVOU", evento.getAcao());
        assertEquals("Carlos Souza", evento.getNome());
        org.junit.jupiter.api.Assertions.assertNotNull(evento.getData());
        assertEquals(FinArq.ARQUIVADO, resultado.getFinalizarArquivar());
    }

    @Test
    void informaOCampoQuandoEmailPertenceAOutroUsuario() {
        var usuarioRequest = Usuarios.builder()
                .cpf("12345678909")
                .email("teste@gmail.com")
                .build();
        var usuarioCadastrado = Usuarios.builder()
                .cpf("98765432100")
                .email("teste@gmail.com")
                .build();
        var formulario = Formulario.builder().usuario(usuarioRequest).build();
        when(usuariosRepository.findByEmailIgnoreCase("teste@gmail.com"))
                .thenReturn(Optional.of(usuarioCadastrado));

        var exception = assertThrows(CampoDuplicadoException.class,
                () -> service.save(formulario, List.of()));

        assertEquals("email", exception.getCampo());
        assertEquals("Este e-mail já está cadastrado para outro usuário.", exception.getMessage());
        verify(usuariosRepository, never()).save(org.mockito.ArgumentMatchers.any());
        verify(repository, never()).saveAndFlush(org.mockito.ArgumentMatchers.any());
    }
}
