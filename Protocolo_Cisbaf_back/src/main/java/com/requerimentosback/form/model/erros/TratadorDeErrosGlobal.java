package com.requerimentosback.form.model.erros;

import jakarta.validation.ConstraintViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;

@RestControllerAdvice
public class TratadorDeErrosGlobal {

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<List<ErroDeValidacaoDto>> tratarErroConstraintViolation(ConstraintViolationException ex) {

        // Pega todas as violações, transforma no nosso DTO e coloca em uma lista
        List<ErroDeValidacaoDto> erros = ex.getConstraintViolations().stream()
                .map(violacao -> new ErroDeValidacaoDto(
                        violacao.getPropertyPath().toString(),
                        violacao.getMessage()
                ))
                .toList();

        // Retorna o status 400 com a lista de erros no corpo da resposta
        return ResponseEntity.badRequest().body(erros);
    }
}
