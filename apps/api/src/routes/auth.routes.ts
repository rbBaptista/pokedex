// Rotas de autenticação: cadastro, login, logout e "quem sou eu".
// Login funciona via cookie httpOnly contendo um JWT (ver ../token.ts) — não
// guardamos sessão nenhuma no servidor.
import bcrypt from 'bcryptjs'
import { Router, type Response } from 'express'
import { Prisma } from '../generated/prisma/client.ts'
import { autenticacao } from '../middlewares/autenticacao.ts'
import { prisma } from '../prisma.ts'
import { criarToken } from '../token.ts'

export const authRouter = Router()

const CUSTO_DO_HASH = 10
const NOME_DO_COOKIE = 'token'
const DURACAO_DO_COOKIE_MS = 7 * 24 * 60 * 60 * 1000 // 7 dias, igual à validade do token

function definirCookieDeLogin(res: Response, usuarioId: number) {
  const token = criarToken(usuarioId)
  res.cookie(NOME_DO_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: DURACAO_DO_COOKIE_MS,
  })
}

function emailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// Remove espaços nas pontas e uniformiza maiúsculas/minúsculas, pra
// "Ash@Example.com" e "ash@example.com " serem tratados como o mesmo email.
// Exportada porque o script criar-admin.ts precisa da mesma normalização.
export function normalizarEmail(email: string): string {
  return email.trim().toLowerCase()
}

// POST /api/auth/register — cria um usuário novo e já loga (seta o cookie).
authRouter.post('/register', async (req, res) => {
  const { nome, email: emailBruto, senha } = req.body ?? {}

  if (typeof nome !== 'string' || !nome.trim()) {
    return res.status(400).json({ erro: 'Nome é obrigatório.' })
  }
  if (typeof emailBruto !== 'string' || !emailValido(normalizarEmail(emailBruto))) {
    return res.status(400).json({ erro: 'Email inválido.' })
  }
  if (typeof senha !== 'string' || senha.length < 6) {
    return res.status(400).json({ erro: 'Senha precisa ter pelo menos 6 caracteres.' })
  }

  const email = normalizarEmail(emailBruto)

  try {
    const senhaHash = await bcrypt.hash(senha, CUSTO_DO_HASH)
    const usuario = await prisma.user.create({
      data: { nome: nome.trim(), email, senhaHash },
      select: { id: true, nome: true, email: true, papel: true },
    })

    definirCookieDeLogin(res, usuario.id)
    res.status(201).json(usuario)
  } catch (erro) {
    if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === 'P2002') {
      return res.status(409).json({ erro: 'Esse email já está cadastrado.' })
    }
    console.error(erro)
    res.status(500).json({ erro: 'Erro ao cadastrar usuário.' })
  }
})

// POST /api/auth/login — confere email/senha e seta o cookie.
authRouter.post('/login', async (req, res) => {
  const { email: emailBruto, senha } = req.body ?? {}

  if (typeof emailBruto !== 'string' || typeof senha !== 'string') {
    return res.status(400).json({ erro: 'Email e senha são obrigatórios.' })
  }

  const email = normalizarEmail(emailBruto)

  try {
    // Sem select aqui de propósito: precisamos do senhaHash pra comparar com
    // bcrypt.compare. Ele só nunca é incluído no JSON de resposta lá embaixo.
    const usuario = await prisma.user.findUnique({ where: { email } })
    const senhaConfere = usuario ? await bcrypt.compare(senha, usuario.senhaHash) : false

    if (!usuario || !senhaConfere) {
      return res.status(401).json({ erro: 'Email ou senha inválidos.' })
    }

    definirCookieDeLogin(res, usuario.id)
    res.json({ id: usuario.id, nome: usuario.nome, email: usuario.email, papel: usuario.papel })
  } catch (erro) {
    console.error(erro)
    res.status(500).json({ erro: 'Erro ao fazer login.' })
  }
})

// POST /api/auth/logout — limpa o cookie de login.
authRouter.post('/logout', (_req, res) => {
  res.clearCookie(NOME_DO_COOKIE)
  res.status(200).json({})
})

// GET /api/auth/me — devolve o usuário logado (rota protegida).
authRouter.get('/me', autenticacao, async (req, res) => {
  const usuarioId = req.usuarioId
  if (usuarioId === undefined) {
    return res.status(401).json({ erro: 'Não autenticado.' })
  }

  try {
    const usuario = await prisma.user.findUnique({
      where: { id: usuarioId },
      select: { id: true, nome: true, email: true, papel: true },
    })

    if (!usuario) {
      return res.status(401).json({ erro: 'Não autenticado.' })
    }

    res.json(usuario)
  } catch (erro) {
    console.error(erro)
    res.status(500).json({ erro: 'Erro ao buscar usuário.' })
  }
})
