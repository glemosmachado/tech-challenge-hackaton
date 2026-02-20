# Tech Challenge – Hackathon (Sistema Gerador de Provas)
Autor: Gabriel Machado – RM362607

---

## Visão Geral

Este projeto consiste no desenvolvimento de uma plataforma completa para geração e gestão de provas escolares voltadas ao ensino público.

A solução foi construída em arquitetura full stack, com foco em professores como usuários principais, permitindo:

- composição automática de provas  
- geração de versões A/B  
- gestão de banco de questões  
- autenticação segura por perfil  
- visualização estruturada para impressão  

O sistema foi pensado para ser escalável, modular e preparado para evoluções futuras como correção automática, estatísticas por aluno e geração assistida por IA.

O projeto atende aos requisitos do Hackathon, entregando uma aplicação funcional, integrada e pronta para deploy.

---

## Objetivos do Projeto

- Construir um backend robusto para gestão de provas
- Desenvolver uma interface web moderna e responsiva
- Implementar autenticação segura com JWT
- Permitir composição dinâmica de provas por filtros
- Gerar versões A/B automaticamente
- Disponibilizar visualização estruturada para impressão
- Preparar a base para evolução futura do produto

---

## Perfis de Usuário

### Professor

- Realiza login seguro
- Gerencia banco de questões
- Compõe provas por filtros
- Visualiza versões A/B
- Exclui provas
- Administra alunos cadastrados

### Aluno (estrutura preparada)

- Login implementado
- Estrutura pronta para futuras funcionalidades:
  - visualização de prova
  - resolução
  - acompanhamento de desempenho

---

## Funcionalidades Implementadas

### Autenticação e Autorização

- Registro de usuário
- Login com email e senha
- Autenticação via JWT
- Middleware de proteção de rotas
- Controle por roles (TEACHER / STUDENT)
- Persistência de sessão no front-end
- Logout seguro

---

### Banco de Questões

- CRUD completo via API
- Suporte a:
  - Física
  - Geografia
- Filtros por:
  - disciplina
  - série
  - tópico
  - dificuldade
  - tipo de questão
- Suporte a:
  - MCQ (múltipla escolha)
  - DISC (discursiva)

---

### Composição de Provas

- Seleção por:
  - disciplina
  - série
  - múltiplos tópicos
  - quantidade de questões
  - tipo (MCQ / DISC / MIXED)
- Validação de disponibilidade no banco
- Geração automática de prova
- Armazenamento estruturado no MongoDB

---

### Versões A/B

- Embaralhamento automático
- Ordem independente por versão
- Preservação de integridade da prova
- Visualização alternável no front-end
- Indicação de gabarito

---

### Gestão de Provas

- Listagem de provas do professor
- Abertura em página dedicada
- Visualização estruturada
- Exclusão de prova
- Navegação por versão (A/B)

---

### Gestão de Alunos

- Endpoint de listagem
- Interface de visualização
- Busca por nome ou email
- List view otimizada

---

### Exportação em PDF

- Geração via jsPDF
- Layout preparado para impressão
- Compatível com A4
- Suporte a versões A/B
- Opção com gabarito

---

## Arquitetura do Projeto

### Monorepo
- apps/
-   web/
-   mobile/

- services/
-   api/

---

### Backend

Localização: `services/api`

Responsabilidades:

- autenticação
- regras de negócio
- composição de provas
- geração A/B
- acesso ao MongoDB

---

### Frontend Web

Localização: `apps/web`

Responsabilidades:

- interface do professor
- composição de prova
- gestão de questões
- visualização
- exportação PDF

---

### Mobile (estrutura inicial)

Localização: `apps/mobile`

Status: fora do escopo atual do hackathon, preparado para evolução futura.

---

## Tecnologias Utilizadas

### Backend

- Node.js
- Express
- TypeScript
- MongoDB Atlas
- JWT
- Mongoose

---

### Frontend Web

- React
- Vite
- TypeScript
- React Router
- jsPDF
- Context API (auth)

---

### Infraestrutura

- MongoDB Atlas
- Render (API)
- Vercel ou Render (Web)
- GitHub
- GitHub Actions (estrutura preparada)
- Docker (configuração base)

---

## Estrutura de Pastas (Web)
- src/
  - api/
  - assets/
  - auth/
  - components/
  - lib/
  - router/
  - screens/
  - styles/

Principais responsabilidades:

- `auth/` — controle de sessão
- `lib/api.ts` — comunicação com backend
- `screens/` — páginas principais
- `components/` — layout e UI reutilizável

---

## Fluxo da Aplicação

1. Professor acessa o sistema
2. Realiza login
3. Token JWT é armazenado
4. Front passa a enviar Authorization header
5. Professor pode:
   - compor prova
   - visualizar provas
   - gerenciar questões
   - visualizar alunos
6. Provas podem ser exportadas em PDF

---

## Setup do Projeto

### Pré-requisitos

- Node.js
- npm
- MongoDB Atlas configurado

---

### Instalação

```bash
npm install
---

### Rodar API
npm run dev:api
---

### Rodar WEB
npm --workspace apps/web run dev
---

### Deploy
- API
Render
https://tech-challenge-hackaton.onrender.com

- WEB
Render Static Site
https://tech-challenge-hackaton-1.onrender.com

### Roadmap futuro

- edição parcial de provas
- área do aluno completa
- turmas e vinculações
- estatísticas de desempenho
- geração de questões por IA
- correção automática
- melhorias de UX