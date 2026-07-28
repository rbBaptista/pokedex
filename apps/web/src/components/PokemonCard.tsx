import { Link } from 'react-router'
import { corDoTipo } from '../constants/coresPorTipo'
import type { PokemonResumo } from '../types/pokemon'

interface PokemonCardProps {
  pokemon: PokemonResumo
}

function PokemonCard({ pokemon }: PokemonCardProps) {
  const numeroFormatado = `#${String(pokemon.id).padStart(4, '0')}`
  const nomeCapitalizado = pokemon.nome.charAt(0).toUpperCase() + pokemon.nome.slice(1)

  return (
    <Link
      to={`/pokemon/${pokemon.id}`}
      className="flex flex-col items-center rounded-lg border border-neutral-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <span className="self-end text-sm text-neutral-400">{numeroFormatado}</span>
      <img
        src={pokemon.spriteUrl}
        alt={nomeCapitalizado}
        loading="lazy"
        className="h-24 w-24 object-contain"
      />
      <h2 className="mt-2 font-semibold text-neutral-800">{nomeCapitalizado}</h2>
      <div className="mt-2 flex flex-wrap justify-center gap-1">
        {pokemon.tipos.map((tipo) => (
          <span
            key={tipo}
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${corDoTipo(tipo)}`}
          >
            {tipo}
          </span>
        ))}
      </div>
    </Link>
  )
}

export default PokemonCard
