# Decisões técnicas

Registro resumido do que foi decidido no projeto Pokedex, por quê, e o que
ainda está pendente. Escrito pra quem (ou qual sessão futura) for mexer no
projeto sem ter acompanhado o histórico. Resumido pra caber em poucas linhas —
o detalhamento completo de cada decisão anterior continua no histórico do git
(`git log -p DECISOES.md`).

## Decisões técnicas e o porquê

- **`GET /api/capturas` devolve o formato resumido de `/api/pokemons`** (não o
  registro `Captura` cru): deixa o frontend reaproveitar `PokemonCard` sem
  adaptação, e não expõe `userId` à toa.
- **`CapturasContext` (Context), não um hook comum**: o botão de captura existe
  em qualquer `PokemonCard` da tela (até 1025 na Home) e todos precisam saber o
  mesmo estado de "capturado" — um hook por card duplicaria a busca e
  dessincronizaria. Mesmo motivo que levou o login a virar `AuthContext`.
- **`capturar(pokemon)` recebe o Pokémon inteiro, não só o id**: quem chama
  (`PokemonCard`) já tem o objeto em mãos; pedir só o id obrigaria uma viagem
  de rede extra pra saber o que acabou de ser capturado.
- **`Type`/`Generation` como tabelas relacionais**, não texto solto no
  `Pokemon`: permite filtrar (`?tipo=`, `?geracao=`) e contar via Prisma sem
  lógica extra no código.
- **`senhaHash` (não `senha`) + `@@unique([userId, pokemonId])` em `Captura`**:
  o nome do campo deixa explícito que nunca deveria ir texto puro; a
  constraint única modela "capturado ou não" como estado binário, sem
  soft-delete.
- **Login via JWT em cookie `httpOnly`, sem sessão em memória**: a API roda com
  `tsx watch` (reinicia a cada save) — sessão em `MemoryStore` derrubaria todo
  mundo a cada restart; JWT não guarda estado no servidor. `GET /api/auth/me`
  existe pro frontend descobrir se está logado sem ler o cookie (é `httpOnly`).
- **Estado de login via `AuthContext`/`useAuth()`**: precisa ser lido por
  componentes sem relação entre si (Navbar, minha-pokedex, card) — Context é o
  padrão do React pra isso, um hook comum não compartilha estado entre
  chamadas.
- **`credentials: 'include'` em toda chamada autenticada do frontend**: sem
  isso o cookie `httpOnly` não vai junto entre `localhost:5173` e `:3001`,
  mesmo com CORS configurado. Só é pego testando no navegador (Playwright),
  não com `curl`.
- **`bcryptjs`, não `bcrypt`**: evita mais uma dependência nativa (já sentimos
  essa dor com `better-sqlite3`); API idêntica.
- **`normalizarEmail()` (trim + lowercase) no cadastro e login**: o `@unique`
  do SQLite é sensível a caixa/espaço — sem normalizar, duas contas poderiam
  existir pro mesmo email de verdade.
- **`select` explícito sem `senhaHash`** em `/register` e `/me`: defesa em
  profundidade — mesmo sem vazamento hoje, evita que o hash chegue à memória
  sem necessidade.
- **Busca/filtro (`busca`, `tipo`, `geracao`) resolvidos no backend**, não
  filtrando uma lista já carregada no frontend: funciona certo independente de
  quanto já foi carregado na tela.
- **Paginação da Home por geração**, não por número fixo de itens: pedido
  explícito, usa uma divisão que já faz sentido pro domínio (regiões do jogo).
- **Paginação "de verdade" só na opção "Todas"**: o teto de 100 itens/request
  (`LIMITE_MAXIMO`) é menor que a maior geração (Unova, 156) — em vez de mexer
  no teto do backend, o frontend busca as páginas que faltam sozinho (nunca
  mais que 2 requisições por geração).
- **Sync busca gerações na PokeAPI**, não assume intervalos de id fixos: evita
  errar por memória desatualizada (confirmado ao vivo via `curl`).
