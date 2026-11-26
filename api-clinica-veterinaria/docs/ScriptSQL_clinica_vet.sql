CREATE DATABASE clinica_vet;

USE clinica_vet;

CREATE TABLE endereco (
                          id BIGINT AUTO_INCREMENT PRIMARY KEY,
                          cep VARCHAR(10) NOT NULL,
                          logradouro VARCHAR(150) NOT NULL,
                          numero VARCHAR(20) NOT NULL,
                          complemento VARCHAR(100) NULL,
                          bairro VARCHAR(100) NOT NULL,
                          cidade VARCHAR(100) NOT NULL,
                          uf CHAR(2) NOT NULL,
                          codigo_ibge VARCHAR(20) NULL
) ENGINE=InnoDB;

CREATE TABLE tutor (
                       id BIGINT AUTO_INCREMENT PRIMARY KEY,
                       endereco_id BIGINT NOT NULL,
                       cpf VARCHAR(11) NOT NULL,
                       nome_completo VARCHAR(150) NOT NULL,
                       data_nascimento DATE NULL,
                       email VARCHAR(150) NULL,
                       telefone VARCHAR(20) NOT NULL,
                       data_cadastro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                       situacao VARCHAR(20) NOT NULL DEFAULT 'ATIVO',
                       CONSTRAINT uq_tutor_cpf UNIQUE (cpf),
                       CONSTRAINT fk_tutor_endereco FOREIGN KEY (endereco_id) REFERENCES endereco (id)
) ENGINE=InnoDB;

CREATE TABLE especie (
                         id BIGINT AUTO_INCREMENT PRIMARY KEY,
                         nome VARCHAR(80) NOT NULL,
                         descricao VARCHAR(255) NULL,
                         situacao VARCHAR(20) NOT NULL DEFAULT 'ATIVO',
                         CONSTRAINT uq_especie_nome UNIQUE (nome)
) ENGINE=InnoDB;

CREATE TABLE raca (
                      id BIGINT AUTO_INCREMENT PRIMARY KEY,
                      especie_id BIGINT NOT NULL,
                      nome VARCHAR(100) NOT NULL,
                      descricao VARCHAR(255) NULL,
                      situacao VARCHAR(20) NOT NULL DEFAULT 'ATIVO',
                      CONSTRAINT uq_raca_especie_nome UNIQUE (especie_id, nome),
                      CONSTRAINT uq_raca_especie_id UNIQUE (especie_id, id),
                      CONSTRAINT fk_raca_especie FOREIGN KEY (especie_id) REFERENCES especie (id)
) ENGINE=InnoDB;

CREATE TABLE veterinario (
                             id BIGINT AUTO_INCREMENT PRIMARY KEY,
                             cpf VARCHAR(11) NOT NULL,
                             crmv_numero VARCHAR(20) NOT NULL,
                             crmv_uf CHAR(2) NOT NULL,
                             nome_completo VARCHAR(150) NOT NULL,
                             email VARCHAR(150) NOT NULL,
                             telefone VARCHAR(20) NOT NULL,
                             senha_hash VARCHAR(255) NOT NULL,
                             senha_confirmada TINYINT(1) NOT NULL DEFAULT 0,
                             data_confirmacao_senha DATETIME NULL,
                             codigo_confirmacao VARCHAR(100) NULL,
                             codigo_expira_em DATETIME NULL,
                             data_cadastro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                             situacao VARCHAR(20) NOT NULL DEFAULT 'ATIVO',
                             ultimo_acesso DATETIME NULL,
                             CONSTRAINT uq_veterinario_cpf UNIQUE (cpf),
                             CONSTRAINT uq_veterinario_email UNIQUE (email),
                             CONSTRAINT uq_veterinario_crmv UNIQUE (crmv_numero, crmv_uf)
) ENGINE=InnoDB;


CREATE TABLE animal (
                        id BIGINT AUTO_INCREMENT PRIMARY KEY,
                        tutor_id BIGINT NOT NULL,
                        especie_id BIGINT NOT NULL,
                        raca_id BIGINT NULL,
                        nome VARCHAR(100) NOT NULL,
                        data_nascimento DATE NULL,
                        idade_estimada_meses INT NULL,
                        sexo VARCHAR(20) NOT NULL,
                        cor VARCHAR(50) NULL,
                        peso_atual DECIMAL(6,2) NULL,
                        situacao VARCHAR(20) NOT NULL DEFAULT 'ATIVO',
                        CONSTRAINT fk_animal_tutor FOREIGN KEY (tutor_id) REFERENCES tutor (id),
                        CONSTRAINT fk_animal_especie FOREIGN KEY (especie_id) REFERENCES especie (id),
                        CONSTRAINT fk_animal_especie_raca FOREIGN KEY (especie_id, raca_id)
                            REFERENCES raca (especie_id, id)
) ENGINE=InnoDB;

