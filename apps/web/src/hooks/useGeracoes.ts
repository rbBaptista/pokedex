import { useEffect, useState } from 'react'
import { API_BASE_URL } from '../config'
import type { Generation } from '../types/pokemon'

interface UseGeracoesResultado {
  geracoes: Generation[]
  carregando: boolean
  erro: string | null
}

// Busca a lista de gerações uma vez, usada pra montar o seletor de páginas da Home.
export function useGeracoes(): UseGeracoesResultado {
  const [geracoes, setGeracoes] = useState<Generation[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    async function buscarGeracoes() {
      try {
        const resposta = await fetch(`${API_BASE_URL}/geracoes`)
        if (!resposta.ok) {
          throw new Error(`A API respondeu com status ${resposta.status}`)
        }
        const dados: Generation[] = await resposta.json()
        setGeracoes(dados)
      } catch {
        setErro('Não foi possível carregar as gerações.')
      } finally {
        setCarregando(false)
      }
    }

    buscarGeracoes()
  }, [])

  return { geracoes, carregando, erro }
}
