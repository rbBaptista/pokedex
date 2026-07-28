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
- [ ] Opção "Todas" no seletor de geração (exige paginação ou scroll infinito na Home)
- [ ] Modelos `User` e `Captura` no Prisma (relação usuário ↔ Pokémon)
- [ ] Autenticação na API: cadastro, login e logout (senha com hash, nunca em texto puro)
- [ ] Estado de autenticação no frontend + página `/login` e `/cadastro`
- [ ] Navbar: botão "Entrar" quando deslogado, nome do usuário e "Sair" quando logado
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
│   │   ├── .env                # DATABASE_URL (gitignored)
│   │   └── src/
│   │       ├── index.ts        # cria o Express app, monta os routers
│   │       ├── prisma.ts       # client único do Prisma (com driver adapter)
│   │       ├── routes/
│   │       │   ├── pokemons.routes.ts
│   │       │   └── geracoes.routes.ts
│   │       ├── scripts/
│   │       │   └── sync-pokeapi.ts   # popula o banco a partir da PokeAPI
│   │       └── generated/prisma/     # Prisma Client gerado (gitignored)
│   └── web/
│       └── src/
│           ├── main.tsx        # ponto de entrada, envolve App em <BrowserRouter>
│           ├── App.tsx         # define as rotas (react-router)
│           ├── config.ts       # API_BASE_URL
│           ├── types/pokemon.ts
│           ├── constants/coresPorTipo.ts
│           ├── hooks/          # usePokemons, usePokemon, useGeracoes
│           ├── components/     # Layout, Navbar, PokemonCard, PokemonGrid, SeletorDeGeracao
│           └── pages/          # PaginaInicial, PaginaDetalhe
├── CLAUDE.md
└── DECISOES.md
```

### Rotas da API (Express, porta 3001)
- `GET /api/health` — healthcheck simples, `{ status: "ok" }`.
- `GET /api/pokemons` — lista Pokémon (formato resumido: `id`, `nome`, `spriteUrl`, `tipos`). Aceita query params combináveis: `busca` (nome contém, case-insensitive), `tipo` (nome do tipo) e `geracao` (número da geração).
- `GET /api/pokemons/:id` — detalhe completo de um Pokémon (`altura`, `peso`, `spriteUrl`, `tipos`, `stats` com os 6 atributos base). 400 se `:id` não for número, 404 se não existir.
- `GET /api/geracoes` — lista as 9 gerações com `numero`, `regiao` e `totalPokemons` (contagem via Prisma).

### Modelo de dados (Prisma, `prisma/schema.prisma`)
- `Pokemon` — atributos base + `geracaoNumero` (FK pra `Generation`).
- `Type` — tipos únicos (fire, water, etc.), relação muitos-para-muitos com `Pokemon` via `PokemonType`.
- `Generation` — `numero` (1 a 9) + `regiao` (kanto, johto, ...), relação um-para-muitos com `Pokemon`.

### Frontend (React + Vite, porta 5173)
- **Rotas:** `/` (Home, `PaginaInicial`) e `/pokemon/:id` (`PaginaDetalhe`), ambas dentro de `Layout` (Navbar fixa + `<Outlet />`).
- **`PaginaInicial`** guarda a geração atual na URL (`?geracao=N` via `useSearchParams`), renderiza `SeletorDeGeracao` (navegação anterior/próxima + select) e `PokemonGrid`.
- **`PokemonGrid`** é dono do estado de busca (texto) e filtro de tipo (pills clicáveis); busca os dados via o hook `usePokemons`, que já recebe `busca`/`tipo`/`geracao` e faz debounce de 300ms antes de chamar a API.
- **`PaginaDetalhe`** usa `useParams` + o hook `usePokemon` pra buscar `GET /api/pokemons/:id`, trata 404 como "não encontrado".
- Cores dos badges de tipo vêm de um mapa fixo em `constants/coresPorTipo.ts` (18 tipos).

### Como rodar localmente
Dois processos separados, cada um com seu `package.json`:
```
cd apps/api && npm run dev   # porta 3001
cd apps/web && npm run dev   # porta 5173
```
Scripts úteis em `apps/api`: `db:migrate`, `db:generate`, `db:studio`, `sync:pokeapi` (repopula o banco a partir da PokeAPI, é seguro rodar de novo).
