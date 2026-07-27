# Projeto: Pokedex Site

## Visão geral
Site de Pokedex, usando https://www.pokemon.com/br/pokedex como referência de layout e experiência de navegação. Objetivo: listar Pokémons com busca/filtro e página de detalhes de cada um.

## Stack
- **Frontend:** React + TypeScript + Vite
- **Estilização:** Tailwind CSS
- **Backend:** Node.js + Express + TypeScript
- **Banco de dados:** SQLite (dev) via Prisma ORM
- **Dados dos Pokémons:** PokeAPI (https://pokeapi.co) como fonte, ou dados sincronizados para o próprio banco via Prisma

## Estrutura de pastas (sugerida)
```
pokedex-site/
├── apps/
│   ├── web/          # Frontend (Vite + React)
│   └── api/          # Backend (Express)
├── prisma/
│   ├── schema.prisma
│   └── migrations/
└── CLAUDE.md
```

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
- [ ] Layout base do frontend (Navbar, Grid de Pokémons)
- [ ] Página de detalhes do Pokémon
- [ ] Busca e filtros
- [ ] Deploy