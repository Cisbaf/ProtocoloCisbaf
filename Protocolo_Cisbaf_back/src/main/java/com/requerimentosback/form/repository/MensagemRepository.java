package com.requerimentosback.form.repository;

import com.requerimentosback.form.model.Mensagem;
import com.requerimentosback.form.model.enuns.TipoRemetente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MensagemRepository extends JpaRepository<Mensagem, Long> {
    List<Mensagem> findByFormularioIdOrderByDataEnvioAsc(String formularioId);
    
    Optional<Mensagem> findFirstByFormularioIdAndRemetenteOrderByDataEnvioDesc(
            String formularioId,
            TipoRemetente remetente
    );

    void deleteByFormularioId(String formularioId);
}
