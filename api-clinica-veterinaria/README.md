# API Privada da Clínica — NexoVet

## Visão Geral
Serviço principal de back-end do sistema **clinica-vet**, responsável por centralizar as regras de negócio da clínica veterinária, a persistência dos dados e a comunicação com APIs externas.

- **Tecnologias:** Java 21, Spring Boot 3.2.4, Spring Data JPA e Spring Cloud OpenFeign
- **Banco de Dados:** MySQL (`clinica_vet`) com versionamento via Flyway
- **Documentação da API:** Swagger / OpenAPI (`http://localhost:8081/swagger-ui/index.html`)
- **Porta padrão:** `8081`

## Objetivo
Gerenciar o fluxo clínico (veterinários, tutores, animais, consultas e vacinas) garantindo a integridade dos registros e o envio confiável das vacinações antirrábicas ao serviço governamental.

## Escopo Funcional
- **Autenticação de Veterinários:** cadastro com hash BCrypt, confirmação de senha e login liberado apenas para profissionais ativos e confirmados.
- **Tutores e Endereços:** gestão de tutores com CPF único e consulta automática de endereços via **ViaCEP**.
- **Animais e Microchips:** cadastro de espécies, raças e animais, além de vínculo de microchip RFID único com registro de histórico.
- **Consultas e Vacinas:** controle de atendimentos clínicos, aplicações de vacinas e consulta de próximas doses.
- **Tratamento de Erros:** respostas padronizadas para falhas de validação, regras de negócio e recursos não encontrados.

## Integrações Externas
- **API Governamental Simulada (`http://localhost:8082`):** comunicação via **OpenFeign** (timeout de `2s`) para sincronizar animais microchipados e registrar vacinas antirrábicas. Cada operação é gravada na tabela `integracao_governo` com **chave de idempotência** (evitando duplicidade), protocolo externo e rotina agendada (`@Scheduled`) para reenvio automático em caso de indisponibilidade.
- **ViaCEP:** preenchimento automático de endereço por CEP, com *fallback* para permitir o cadastro manual caso o serviço esteja indisponível.

## Documentação Complementar
Os demais documentos do projeto (requisitos e arquitetura, modelos conceitual e físico, script SQL, coleção Postman e relatório de testes) estão disponíveis na pasta [`docs/`](./docs).

