# GD CELL STORE ERP

ERP web para operação de loja, com frontend em React e backend em Flask/PostgreSQL.

## Stack

- `frontend`: React + styled-components
- `backend`: Flask + psycopg2
- `banco`: PostgreSQL

## Estrutura

```text
cell-store-master/
  backend/
  frontend/
```

## Requisitos

- Node.js 18+
- Python 3.11+
- PostgreSQL 14+

## Variáveis de ambiente

O backend usa estas variáveis:

- `DATABASE_URL`
  String de conexão do PostgreSQL.
  Exemplo:
  `postgresql://postgres:postgres@localhost:5432/postgres`
- `ADMIN_PASSWORD`
  Senha inicial do usuário `admin`.
  Em ambiente com `DATABASE_URL`, esta variável deve estar definida.
- `ENABLE_DEBUG_DB`
  Deixe `0` ou ausente em uso normal.
  Use `1` apenas em debug controlado.
- `FLASK_DEBUG`
  Use `1` só em desenvolvimento.
- `PORT`
  Porta do backend. O padrão é `5000`.

Se `DATABASE_URL` não estiver definida, o backend tenta conectar em:

`user=postgres password=postgres dbname=postgres host=localhost`

## Instalação

### Backend

```powershell
cd C:\Users\user\Downloads\cell-store-master\cell-store-master
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r backend\requirements.txt
```

### Frontend

```powershell
cd C:\Users\user\Downloads\cell-store-master\cell-store-master\frontend
npm install
```

Para ambiente Vercel do frontend, use também:

```powershell
cd C:\Users\user\Downloads\cell-store-master\cell-store-master\frontend
copy .env.example .env
```

## Rodando em desenvolvimento

### 1. Suba o backend

```powershell
cd C:\Users\user\Downloads\cell-store-master\cell-store-master
$env:DATABASE_URL='postgresql://postgres:postgres@localhost:5432/postgres'
$env:ADMIN_PASSWORD='troque-essa-senha'
python backend\app.py
```

O backend sobe em `http://127.0.0.1:5000`.

Se quiser aplicar as migrações manualmente antes de subir a API:

```powershell
cd C:\Users\user\Downloads\cell-store-master\cell-store-master
python -m backend.migrate
```

## Deploy na Vercel

Use dois projetos separados da mesma base:

### Frontend

- crie um projeto Vercel apontando para a pasta `frontend`
- framework preset: `Create React App`
- variável obrigatória:
  - `REACT_APP_API_URL=https://seu-backend.vercel.app/api`
- o arquivo [frontend/vercel.json](C:/Users/user/Downloads/cell-store-master/cell-store-master/frontend/vercel.json) já deixa o SPA funcionando com rotas internas

### Backend

- crie outro projeto Vercel apontando para a pasta `backend`
- o arquivo [backend/vercel.json](C:/Users/user/Downloads/cell-store-master/cell-store-master/backend/vercel.json) já publica o Flask como função Python
- variáveis obrigatórias:
  - `DATABASE_URL`
  - `ADMIN_PASSWORD`
  - `CORS_ALLOWED_ORIGINS=https://seu-frontend.vercel.app`
- variáveis recomendadas:
  - `ENABLE_DEBUG_DB=0`
  - `FLASK_DEBUG=0`

Depois do primeiro deploy do backend, rode a migração uma vez com:

```powershell
cd C:\Users\user\Downloads\cell-store-master\cell-store-master
python -m backend.migrate
```

## Deploy recomendado para operacao: Vercel + Railway

Para uso real de loja, a combinacao mais estavel hoje e:

- `frontend` na Vercel
- `backend` e `PostgreSQL` na Railway

### Backend na Railway

- crie um novo projeto na Railway
- adicione um servico `PostgreSQL` no mesmo projeto
- adicione um servico da aplicacao apontando para este repositorio
- configure o `Root Directory` do servico da aplicacao para `backend`
- o arquivo [backend/railway.json](C:/Users/user/Downloads/cell-store-master/cell-store-master/backend/railway.json) ja define:
  - `preDeployCommand=python migrate.py`
  - `startCommand=gunicorn --bind 0.0.0.0:$PORT app:app`
  - `healthcheckPath=/api/health`
- variaveis obrigatorias do backend:
  - `DATABASE_URL` (a Railway injeta ao conectar o Postgres)
  - `ADMIN_PASSWORD`
  - `CORS_ALLOWED_ORIGINS=https://seu-frontend.vercel.app`
- variaveis recomendadas:
  - `ENABLE_DEBUG_DB=0`
  - `FLASK_DEBUG=0`

### Frontend na Vercel apontando para a Railway

Depois que o backend da Railway estiver publicado, atualize o projeto do frontend na Vercel:

- `REACT_APP_API_URL=https://seu-backend.up.railway.app/api`

Em seguida, faça um novo deploy do frontend na Vercel para cortar o trafego para a nova API.

### 2. Suba o frontend

Em outro terminal:

```powershell
cd C:\Users\user\Downloads\cell-store-master\cell-store-master\frontend
npm start
```

O frontend sobe em `http://127.0.0.1:3000`.

## Build de produção

```powershell
cd C:\Users\user\Downloads\cell-store-master\cell-store-master\frontend
npm run build
```

Depois disso, o Flask passa a servir o build estático do frontend pela pasta `frontend/build`.

## Testes

### Backend

```powershell
cd C:\Users\user\Downloads\cell-store-master\cell-store-master
python -m unittest backend.tests.test_api_flows -v
```

### Frontend

```powershell
cd C:\Users\user\Downloads\cell-store-master\cell-store-master\frontend
$env:CI='true'
npm test -- --watch=false --runInBand
```

## Credenciais iniciais

- usuário: `admin`
- senha:
  - valor de `ADMIN_PASSWORD`, se definido
  - `admin123` apenas em ambiente local sem `DATABASE_URL`

## Observações importantes

- O banco é inicializado automaticamente no boot do backend.
- As migrações ficam versionadas em `backend/migrations/versions/`.
- O histórico aplicado é salvo na tabela `schema_migrations`.
- O runner de migração usa `pg_advisory_lock` para evitar corrida de schema no primeiro boot.
- O endpoint `/api/debug-db` fica fechado por padrão e só responde quando:
  - o usuário está autenticado
  - o usuário é admin
  - `ENABLE_DEBUG_DB=1`

## Validação usada neste projeto

Checklist atual:

- `python -m py_compile backend/app.py`
- `python -m unittest backend.tests.test_api_flows -v`
- `python -m unittest backend.tests.test_migrations -v`
- `npm run build`
- `npm test -- --watch=false --runInBand`

## Próximos passos recomendados

- continuar quebrando arquivos grandes do frontend
- ampliar testes de frontend para mais fluxos manuais
- adicionar novas migrações versionadas conforme o schema evoluir
