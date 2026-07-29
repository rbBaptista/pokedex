import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../contexts/AuthContext'

function PaginaLogin() {
  const { usuario, carregando: carregandoSessao, login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  // Quem já está logado não precisa ver o formulário de novo.
  useEffect(() => {
    if (!carregandoSessao && usuario) {
      navigate('/', { replace: true })
    }
  }, [carregandoSessao, usuario, navigate])

  if (carregandoSessao || usuario) {
    return null
  }

  async function aoSubmeter(evento: FormEvent) {
    evento.preventDefault()
    setErro(null)
    setEnviando(true)

    try {
      await login(email, senha)
      navigate('/')
    } catch (erroCapturado) {
      setErro(erroCapturado instanceof Error ? erroCapturado.message : 'Não foi possível entrar.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-neutral-800">Entrar</h1>

        <form onSubmit={aoSubmeter} className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm text-neutral-700">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(evento) => setEmail(evento.target.value)}
              className="rounded-lg border border-neutral-300 px-3 py-2 focus:border-red-500 focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-neutral-700">
            Senha
            <input
              type="password"
              required
              value={senha}
              onChange={(evento) => setSenha(evento.target.value)}
              className="rounded-lg border border-neutral-300 px-3 py-2 focus:border-red-500 focus:outline-none"
            />
          </label>

          {erro && <p className="text-sm text-red-600">{erro}</p>}

          <button
            type="submit"
            disabled={enviando}
            className="mt-2 rounded-md bg-red-600 px-4 py-2 font-medium text-white disabled:opacity-40"
          >
            {enviando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="mt-4 text-sm text-neutral-600">
          Não tem conta?{' '}
          <Link to="/cadastro" className="text-blue-600 hover:underline">
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  )
}

export default PaginaLogin
