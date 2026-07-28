# Decisões técnicas

Registro do que foi decidido no projeto Pokedex, por quê, quais problemas apareceram
no caminho e o que ainda está pendente. Escrito pra quem (ou qual sessão futura)
for mexer no projeto sem ter acompanhado o histórico.

## Decisões técnicas e o porquê

### Modelagem relacional para tipos e gerações
`Type` e `Generation` são tabelas próprias, relacionadas a `Pokemon` (`Type` via
tabela de ligação `PokemonType`, `Generation` via chave estrangeira direta
`geracaoNumero`), em vez de guardar o tipo/geração como texto solto no próprio
Pokémon.
**Por quê:** permite filtrar (`?tipo=fire`, `?geracao=3`) e contar (`_count`)
direto no banco via Prisma, sem lógica extra no código. Pra tipos, foi uma escolha
explícita entre "tabela relacional" vs "campo texto/JSON" — optamos pela tabela.

### Busca e filtro de tipo no backend, não no frontend
`GET /api/pokemons` aceita `busca`, `tipo` e `geracao` como query params, combináveis
em AND. O frontend não filtra uma lista já carregada.
**Por quê:** o plano é a Home carregar a lista completa (~1300, hoje 1025) paginada
por geração — se o filtro fosse só no frontend, só acharia resultados dentro dos
dados já carregados na tela. Fazendo no backend, a busca já funciona certo
independente de quanto está carregado.

### Paginação da Home por geração, não por número fixo de itens
Cada "página" da Home é uma geração inteira (Kanto, Johto, ...), navegável por
botões anterior/próxima ou um `<select>`, com a geração atual guardada na URL
(`/?geracao=N` via `useSearchParams` do react-router).
**Por quê:** pedido explícito — evita paginação genérica tipo "20 por página" e
usa uma divisão que já faz sentido pro domínio (regiões do jogo).

### Paginação "de verdade" só na opção "Todas"; geração específica carrega tudo de uma vez
`usePokemons` só pagina com botão "Carregar mais" quando `geracao` é `undefined`
("Todas" selecionada). Com uma geração específica, o hook busca as páginas
necessárias em sequência automaticamente (sem interação do usuário) até completar,
e só então mostra o grid — sem botão.
**Por quê:** o teto de 100 itens por requisição da API (`LIMITE_MAXIMO`, proteção
legítima pro modo "Todas", que pode chegar a 1025) é menor que a maior geração
(Unova, geração 5, com 156). Duas opções foram consideradas: aumentar o teto do
backend, ou o frontend buscar as páginas que faltam sozinho. Optamos por não mexer
no backend — o teto continua protegendo o modo "Todas" igual, e carregar uma
geração inteira nunca passa de 2 requisições.

### Fonte de verdade pra gerações: PokeAPI, não intervalos de id na mão
O script de sync busca `/api/v2/generation` (e o detalhe de cada geração) na
PokeAPI pra descobrir quais espécies pertencem a cada geração e o nome da região,
em vez de assumir os intervalos de id (ex: "gen 1 = 1-151") direto no código.
**Por quê:** evita errar por causa de memória desatualizada — foi conferido ao
vivo com `curl` antes de implementar (9 gerações, 1025 Pokémon no total).

### Script de sync separado do servidor
`apps/api/src/scripts/sync-pokeapi.ts` roda manualmente (`npm run sync:pokeapi`),
não é uma rota HTTP.
**Por quê:** popular/repopular o banco é uma tarefa de manutenção, não algo que
deveria acontecer a cada request — e sincronizar tudo demora minutos (1025
Pokémon). O script usa `upsert` em tudo (Pokemon, Type, PokemonType, Generation),
então é seguro rodar de novo sem duplicar dados.

### React Router v8 — pacote `react-router`, não `react-router-dom`
Desde a v7 do React Router, o pacote `react-router` já inclui os bindings de
navegador (`BrowserRouter`, etc.); `react-router-dom` existe só por
compatibilidade.
**Por quê:** confirmado direto na documentação oficial antes de instalar, pra não
seguir um tutorial desatualizado.

### CORS totalmente aberto (`app.use(cors())`)
**Por quê:** frontend (porta 5173) e backend (porta 3001) são origens diferentes
em dev. Sem `cors()`, o navegador bloqueia o `fetch`. Não há restrição de origem
configurada — ver seção de pendências.

### `apps/api` e `apps/web` com `package.json` próprios, sem workspaces
Não existe um `package.json` na raiz nem ferramenta de monorepo (npm workspaces,
turborepo, etc.).
**Por quê:** simplicidade — o projeto é pequeno o suficiente pra não precisar
disso, e o CLAUDE.md não pediu uma estrutura de monorepo.

### Altura/peso guardados nas unidades cruas da PokeAPI
O banco guarda `altura` em decímetros e `peso` em hectogramas (unidades que a
PokeAPI usa), e a conversão pra metros/kg acontece só na hora de exibir, na
página de detalhe.
**Por quê:** mantém o banco fiel à fonte de dados; a conversão é um detalhe de
apresentação, não de armazenamento.

## Problemas enfrentados e como foram resolvidos

### Prisma 7 mudou como a conexão com o banco é configurada
Ao rodar a primeira migração, o Prisma 7 (instalado automaticamente como versão
mais recente) rejeitou `url = env("DATABASE_URL")` dentro do `datasource` do
`schema.prisma` (erro `P1012`), uma mudança não documentada na memória de
treinamento do Claude. **Resolvido** consultando a documentação oficial ao vivo:
a URL passou a ser definida em `apps/api/prisma.config.ts`, e toda conexão SQLite
precisa de um "driver adapter" (`@prisma/adapter-better-sqlite3`) tanto pro
Prisma Client quanto, indiretamente, pro Migrate. O generator também mudou de
`prisma-client-js` (deprecated) pra `prisma-client`, que exige um `output`
explícito.

