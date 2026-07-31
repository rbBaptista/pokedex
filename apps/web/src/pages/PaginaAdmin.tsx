import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../contexts/AuthContext'
import { useEstatisticas } from '../hooks/useEstatisticas'

// Rota protegida por papel: deslogado vai pro /login (ainda pode logar);
// logado mas sem papel ADMIN vai pra Home (logar de novo não resolveria).
function PaginaAdmin() {
  const { usuario, carregando: carregandoSessao } = useAuth()
  const navigate = useNavigate()
  const usuarioEhAdmin = usuario?.papel === 'ADMIN'
  const { estatisticas, carregando, erro } = useEstatisticas(usuarioEhAdmin)

  useEffect(() => {
    if (carregandoSessao) return

    if (!usuario) {
      navigate('/login', { replace: true })
      return
    }
    if (!usuarioEhAdmin) {
      navigate('/', { replace: true })
    }
  }, [carregandoSessao, usuario, usuarioEhAdmin, navigate])

  if (carregandoSessao || !usuarioEhAdmin) {
    return null
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-neutral-800">Administração</h1>

      {carregando && <p className="py-8 text-center text-neutral-500">Carregando...</p>}

      {!carregando && erro && <p className="py-8 text-center text-red-600">{erro}</p>}

      {!carregando && !erro && estatisticas && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <CartaoEstatistica titulo="Usuários" valor={estatisticas.totalUsuarios} />
            <CartaoEstatistica titulo="Capturas" valor={estatisticas.totalCapturas} />
            <CartaoEstatistica
              titulo="Capturas por usuário"
              valor={estatisticas.mediaCapturasPorUsuario}
            />
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 font-semibold text-neutral-800">Mais capturados</h2>

            {estatisticas.maisCapturados.length === 0 ? (
              <p className="text-sm text-neutral-500">Ainda não há capturas.</p>
            ) : (
              <ol className="flex flex-col gap-2">
                {estatisticas.maisCapturados.map((pokemon, indice) => (
                  <li
                    key={pokemon.id}
                    className="flex items-center justify-between text-sm text-neutral-700"
                  >
                    <span className="capitalize">
                      {indice + 1}. {pokemon.nome}
                    </span>
                    <span className="font-medium">{pokemon.totalCapturas}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function CartaoEstatistica({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 text-center shadow-sm">
      <p className="text-sm text-neutral-500">{titulo}</p>
      <p className="text-2xl font-bold text-neutral-800">{valor}</p>
    </div>
  )
}

export default PaginaAdmin
