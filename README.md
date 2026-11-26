# Guia de Instalação e Execução — NexoVet (Clínica Vetérinária)

Manual passo a passo para configurar, iniciar e testar localmente os três módulos do sistema: **API Governamental (Python)**, **API Privada da Clínica (Java)** e **Front-end Web (HTML/CSS/JS)**.

---

## Pré-requisitos

Certifique-se de ter as ferramentas abaixo instaladas antes de começar:

- **Java JDK 21** — verifique com `java -version`
- **Apache Maven** *(opcional — o projeto já inclui Maven Wrapper `mvnw` / `mvnw.cmd`)*
- **MySQL Server 8+** ativo na porta `3306`
- **Python 3.10+** com `pip` — verifique com `python --version` (ou `python3 --version`)
- **Git** *(ou download do repositório em `.zip`)*
- **Postman** *(para rodar a coleção de testes das APIs)*
- **VS Code com extensão Live Server** *(opcional, recomendado para abrir o front-end)*

---

## Ordem de Execução

Para evitar erros de comunicação entre os serviços, suba os componentes sempre nesta sequência, mantendo cada terminal aberto:

1. **MySQL** ativo com o schema `clinica_vet` criado.
2. **Terminal 1:** API Governamental (`api-governamental`) na porta `8082`.
3. **Terminal 2 (ou IntelliJ IDEA):** API Privada da Clínica (`api-clinica-veterinaria`) na porta `8081`.
4. **Front-end Web:** `front end/VetCare-Sistema` via Live Server ou servidor HTTP na porta `5500`.

---

## 1. Obter o Código-Fonte

Clone o repositório e entre na pasta raiz:

```bash
git clone https://github.com/RodrigoYamaya/api-clinica-veterinaria.git
cd api-clinica-veterinaria
```

> **Baixou em `.zip`?** Extraia o arquivo e acesse a pasta `api-clinica-veterinaria-main`.

---

## 2. Configurar o Banco de Dados (MySQL)

1. Verifique se o serviço do **MySQL** está em execução na porta `3306`.
2. Crie o banco de dados vazio no MySQL Workbench, DBeaver ou terminal:

```sql
CREATE DATABASE IF NOT EXISTS clinica_vet;
```

3. Abra `api-clinica-veterinaria/src/main/resources/application.properties` e confirme se o usuário e a senha coincidem com o seu MySQL local (ajuste `username` e `password`, se necessário):

```properties
spring.application.name=api-clinica

spring.datasource.url=jdbc:mysql://localhost:3306/clinica_vet
spring.datasource.username=root
spring.datasource.password=123
server.port=8081
spring.jpa.hibernate.ddl-auto=validate

feign.client.config.default.connect-timeout=2000
feign.client.config.default.read-timeout=2000

governo.api.url=http://localhost:8082
```

> **Criação automática de tabelas:** Não é necessário executar scripts SQL manualmente. Ao subir a API Java, o **Flyway** cria automaticamente toda a estrutura do banco `clinica_vet` (`V1`, `V2` e `V3`). A API Governamental cria automaticamente seu banco **SQLite** (`governo_simulado.db`) via **SQLAlchemy** na primeira execução.

---

## 3. Iniciar a API Governamental (Python — Porta 8082)

Suba primeiro a API Governamental para que a API da clínica já encontre o serviço externo online. Abra o **Terminal 1** na raiz do repositório:

### Windows (PowerShell)

```powershell
cd api-governamental
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

*(Se o PowerShell bloquear a execução do `activate`, rode `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` no mesmo terminal e execute `.\venv\Scripts\activate` novamente.)*

### Linux / macOS

```bash
cd api-governamental
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 main.py
```

> **Nas próximas execuções** (com a pasta `venv` já criada e dependências instaladas), basta entrar em `api-governamental`, ativar o ambiente virtual e executar `python main.py` (ou `python3 main.py`).

### Validação

- Acesse `http://localhost:8082/health` — retorno esperado: `{"status": "online", "servico": "API Governamental Simulada"}`.
- Swagger da API Governamental: `http://localhost:8082/docs`.

---

## 4. Iniciar a API Privada da Clínica (Java 21 — Porta 8081)

Mantenha o **Terminal 1** aberto e inicie o backend Java usando **uma** das opções abaixo:

### Opção A — Via Terminal (Maven Wrapper)

Abra o **Terminal 2** na raiz do repositório:

**Windows (PowerShell ou CMD):**

```powershell
cd api-clinica-veterinaria
.\mvnw.cmd spring-boot:run
```

