import { useEffect, useState } from 'react'
import { API_BASE_URL } from '../config'
import type { PokemonResumo } from '../types/pokemon'

interface UseCapturasResultado {
  capturas: PokemonResumo[]
  carregando: boolean
  erro: string | null
}

// Busca os Pokémon capturados pelo usuário logado. Rota protegida, por isso
// credentials: 'include' (precisa do cookie de login ir junto).
export function useCapturas(): UseCapturasResultado {
  const [capturas, setCapturas] = useState<PokemonResumo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    async function buscarCapturas() {
      try {
        const resposta = await fetch(`${API_BASE_URL}/capturas`, { credentials: 'include' })
        if (!resposta.ok) {
          throw new Error(`A API respondeu com status ${resposta.status}`)
        }
        const dados: PokemonResumo[] = await resposta.json()
        setCapturas(dados)
      } catch {
        setErro('Não foi possível carregar suas capturas.')
      } finally {
        setCarregando(false)
      }
    }

    buscarCapturas()
  }, [])

  return { capturas, carregando, erro }
}
