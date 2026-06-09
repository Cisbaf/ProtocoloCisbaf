package com.requerimentosback.form.repository;

import com.requerimentosback.form.model.Usuarios;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UsuariosRepository extends JpaRepository<Usuarios, String> {
    Optional<Usuarios> findByCpfAndNomeAndSobrenome(String cpf, String nome, String sobrenome);
}
