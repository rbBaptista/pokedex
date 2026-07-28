import { useEffect, useState } from 'react'
import { API_BASE_URL } from '../config'
import type { PokemonResumo } from '../types/pokemon'

interface UsePokemonsFiltros {
  busca?: string
  tipo?: string | null
  geracao?: number
}

interface UsePokemonsResultado {
  pokemons: PokemonResumo[]
  carregando: boolean
  erro: string | null
}

const ATRASO_DEBOUNCE_MS = 300

// Busca a lista de Pokémon na API, refazendo a busca quando busca/tipo mudarem.
// Espera um pouco (debounce) antes de disparar a requisição, pra não buscar a cada tecla digitada.
export function usePokemons(filtros: UsePokemonsFiltros = {}): UsePokemonsResultado {
  const { busca, tipo, geracao } = filtros
  const [pokemons, setPokemons] = useState<PokemonResumo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    const temporizador = setTimeout(async () => {
      setCarregando(true)
      setErro(null)

      const params = new URLSearchParams()
      if (busca) params.set('busca', busca)
      if (tipo) params.set('tipo', tipo)
      if (geracao) params.set('geracao', String(geracao))

      try {
        const resposta = await fetch(`${API_BASE_URL}/pokemons?${params.toString()}`)
        if (!resposta.ok) {
          throw new Error(`A API respondeu com status ${resposta.status}`)
        }
        const dados: PokemonResumo[] = await resposta.json()
        setPokemons(dados)
      } catch {
        setErro('Não foi possível carregar os Pokémon. Verifique se a API está rodando.')
      } finally {
        setCarregando(false)
      }
    }, ATRASO_DEBOUNCE_MS)

    return () => clearTimeout(temporizador)
  }, [busca, tipo, geracao])

  return { pokemons, carregando, erro }
}
