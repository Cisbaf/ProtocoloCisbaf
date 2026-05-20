package com.requerimentosback.form.repository;

import com.requerimentosback.form.model.Formulario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FormularioRepository extends JpaRepository<Formulario, String> {
}
