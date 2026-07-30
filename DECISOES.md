# Decisões técnicas

Registro do que foi decidido no projeto Pokedex, por quê, quais problemas apareceram
no caminho e o que ainda está pendente. Escrito pra quem (ou qual sessão futura)
for mexer no projeto sem ter acompanhado o histórico.

## Decisões técnicas e o porquê

### `GET /api/capturas` devolve o mesmo formato de `GET /api/pokemons`
A rota de capturas mapeia `Captura` (via `include: { pokemon: ... } }`) pro
mesmo formato resumido (`id`, `nome`, `spriteUrl`, `tipos`) que a listagem de
Pokémon já usa, em vez de devolver o registro de `Captura` cru (com `userId`,
`pokemonId`, `capturadoEm`).
**Por quê:** deixa o frontend reaproveitar o componente `PokemonCard` sem
nenhuma adaptação — `PaginaMinhaPokedex` só passa o array de capturas pro
mesmo card que a Home já usa. Também não expõe o `userId` de propósito (o
usuário logado já sabe quem é, não precisa disso na resposta).

### `POST`/`DELETE /api/capturas` ficaram pra outra etapa
Esta etapa só criou a leitura (`GET`, listar capturas); criar/apagar uma
captura fica pro item seguinte do checklist (botão de capturar/remover no
`PokemonCard`).
**Por quê:** sem o botão, não haveria como testar `POST`/`DELETE` de verdade
pela UI — só via `curl`/inserção direta no banco, como foi feito aqui pra
testar a listagem (um Squirtle inserido manualmente pro usuário de teste,
depois removido). Construir a escrita junto com quem vai usá-la evita rota
"no escuro".

### `CapturasContext` em vez do hook `useCapturas` original
O hook `useCapturas` (buscava a lista só pra `PaginaMinhaPokedex` renderizar)
foi substituído por `CapturasContext`/`useCapturas()` (mesmo nome, agora um
Context) quando o botão de capturar chegou no `PokemonCard`.
**Por quê:** o botão existe em **qualquer** card na tela — inclusive na Home,
com até 1025 cards na opção "Todas" — e cada um precisa saber se aquele
Pokémon já está capturado. Isso é estado compartilhado entre componentes sem
relação direta entre si, o mesmo motivo que já tinha levado o login a virar
`AuthContext` em vez de hook comum. Manter as duas fontes (hook antigo +
Context novo) duplicaria a busca de capturas e poderia deixá-las
dessincronizadas (ex: capturar na Home sem "Minha Pokédex" saber).

### `capturar()` recebe o Pokémon inteiro, não só o id
`CapturasContext.capturar(pokemon: PokemonResumo)` recebe o objeto completo
(sprite, nome, tipos), não só `pokemon.id`.
**Por quê:** quem chama (`PokemonCard`) já tem esse objeto em mãos — é o mesmo
`pokemon` que está renderizando. Aceitar só o `id` obrigaria buscar os dados de
volta na API (ou re-buscar a lista inteira de capturas) só pra saber o que
acabou de ser capturado, uma viagem de rede a mais sem necessidade.

### Modelagem relacional para tipos e gerações
`Type` e `Generation` são tabelas próprias, relacionadas a `Pokemon` (`Type` via
tabela de ligação `PokemonType`, `Generation` via chave estrangeira direta
`geracaoNumero`), em vez de guardar o tipo/geração como texto solto no próprio
Pokémon.
**Por quê:** permite filtrar (`?tipo=fire`, `?geracao=3`) e contar (`_count`)
direto no banco via Prisma, sem lógica extra no código. Pra tipos, foi uma escolha
explícita entre "tabela relacional" vs "campo texto/JSON" — optamos pela tabela.

### `senhaHash` em vez de `senha`, e captura como estado único por usuário+Pokémon
O model `User` guarda a senha no campo `senhaHash` (não `senha`), e `Captura` tem
`@@unique([userId, pokemonId])` — um usuário não pode ter duas linhas de captura
pro mesmo Pokémon.
**Por quê:** o nome do campo deixa explícito, só de olhar o schema, que ali nunca
deveria ir texto puro — o hash de verdade (bcrypt, via `bcryptjs`) foi implementado
junto com as rotas de autenticação logo em seguida. A constraint única modela
"capturado ou não" como um estado binário: capturar cria a linha, remover apaga
ela, sem precisar de soft-delete nem de permitir duplicatas.