- **Script de sync (`sync-pokeapi.ts`) roda manual, não é rota HTTP**: demora
  minutos (1025 Pokémon); usa `upsert` em tudo, seguro rodar de novo.
- **`react-router`, não `react-router-dom`**: desde a v7 já inclui os bindings
  de navegador; confirmado na doc oficial antes de instalar.
- **CORS restrito a `http://localhost:5173`, `credentials: true`**: o
  navegador não permite `credentials: true` com origem coringa — a origem
  precisou virar explícita pro cookie de login funcionar.
- **`apps/api`/`apps/web` com `package.json` próprios, sem workspaces**:
  projeto pequeno o suficiente pra não precisar de monorepo.
- **Altura/peso guardados em decímetros/hectogramas** (unidades cruas da
  PokeAPI): conversão pra metros/kg só na exibição; banco fiel à fonte.
- **`usePokemons`: cancelamento com flag `cancelado` *e* `AbortController`**,
  não só um dos dois: o abort sozinho não cobre a janela de microtasks entre o
  `fetch` resolver e o `setState` rodar; a flag, checada após cada `await`
  (inclusive no laço da busca por geração), garante que nada atualiza o estado
  depois que os filtros já mudaram.
- **Tetos generosos, não exatos** (`MAX_PAGINAS_GERACAO = 20` no hook,
  `PAGINA_MAXIMA = 10_000` em `pokemons.routes.ts`): existem só como rede de
  segurança (loop infinito / `skip` gigante no Prisma), não como regra de
  negócio — por isso folgados, pra nunca atrapalhar um uso legítimo.
- **`geracao` inválida devolve 400; `busca`/`tipo`/`limite`/`pagina` caem no
  padrão**: presença de `geracao` sinaliza intenção explícita de filtrar — um
  valor quebrado merece erro, não silêncio. Os outros têm um padrão que
  preserva o mesmo significado da resposta, então cair nele não esconde nada.
- **`ErroApi` (`CapturasContext.tsx`) carrega o `status` HTTP no erro**:
  `PokemonCard` precisa diferenciar 401 (redireciona pro login) de qualquer
  outro erro (mostra mensagem) sem parsear texto — subclasse de `Error` em vez
  de um objeto de resultado, pra manter o mesmo `try`/`catch` de sempre.
- **401 em capturar/remover reaproveita `irParaLogin`** (o mesmo caminho do
  clique deslogado): "nunca logou" e "sessão caiu" (token expirou sem recheck
  de `/me`) têm o mesmo desfecho certo — um só caminho evita duas versões
  divergentes de "preservar origem".
- **`location.state.from` guarda uma `string` (`pathname + search`)**, não o
  objeto `Location` inteiro: mantém o `state` simples, sem campos/`state`
  aninhado que não interessam pra só navegar de volta.
- **`env.ts` (`exigirEnv`) compartilhado** entre `token.ts`/`prisma.ts`: só
  duas ocorrências hoje, mas duplicar a checagem tende a divergir (mensagens
  diferentes); um helper pequeno já deixa o padrão fácil de repetir numa
  terceira env var futura.

## Problemas enfrentados e como foram resolvidos

- **Prisma 7 mudou a config de conexão**: `datasource.url` no `schema.prisma`
  passou a ser rejeitado (`P1012`); resolvido movendo a URL pra
  `apps/api/prisma.config.ts` e adicionando o driver adapter
  (`@prisma/adapter-better-sqlite3`), exigido a partir dessa versão.
- **`prisma.config.ts` só é achado no `cwd` do comando**: colocá-lo na raiz do
  repo não funcionava (scripts rodam com `cwd = apps/api`); resolvido
  colocando o arquivo dentro de `apps/api` mesmo.
- **`tsc` recusava imports terminados em `.ts`**: resolvido habilitando
  `allowImportingTsExtensions`/`rewriteRelativeImportExtensions` no
  `tsconfig.json` (TS 5.7+).
