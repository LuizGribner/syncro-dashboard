# Syncro Solutions Dashboard

Dashboard interno para gestão de projetos, equipe e financeiro da Syncro Solutions LLC.

## Stack

- **Next.js 14** (App Router) — React framework
- **Supabase** — Banco de dados Postgres + Autenticação + Storage
- **Tailwind CSS** — Estilização
- **TypeScript** — Tipagem
- **Vercel** — Deploy

---

## Setup: Passo a Passo

### 1. Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um projeto novo
2. Vá em **SQL Editor** e cole o conteúdo de `supabase/schema.sql` e execute
3. Em **Settings > API**, copie a **Project URL** e a **anon public key**
4. Em **Authentication > Users**, crie dois usuários:
   - Você: `luiz@syncrosolutions.com` + senha
   - Gabi: `gabi@syncrosolutions.com` + senha

### 2. Projeto local

```bash
# Clone ou baixe o projeto
git clone https://github.com/SEU_USUARIO/syncro-dashboard.git
cd syncro-dashboard

# Instale dependências
npm install

# Configure variáveis de ambiente
cp .env.local.example .env.local
# Edite .env.local com suas credenciais do Supabase

# Rode em desenvolvimento
npm run dev
```

Acesse: http://localhost:3000

### 3. Deploy no Vercel

1. Push para GitHub
2. Acesse [vercel.com](https://vercel.com) > **New Project** > importe o repositório
3. Em **Environment Variables**, adicione:
   - `NEXT_PUBLIC_SUPABASE_URL` = sua URL do Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = sua anon key
4. Deploy!

---

## Estrutura do Projeto

```
src/
├── app/
│   ├── login/          # Tela de login
│   ├── dashboard/      # Visão geral com métricas
│   ├── projects/       # Lista e detalhe de projetos
│   ├── employees/      # Gestão da equipe + pagamentos
│   └── finance/        # Histórico financeiro
├── components/
│   └── layout/         # Sidebar de navegação
├── lib/
│   └── supabase/       # Clients (browser + server)
└── types/
    └── database.ts     # Tipos TypeScript do banco
```

## Funcionalidades

- ✅ Login seguro (você + Gabi)
- ✅ Dashboard com métricas em tempo real
- ✅ Projetos: criar, editar, excluir, filtrar por status
- ✅ Funcionário em múltiplos projetos (many-to-many)
- ✅ Upload de arquivos por projeto (Supabase Storage)
- ✅ Equipe: cadastro, salário, status ativo/inativo
- ✅ Pagamentos: registrar, histórico, filtro por status
- ✅ Financeiro: receita por projeto, total pago à equipe
- ✅ Proteção de rotas (middleware)
- ✅ Row Level Security no banco
