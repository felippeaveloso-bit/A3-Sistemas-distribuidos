package com.ibmr.sdm.api_clinica.mapper;

import com.ibmr.sdm.api_clinica.model.dto.IntegracaoGovernoRequestDto;
import com.ibmr.sdm.api_clinica.model.dto.IntegracaoGovernoResponseDto;
import com.ibmr.sdm.api_clinica.model.entities.IntegracaoGoverno;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface IntegracaoGovernoMapper {

    @Mapping(target = "animal", ignore = true)
    @Mapping(target = "vacina", ignore = true)
    IntegracaoGoverno toEntity(IntegracaoGovernoRequestDto dto);

    @Mapping(source = "animal.id", target = "animalId")
    @Mapping(target = "vacinaId", expression = "java(entity.getVacina() != null ? entity.getVacina().getId() : null)")
    IntegracaoGovernoResponseDto toDto(IntegracaoGoverno entity);
}