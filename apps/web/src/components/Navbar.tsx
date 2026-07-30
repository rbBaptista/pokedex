import { Link, useNavigate } from 'react-router'
import { useAuth } from '../contexts/AuthContext'

// Barra superior fixa, com o nome do site e o estado de login.
function Navbar() {
  const { usuario, carregando, logout } = useAuth()
  const navigate = useNavigate()

  async function aoSair() {
    await logout()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-10 bg-red-600 shadow-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <h1 className="text-2xl font-bold text-white">Pokédex</h1>

        <div className="flex h-8 items-center gap-3">
          {carregando ? (
            // Placeholder com a mesma altura do conteúdo real, pra Navbar não
            // mudar de tamanho quando o carregamento inicial terminar.
            <div className="h-8 w-20 animate-pulse rounded-md bg-white/20" aria-hidden="true" />
          ) : usuario ? (
            <>
              <Link
                to="/minha-pokedex"
                className="shrink-0 text-sm text-white hover:underline"
              >
                Minha Pokédex
              </Link>
              <span className="hidden max-w-[140px] truncate text-sm text-white sm:inline lg:max-w-none">
                {usuario.email}
              </span>
              <button
                type="button"
                onClick={aoSair}
                className="shrink-0 rounded-md border border-white/60 px-3 py-1.5 text-sm text-white hover:bg-white/10"
              >
                Sair
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="shrink-0 rounded-md border border-white/60 px-3 py-1.5 text-sm text-white hover:bg-white/10"
            >
              Entrar
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

export default Navbar
