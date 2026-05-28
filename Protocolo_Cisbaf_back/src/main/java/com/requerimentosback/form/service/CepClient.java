package com.requerimentosback.form.service;

import com.requerimentosback.form.model.CepResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@Service
@FeignClient(name = "CepClient", url = "https://viacep.com.br/ws")
public interface CepClient {
    @GetMapping("/{cep}/json/")
    CepResponse findAddress(@PathVariable String cep);
}
