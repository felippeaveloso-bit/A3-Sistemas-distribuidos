package com.ibmr.sdm.api_clinica.service;

import com.ibmr.sdm.api_clinica.Exceptions.RecursoNaoEncontradoException;
import com.ibmr.sdm.api_clinica.Exceptions.RegraDeNegocioException;
import com.ibmr.sdm.api_clinica.mapper.VinculoMicrochipMapper;
import com.ibmr.sdm.api_clinica.model.dto.IntegracaoGovernoRequestDto;
import com.ibmr.sdm.api_clinica.model.dto.VinculoMicrochipRequestDto;
import com.ibmr.sdm.api_clinica.model.dto.VinculoMicrochipResponseDto;
import com.ibmr.sdm.api_clinica.model.entities.Animal;
import com.ibmr.sdm.api_clinica.model.entities.Veterinario;
import com.ibmr.sdm.api_clinica.model.entities.VinculoMicrochip;
import com.ibmr.sdm.api_clinica.model.enums.TipoOperacaoIntegracao;
import com.ibmr.sdm.api_clinica.repository.AnimalRepository;
import com.ibmr.sdm.api_clinica.repository.VeterinarioRepository;
import com.ibmr.sdm.api_clinica.repository.VinculoMicrochipRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class VinculoMicrochipService {

    private final VinculoMicrochipRepository microchipRepository;
    private final VinculoMicrochipMapper microchipMapper;
    private final AnimalRepository animalRepository;
    private final VeterinarioRepository veterinarioRepository;
    private final IntegracaoGovernoService integracaoService;

    public VinculoMicrochipService(VinculoMicrochipRepository microchipRepository,
                                   VinculoMicrochipMapper microchipMapper,
                                   AnimalRepository animalRepository,
                                   VeterinarioRepository veterinarioRepository,
                                   IntegracaoGovernoService integracaoService) {
        this.microchipRepository = microchipRepository;
        this.microchipMapper = microchipMapper;
        this.animalRepository = animalRepository;
        this.veterinarioRepository = veterinarioRepository;
        this.integracaoService = integracaoService;
    }

    @Transactional
    public VinculoMicrochipResponseDto vincularMicrochip(Long animalId, VinculoMicrochipRequestDto dto) {

        if (microchipRepository.existsByCodigoMicrochip(dto.codigoMicrochip())) {
            throw new RegraDeNegocioException("Este código de microchip RFID já foi utilizado no sistema e não pode ser reutilizado!!");
        }

        Animal animal = animalRepository.findById(animalId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Animal com ID " + animalId + " não encontrado"));

        Veterinario veterinario = veterinarioRepository.findById(dto.veterinarioId())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Veterinário com ID " + dto.veterinarioId() + " não encontrado"));

        if (veterinario.getSituacao() != null && "INATIVO".equals(veterinario.getSituacao().name())) {
            throw new RegraDeNegocioException("O vínculo do microchip deve ser realizado por um veterinário ativo e autorizado.");
        }

        microchipRepository.findByAnimalIdAndDataFimIsNull(animalId).ifPresent(chipAntigo -> {
            chipAntigo.setDataFim(LocalDateTime.now());
            chipAntigo.setMotivoEncerramento("Substituição por novo microchip");
            microchipRepository.saveAndFlush(chipAntigo);
        });

        VinculoMicrochip novoChip = microchipMapper.toEntity(dto);
        novoChip.setAnimal(animal);
        novoChip.setVeterinario(veterinario);
        novoChip.setDataVinculo(LocalDateTime.now());

        VinculoMicrochip chipSalvo = microchipRepository.saveAndFlush(novoChip);

        // Dispara o cadastro/sincronização do animal na API governamental assim que ele ganha um microchip
        IntegracaoGovernoRequestDto integracaoDto = new IntegracaoGovernoRequestDto(
                animal.getId(),
                null,
                TipoOperacaoIntegracao.CADASTRO_ANIMAL,
                UUID.randomUUID().toString()
        );
        integracaoService.solicitarIntegracao(integracaoDto);

        return microchipMapper.toDto(chipSalvo);
    }

    public List<VinculoMicrochipResponseDto> listarHistoricoDoAnimal(Long animalId) {
        if (!animalRepository.existsById(animalId)) {
            throw new RecursoNaoEncontradoException("Animal com ID " + animalId + " não encontrado");
        }
        return microchipRepository.findAllByAnimalIdOrderByDataVinculoDesc(animalId).stream()
                .map(microchipMapper::toDto)
                .toList();
    }
}