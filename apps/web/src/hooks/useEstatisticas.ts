import { useEffect, useState } from 'react'
import { API_BASE_URL } from '../config'
import type { Estatisticas } from '../types/estatisticas'

interface UseEstatisticasResultado {
  estatisticas: Estatisticas | null
  carregando: boolean
  erro: string | null
}

// Busca as estatísticas gerais do site (rota só pra ADMIN). `ativo` existe
// pra PaginaAdmin só disparar a busca depois de confirmar que o usuário é
// admin, sem precisar chamar o hook condicionalmente.
export function useEstatisticas(ativo: boolean): UseEstatisticasResultado {
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!ativo) {
      setCarregando(false)
      return
    }

    async function buscarEstatisticas() {
      setCarregando(true)
      setErro(null)
      try {
        const resposta = await fetch(`${API_BASE_URL}/admin/estatisticas`, {
          credentials: 'include',
        })
        if (!resposta.ok) {
          throw new Error(`A API respondeu com status ${resposta.status}`)
        }
        setEstatisticas(await resposta.json())
      } catch {
        setErro('Não foi possível carregar as estatísticas.')
      } finally {
        setCarregando(false)
      }
    }

    buscarEstatisticas()
  }, [ativo])

  return { estatisticas, carregando, erro }
}