### Login com JWT em cookie httpOnly, não sessão em memória
`POST /api/auth/login` (e `/register`) setam um cookie `httpOnly` contendo um JWT
assinado (`apps/api/src/token.ts`); não existe tabela nem armazenamento de sessão
no servidor — cada request só verifica a assinatura do token.
**Por quê:** a API roda com `tsx watch`, que reinicia o processo a cada arquivo
salvo durante o desenvolvimento. Uma sessão guardada em memória (`express-session`
com `MemoryStore`, a opção mais simples) derrubaria todo mundo logado a cada
restart. JWT não guarda estado nenhum no servidor, então sobrevive a isso de
graça. Uma sessão persistida em tabela (`Session` no Prisma) resolveria o mesmo
problema, mas é infraestrutura a mais sem necessidade aqui. Como o cookie é
`httpOnly`, o JavaScript do navegador não consegue ler o token — por isso existe
`GET /api/auth/me`, pro frontend descobrir se está logado sem precisar guardar
nada em `localStorage`.

### Estado de login no frontend via React Context (`AuthContext`/`useAuth`)
Um `AuthProvider` envolve o app inteiro (`main.tsx`) e guarda o usuário logado
(ou `null`); qualquer componente lê isso com `useAuth()`.
**Por quê:** diferente de `usePokemons`/`useGeracoes` (dados de uma página só),
o status de login precisa ser lido por componentes sem relação entre si —
Navbar, página de "minha pokedex", botão de captura no card — que vão existir em
etapas futuras e não têm um ancestral comum além da raiz do app. Um hook comum
não compartilha estado entre chamadas independentes; Context é o jeito padrão do
React de resolver exatamente isso.

### `credentials: 'include'` em toda chamada de autenticação do frontend
`login`/`cadastrar`/`logout`/a checagem de `/me` no `AuthContext` passam
`credentials: 'include'` pro `fetch`.
**Por quê:** cookie `httpOnly` só é enviado/aceito pelo navegador em requests
"credenciados" — sem essa opção, o cookie de login simplesmente não vai junto
entre `localhost:5173` (frontend) e `localhost:3001` (API), mesmo o backend já
estando configurado pra aceitar (`cors({ credentials: true })`, feito na etapa
anterior). Testado de dentro do navegador via Playwright (não só `curl`, que não
teria pego esse tipo de problema — `curl` não aplica as mesmas regras de CORS
que um navegador de verdade aplica).

