import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { corDoTipo } from '../constants/coresPorTipo'
import { useAuth } from '../contexts/AuthContext'
import { useCapturas } from '../contexts/CapturasContext'
import type { PokemonResumo } from '../types/pokemon'

interface PokemonCardProps {
  pokemon: PokemonResumo
}

function PokemonCard({ pokemon }: PokemonCardProps) {
  const { usuario } = useAuth()
  const { estaCapturado, capturar, remover } = useCapturas()
  const navigate = useNavigate()
  const [processando, setProcessando] = useState(false)

  const numeroFormatado = `#${String(pokemon.id).padStart(4, '0')}`
  const nomeCapitalizado = pokemon.nome.charAt(0).toUpperCase() + pokemon.nome.slice(1)
  const capturado = estaCapturado(pokemon.id)

  async function aoClicarCapturar() {
    if (!usuario) {
      navigate('/login')
      return
    }

    setProcessando(true)
    try {
      if (capturado) {
        await remover(pokemon.id)
      } else {
        await capturar(pokemon)
      }
    } catch (erro) {
      console.error(erro)
    } finally {
      setProcessando(false)
    }
  }

  return (
    <div className="relative flex flex-col items-center rounded-lg border border-neutral-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <button
        type="button"
        onClick={aoClicarCapturar}
        disabled={processando}
        aria-label={capturado ? 'Remover da minha Pokédex' : 'Capturar'}
        aria-pressed={capturado}
        className={`absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-lg leading-none shadow-sm transition-colors disabled:opacity-50 ${
          capturado
            ? 'bg-red-600 text-white'
            : 'bg-white text-neutral-300 hover:text-red-400'
        }`}
      >
        {capturado ? '★' : '☆'}
      </button>

      <Link to={`/pokemon/${pokemon.id}`} className="flex w-full flex-col items-center">
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
    </div>
  )
}

export default PokemonCard
