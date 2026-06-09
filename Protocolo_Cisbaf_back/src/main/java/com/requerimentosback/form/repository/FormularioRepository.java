package com.requerimentosback.form.repository;

import com.requerimentosback.form.model.DadoGraficoDTO;
import com.requerimentosback.form.model.Formulario;
import com.requerimentosback.form.model.enuns.Unidades;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;

@Repository
public interface FormularioRepository extends JpaRepository<Formulario, String> {

    List<Formulario> findByUnidade(Unidades unidade);

    // --- QUERIES GERAIS (TODAS AS UNIDADES) ---

    @Query("SELECT new com.requerimentosback.form.model.DadoGraficoDTO(CAST(f.unidade AS string), COUNT(f)) " +
            "FROM Formulario f " +
            "WHERE f.dataCriacao BETWEEN :inicio AND :fim " +
            "GROUP BY f.unidade " +
            "ORDER BY COUNT(f) DESC")
    List<DadoGraficoDTO> obterVolumePorUnidade(@Param("inicio") Date inicio, @Param("fim") Date fim);

    @Query("SELECT new com.requerimentosback.form.model.DadoGraficoDTO(CAST(FUNCTION('DATE_FORMAT', f.dataCriacao, '%Y-%m-%d') AS string), COUNT(f)) " +
            "FROM Formulario f " +
            "WHERE f.dataCriacao BETWEEN :inicio AND :fim " +
            "GROUP BY CAST(FUNCTION('DATE_FORMAT', f.dataCriacao, '%Y-%m-%d') AS string) " +
            "ORDER BY CAST(FUNCTION('DATE_FORMAT', f.dataCriacao, '%Y-%m-%d') AS string) ASC")
    List<DadoGraficoDTO> obterEvolucaoTemporal(@Param("inicio") Date inicio, @Param("fim") Date fim);

    @Query("SELECT new com.requerimentosback.form.model.DadoGraficoDTO(CAST(f.usuario.cargo AS string), COUNT(f)) " +
            "FROM Formulario f " +
            "WHERE f.dataCriacao BETWEEN :inicio AND :fim " +
            "GROUP BY f.usuario.cargo " +
            "ORDER BY COUNT(f) DESC")
    List<DadoGraficoDTO> obterVolumePorCargo(@Param("inicio") Date inicio, @Param("fim") Date fim);


    // --- QUERIES FILTRADAS (POR UNIDADE ESPECÍFICA) ---

    @Query("SELECT new com.requerimentosback.form.model.DadoGraficoDTO(CAST(f.unidade AS string), COUNT(f)) " +
            "FROM Formulario f " +
            "WHERE f.dataCriacao BETWEEN :inicio AND :fim " +
            "AND f.unidade = :unidade " +
            "GROUP BY f.unidade " +
            "ORDER BY COUNT(f) DESC")
    List<DadoGraficoDTO> obterVolumePorUnidadeFiltrado(@Param("inicio") Date inicio, @Param("fim") Date fim, @Param("unidade") Unidades unidade);

    @Query("SELECT new com.requerimentosback.form.model.DadoGraficoDTO(CAST(FUNCTION('DATE_FORMAT', f.dataCriacao, '%Y-%m-%d') AS string), COUNT(f)) " +
            "FROM Formulario f " +
            "WHERE f.dataCriacao BETWEEN :inicio AND :fim " +
            "AND f.unidade = :unidade " +
            "GROUP BY CAST(FUNCTION('DATE_FORMAT', f.dataCriacao, '%Y-%m-%d') AS string) " +
            "ORDER BY CAST(FUNCTION('DATE_FORMAT', f.dataCriacao, '%Y-%m-%d') AS string) ASC")
    List<DadoGraficoDTO> obterEvolucaoTemporalFiltrado(@Param("inicio") Date inicio, @Param("fim") Date fim, @Param("unidade") Unidades unidade);

    @Query("SELECT new com.requerimentosback.form.model.DadoGraficoDTO(CAST(f.usuario.cargo AS string), COUNT(f)) " +
            "FROM Formulario f " +
            "WHERE f.dataCriacao BETWEEN :inicio AND :fim " +
            "AND f.unidade = :unidade " +
            "GROUP BY f.usuario.cargo " +
            "ORDER BY COUNT(f) DESC")
    List<DadoGraficoDTO> obterVolumePorCargoFiltrado(@Param("inicio") Date inicio, @Param("fim") Date fim, @Param("unidade") Unidades unidade);
}
