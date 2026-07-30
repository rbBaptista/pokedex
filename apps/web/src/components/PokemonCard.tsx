import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { corDoTipo } from '../constants/coresPorTipo'
import { useAuth } from '../contexts/AuthContext'
import { ErroApi, useCapturas } from '../contexts/CapturasContext'
import type { PokemonResumo } from '../types/pokemon'

interface PokemonCardProps {
  pokemon: PokemonResumo
}

function PokemonCard({ pokemon }: PokemonCardProps) {
  const { usuario } = useAuth()
  const { estaCapturado, capturar, remover } = useCapturas()
  const navigate = useNavigate()
  const location = useLocation()
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const numeroFormatado = `#${String(pokemon.id).padStart(4, '0')}`
  const nomeCapitalizado = pokemon.nome.charAt(0).toUpperCase() + pokemon.nome.slice(1)
  const capturado = estaCapturado(pokemon.id)

  // Preserva a página atual, pra voltar pra cá depois do login.
  function irParaLogin() {
    navigate('/login', { state: { from: `${location.pathname}${location.search}` } })
  }

  async function aoClicarCapturar() {
    if (!usuario) {
      irParaLogin()
      return
    }

    setProcessando(true)
    setErro(null)
    try {
      if (capturado) {
        await remover(pokemon.id)
      } else {
        await capturar(pokemon)
      }
    } catch (erroCapturado) {
      // 401 quer dizer que a sessão caiu (ex: token expirou) mesmo com
      // `usuario` ainda preenchido no client — manda pro login de novo.
      if (erroCapturado instanceof ErroApi && erroCapturado.status === 401) {
        irParaLogin()
        return
      }
      setErro(erroCapturado instanceof Error ? erroCapturado.message : 'Não foi possível processar.')
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

      {erro && (
        <p className="absolute left-2 top-10 z-10 max-w-[85%] rounded bg-red-50 px-1.5 py-0.5 text-[10px] leading-tight text-red-600 shadow">
          {erro}
        </p>
      )}

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
