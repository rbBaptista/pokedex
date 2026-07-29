import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { API_BASE_URL } from '../config'
import type { Usuario } from '../types/usuario'

interface AuthContextValor {
  usuario: Usuario | null
  carregando: boolean
  login: (email: string, senha: string) => Promise<void>
  cadastrar: (nome: string, email: string, senha: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValor | null>(null)

// Faz uma chamada autenticada (credentials: 'include', pro cookie httpOnly ir
// junto) e lança um erro com a mensagem da API quando a resposta não é ok.
async function chamarApi(caminho: string, opcoes: RequestInit = {}) {
  const resposta = await fetch(`${API_BASE_URL}${caminho}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...opcoes,
  })
  const dados = await resposta.json()

  if (!resposta.ok) {
    throw new Error(dados.erro ?? 'Algo deu errado. Tente de novo.')
  }

  return dados
}

// Guarda o usuário logado (ou null) e disponibiliza login/cadastro/logout pra
// qualquer componente da árvore, via useAuth().
export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    async function carregarUsuarioAtual() {
      try {
        const resposta = await fetch(`${API_BASE_URL}/auth/me`, { credentials: 'include' })
        if (resposta.ok) {
          setUsuario(await resposta.json())
        }
      } catch {
        // Sem conexão com a API — trata como deslogado, sem travar a página.
      } finally {
        setCarregando(false)
      }
    }

    carregarUsuarioAtual()
  }, [])

  async function login(email: string, senha: string) {
    const dados = await chamarApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha }),
    })
    setUsuario(dados)
  }

  async function cadastrar(nome: string, email: string, senha: string) {
    const dados = await chamarApi('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ nome, email, senha }),
    })
    setUsuario(dados)
  }

  async function logout() {
    try {
      await chamarApi('/auth/logout', { method: 'POST' })
    } finally {
      setUsuario(null)
    }
  }

  return (
    <AuthContext.Provider value={{ usuario, carregando, login, cadastrar, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValor {
  const contexto = useContext(AuthContext)
  if (!contexto) {
    throw new Error('useAuth precisa ser usado dentro de um <AuthProvider>.')
  }
  return contexto
}
