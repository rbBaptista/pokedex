import { useEffect, useState } from 'react'
import { API_BASE_URL } from '../config'
import type { PokemonResumo, RespostaPokemonsPaginada } from '../types/pokemon'

interface UsePokemonsFiltros {
  busca?: string
  tipo?: string | null
  geracao?: number
}

interface UsePokemonsResultado {
  pokemons: PokemonResumo[]
  total: number
  carregando: boolean
  carregandoMais: boolean
  erro: string | null
  carregarMais: () => void
}

const ATRASO_DEBOUNCE_MS = 300
const ITENS_POR_PAGINA = 96
// Teto de segurança pro laço que busca uma geração inteira: a maior geração
// (Unova, ~156 Pokémon) nunca passa de 2 páginas. Um valor bem acima disso só
// evita loop infinito caso a API nunca devolva um `total` alcançável.
const MAX_PAGINAS_GERACAO = 20

function montarUrl(filtros: UsePokemonsFiltros, pagina: number): string {
  const params = new URLSearchParams()
  if (filtros.busca) params.set('busca', filtros.busca)
  if (filtros.tipo) params.set('tipo', filtros.tipo)
  if (filtros.geracao) params.set('geracao', String(filtros.geracao))
  params.set('limite', String(ITENS_POR_PAGINA))
  params.set('pagina', String(pagina))
  return `${API_BASE_URL}/pokemons?${params.toString()}`
}

async function buscarPagina(
  filtros: UsePokemonsFiltros,
  pagina: number,
  signal?: AbortSignal,
): Promise<RespostaPokemonsPaginada> {
  const resposta = await fetch(montarUrl(filtros, pagina), { signal })
  if (!resposta.ok) {
    throw new Error(`A API respondeu com status ${resposta.status}`)
  }
  return resposta.json()
}

// Busca a lista de Pokémon na API.
// Com uma geração específica selecionada, carrega tudo de uma vez (buscando páginas
// em sequência até completar — cada geração tem no máximo ~156 Pokémon, então isso é
// só 1 ou 2 requisições). Sem geração (opção "Todas"), a lista é paginada de verdade:
// carrega uma página por vez e só busca mais quando o usuário clicar em "Carregar mais".
export function usePokemons(filtros: UsePokemonsFiltros = {}): UsePokemonsResultado {
  const { busca, tipo, geracao } = filtros
  const modoPaginado = geracao === undefined

  const [pokemons, setPokemons] = useState<PokemonResumo[]>([])
  const [total, setTotal] = useState(0)
  const [pagina, setPagina] = useState(1)
  const [carregando, setCarregando] = useState(true)
  const [carregandoMais, setCarregandoMais] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    const controller = new AbortController()

    const temporizador = setTimeout(async () => {
      setCarregando(true)
      setErro(null)

      try {
        if (modoPaginado) {
          const dados = await buscarPagina({ busca, tipo, geracao }, 1, controller.signal)
          if (cancelado) return
          setPokemons(dados.itens)
          setTotal(dados.total)
          setPagina(dados.pagina)
        } else {
          let acumulado: PokemonResumo[] = []
          let paginaAtual = 1
          let totalDaResposta = 0

          while (paginaAtual <= MAX_PAGINAS_GERACAO) {
            const dados = await buscarPagina({ busca, tipo, geracao }, paginaAtual, controller.signal)
            if (cancelado) return
            acumulado = acumulado.concat(dados.itens)
            totalDaResposta = dados.total

            if (dados.itens.length === 0 || acumulado.length >= totalDaResposta) {
              break
            }
            paginaAtual += 1
          }

          setPokemons(acumulado)
          setTotal(totalDaResposta)
          setPagina(paginaAtual)
        }
      } catch (erroCapturado) {
        if (cancelado) return
        // Cancelamento (troca de filtro ou desmontagem) não é um erro de verdade,
        // não deve aparecer pro usuário.
        if (erroCapturado instanceof DOMException && erroCapturado.name === 'AbortError') {
          return
        }
        setErro('Não foi possível carregar os Pokémon. Verifique se a API está rodando.')
      } finally {
        if (!cancelado) {
          setCarregando(false)
        }
      }
    }, ATRASO_DEBOUNCE_MS)

    return () => {
      cancelado = true
      controller.abort()
      clearTimeout(temporizador)
    }
  }, [busca, tipo, geracao])

  async function carregarMais() {
    setCarregandoMais(true)

    try {
      const dados = await buscarPagina({ busca, tipo, geracao }, pagina + 1)
      setPokemons((atual) => [...atual, ...dados.itens])
      setTotal(dados.total)
      setPagina(dados.pagina)
    } catch {
      setErro('Não foi possível carregar mais Pokémon. Verifique se a API está rodando.')
    } finally {
      setCarregandoMais(false)
    }
  }

  return { pokemons, total, carregando, carregandoMais, erro, carregarMais }
}