- **`geracaoNumero` obrigatório numa tabela já populada**: resolvido apagando
  `prisma/dev.db` antes da migração — sem risco, o sync completo repopulou
  tudo em seguida.
- **`EADDRINUSE` ao testar os servidores**: `cd` "vazava" entre comandos no
  mesmo bloco Bash; resolvido matando o processo da porta antes de cada teste
  (`lsof -ti:PORTA -sTCP:LISTEN | xargs kill`).
- **Sprites "em branco" num screenshot da geração 9**: era só o tempo de
  carregar ~120 imagens em paralelo (confirmado via `curl` +
  `waitForLoadState`), não um bug real.
- **`timeout` não existe no macOS/zsh**: resolvido com loop de polling manual
  (`for i in $(seq 1 30); do curl ... && break; sleep 1; done`).

## Pontos pendentes / que sabemos que precisam melhorar

- **Deploy**: único item não marcado no checklist do CLAUDE.md. Três
  bloqueadores mapeados abaixo.
- **`API_BASE_URL` fixo** (`apps/web/src/config.ts`): precisa virar
  `import.meta.env.VITE_API_BASE_URL`, com um valor de dev e um de produção.
- **Cookie de login: sem `secure`, `sameSite: 'lax'`, CORS fixo em
  `localhost:5173`**: bom pra dev (mesmo host, sem HTTPS). Pra deploy: `origin`
  do CORS vira a URL real do frontend; cookie precisa de `secure: true`;
  `sameSite: 'lax'` não sobrevive a frontend/API em domínios diferentes (login
  pareceria funcionar, mas nenhuma chamada depois enviaria o cookie).
  **Trade-off:** trocar pra `sameSite: 'none'` exige `secure: true` mas remove
  a defesa contra CSRF que o `lax` dava de graça — precisaria de proteção
  extra (header customizado ou token CSRF) nas rotas que mudam estado.
- **SQLite em disco efêmero, agora com dados de usuário reais**: a maioria das
  plataformas de deploy usa disco efêmero (container recriado apaga o `.db`).
  Enquanto só tinha dados da PokeAPI (recriáveis via `sync:pokeapi`) não era
  problema; agora com `User`/`Captura` reais, precisa de um volume persistente
  ou migrar pra um banco gerenciado (Postgres, Turso) antes do deploy.
- **Busca não cruza gerações**: só encontra resultados dentro da geração
  selecionada.
- **Página de detalhe não mostra geração/região** do Pokémon.
- **Sem testes automatizados**: tudo validado manualmente (curl, Playwright).
- **Sync sem retry**: falha no meio para o script todo; idempotente, então
  rodar de novo resolve, mas sem retomada automática.
- **Estados de carregamento/erro são só texto simples**, sem skeleton/spinner.
- **`PokemonGrid` acumula responsabilidades** (busca + filtro de tipo + grid);
  candidato a quebrar em componentes menores se mais filtros entrarem.
- **`JWT_SECRET` de dev só existe no `.env` local**: sem processo documentado
  pra gerar um segredo de produção.
- **`PaginaCadastro` não preserva a página de origem**: não repassa
  `state.from`; quem vai se cadastrar em vez de logar perde o caminho de
  volta.
- **`CapturasContext.carregarCapturas` não trata 401**: usa `fetch` direto,
  sem `ErroApi` — sessão caindo em `/minha-pokedex` só mostra erro genérico,
  sem redirecionar.
- **`AuthContext.chamarApi` ainda lança `Error` genérico**, sem status — não
  migrado pro padrão do `ErroApi`.
- **`usePokemons.carregarMais` sem proteção contra condição de corrida**: só o
  efeito debounced principal ganhou flag + `AbortController`.
- **Teto do laço em `usePokemons` (`MAX_PAGINAS_GERACAO`) falha em silêncio**:
  se atingido (não deveria), trunca a lista sem avisar o usuário.
- **`PaginaMinhaPokedex` redireciona pro login sem preservar origem**:
  inconsistente com o `PokemonCard`, mas baixo impacto (já é o destino mais
  comum pós-login).