**Linux / macOS:**

```bash
cd api-clinica-veterinaria
./mvnw spring-boot:run
```

### Opção B — Via IntelliJ IDEA

1. Abra a pasta `api-clinica-veterinaria` no **IntelliJ IDEA**.
2. Em **File → Project Structure → SDK**, confirme que o **JDK 21** está selecionado.
3. Aguarde o download das dependências do Maven (ou clique em **Reload All Maven Projects**).
4. Abra `src/main/java/com/ibmr/sdm/api_clinica/ApiClinicaApplication.java` e clique em **Run** (`▶`).

### Validação

- O console exibirá a execução das migrations do **Flyway** e a mensagem `Started ApiClinicaApplication` na porta `8081`.
- Swagger da API da Clínica: `http://localhost:8081/swagger-ui/index.html`.

---

## 5. Iniciar o Front-end Web (`VetCare-Sistema`)

O front-end fica em `front end/VetCare-Sistema/` em HTML, CSS e JavaScript puros — **não precisa de Node.js nem `npm install`**. Com as duas APIs rodando (`8081` e `8082`), escolha **uma** das opções:

### Opção A — Via Live Server no VS Code (Recomendado)

1. Abra a pasta `front end/VetCare-Sistema` no **VS Code**.
2. Clique com o botão direito no arquivo `login.html`.
3. Selecione **Open with Live Server** — a aplicação abrirá automaticamente no navegador.

### Opção B — Via Servidor HTTP do Python

Abra um **Terminal 3** na raiz do repositório (mantenha as aspas por causa do espaço no nome da pasta `front end`):

```bash
cd "front end/VetCare-Sistema"
python -m http.server 5500
```

*(No Linux/macOS, use `python3 -m http.server 5500`.)*

Depois, abra o navegador em: `http://localhost:5500/login.html`.

---

## 6. Primeiro Acesso e Testes de Funcionamento

### 6.1. Criar e ativar o primeiro veterinário (banco recém-criado)

Por regra de segurança da aplicação, um veterinário só consegue fazer login após confirmar a senha. Se o banco `clinica_vet` estiver vazio:

1. Cadastre um veterinário via tela de cadastro do front-end ou em `POST http://localhost:8081/api/veterinarios` (pelo Swagger ou Postman) e anote o `id` retornado.
2. Confirme a senha do veterinário chamando `PATCH http://localhost:8081/api/veterinarios/{id}/confirmar-senha`.
3. Acesse `login.html` no navegador e entre com o e-mail e a senha cadastrados.

### 6.2. Testar os endpoints pelo Swagger

Com ambos os serviços ativos, todos os endpoints podem ser inspecionados e executados direto no navegador:

- **API da Clínica (8081):** `http://localhost:8081/swagger-ui/index.html`
- **API Governamental (8082):** `http://localhost:8082/docs`[.idea](.idea)

### 6.3. Executar a coleção de testes no Postman

1. Abra o **Postman** e clique em **Import**.
2. Selecione o arquivo:
   `api-clinica-veterinaria/docs/clinica-vet 16 testes obrigatorios.postman_collection.json`
3. Com o MySQL e as duas APIs em execução, rode as requisições em ordem (do **Teste 1** ao **Teste 16**).

> **Observação:** Em um banco recém-criado, ajuste nos payloads do Postman os IDs de veterinário, endereço, tutor, espécie, raça e animal conforme os registros gerados localmente.

---

## Solução Rápida de Problemas

- **Erro de conexão com o MySQL (`Access denied` ou `Unknown database`):** confirme que o MySQL está rodando na porta `3306`, que `CREATE DATABASE clinica_vet;` foi executado e que `username`/`password` em `application.properties` correspondem à sua máquina.
- **Login recusado com `"É necessário confirmar a senha"`:** execute `PATCH http://localhost:8081/api/veterinarios/{id}/confirmar-senha` para o veterinário recém-cadastrado antes de tentar autenticar.
- **Erro ao ativar `venv` no PowerShell:** rode `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` no mesmo terminal e execute `.\venv\Scripts\activate` novamente.
- **Porta `8081` ou `8082` já em uso:** encerre o processo que ocupa a porta ou altere `server.port` em `application.properties` (mantendo `governo.api.url` sincronizado com a porta da API Python).
- **Integração governamental falhando durante os testes:** confira se o Terminal 1 (`python main.py`) continua rodando e se `http://localhost:8082/health` retorna `"status": "online"`.
