# Projeto: Pokedex Site

## Visão geral
Site de Pokedex, usando https://www.pokemon.com/br/pokedex como referência de layout e experiência de navegação. Objetivo: listar Pokémons com busca/filtro e página de detalhes de cada um.

## Decisões técnicas
O histórico das decisões e o porquê de cada uma está em:

@DECISOES.md

Leia antes de propor qualquer mudança de arquitetura.

## Stack
- **Frontend:** React + TypeScript + Vite
- **Estilização:** Tailwind CSS
- **Backend:** Node.js + Express + TypeScript
- **Banco de dados:** SQLite (dev) via Prisma ORM
- **Dados dos Pokémons:** PokeAPI (https://pokeapi.co) como fonte, ou dados sincronizados para o próprio banco via Prisma

## Convenções de código
- TypeScript sem uso de `any`
- Comentários no código em português
- Estilização somente com Tailwind (sem CSS solto, salvo casos muito específicos)
- Nomes de componentes em PascalCase, arquivos de componente `NomeComponente.tsx`
- Rotas da API em inglês (`/api/pokemons`), nomes de variáveis em português quando fizer sentido para o domínio

## Fluxo de trabalho
- Construir uma seção/funcionalidade por vez
- Sempre pedir aprovação antes de seguir para a próxima etapa
- Explicar decisões técnicas de forma simples (autor está aprendendo programação)

## Status do projeto
- [x] Setup inicial do repositório (frontend + backend)
- [x] Configuração do Prisma + schema inicial
- [x] Estrutura de rotas da API
- [x] Layout base do frontend (Navbar, Grid de Pokémons)
- [x] Página de detalhes do Pokémon
- [x] Busca e filtros
- [x] Sincronizar todas as gerações da PokeAPI (1025 Pokémon, 9 gerações)
- [x] Paginação da Home por geração (não por número fixo de itens)
- [x] Opção "Todas" no seletor de geração (exige paginação ou scroll infinito na Home)
- [x] Modelos `User` e `Captura` no Prisma (relação usuário ↔ Pokémon)
- [x] Autenticação na API: cadastro, login e logout (senha com hash, nunca em texto puro)
- [x] Estado de autenticação no frontend + página `/login` e `/cadastro`
- [x] Navbar: botão "Entrar" quando deslogado, nome do usuário e "Sair" quando logado
- [ ] Página `/minha-pokedex` com os Pokémon capturados pelo usuário logado (rota protegida)
- [ ] Botão de capturar/remover no `PokemonCard` (deslogado → redireciona para o login)
- [ ] Deploy

## Arquitetura atual

### Estrutura de pastas (real)
```
pokedex/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── dev.db                  # banco SQLite local (gitignored)
├── apps/
│   ├── api/
│   │   ├── prisma.config.ts    # config do Prisma CLI (schema/migrations/URL)
│   │   ├── .env                # DATABASE_URL, JWT_SECRET (gitignored)
│   │   ├── .env.example        # variáveis necessárias, sem valores reais
│   │   └── src/
│   │       ├── index.ts        # cria o Express app, monta os routers
│   │       ├── prisma.ts       # client único do Prisma (com driver adapter)
│   │       ├── token.ts        # criarToken/verificarToken (JWT)
│   │       ├── middlewares/
│   │       │   └── autenticacao.ts   # exige cookie de login válido, anexa req.usuarioId
│   │       ├── routes/
│   │       │   ├── pokemons.routes.ts
│   │       │   ├── geracoes.routes.ts
│   │       │   └── auth.routes.ts
│   │       ├── scripts/
│   │       │   └── sync-pokeapi.ts   # popula o banco a partir da PokeAPI
│   │       └── generated/prisma/     # Prisma Client gerado (gitignored)
│   └── web/
│       └── src/
│           ├── main.tsx        # ponto de entrada, envolve App em <BrowserRouter><AuthProvider>
│           ├── App.tsx         # define as rotas (react-router)
│           ├── config.ts       # API_BASE_URL
│           ├── types/           # pokemon.ts, usuario.ts
│           ├── constants/coresPorTipo.ts
│           ├── contexts/AuthContext.tsx   # AuthProvider + useAuth (usuário logado)
│           ├── hooks/          # usePokemons, usePokemon, useGeracoes
│           ├── components/     # Layout, Navbar, PokemonCard, PokemonGrid, SeletorDeGeracao
│           └── pages/          # PaginaInicial, PaginaDetalhe, PaginaLogin, PaginaCadastro
├── CLAUDE.md
└── DECISOES.md
```

### Rotas da API (Express, porta 3001)
- `GET /api/health` — healthcheck simples, `{ status: "ok" }`.
- `GET /api/pokemons` — lista Pokémon paginada. Resposta: `{ itens, total, pagina, limite }`, onde `itens` tem o formato resumido (`id`, `nome`, `spriteUrl`, `tipos`) e `total` é a contagem batendo com os filtros aplicados. Aceita query params combináveis: `busca` (nome contém, case-insensitive), `tipo` (nome do tipo), `geracao` (número da geração), `limite` (padrão 96, máximo 100) e `pagina` (padrão 1). Entradas inválidas (não numéricas, zero ou negativas) caem nos padrões em vez de quebrar a rota.
- `GET /api/pokemons/:id` — detalhe completo de um Pokémon (`altura`, `peso`, `spriteUrl`, `tipos`, `stats` com os 6 atributos base). 400 se `:id` não for número, 404 se não existir.
- `GET /api/geracoes` — lista as 9 gerações com `numero`, `regiao` e `totalPokemons` (contagem via Prisma).
- `POST /api/auth/register` — `{ nome, email, senha }`. 400 se faltar campo/senha curta, 409 se o email já existe. Cria o usuário (senha vira `senhaHash` via bcrypt) e já loga (seta o cookie).
- `POST /api/auth/login` — `{ email, senha }`. 401 genérico ("Email ou senha inválidos") se um dos dois estiver errado, sem dizer qual.
- `POST /api/auth/logout` — limpa o cookie de login.
- `GET /api/auth/me` — rota protegida (usa o middleware `autenticacao`); devolve o usuário logado a partir do cookie, 401 se não tiver.

### Modelo de dados (Prisma, `prisma/schema.prisma`)
- `Pokemon` — atributos base + `geracaoNumero` (FK pra `Generation`).
- `Type` — tipos únicos (fire, water, etc.), relação muitos-para-muitos com `Pokemon` via `PokemonType`.
- `Generation` — `numero` (1 a 9) + `regiao` (kanto, johto, ...), relação um-para-muitos com `Pokemon`.
- `User` — `nome`, `email` (único), `senhaHash`.
- `Captura` — liga `User` a `Pokemon` (`userId` + `pokemonId`), com `@@unique([userId, pokemonId])` pra não capturar o mesmo Pokémon duas vezes.

### Frontend (React + Vite, porta 5173)
- **Rotas:** `/` (Home, `PaginaInicial`), `/pokemon/:id` (`PaginaDetalhe`), `/login` (`PaginaLogin`) e `/cadastro` (`PaginaCadastro`), todas dentro de `Layout` (Navbar fixa + `<Outlet />`).
- **`AuthContext`/`useAuth()`** — `AuthProvider` envolve o app inteiro (dentro do `BrowserRouter`, em `main.tsx`) e guarda `usuario: Usuario | null` + `carregando` (true enquanto confere `GET /api/auth/me` na carga inicial, pra saber se o cookie já existente ainda vale). Expõe `login`/`cadastrar`/`logout`, que chamam a API com `credentials: 'include'` (necessário pro cookie httpOnly ir/vir entre `localhost:5173` e `localhost:3001`) e lançam `Error` com a mensagem da API em caso de falha, pra página mostrar. `PaginaLogin`/`PaginaCadastro` usam esse hook e navegam pra `/` em caso de sucesso; as duas também redirecionam pra `/` (sem renderizar o formulário) se `useAuth()` já disser que tem usuário logado.
- **`Navbar`** lê `useAuth()`: enquanto `carregando` é `true`, mostra um placeholder (`animate-pulse`, mesma altura do botão/link real, pra Navbar não mudar de tamanho); deslogado mostra um link "Entrar"; logado mostra o email (truncado com `max-w` no mobile) + botão "Sair" (chama `logout()` e navega pra `/`).
- **`PaginaInicial`** guarda a geração atual na URL (`?geracao=N` ou `?geracao=todas` via `useSearchParams`), renderiza `SeletorDeGeracao` e `PokemonGrid`. `geracao=todas` vira `geracao={undefined}` pro grid (sem filtro).
- **`SeletorDeGeracao`** trata `["todas", 1, 2, ..., 9]` como uma sequência única — Anterior/Próxima sempre andam ±1 posição nela (desabilitadas nas duas pontas).
- **`PokemonGrid`** é dono do estado de busca (texto) e filtro de tipo (pills clicáveis); busca os dados via o hook `usePokemons`, que recebe `busca`/`tipo`/`geracao` e faz debounce de 300ms. A paginação de verdade (96 por página, acumulando com "Carregar mais") só acontece quando `geracao` é `undefined` (opção "Todas") — com uma geração específica selecionada, o hook busca as páginas necessárias em sequência automaticamente (1 ou 2 requisições, já que a API tem teto de 100 itens por chamada) e entrega a geração inteira de uma vez, sem botão. Trocar busca/tipo/geracao reinicia o acumulado. Mostra "X de Y Pokémon" (`Y` = `total` da API).
- **`PaginaDetalhe`** usa `useParams` + o hook `usePokemon` pra buscar `GET /api/pokemons/:id`, trata 404 como "não encontrado".
- Cores dos badges de tipo vêm de um mapa fixo em `constants/coresPorTipo.ts` (18 tipos).

### Como rodar localmente
Dois processos separados, cada um com seu `package.json`:
```
cd apps/api && npm run dev   # porta 3001
cd apps/web && npm run dev   # porta 5173
```
Scripts úteis em `apps/api`: `db:migrate`, `db:generate`, `db:studio`, `sync:pokeapi` (repopula o banco a partir da PokeAPI, é seguro rodar de novo).

`apps/api/.env` precisa de `DATABASE_URL` e `JWT_SECRET` (veja `apps/api/.env.example` — qualquer string aleatória serve em dev, ex: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).
