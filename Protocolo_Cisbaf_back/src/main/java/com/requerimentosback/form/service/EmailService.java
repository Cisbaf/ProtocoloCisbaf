package com.requerimentosback.form.service;

import com.requerimentosback.form.model.Formulario;
import com.requerimentosback.form.model.Usuarios;
import com.requerimentosback.form.model.enuns.FinArq;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String emailRemetente;

    // -------------------------------------------------------------------------
    // Core
    // -------------------------------------------------------------------------

    public void enviarEmail(String para, String assunto, String mensagem, boolean html) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");
            helper.setTo(para.trim());
            helper.setSubject(assunto);
            helper.setText(mensagem, html);
            try {
                helper.setFrom(emailRemetente, "Sistema de Requerimentos");
            } catch (java.io.UnsupportedEncodingException e) {
                log.error("Erro ao definir o nome do remetente: {}", e.getMessage());
                helper.setFrom(emailRemetente);
            }
            helper.setReplyTo(emailRemetente);
            mimeMessage.setHeader("X-Mailer", "JavaMailSender");
            mimeMessage.setHeader("X-Priority", "3");
            mimeMessage.setHeader("Message-ID", "<" + System.currentTimeMillis() + "@gmail.com>");

            mailSender.send(mimeMessage);

        } catch (Exception e) {
            log.error("Erro ao enviar email para '{}' com assunto '{}': {}", para, assunto, e.getMessage());
        }
    }

    // -------------------------------------------------------------------------
    // Fluxos de negócio
    // -------------------------------------------------------------------------

    /**
     * Chamado logo após a criação do formulário: notifica o solicitante.
     */
    public void enviarEmailNovoFormulario(Formulario formulario) {
        log.info("Enviando email de novo formulário: {}", formulario.getId());

        Usuarios usuario = formulario.getUsuario();
        if (usuario == null || usuario.getEmail() == null) {
            log.warn("Formulário {} sem usuário/email — email de confirmação não enviado.", formulario.getId());
            return;
        }

        enviarEmail(
                usuario.getEmail(),
                "Requerimento Recebido - " + formulario.getId(),
                montarEmailConfirmacaoUsuario(formulario),
                true
        );
    }

    /**
     * Chamado na atualização do formulário.
     * Só notifica o solicitante se o status for FINALIZADO.
     */
    public void enviarEmailFinalizacaoFormulario(Formulario formulario) {
        // Trava: Se não for FINALIZADO, não envia e-mail.
        if (formulario.getFinalizarArquivar() != FinArq.FINALIZADO) {
            log.info("Status do formulário {} é {}. Nenhum e-mail enviado.", formulario.getId(), formulario.getFinalizarArquivar());
            return;
        }

        log.info("Enviando email de finalização do formulário: {}", formulario.getId());

        Usuarios usuario = formulario.getUsuario();
        if (usuario == null || usuario.getEmail() == null) {
            log.warn("Formulário {} sem usuário/email — email de finalização não enviado.", formulario.getId());
            return;
        }

        enviarEmail(
                usuario.getEmail(),
                "Seu Requerimento foi Finalizado - " + formulario.getId(),
                montarEmailFinalizacaoUsuario(formulario),
                true
        );
    }

    // -------------------------------------------------------------------------
    // Montagem dos templates HTML
    // -------------------------------------------------------------------------

    private String montarEmailConfirmacaoUsuario(Formulario formulario) {
        Usuarios u = formulario.getUsuario();

        // Só renderiza a linha se o benefício existir e não estiver em branco
        String blocoBeneficio = (formulario.getBeneficio() != null && !formulario.getBeneficio().isBlank())
                ? "<tr><td style='padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;'><strong>Benefício Solicitado:</strong></td><td style='padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-weight: 500;'>" + safe(formulario.getBeneficio()) + "</td></tr>"
                : "";

        // Mesma proteção para prioridade
        String blocoPrioridade = (formulario.getPrioridade() != null && !formulario.getPrioridade().isBlank())
                ? "<tr><td style='padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;'><strong>Prioridade:</strong></td><td style='padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-weight: 500;'>" + safe(formulario.getPrioridade()) + "</td></tr>"
                : "";

        return "<div style='font-family: Arial, sans-serif; background-color: #f8fafc; padding: 40px 20px; margin: 0;'>" +
                "<div style='max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);'>" +
                "<div style='background-color: #2563eb; padding: 25px; text-align: center;'>" +
                "<h2 style='color: #ffffff; margin: 0; font-size: 22px; letter-spacing: 0.5px;'>Requerimento Recebido</h2>" +
                "</div>" +
                "<div style='padding: 30px;'>" +
                "<p style='color: #334155; font-size: 16px; line-height: 1.6; margin-top: 0;'>Olá, <strong>" + safe(u.getNome()) + "</strong>!</p>" +
                "<p style='color: #475569; font-size: 15px; line-height: 1.6;'>Seu requerimento foi registrado com sucesso e já está aguardando análise pela equipe.</p>" +
                "<div style='background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 25px 0;'>" +
                "<table width='100%' border='0' cellpadding='0' cellspacing='0' style='font-size: 14px; text-align: left;'>" +
                "<tr><td style='padding: 0 0 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; width: 40%;'><strong>ID do Protocolo:</strong></td><td style='padding: 0 0 12px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-weight: 600;'>" + safe(formulario.getId()) + "</td></tr>" +
                "<tr><td style='padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;'><strong>Assunto:</strong></td><td style='padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-weight: 500;'>" + safe(formulario.getAssunto()) + "</td></tr>" +
                blocoBeneficio +
                blocoPrioridade +
                "<tr><td style='padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;'><strong>Matrícula:</strong></td><td style='padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-weight: 500;'>" + safe(u.getMatricula()) + "</td></tr>" +
                "<tr><td style='padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;'><strong>Cargo:</strong></td><td style='padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-weight: 500;'>" + safe(u.getCargo()) + "</td></tr>" +
                "<tr><td style='padding: 12px 0 0 0; color: #64748b;'><strong>Unidade:</strong></td><td style='padding: 12px 0 0 0; color: #1e293b; font-weight: 500;'>" + safe(formulario.getUnidade() != null ? formulario.getUnidade().name() : null) + "</td></tr>" +
                "</table>" +
                "</div>" +
                "<p style='color: #475569; font-size: 15px;'>Você receberá uma nova notificação assim que houver alguma atualização no status.</p>" +
                "</div>" +
                "<div style='background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;'>" +
                "<p style='margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.5;'>Este é um e-mail automático gerado pelo Sistema de Requerimentos.<br>Por favor, não responda a esta mensagem.</p>" +
                "</div>" +
                "</div>" +
                "</div>";
    }

    private String montarEmailFinalizacaoUsuario(Formulario formulario) {
        Usuarios u = formulario.getUsuario();

        // Configuração visual fixa para FINALIZADO
        String corStatus = "#16a34a"; // Verde
        String bgHeader = "#15803d";  // Verde escuro para o cabeçalho

        String blocoBeneficio = (formulario.getBeneficio() != null && !formulario.getBeneficio().isBlank())
                ? "<tr><td style='padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;'><strong>Benefício:</strong></td><td style='padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-weight: 500;'>" + safe(formulario.getBeneficio()) + "</td></tr>"
                : "";

        String blocoPrioridade = (formulario.getPrioridade() != null && !formulario.getPrioridade().isBlank())
                ? "<tr><td style='padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;'><strong>Prioridade:</strong></td><td style='padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-weight: 500;'>" + safe(formulario.getPrioridade()) + "</td></tr>"
                : "";

        return "<div style='font-family: Arial, sans-serif; background-color: #f8fafc; padding: 40px 20px; margin: 0;'>" +
                "<div style='max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);'>" +
                "<div style='background-color: " + bgHeader + "; padding: 25px; text-align: center;'>" +
                "<h2 style='color: #ffffff; margin: 0; font-size: 22px; letter-spacing: 0.5px;'>Requerimento Finalizado</h2>" +
                "</div>" +
                "<div style='padding: 30px;'>" +
                "<p style='color: #334155; font-size: 16px; line-height: 1.6; margin-top: 0;'>Olá, <strong>" + safe(u.getNome()) + "</strong>!</p>" +
                "<p style='color: #475569; font-size: 15px; line-height: 1.6;'>O seu requerimento foi analisado e <strong>finalizado</strong> pela equipe.</p>" +
                "<div style='background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 25px 0;'>" +
                "<table width='100%' border='0' cellpadding='0' cellspacing='0' style='font-size: 14px; text-align: left;'>" +
                "<tr><td style='padding: 0 0 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; width: 40%;'><strong>ID do Protocolo:</strong></td><td style='padding: 0 0 12px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-weight: 600;'>" + safe(formulario.getId()) + "</td></tr>" +
                "<tr><td style='padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;'><strong>Assunto:</strong></td><td style='padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-weight: 500;'>" + safe(formulario.getAssunto()) + "</td></tr>" +
                blocoBeneficio +
                blocoPrioridade +
                "<tr><td style='padding: 12px 0; color: #64748b;'><strong>Status Atual:</strong></td><td style='padding: 12px 0; color: " + corStatus + "; font-weight: 700;'>FINALIZADO</td></tr>" +
                "</table>" +
                "</div>" +
                "<p style='color: #475569; font-size: 15px;'>Caso tenha alguma dúvida, entre em contato com o setor responsável.</p>" +
                "</div>" +
                "<div style='background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;'>" +
                "<p style='margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.5;'>Este é um e-mail automático gerado pelo Sistema de Requerimentos.<br>Por favor, não responda a esta mensagem.</p>" +
                "</div>" +
                "</div>" +
                "</div>";
    }

    // -------------------------------------------------------------------------
    // Utilitários
    // -------------------------------------------------------------------------

    private String safe(String s) {
        return s == null ? "-" : s;
    }
}