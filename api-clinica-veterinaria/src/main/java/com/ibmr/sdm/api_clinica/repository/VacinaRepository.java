package com.ibmr.sdm.api_clinica.repository;

import com.ibmr.sdm.api_clinica.model.entities.Vacina;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface VacinaRepository extends JpaRepository<Vacina, Long> {
    List<Vacina> findByAnimalId(Long animalId);

    // Todas as próximas doses agendadas na clínica (ordenadas da mais próxima para a mais distante)
    List<Vacina> findByDataProximaDoseAfter(LocalDate data);

    List<Vacina> findByAnimalIdAndDataProximaDoseAfter(Long animalId, LocalDate data);
    // Próximas doses específicas de um animal
}