import { Link, useParams } from 'react-router'
import { corDoTipo } from '../constants/coresPorTipo'
import { usePokemon } from '../hooks/usePokemon'
import type { PokemonDetalhe as PokemonDetalheType } from '../types/pokemon'

// Valor base máximo possível de um stat, usado só pra calcular o tamanho da barra.
const STAT_MAXIMO = 255

const STATS_EXIBIDOS: { chave: keyof PokemonDetalheType['stats']; rotulo: string }[] = [
  { chave: 'hp', rotulo: 'HP' },
  { chave: 'ataque', rotulo: 'Ataque' },
  { chave: 'defesa', rotulo: 'Defesa' },
  { chave: 'ataqueEspecial', rotulo: 'Ataque especial' },
  { chave: 'defesaEspecial', rotulo: 'Defesa especial' },
  { chave: 'velocidade', rotulo: 'Velocidade' },
]

function PaginaDetalhe() {
  const { id } = useParams()
  const { pokemon, carregando, erro } = usePokemon(id)

  if (carregando) {
    return <p className="py-8 text-center text-neutral-500">Carregando Pokémon...</p>
  }

  if (erro || !pokemon) {
    return (
      <div className="py-8 text-center">
        <p className="text-red-600">{erro}</p>
        <Link to="/" className="mt-4 inline-block text-blue-600 hover:underline">
          ← Voltar
        </Link>
      </div>
    )
  }

  const nomeCapitalizado = pokemon.nome.charAt(0).toUpperCase() + pokemon.nome.slice(1)
  const numeroFormatado = `#${String(pokemon.id).padStart(4, '0')}`
  const alturaEmMetros = (pokemon.altura / 10).toFixed(1)
  const pesoEmQuilos = (pokemon.peso / 10).toFixed(1)

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/" className="text-blue-600 hover:underline">
        ← Voltar
      </Link>

      <div className="mt-4 flex flex-col items-center rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <span className="self-end text-sm text-neutral-400">{numeroFormatado}</span>
        <img
          src={pokemon.spriteUrl}
          alt={nomeCapitalizado}
          className="h-48 w-48 object-contain"
        />
        <h1 className="mt-2 text-2xl font-bold text-neutral-800">{nomeCapitalizado}</h1>

        <div className="mt-2 flex flex-wrap justify-center gap-1">
          {pokemon.tipos.map((tipo) => (
            <span
              key={tipo}
              className={`rounded-full px-3 py-1 text-sm font-medium ${corDoTipo(tipo)}`}
            >
              {tipo}
            </span>
          ))}
        </div>

        <div className="mt-4 flex gap-8 text-center text-neutral-700">
          <div>
            <p className="text-sm text-neutral-400">Altura</p>
            <p className="font-semibold">{alturaEmMetros} m</p>
          </div>
          <div>
            <p className="text-sm text-neutral-400">Peso</p>
            <p className="font-semibold">{pesoEmQuilos} kg</p>
          </div>
        </div>

        <div className="mt-6 w-full">
          <h2 className="mb-2 font-semibold text-neutral-800">Stats base</h2>
          <div className="flex flex-col gap-2">
            {STATS_EXIBIDOS.map(({ chave, rotulo }) => {
              const valor = pokemon.stats[chave]
              return (
                <div key={chave} className="flex items-center gap-2">
                  <span className="w-32 shrink-0 text-sm text-neutral-500">{rotulo}</span>
                  <span className="w-8 shrink-0 text-right text-sm font-medium text-neutral-700">
                    {valor}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-200">
                    <div
                      className="h-full rounded-full bg-red-500"
                      style={{ width: `${Math.min((valor / STAT_MAXIMO) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaginaDetalhe
