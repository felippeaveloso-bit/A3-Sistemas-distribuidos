# Front-end Web — NexoVet

## Visão Geral
Interface web do sistema **NexoVet**, construída em **HTML5**, **CSS3** e **JavaScript** puros (`login.html`, `index.html`, `styles.css` e `app.js`)

## Objetivo
Disponibilizar uma interface responsiva e direta para que os veterinários operem os cadastros da clínica, registrem atendimentos e acompanhem o retorno das integrações externas.

## Escopo Funcional
- **Acesso (`login.html`):** cadastro de novos veterinários, confirmação de senha por e-mail e login na plataforma.
- **Gestão Cadastral (`index.html`):** cadastro, edição e consulta de tutores, endereços (com preenchimento automático via **ViaCEP**), espécies, raças e animais.
- **Operações Clínicas:** vínculo e visualização do histórico de microchips RFID, registro de consultas e controle de vacinas.
- **Painel de Integrações:** acompanhamento das comunicações enviadas ao governo, exibindo status, protocolos gerados e eventuais erros.

## Integração com o Back-end e API Governamental
Consome diretamente os endpoints REST da API Privada da Clínica (`http://localhost:8081`, configurada em `API_BASE` nos arquivos `app.js` e `login.html`). O front-end não se comunica diretamente com a API Governamental: toda persistência, validação e sincronização externa é orquestrada pelo back-end Java, cabendo à interface disparar as operações e exibir os retornos e protocolos.

