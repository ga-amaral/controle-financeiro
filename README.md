# Financeiro Pessoal

Sistema web de acompanhamento de finanças pessoais com Next.js, Tailwind CSS, Prisma e PostgreSQL.

## Tecnologias

- **Frontend**: Next.js 14 + Tailwind CSS
- **Backend**: Next.js API Routes
- **ORM**: Prisma
- **Banco de dados**: PostgreSQL (externo)

## Pré-requisitos

- Node.js 18+
- npm ou yarn

## Configuração

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Edite o arquivo `.env` e configure o IP da sua VPS:

```env
DATABASE_URL="postgres://postgres:8ef42ffa70245ba6fc0d97e521575491@SEU_IP_VPS:5433/financeiro"
JWT_SECRET="sua-chave-secreta-aqui-mude-em-producao"
```

**Importante**: Substitua `SEU_IP_VPS` pelo IP real do seu servidor PostgreSQL.

### 3. Executar migrations

```bash
npx prisma migrate dev --name init
```

Isso criará as tabelas no banco de dados PostgreSQL.

### 4. Gerar cliente Prisma

```bash
npx prisma generate
```

### 5. Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

O aplicação estará disponível em: http://localhost:3000

## Como usar

1. Acesse http://localhost:3000
2. Crie uma conta (primeiro acesso)
3. Faça login
4. Adicione transações (receitas/despesas)
5. Acompanhe o dashboard com gráficos mensais

## Estrutura do projeto

```
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   └── register/route.ts
│   │   ├── categories/route.ts
│   │   ├── dashboard/route.ts
│   │   └── transactions/route.ts
│   ├── context/AuthContext.tsx
│   ├── dashboard/page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── auth.ts
│   └── prisma.ts
├── prisma/
│   └── schema.prisma
├── .env
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

## API Endpoints

### Autenticação
- `POST /api/auth/register` - Criar usuário
- `POST /api/auth/login` - Login

### Transações
- `GET /api/transactions` - Listar transações
- `POST /api/transactions` - Criar transação
- `PUT /api/transactions` - Atualizar transação
- `DELETE /api/transactions?id=` - Excluir transação

### Categorias
- `GET /api/categories` - Listar categorias
- `POST /api/categories` - Criar categoria

### Dashboard
- `GET /api/dashboard?year=2026` - Dados do dashboard

## Observações

- Ao criar um usuário, as categorias padrão são criadas automaticamente
- O token JWT tem validade de 7 dias
- As transações podem ser filtradas por mês e ano
