// Rotas relacionadas às capturas do usuário logado.
import { Router } from 'express'
import { autenticacao } from '../middlewares/autenticacao.ts'
import { prisma } from '../prisma.ts'

export const capturasRouter = Router()

// GET /api/capturas — lista os Pokémon capturados pelo usuário logado (rota
// protegida), no mesmo formato resumido de GET /api/pokemons, mais recente
// primeiro.
capturasRouter.get('/', autenticacao, async (req, res) => {
  const usuarioId = req.usuarioId
  if (usuarioId === undefined) {
    return res.status(401).json({ erro: 'Não autenticado.' })
  }

  try {
    const capturas = await prisma.captura.findMany({
      where: { userId: usuarioId },
      orderBy: { capturadoEm: 'desc' },
      include: { pokemon: { include: { tipos: { include: { tipo: true } } } } },
    })

    res.json(
      capturas.map(({ pokemon }) => ({
        id: pokemon.id,
        nome: pokemon.nome,
        spriteUrl: pokemon.spriteUrl,
        tipos: pokemon.tipos.map((pokemonType) => pokemonType.tipo.nome),
      })),
    )
  } catch (erro) {
    console.error(erro)
    res.status(500).json({ erro: 'Erro ao buscar capturas.' })
  }
})
