// Rotas de administração — todas exigem autenticacao + apenasAdmin.
import { Router } from 'express'
import { apenasAdmin } from '../middlewares/apenasAdmin.ts'
import { autenticacao } from '../middlewares/autenticacao.ts'
import { prisma } from '../prisma.ts'

export const adminRouter = Router()

const TOP_MAIS_CAPTURADOS = 5

// GET /api/admin/estatisticas — números gerais do site (só ADMIN).
adminRouter.get('/estatisticas', autenticacao, apenasAdmin, async (_req, res) => {
  try {
    const [totalUsuarios, totalCapturas, agrupadoPorPokemon] = await Promise.all([
      prisma.user.count(),
      prisma.captura.count(),
      prisma.captura.groupBy({
        by: ['pokemonId'],
        _count: { pokemonId: true },
        orderBy: { _count: { pokemonId: 'desc' } },
        take: TOP_MAIS_CAPTURADOS,
      }),
    ])

    const pokemons = await prisma.pokemon.findMany({
      where: { id: { in: agrupadoPorPokemon.map((grupo) => grupo.pokemonId) } },
      select: { id: true, nome: true },
    })
    const nomePorId = new Map(pokemons.map((pokemon) => [pokemon.id, pokemon.nome]))

    const maisCapturados = agrupadoPorPokemon.map((grupo) => ({
      id: grupo.pokemonId,
      nome: nomePorId.get(grupo.pokemonId) ?? 'desconhecido',
      totalCapturas: grupo._count.pokemonId,
    }))

    // Arredonda pra 2 casas; sem usuários, a média é 0 (evita divisão por zero).
    const mediaCapturasPorUsuario =
      totalUsuarios === 0 ? 0 : Math.round((totalCapturas / totalUsuarios) * 100) / 100

    res.json({ totalUsuarios, totalCapturas, mediaCapturasPorUsuario, maisCapturados })
  } catch (erro) {
    console.error(erro)
    res.status(500).json({ erro: 'Erro ao buscar estatísticas.' })
  }
})
