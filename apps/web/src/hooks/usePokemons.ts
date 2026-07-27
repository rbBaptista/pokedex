import { useEffect, useState } from 'react'
import { API_BASE_URL } from '../config'
import type { PokemonResumo } from '../types/pokemon'

interface UsePokemonsResultado {
  pokemons: PokemonResumo[]
  carregando: boolean
  erro: string | null
}

// Busca a lista de Pokémon na API quando o componente que usar esse hook for montado.
export function usePokemons(): UsePokemonsResultado {
  const [pokemons, setPokemons] = useState<PokemonResumo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    async function buscarPokemons() {
      try {
        const resposta = await fetch(`${API_BASE_URL}/pokemons`)
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
    }

    buscarPokemons()
  }, [])

  return { pokemons, carregando, erro }
}