### `prisma.config.ts` não era encontrado ao rodar `npm run db:migrate`
Colocar o `prisma.config.ts` na raiz do repo não funcionava, porque `npx prisma`
só descobre o arquivo de config automaticamente na pasta onde o comando é
executado (o `cwd`) — e os scripts npm rodam com `cwd = apps/api`. **Resolvido**
colocando o `prisma.config.ts` dentro de `apps/api` mesmo, com os caminhos de
`schema`/`migrations` apontando pra `../../prisma/` (calculados via
`import.meta.dirname`, já que o projeto usa ESM puro).

### TypeScript recusava importações terminadas em `.ts`
Com `module`/`moduleResolution: NodeNext`, o Node exige que imports relativos
incluam a extensão do arquivo (`from './prisma.ts'`), mas o `tsc` reclamava
(`TS5097: ...only end with a '.ts' extension when 'allowImportingTsExtensions'
is enabled`). **Resolvido** habilitando `allowImportingTsExtensions` e
`rewriteRelativeImportExtensions` no `tsconfig.json` de `apps/api` (recurso do
TypeScript 5.7+), que reescreve `.ts` pra `.js` na hora de compilar.

### Adicionar `geracaoNumero` obrigatório numa tabela que já tinha dados
O `Pokemon` já tinha 151 linhas (só a geração 1) quando o campo obrigatório
`geracaoNumero` foi adicionado ao schema. **Resolvido** apagando
`prisma/dev.db` antes de rodar a nova migração (mantendo o histórico de
migrations) — sem risco, porque a sincronização completa que veio em seguida
repopulou tudo (todas as 9 gerações) de qualquer forma.

### `EADDRINUSE` repetido ao testar os servidores de dev
Ao encadear `cd apps/api && (npm run dev > log &)` seguido de outro comando no
mesmo bloco Bash, o `cd` "vazava" pro segundo comando (mesma sessão de shell),
fazendo o servidor errado subir na pasta errada, além de processos anteriores
ainda ocuparem a porta. **Resolvido** matando o processo da porta antes de cada
novo teste (`lsof -ti:PORTA -sTCP:LISTEN | xargs kill`) e tomando cuidado pra
não encadear `cd` com comandos não relacionados no mesmo bloco.

### Sprites "em branco" num screenshot da geração 9
Um screenshot tirado logo após trocar pra geração 9 (Paldea, 120 Pokémon) mostrou
vários sprites sem carregar. **Investigado** conferindo as URLs direto via `curl`
(todas retornaram HTTP 200) e re-testando com `page.waitForLoadState('networkidle')`
— confirmado que era só o tempo de carregar ~120 imagens externas em paralelo, não
um bug real.

### `timeout` não existe no macOS/zsh por padrão
Comandos de espera usados em exemplos (`timeout 30 bash -c '...'`) falharam
(`command not found`) porque `timeout` é um utilitário GNU não presente no macOS.
**Resolvido** usando um loop de polling manual (`for i in $(seq 1 30); do curl
... && break; sleep 1; done`) sempre que precisou esperar um servidor subir.

## Pontos pendentes / que sabemos que precisam melhorar

- **Deploy**: ainda não feito — é o único item não marcado no checklist do
  CLAUDE.md.
- **Busca não cruza gerações**: buscar por nome só encontra resultados dentro da
  geração selecionada no momento. Pra achar um Pokémon sem saber a geração dele,
  é preciso navegar até a geração certa primeiro.
- **Página de detalhe não mostra a geração/região** do Pokémon (a Home mostra,
  o detalhe não — ficou fora do escopo quando foi pedido).
- **Sem testes automatizados**: nada de unitário, integração ou e2e. Tudo foi
  validado manualmente (curl nas rotas, Playwright pra tirar screenshot e
  conferir visualmente) durante o desenvolvimento, sem deixar suíte no repo.
- **Sem `.env.example`**: o `.gitignore` já prevê um (`!.env.example`), mas ele
  não existe — quem clonar o repo do zero não tem onde ver que
  `apps/api/.env` precisa de `DATABASE_URL="file:../../prisma/dev.db"`.
- **CORS totalmente aberto**: `cors()` sem nenhuma restrição de origem. Serve
  pra dev, mas precisaria ser restrito a um domínio real antes de qualquer deploy.
- **`GET /api/pokemons` sem limite**: sem `geracao` no filtro, a rota devolve
  literalmente tudo (hoje 1025 itens) numa resposta só. Não tem paginação por
  offset/limit nem um teto de segurança.
- **Sync sem retry**: se uma requisição pra PokeAPI falhar no meio do caminho,
  o script todo para (lança erro e sai). Como é idempotente (usa upsert), rodar
  de novo do zero resolve, mas não há nova tentativa automática nem retomada de
  onde parou.
- **Estados de carregamento/erro são só texto simples**: funcionam, mas não têm
  nenhum estilo de skeleton/spinner.
- **`PokemonGrid` acumulando responsabilidades**: hoje o componente cuida de
  input de busca, pills de filtro de tipo e renderização do grid ao mesmo tempo.
  Não é um problema no tamanho atual, mas é candidato a ser quebrado em
  componentes menores se mais filtros forem adicionados.
