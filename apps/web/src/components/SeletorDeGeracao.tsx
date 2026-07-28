import type { Generation } from '../types/pokemon'

type OpcaoGeracao = number | 'todas'

interface SeletorDeGeracaoProps {
  geracoes: Generation[]
  geracaoAtual: OpcaoGeracao
  aoSelecionar: (opcao: OpcaoGeracao) => void
}

function converterValorDoSelect(valor: string): OpcaoGeracao {
  return valor === 'todas' ? 'todas' : Number(valor)
}

function SeletorDeGeracao({ geracoes, geracaoAtual, aoSelecionar }: SeletorDeGeracaoProps) {
  // "Todas" entra como o primeiro item de uma sequência única com as gerações
  // numeradas, então Anterior/Próxima sempre andam ±1 posição nessa lista.
  const opcoes: OpcaoGeracao[] = ['todas', ...geracoes.map((geracao) => geracao.numero)]
  const indiceAtual = opcoes.indexOf(geracaoAtual)

  const opcaoAnterior = indiceAtual > 0 ? opcoes[indiceAtual - 1] : null
  const opcaoProxima =
    indiceAtual !== -1 && indiceAtual < opcoes.length - 1 ? opcoes[indiceAtual + 1] : null

  const geracaoInfo = geracoes.find((geracao) => geracao.numero === geracaoAtual)
  const regiaoCapitalizada = geracaoInfo
    ? geracaoInfo.regiao.charAt(0).toUpperCase() + geracaoInfo.regiao.slice(1)
    : ''

  return (
    <div className="mb-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
      <h2 className="text-xl font-bold text-neutral-800">
        {geracaoAtual === 'todas'
          ? 'Todos os Pokémon'
          : `Geração ${geracaoAtual}${regiaoCapitalizada ? ` — ${regiaoCapitalizada}` : ''}`}
      </h2>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => opcaoAnterior !== null && aoSelecionar(opcaoAnterior)}
          disabled={opcaoAnterior === null}
          className="rounded-md border border-neutral-300 px-3 py-1 text-sm disabled:opacity-40"
        >
          ← Anterior
        </button>

        <select
          value={geracaoAtual}
          onChange={(evento) => aoSelecionar(converterValorDoSelect(evento.target.value))}
          className="rounded-md border border-neutral-300 px-2 py-1 text-sm"
        >
          <option value="todas">Todas</option>
          {geracoes.map((geracao) => (
            <option key={geracao.numero} value={geracao.numero}>
              {geracao.numero} — {geracao.regiao.charAt(0).toUpperCase() + geracao.regiao.slice(1)}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => opcaoProxima !== null && aoSelecionar(opcaoProxima)}
          disabled={opcaoProxima === null}
          className="rounded-md border border-neutral-300 px-3 py-1 text-sm disabled:opacity-40"
        >
          Próxima →
        </button>
      </div>
    </div>
  )
}

export default SeletorDeGeracao
