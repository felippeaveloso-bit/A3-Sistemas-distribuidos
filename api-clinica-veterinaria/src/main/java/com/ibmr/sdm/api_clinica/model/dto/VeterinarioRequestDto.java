package com.ibmr.sdm.api_clinica.model.dto;

import com.ibmr.sdm.api_clinica.model.enums.Situacao;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.hibernate.validator.constraints.br.CPF;

public record VeterinarioRequestDto(
        @NotBlank(message = "O nome completo é obrigatório")
        String nomeCompleto,

        @NotBlank(message = "O CPF é obrigatório")
        @Pattern(regexp = "\\d{11}", message = "O CPF deve conter exatamente 11 dígitos numéricos")
        @CPF(message = "Informe um CPF válido")
        String cpf,

        @NotBlank(message = "O número do CRMV é obrigatório")
        String crmvNumero,

        @NotBlank(message = "A UF do CRMV é obrigatória")
        @Size(min = 2, max = 2, message = "A UF do CRMV deve ter 2 caracteres")
        String crmvUf,

        @NotBlank(message = "O e-mail é obrigatório")
        @Email(message = "O formato do e-mail é inválido")
        String email,

        String telefone,

        @Size(min = 4, message = "A senha deve ter no mínimo 4 caracteres")
        String senha,

        Situacao situacao
) {
}
