# API Governamental Simulada —

## Visão Geral
Serviço externo simulado desenvolvido em **Python 3.10+**, **FastAPI**, **SQLAlchemy** e **SQLite** (porta `8082`). Representa o órgão público responsável pelo registro de animais microchipados e vacinações antirrábicas.

## Objetivo
Simular um serviço governamental para validar a comunicação distribuída, o controle de idempotência e a tolerância a falhas da API da clínica.

## Escopo Funcional
- Cadastro, consulta e atualização de animais por código de microchip.
- Recebimento, listagem e consulta por protocolo de vacinações antirrábicas.
- Verificação de disponibilidade (`/health`) e documentação (`/docs`).
- Simulação de indisponibilidade (`HTTP 503`) sob demanda.

## Integração com a Clínica Veterinária
Recebe requisições HTTP da API da clínica, gera protocolos únicos e impede duplicidade por meio do cabeçalho `Idempotency-Key`. Permite registrar vacinações antirrábicas mesmo sem cadastro prévio do animal e disponibiliza rota para simular quedas durante os testes de retentativa.


