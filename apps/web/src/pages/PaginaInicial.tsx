import { useSearchParams } from 'react-router'
import PokemonGrid from '../components/PokemonGrid'
import SeletorDeGeracao from '../components/SeletorDeGeracao'
import { useGeracoes } from '../hooks/useGeracoes'

function PaginaInicial() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { geracoes } = useGeracoes()

  const geracaoAtual = Number(searchParams.get('geracao')) || 1

  function selecionarGeracao(numero: number) {
    setSearchParams({ geracao: String(numero) })
  }

  return (
    <div>
      <SeletorDeGeracao
        geracoes={geracoes}
        geracaoAtual={geracaoAtual}
        aoSelecionar={selecionarGeracao}
      />
      <PokemonGrid geracao={geracaoAtual} />
    </div>
  )
}

export default PaginaInicial
