import type { Generation } from '../types/pokemon'

interface SeletorDeGeracaoProps {
  geracoes: Generation[]
  geracaoAtual: number
  aoSelecionar: (numero: number) => void
}

function SeletorDeGeracao({ geracoes, geracaoAtual, aoSelecionar }: SeletorDeGeracaoProps) {
  const geracaoInfo = geracoes.find((geracao) => geracao.numero === geracaoAtual)
  const regiaoCapitalizada = geracaoInfo
    ? geracaoInfo.regiao.charAt(0).toUpperCase() + geracaoInfo.regiao.slice(1)
    : ''

  const primeiraGeracao = geracoes[0]?.numero ?? 1
  const ultimaGeracao = geracoes[geracoes.length - 1]?.numero ?? 1

  return (
    <div className="mb-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
      <h2 className="text-xl font-bold text-neutral-800">
        Geração {geracaoAtual}
        {regiaoCapitalizada && ` — ${regiaoCapitalizada}`}
      </h2>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => aoSelecionar(geracaoAtual - 1)}
          disabled={geracaoAtual <= primeiraGeracao}
          className="rounded-md border border-neutral-300 px-3 py-1 text-sm disabled:opacity-40"
        >
          ← Anterior
        </button>

        <select
          value={geracaoAtual}
          onChange={(evento) => aoSelecionar(Number(evento.target.value))}
          className="rounded-md border border-neutral-300 px-2 py-1 text-sm"
        >
          {geracoes.map((geracao) => (
            <option key={geracao.numero} value={geracao.numero}>
              {geracao.numero} — {geracao.regiao.charAt(0).toUpperCase() + geracao.regiao.slice(1)}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => aoSelecionar(geracaoAtual + 1)}
          disabled={geracaoAtual >= ultimaGeracao}
          className="rounded-md border border-neutral-300 px-3 py-1 text-sm disabled:opacity-40"
        >
          Próxima →
        </button>
      </div>
    </div>
  )
}

export default SeletorDeGeracao
