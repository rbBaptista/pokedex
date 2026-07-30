import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { API_BASE_URL } from '../config'
import type { PokemonResumo } from '../types/pokemon'
import { useAuth } from './AuthContext'

interface CapturasContextValor {
  capturas: PokemonResumo[]
  carregando: boolean
  erro: string | null
  estaCapturado: (pokemonId: number) => boolean
  capturar: (pokemon: PokemonResumo) => Promise<void>
  remover: (pokemonId: number) => Promise<void>
}

const CapturasContext = createContext<CapturasContextValor | null>(null)

// Guarda os Pokémon capturados pelo usuário logado — buscados uma vez quando
// loga, limpos quando desloga — e disponibiliza pra qualquer PokemonCard saber
// se está capturado, além de capturar/remover, via useCapturas().
export function CapturasProvider({ children }: { children: ReactNode }) {
  const { usuario } = useAuth()
  const [capturas, setCapturas] = useState<PokemonResumo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!usuario) {
      setCapturas([])
      setErro(null)
      setCarregando(false)
      return
    }

    let cancelado = false

    async function carregarCapturas() {
      setCarregando(true)
      setErro(null)
      try {
        const resposta = await fetch(`${API_BASE_URL}/capturas`, { credentials: 'include' })
        if (!resposta.ok) {
          throw new Error(`A API respondeu com status ${resposta.status}`)
        }
        if (!cancelado) {
          setCapturas(await resposta.json())
        }
      } catch {
        if (!cancelado) setErro('Não foi possível carregar suas capturas.')
      } finally {
        if (!cancelado) setCarregando(false)
      }
    }

    carregarCapturas()

    return () => {
      cancelado = true
    }
  }, [usuario])

  function estaCapturado(pokemonId: number): boolean {
    return capturas.some((pokemon) => pokemon.id === pokemonId)
  }

  async function capturar(pokemon: PokemonResumo) {
    const resposta = await fetch(`${API_BASE_URL}/capturas`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pokemonId: pokemon.id }),
    })

    if (!resposta.ok) {
      const dados = await resposta.json().catch(() => ({}))
      throw new Error(dados.erro ?? 'Não foi possível capturar.')
    }

    setCapturas((atual) => [pokemon, ...atual])
  }

  async function remover(pokemonId: number) {
    const resposta = await fetch(`${API_BASE_URL}/capturas/${pokemonId}`, {
      method: 'DELETE',
      credentials: 'include',
    })

    if (!resposta.ok) {
      const dados = await resposta.json().catch(() => ({}))
      throw new Error(dados.erro ?? 'Não foi possível remover.')
    }

    setCapturas((atual) => atual.filter((pokemon) => pokemon.id !== pokemonId))
  }

  return (
    <CapturasContext.Provider
      value={{ capturas, carregando, erro, estaCapturado, capturar, remover }}
    >
      {children}
    </CapturasContext.Provider>
  )
}

export function useCapturas(): CapturasContextValor {
  const contexto = useContext(CapturasContext)
  if (!contexto) {
    throw new Error('useCapturas precisa ser usado dentro de um <CapturasProvider>.')
  }
  return contexto
}
