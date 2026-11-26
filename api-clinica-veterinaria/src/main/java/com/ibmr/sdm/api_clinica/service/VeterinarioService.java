package com.ibmr.sdm.api_clinica.service;

import com.ibmr.sdm.api_clinica.Exceptions.RecursoNaoEncontradoException;
import com.ibmr.sdm.api_clinica.Exceptions.RegraDeNegocioException;
import com.ibmr.sdm.api_clinica.mapper.VeterinarioMapper;
import com.ibmr.sdm.api_clinica.model.dto.LoginRequestDto;
import com.ibmr.sdm.api_clinica.model.dto.LoginResponseDto;
import com.ibmr.sdm.api_clinica.model.dto.VeterinarioRequestDto;
import com.ibmr.sdm.api_clinica.model.dto.VeterinarioResponseDto;
import com.ibmr.sdm.api_clinica.model.entities.Veterinario;
import com.ibmr.sdm.api_clinica.model.enums.Situacao;
import com.ibmr.sdm.api_clinica.repository.VeterinarioRepository;
import jakarta.transaction.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class VeterinarioService {

    private final VeterinarioRepository veterinarioRepository;
    private final VeterinarioMapper veterinarioMapper;
    private final PasswordEncoder passwordEncoder;

    public VeterinarioService(
            VeterinarioRepository veterinarioRepository,
            VeterinarioMapper veterinarioMapper,
            PasswordEncoder passwordEncoder) {
        this.veterinarioRepository = veterinarioRepository;
        this.veterinarioMapper = veterinarioMapper;
        this.passwordEncoder = passwordEncoder;
    }

    public List<VeterinarioResponseDto> listarVeterinario() {
        return veterinarioRepository.findAll()
                .stream()
                .map(veterinarioMapper::toDto)
                .collect(Collectors.toList());
    }

    public VeterinarioResponseDto buscarPorId(long id) {
        Veterinario veterinario = veterinarioRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Veterinário com ID " + id + " não encontrado"));
        return veterinarioMapper.toDto(veterinario);
    }

    @Transactional
    public VeterinarioResponseDto cadastrar(VeterinarioRequestDto veterinarioDto) {
        if (veterinarioDto.senha() == null || veterinarioDto.senha().isBlank()) {
            throw new RegraDeNegocioException("A senha é obrigatória para cadastrar o veterinário.");
        }

        if (veterinarioRepository.existsByCpf(veterinarioDto.cpf())) {
            throw new IllegalArgumentException("Já existe um veterinário cadastrado com o CPF: " + veterinarioDto.cpf());
        }

        Veterinario veterinario = veterinarioMapper.toEntity(veterinarioDto);
        veterinario.setSenhaHash(passwordEncoder.encode(veterinarioDto.senha()));
        Veterinario veterinarioSalvo = veterinarioRepository.save(veterinario);
        return veterinarioMapper.toDto(veterinarioSalvo);
    }
    @Transactional
    public void deletarVeterinario(long id) {
        if (!veterinarioRepository.existsById(id)) {
            throw new RecursoNaoEncontradoException("Veterinario com ID " + id + " não encontrado");
        }
        veterinarioRepository.deleteById(id);
    }

    @Transactional
    public VeterinarioResponseDto update(VeterinarioRequestDto veterinarioDto, long id) {
        Veterinario veterinario = veterinarioRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Veterinário com ID " + id + " não encontrado"));

        if (!veterinario.getCpf().equals(veterinarioDto.cpf()) && veterinarioRepository.existsByCpf(veterinarioDto.cpf())) {
            throw new IllegalArgumentException("O CPF informado já está em uso por outro veterinário.");
        }

        veterinario.setNomeCompleto(veterinarioDto.nomeCompleto());
        veterinario.setCpf(veterinarioDto.cpf());
        veterinario.setCrmvNumero(veterinarioDto.crmvNumero());
        veterinario.setCrmvUf(veterinarioDto.crmvUf());
        veterinario.setEmail(veterinarioDto.email());
        veterinario.setTelefone(veterinarioDto.telefone());

        if (veterinarioDto.situacao() != null) {
            veterinario.setSituacao(veterinarioDto.situacao());
        }

        if (veterinarioDto.senha() != null && !veterinarioDto.senha().isBlank()) {
            veterinario.setSenhaHash(passwordEncoder.encode(veterinarioDto.senha()));
        }

        Veterinario veterinarioUpdate = veterinarioRepository.save(veterinario);
        return veterinarioMapper.toDto(veterinarioUpdate);
    }

    @Transactional
    public LoginResponseDto realizarLogin(LoginRequestDto request) {
        Veterinario vet = veterinarioRepository.findByEmail(request.email())
                .orElseThrow(() -> new RegraDeNegocioException("E-mail ou senha inválidos."));

        if (!passwordEncoder.matches(request.senha(), vet.getSenhaHash())) {
            throw new RegraDeNegocioException("E-mail ou senha inválidos.");
        }

        if (vet.getSituacao() != null && "INATIVO".equals(vet.getSituacao().name())) {
            throw new RegraDeNegocioException("Veterinário inativo no sistema.");
        }

        if (vet.getSenhaConfirmada() == null || !vet.getSenhaConfirmada()) {
            throw new RegraDeNegocioException("Acesso negado. É necessário confirmar a senha.");
        }

        vet.setUltimoAcesso(LocalDateTime.now());
        veterinarioRepository.save(vet);

        return veterinarioMapper.toLoginResponseDto(vet);
    }
    

    @Transactional
    public void confirmarSenhaPorId(Long id) {
        Veterinario vet = veterinarioRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Veterinário com ID " + id + " não encontrado."));

        validarEConfirmar(vet);
    }

    @Transactional
    public void confirmarSenhaPorEmail(String email) {
        Veterinario vet = veterinarioRepository.findByEmail(email)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Veterinário com o e-mail " + email + " não encontrado."));

        validarEConfirmar(vet);
    }

    private void validarEConfirmar(Veterinario vet) {
        if (Boolean.TRUE.equals(vet.getSenhaConfirmada())) {
            throw new RegraDeNegocioException("A senha deste cadastro já foi confirmada anteriormente.");
        }

        vet.setSenhaConfirmada(true);
        vet.setDataConfirmacaoSenha(LocalDateTime.now());
        veterinarioRepository.save(vet);
    }


}