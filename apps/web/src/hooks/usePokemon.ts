import { useEffect, useState } from 'react'
import { API_BASE_URL } from '../config'
import type { PokemonDetalhe } from '../types/pokemon'

interface UsePokemonResultado {
  pokemon: PokemonDetalhe | null
  carregando: boolean
  erro: string | null
}

// Busca o detalhe de um Pokémon pelo id. Refaz a busca sempre que o id mudar
// (ex: navegar de /pokemon/1 direto pra /pokemon/2).
export function usePokemon(id: string | undefined): UsePokemonResultado {
  const [pokemon, setPokemon] = useState<PokemonDetalhe | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    async function buscarPokemon() {
      setCarregando(true)
      setErro(null)
      setPokemon(null)

      try {
        const resposta = await fetch(`${API_BASE_URL}/pokemons/${id}`)

        if (resposta.status === 404) {
          setErro('Pokémon não encontrado.')
          return
        }
        if (!resposta.ok) {
          throw new Error(`A API respondeu com status ${resposta.status}`)
        }

        const dados: PokemonDetalhe = await resposta.json()
        setPokemon(dados)
      } catch {
        setErro('Não foi possível carregar o Pokémon. Verifique se a API está rodando.')
      } finally {
        setCarregando(false)
      }
    }

    buscarPokemon()
  }, [id])

  return { pokemon, carregando, erro }
}
