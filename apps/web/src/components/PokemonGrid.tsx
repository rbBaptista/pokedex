import { useState } from 'react'
import { CORES_POR_TIPO, corDoTipo } from '../constants/coresPorTipo'
import { usePokemons } from '../hooks/usePokemons'
import PokemonCard from './PokemonCard'

const TODOS_OS_TIPOS = Object.keys(CORES_POR_TIPO)

interface PokemonGridProps {
  geracao: number
}

function PokemonGrid({ geracao }: PokemonGridProps) {
  const [busca, setBusca] = useState('')
  const [tipoSelecionado, setTipoSelecionado] = useState<string | null>(null)
  const { pokemons, carregando, erro } = usePokemons({ busca, tipo: tipoSelecionado, geracao })

  function alternarTipo(tipo: string) {
    setTipoSelecionado((atual) => (atual === tipo ? null : tipo))
  }

  return (
    <div>
      <input
        type="text"
        value={busca}
        onChange={(evento) => setBusca(evento.target.value)}
        placeholder="Buscar Pokémon pelo nome..."
        className="w-full rounded-lg border border-neutral-300 px-4 py-2 focus:border-red-500 focus:outline-none"
      />

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTipoSelecionado(null)}
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            tipoSelecionado === null ? 'bg-neutral-800 text-white' : 'bg-neutral-200 text-neutral-700'
          }`}
        >
          Todos
        </button>
        {TODOS_OS_TIPOS.map((tipo) => (
          <button
            key={tipo}
            type="button"
            onClick={() => alternarTipo(tipo)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${corDoTipo(tipo)} ${
              tipoSelecionado === tipo ? 'ring-2 ring-offset-1 ring-neutral-800' : 'opacity-60'
            }`}
          >
            {tipo}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {carregando && <p className="py-8 text-center text-neutral-500">Carregando Pokémon...</p>}

        {!carregando && erro && <p className="py-8 text-center text-red-600">{erro}</p>}

        {!carregando && !erro && pokemons.length === 0 && (
          <p className="py-8 text-center text-neutral-500">Nenhum Pokémon encontrado.</p>
        )}

        {!carregando && !erro && pokemons.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {pokemons.map((pokemon) => (
              <PokemonCard key={pokemon.id} pokemon={pokemon} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default PokemonGrid
