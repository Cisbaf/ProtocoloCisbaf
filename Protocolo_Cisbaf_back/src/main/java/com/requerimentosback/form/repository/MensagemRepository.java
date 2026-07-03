package com.requerimentosback.form.repository;

import com.requerimentosback.form.model.Mensagem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MensagemRepository extends JpaRepository<Mensagem, Long> {
    List<Mensagem> findByFormularioIdOrderByDataEnvioAsc(String formularioId);
    
   Optional<Mensagem> findFirstByFormularioIdAndNomeRemetenteOrderByDataEnvioDesc(String formularioId, String nomeRemetente);

    void deleteByFormularioId(String formularioId);
}