### `bcryptjs` em vez de `bcrypt`
Pra fazer o hash da senha, usamos o pacote `bcryptjs` (implementação pura em
JavaScript) em vez do `bcrypt` original (que depende de um binário nativo
compilado, via `node-gyp`).
**Por quê:** já sentimos essa dor com `better-sqlite3` (ver "Problemas
enfrentados"), que depende de compilação nativa e trouxe avisos de instalação. A
API do `bcryptjs` é idêntica (`hash`/`compare` assíncronos), então não muda nada
no código, só evita mais uma dependência nativa no projeto.

### Email normalizado (trim + lowercase) no cadastro e no login
`normalizarEmail()` em `auth.routes.ts` aplica `.trim().toLowerCase()` antes de
validar, salvar ou buscar por email — usado tanto em `/register` quanto em
`/login`.
**Por quê:** o `@unique` do SQLite compara string exata (sensível a maiúscula e
espaço) — sem normalizar, `"Ash@Example.com"` e `"ash@example.com"` passam como
dois emails "diferentes" pro banco, permitindo duas contas pro mesmo email de
verdade, e login falha se a pessoa digitar com caixa diferente da que usou no
cadastro. Normalizar antes de qualquer operação faz o `@unique` proteger o que
ele deveria proteger.

### `select` explícito nas queries do Prisma que não precisam do `senhaHash`
`/register` (no `create`) e `/me` (no `findUnique`) usam `select: { id, nome,
email }`. `/login` não usa `select` de propósito, porque precisa do `senhaHash`
pra comparar com `bcrypt.compare`.
**Por quê:** as três rotas já montavam a resposta manualmente sem incluir
`senhaHash`, então não havia vazamento — mas a query sem `select` ainda trazia o
hash pra memória sem necessidade em `/register`/`/me`. Restringir o `select`
onde dá é defesa em profundidade: mesmo que alguém troque a resposta manual por
`res.json(usuario)` direto no futuro, o hash nem chega a existir naquela
variável.

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

### CORS restrito a `http://localhost:5173`, com `credentials: true`
Começou totalmente aberto (`app.use(cors())`, sem restrição de origem) porque
frontend (porta 5173) e backend (porta 3001) são origens diferentes em dev, e sem
`cors()` o navegador bloqueia o `fetch`. Virou `cors({ origin:
'http://localhost:5173', credentials: true })` quando o login (cookie) foi
implementado.
**Por quê:** o cookie de login só é enviado pelo navegador em requests
"credenciados" (`fetch(..., { credentials: 'include' })`, do lado do frontend), e
o navegador **não permite** `credentials: true` combinado com origem coringa
(`*`) — é uma regra de segurança do próprio CORS, não uma escolha nossa. Por isso
a origem teve que virar explícita. Pra um deploy de verdade, essa origem
precisaria virar a URL real do frontend em produção (não mais `localhost:5173`).

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
  CLAUDE.md. Três bloqueadores já mapeados (detalhados nos itens abaixo):
  `API_BASE_URL` fixo no frontend, cookie de login com `sameSite: 'lax'` (não
  sobrevive a frontend/API em domínios diferentes) e SQLite em disco efêmero.
- **`API_BASE_URL` fixo em `http://localhost:3001/api`**: `apps/web/src/config.ts`
  guarda a URL da API como uma constante fixa, não uma variável de ambiente do
  Vite (`import.meta.env.VITE_*`). Em dev funciona porque a API sempre está em
  `localhost:3001`, mas em produção o frontend seria servido de um domínio e a
  API de outro (ou de uma URL completamente diferente) — `localhost:3001` não
  existiria lá, e todo `fetch` da aplicação apontaria pro lugar errado. Precisa
  virar `import.meta.env.VITE_API_BASE_URL` (ou similar), com um valor de dev
  (`.env`) e um de produção.
- **Cookie de login sem `secure`, `sameSite: 'lax'` que não sobrevive a domínios
  diferentes, e origem do CORS fixa em `localhost:5173`**: `auth.routes.ts` seta
  o cookie com `httpOnly: true, sameSite: 'lax'`, sem `secure`; `index.ts`
  restringe o CORS a `origin: 'http://localhost:5173'`. Bom o suficiente pra dev
  (frontend e API são o mesmo host `localhost`, só portas diferentes, sem HTTPS
  local). Antes de qualquer deploy:
  - o `origin` do CORS precisa virar a URL real do frontend em produção;
  - o cookie precisa de `secure: true` (só trafega em HTTPS);
  - `sameSite: 'lax'` só libera o cookie em requests `fetch`/XHR quando
    frontend e API contam como "mesmo site" — deixa de valer se forem servidos
    de domínios diferentes (o caso mais comum: `app.exemplo.com` chamando
    `api.exemplo.com`). Nesse cenário, login pareceria funcionar (a resposta
    200 chega), mas nenhuma chamada autenticada depois enviaria o cookie, e
    tudo pareceria deslogado.

  **Trade-off pendente:** a correção pro terceiro ponto é trocar pra
  `sameSite: 'none'` (libera cookie cross-site de verdade), o que exige
  `secure: true` (resolve os dois primeiros pontos de qualquer forma) — mas
  remove uma defesa que o `lax` dava de graça contra CSRF (um `<form>` num site
  malicioso não é mais bloqueado só pelo `sameSite`, já que `none` existe
  justamente pra permitir esse tipo de request cross-site). Trocar pra `none`
  precisaria vir acompanhado de alguma proteção contra CSRF nas rotas que mudam
  estado (`POST`/`DELETE` de `/api/capturas`, `/api/auth/*`) — ainda não
  decidido se via header customizado (`X-Requested-With`, que forms HTML
  simples não conseguem setar) ou um token CSRF de verdade.
- **SQLite em disco efêmero, agora com dados de usuário de verdade**: o banco é
  um arquivo (`prisma/dev.db`) no disco onde a API roda. Ótimo em dev, mas a
  maioria das plataformas de deploy mais simples usa disco efêmero por padrão
  (container recriado a cada deploy/restart apaga qualquer arquivo escrito
  localmente, `.db` incluído). Enquanto só existiam dados sincronizados da
  PokeAPI (`sync:pokeapi` recria tudo do zero, é idempotente), perder o banco
  não era um problema de verdade — só custava rodar o script de novo. Agora que
  existem `User` e `Captura` (dados que só existem porque uma pessoa de verdade
  cadastrou/capturou, sem fonte externa pra "ressincronizar"), perder o disco
  vira perda de dados de usuário de verdade. Precisa, antes do deploy, de um
  disco persistente de verdade (volume montado na plataforma escolhida) ou
  migrar pra um banco gerenciado (Postgres, Turso, etc.) — ainda não decidido
  qual caminho.
- **Busca não cruza gerações**: buscar por nome só encontra resultados dentro da
  geração selecionada no momento. Pra achar um Pokémon sem saber a geração dele,
  é preciso navegar até a geração certa primeiro.
- **Página de detalhe não mostra a geração/região** do Pokémon (a Home mostra,
  o detalhe não — ficou fora do escopo quando foi pedido).
- **Sem testes automatizados**: nada de unitário, integração ou e2e. Tudo foi
  validado manualmente (curl nas rotas, Playwright pra tirar screenshot e
  conferir visualmente) durante o desenvolvimento, sem deixar suíte no repo.
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
- **`JWT_SECRET` de dev está só no `.env` local (gitignored)**: nunca foi
  commitado, mas também não existe nenhum lugar documentando como gerar um
  segredo de produção — isso vai precisar entrar no processo de deploy.
