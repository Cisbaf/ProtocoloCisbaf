package com.requerimentosback.form.repository;

import com.requerimentosback.form.model.Mensagem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MensagemRepository extends JpaRepository<Mensagem, Long> {
    List<Mensagem> findByFormularioIdOrderByDataEnvioAsc(String formularioId);
    
    java.util.Optional<Mensagem> findFirstByFormularioIdAndNomeRemetenteOrderByDataEnvioDesc(String formularioId, String nomeRemetente);
}
