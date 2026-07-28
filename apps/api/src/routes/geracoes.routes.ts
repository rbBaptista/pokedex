// Rotas relacionadas a gerações (usadas pra paginar a Home por geração).
import { Router } from 'express'
import { prisma } from '../prisma.ts'

export const geracoesRouter = Router()

// GET /api/geracoes — lista todas as gerações com a quantidade de Pokémon de cada uma.
geracoesRouter.get('/', async (_req, res) => {
  try {
    const geracoes = await prisma.generation.findMany({
      orderBy: { numero: 'asc' },
      include: { _count: { select: { pokemons: true } } },
    })

    res.json(
      geracoes.map((geracao) => ({
        numero: geracao.numero,
        regiao: geracao.regiao,
        totalPokemons: geracao._count.pokemons,
      })),
    )
  } catch (erro) {
    console.error(erro)
    res.status(500).json({ erro: 'Erro ao buscar as gerações.' })
  }
})
