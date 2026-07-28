import { useSearchParams } from 'react-router'
import PokemonGrid from '../components/PokemonGrid'
import SeletorDeGeracao from '../components/SeletorDeGeracao'
import { useGeracoes } from '../hooks/useGeracoes'

function PaginaInicial() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { geracoes } = useGeracoes()

  const parametroGeracao = searchParams.get('geracao')
  const geracaoAtual: number | 'todas' =
    parametroGeracao === 'todas' ? 'todas' : Number(parametroGeracao) || 1

  function selecionarGeracao(valor: number | 'todas') {
    setSearchParams({ geracao: String(valor) })
  }

  return (
    <div>
      <SeletorDeGeracao
        geracoes={geracoes}
        geracaoAtual={geracaoAtual}
        aoSelecionar={selecionarGeracao}
      />
      <PokemonGrid geracao={geracaoAtual === 'todas' ? undefined : geracaoAtual} />
    </div>
  )
}

export default PaginaInicial
