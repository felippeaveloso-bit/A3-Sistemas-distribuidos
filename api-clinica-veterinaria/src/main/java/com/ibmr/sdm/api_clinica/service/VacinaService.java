package com.ibmr.sdm.api_clinica.service;

import com.ibmr.sdm.api_clinica.Exceptions.RecursoNaoEncontradoException;
import com.ibmr.sdm.api_clinica.mapper.VacinaMapper;
import com.ibmr.sdm.api_clinica.model.dto.IntegracaoGovernoRequestDto;
import com.ibmr.sdm.api_clinica.model.dto.VacinaRequestDto;
import com.ibmr.sdm.api_clinica.model.dto.VacinaResponseDto;
import com.ibmr.sdm.api_clinica.model.entities.Animal;
import com.ibmr.sdm.api_clinica.model.entities.Vacina;
import com.ibmr.sdm.api_clinica.model.entities.Veterinario;
import com.ibmr.sdm.api_clinica.model.enums.SituacaoVacina;
import com.ibmr.sdm.api_clinica.model.enums.TipoOperacaoIntegracao;
import com.ibmr.sdm.api_clinica.repository.AnimalRepository;
import com.ibmr.sdm.api_clinica.repository.VacinaRepository;
import com.ibmr.sdm.api_clinica.repository.VeterinarioRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class VacinaService {

    private final VacinaRepository vacinaRepository;
    private final VacinaMapper vacinaMapper;
    private final AnimalRepository animalRepository;
    private final VeterinarioRepository veterinarioRepository;
    private final IntegracaoGovernoService integracaoService;

    public VacinaService(VacinaRepository vacinaRepository, VacinaMapper vacinaMapper,
                         AnimalRepository animalRepository, VeterinarioRepository veterinarioRepository,
                         IntegracaoGovernoService integracaoService) {
        this.vacinaRepository = vacinaRepository;
        this.vacinaMapper = vacinaMapper;
        this.animalRepository = animalRepository;
        this.veterinarioRepository = veterinarioRepository;
        this.integracaoService = integracaoService;
    }

    @Transactional
    public VacinaResponseDto cadastrar(VacinaRequestDto dto) {
        Animal animal = buscarAnimal(dto.animalId());
        Veterinario veterinario = buscarVeterinario(dto.veterinarioId());

        Vacina vacina = vacinaMapper.toEntity(dto);
        vacina.setAnimal(animal);
        vacina.setVeterinario(veterinario);

        // AQUI VAI Salvar localmente primeiro (registro local nunca é desfeito por falha externa)
        Vacina vacinaSalva = vacinaRepository.save(vacina);

        // Aqui foi regra que estava cusando erro logica que nao seguir as conformidades do requisitos definido pelo professor; Dispara integração APENAS se for antirrábica E efetivamente "APLICADA" era o que estava acontecendo que todas as situação "agendada, "aplciada"
        if (deveComunicarGoverno(vacinaSalva)) {
            dispararComunicacaoAntirrabica(vacinaSalva);
        }

        return vacinaMapper.toDto(vacinaSalva);
    }

    public List<VacinaResponseDto> listarTodas() {
        return vacinaRepository.findAll().stream()
                .map(vacinaMapper::toDto)
                .toList();
    }

    public List<VacinaResponseDto> listarPorVacinaId(Long animalId) {
        return vacinaRepository.findByAnimalId(animalId).stream()
                .map(vacinaMapper::toDto)
                .toList();
    }

    public VacinaResponseDto buscarPorId(Long id) {
        Vacina vacina = vacinaRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Vacina com ID " + id + " não encontrada"));
        return vacinaMapper.toDto(vacina);
    }

    @Transactional
    public VacinaResponseDto atualizar(Long id, VacinaRequestDto dto) {
        Vacina vacinaExistente = vacinaRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Vacina com ID " + id + " não encontrada"));

        boolean eraAplicadaAntes = deveComunicarGoverno(vacinaExistente);

        Animal animal = buscarAnimal(dto.animalId());
        Veterinario veterinario = buscarVeterinario(dto.veterinarioId());

        Vacina vacinaAtualizada = vacinaMapper.toEntity(dto);
        vacinaAtualizada.setId(vacinaExistente.getId());
        vacinaAtualizada.setAnimal(animal);
        vacinaAtualizada.setVeterinario(veterinario);

        vacinaAtualizada = vacinaRepository.save(vacinaAtualizada);

        // Se estava AGENDADA e foi atualizada para APLICADA (sendo antirrábica), dispara o envio agora. Seguindo as confirmadades definidas pelo professor
        if (!eraAplicadaAntes && deveComunicarGoverno(vacinaAtualizada)) {
            dispararComunicacaoAntirrabica(vacinaAtualizada);
        }

        return vacinaMapper.toDto(vacinaAtualizada);
    }

    @Transactional
    public void excluir(Long id) {
        Vacina vacina = vacinaRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Vacina com ID " + id + " não encontrada"));
        vacina.setSituacao(SituacaoVacina.CANCELADA);
        vacinaRepository.save(vacina);
    }

    private boolean deveComunicarGoverno(Vacina vacina) {
        return Boolean.TRUE.equals(vacina.getAntirrabica())
                && vacina.getSituacao() == SituacaoVacina.APLICADA;
    }

    private void dispararComunicacaoAntirrabica(Vacina vacina) {
        IntegracaoGovernoRequestDto integracaoDto = new IntegracaoGovernoRequestDto(
                vacina.getAnimal().getId(),
                vacina.getId(),
                TipoOperacaoIntegracao.VACINA_ANTIRRABICA,
                UUID.randomUUID().toString()
        );
        integracaoService.solicitarIntegracao(integracaoDto);
    }

    private Animal buscarAnimal(Long animalId) {
        return animalRepository.findById(animalId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Animal com ID " + animalId + " não encontrado"));
    }

    private Veterinario buscarVeterinario(Long veterinarioId) {
        return veterinarioRepository.findById(veterinarioId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Veterinário com ID " + veterinarioId + " não encontrado"));
    }

    public List<VacinaResponseDto> listarProximasDoses() {
        return vacinaRepository.findByDataProximaDoseAfter(LocalDate.now().minusDays(1))
                .stream()
                .map(vacinaMapper::toDto)
                .toList();
    }

    public List<VacinaResponseDto> listarProximasDosesPorAnimal(Long animalId) {
        return vacinaRepository.findByAnimalIdAndDataProximaDoseAfter(animalId, LocalDate.now().minusDays(1))
                .stream()
                .map(vacinaMapper::toDto)
                .toList();
    }
}