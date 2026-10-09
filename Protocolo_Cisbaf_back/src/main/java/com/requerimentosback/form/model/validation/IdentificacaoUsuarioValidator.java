package com.requerimentosback.form.model.validation;

import com.requerimentosback.form.model.Usuarios;
import com.requerimentosback.form.model.enuns.TipoDocumento;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class IdentificacaoUsuarioValidator implements ConstraintValidator<IdentificacaoUsuarioValida, Usuarios> {

    @Override
    public boolean isValid(Usuarios usuario, ConstraintValidatorContext context) {
        if (usuario == null) return true;

        boolean valido = true;
        context.disableDefaultConstraintViolation();

        String documento = somenteDigitos(usuario.getCpf());
        TipoDocumento tipo = usuario.getTipoDocumentoEfetivo();

        if (tipo == TipoDocumento.CPF && !isValidCpf(documento)) {
            adicionarErro(context, "cpf", "CPF inválido");
            valido = false;
        } else if (tipo == TipoDocumento.CNPJ && !isValidCnpj(documento)) {
            adicionarErro(context, "cpf", "CNPJ inválido");
            valido = false;
        }

        if (tipo == TipoDocumento.CPF) {
            if (isBlank(usuario.getNome())) {
                adicionarErro(context, "nome", "O primeiro nome é obrigatório");
                valido = false;
            }
            if (isBlank(usuario.getSobrenome())) {
                adicionarErro(context, "sobrenome", "O sobrenome é obrigatório");
                valido = false;
            }
        } else if (isBlank(usuario.getNomeFantasia())) {
            adicionarErro(context, "nomeFantasia", "O nome fantasia é obrigatório");
            valido = false;
        }

        return valido;
    }

    private void adicionarErro(ConstraintValidatorContext context, String campo, String mensagem) {
        context.buildConstraintViolationWithTemplate(mensagem)
                .addPropertyNode(campo)
                .addConstraintViolation();
    }

    private boolean isBlank(String valor) {
        return valor == null || valor.isBlank();
    }

    private static String somenteDigitos(String valor) {
        return valor == null ? "" : valor.replaceAll("\\D", "");
    }

    public static boolean isValidCpf(String cpf) {
        if (cpf.length() != 11 || todosDigitosIguais(cpf)) return false;

        int primeiro = calcularDigito(cpf.substring(0, 9), new int[]{10, 9, 8, 7, 6, 5, 4, 3, 2});
        int segundo = calcularDigito(cpf.substring(0, 9) + primeiro, new int[]{11, 10, 9, 8, 7, 6, 5, 4, 3, 2});
        return cpf.endsWith("" + primeiro + segundo);
    }

    public static boolean isValidCnpj(String cnpj) {
        if (cnpj.length() != 14 || todosDigitosIguais(cnpj)) return false;

        int primeiro = calcularDigito(cnpj.substring(0, 12), new int[]{5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2});
        int segundo = calcularDigito(cnpj.substring(0, 12) + primeiro, new int[]{6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2});
        return cnpj.endsWith("" + primeiro + segundo);
    }

    private static int calcularDigito(String base, int[] pesos) {
        int soma = 0;
        for (int i = 0; i < base.length(); i++) {
            soma += Character.digit(base.charAt(i), 10) * pesos[i];
        }
        int resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
    }

    private static boolean todosDigitosIguais(String valor) {
        return valor.chars().allMatch(digito -> digito == valor.charAt(0));
    }
}
