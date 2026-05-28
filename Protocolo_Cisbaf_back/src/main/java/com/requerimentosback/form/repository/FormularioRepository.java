package com.requerimentosback.form.repository;

import com.requerimentosback.form.model.Formulario;
import com.requerimentosback.form.model.enuns.Unidades;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FormularioRepository extends JpaRepository<Formulario, String> {
    List<Formulario> findByUnidade(Unidades unidade);
}