CREATE TABLE vinculo_microchip (
                                   id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                   animal_id BIGINT NOT NULL,
                                   veterinario_id BIGINT NOT NULL,
                                   codigo_microchip VARCHAR(30) NOT NULL,
                                   data_vinculo DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                   data_fim DATETIME NULL,
                                   motivo_encerramento VARCHAR(255) NULL,
                                   CONSTRAINT uq_vinculo_codigo_microchip UNIQUE (codigo_microchip),
                                   CONSTRAINT fk_vinculo_animal FOREIGN KEY (animal_id) REFERENCES animal (id),
                                   CONSTRAINT fk_vinculo_veterinario FOREIGN KEY (veterinario_id) REFERENCES veterinario (id)
) ENGINE=InnoDB;

CREATE TABLE consulta (
                          id BIGINT AUTO_INCREMENT PRIMARY KEY,
                          animal_id BIGINT NOT NULL,
                          veterinario_id BIGINT NOT NULL,
                          data_hora DATETIME NOT NULL,
                          motivo VARCHAR(255) NOT NULL,
                          anamnese TEXT NULL,
                          sintomas TEXT NULL,
                          diagnostico TEXT NULL,
                          tratamento TEXT NULL,
                          prescricao TEXT NULL,
                          peso_kg DECIMAL(6,2) NULL,
                          temperatura_c DECIMAL(4,1) NULL,
                          observacoes TEXT NULL,
                          situacao VARCHAR(20) NOT NULL DEFAULT 'REALIZADA',
                          CONSTRAINT fk_consulta_animal FOREIGN KEY (animal_id) REFERENCES animal (id),
                          CONSTRAINT fk_consulta_veterinario FOREIGN KEY (veterinario_id) REFERENCES veterinario (id)
) ENGINE=InnoDB;

-- 9. VACINA
CREATE TABLE vacina (
                        id BIGINT AUTO_INCREMENT PRIMARY KEY,
                        animal_id BIGINT NOT NULL,
                        veterinario_id BIGINT NOT NULL,
                        nome_vacina VARCHAR(100) NOT NULL,
                        tipo_vacina VARCHAR(50) NOT NULL,
                        antirrabica TINYINT(1) NOT NULL DEFAULT 0,
                        fabricante VARCHAR(100) NOT NULL,
                        numero_lote VARCHAR(50) NOT NULL,
                        data_aplicacao DATE NOT NULL,
                        dose VARCHAR(50) NOT NULL,
                        via_aplicacao VARCHAR(50) NOT NULL,
                        data_proxima_dose DATE NULL,
                        validade_lote DATE NOT NULL,
                        observacoes TEXT NULL,
                        situacao VARCHAR(20) NOT NULL DEFAULT 'APLICADA',
                        CONSTRAINT fk_vacina_animal FOREIGN KEY (animal_id) REFERENCES animal (id),
                        CONSTRAINT fk_vacina_veterinario FOREIGN KEY (veterinario_id) REFERENCES veterinario (id)
) ENGINE=InnoDB;

CREATE TABLE integracao_governo (
                                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                    animal_id BIGINT NOT NULL,
                                    vacina_id BIGINT NULL,
                                    tipo_operacao VARCHAR(40) NOT NULL,
                                    protocolo_externo VARCHAR(60) NULL,
                                    chave_idempotencia VARCHAR(100) NOT NULL,
                                    situacao VARCHAR(20) NOT NULL DEFAULT 'PENDENTE',
                                    data_solicitacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                    data_resposta DATETIME NULL,
                                    tentativas INT NOT NULL DEFAULT 0,
                                    mensagem_erro TEXT NULL,
                                    CONSTRAINT uq_integracao_idempotencia UNIQUE (chave_idempotencia),
                                    CONSTRAINT uq_integracao_vacina UNIQUE (vacina_id),
                                    CONSTRAINT fk_integracao_animal FOREIGN KEY (animal_id) REFERENCES animal (id),
                                    CONSTRAINT fk_integracao_vacina FOREIGN KEY (vacina_id) REFERENCES vacina (id)
) ENGINE=InnoDB;