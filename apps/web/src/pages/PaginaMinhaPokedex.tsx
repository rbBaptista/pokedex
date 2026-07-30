import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../contexts/AuthContext'
import { useCapturas } from '../contexts/CapturasContext'
import PokemonCard from '../components/PokemonCard'

// Rota protegida: só quem está logado pode ver.
function PaginaMinhaPokedex() {
  const { usuario, carregando: carregandoSessao } = useAuth()
  const navigate = useNavigate()
  const { capturas, carregando, erro } = useCapturas()

  useEffect(() => {
    if (!carregandoSessao && !usuario) {
      navigate('/login', { replace: true })
    }
  }, [carregandoSessao, usuario, navigate])

  if (carregandoSessao || !usuario) {
    return null
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-neutral-800">Minha Pokédex</h1>

      {carregando && <p className="py-8 text-center text-neutral-500">Carregando...</p>}

      {!carregando && erro && <p className="py-8 text-center text-red-600">{erro}</p>}

      {!carregando && !erro && capturas.length === 0 && (
        <p className="py-8 text-center text-neutral-500">
          Você ainda não capturou nenhum Pokémon.{' '}
          <Link to="/" className="text-blue-600 hover:underline">
            Ir pra Pokédex
          </Link>
        </p>
      )}

      {!carregando && !erro && capturas.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {capturas.map((pokemon) => (
            <PokemonCard key={pokemon.id} pokemon={pokemon} />
          ))}
        </div>
      )}
    </div>
  )
}

export default PaginaMinhaPokedex
