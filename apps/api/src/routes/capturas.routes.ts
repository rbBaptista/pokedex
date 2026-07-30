// Rotas relacionadas às capturas do usuário logado.
import { Router } from 'express'
import { Prisma } from '../generated/prisma/client.ts'
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

// POST /api/capturas — captura um Pokémon pro usuário logado (rota protegida).
// Corpo: { pokemonId }.
capturasRouter.post('/', autenticacao, async (req, res) => {
  const usuarioId = req.usuarioId
  if (usuarioId === undefined) {
    return res.status(401).json({ erro: 'Não autenticado.' })
  }

  const { pokemonId } = req.body ?? {}
  if (typeof pokemonId !== 'number' || !Number.isInteger(pokemonId)) {
    return res.status(400).json({ erro: 'pokemonId é obrigatório e precisa ser um número.' })
  }

  try {
    await prisma.captura.create({ data: { userId: usuarioId, pokemonId } })
    res.status(201).json({})
  } catch (erro) {
    if (erro instanceof Prisma.PrismaClientKnownRequestError) {
      if (erro.code === 'P2002') {
        return res.status(409).json({ erro: 'Esse Pokémon já está capturado.' })
      }
      if (erro.code === 'P2003') {
        return res.status(404).json({ erro: 'Pokémon não encontrado.' })
      }
    }
    console.error(erro)
    res.status(500).json({ erro: 'Erro ao capturar o Pokémon.' })
  }
})

// DELETE /api/capturas/:pokemonId — remove a captura do usuário logado pra
// esse Pokémon (rota protegida).
capturasRouter.delete('/:pokemonId', autenticacao, async (req, res) => {
  const usuarioId = req.usuarioId
  if (usuarioId === undefined) {
    return res.status(401).json({ erro: 'Não autenticado.' })
  }

  const pokemonId = Number(req.params.pokemonId)
  if (!Number.isInteger(pokemonId)) {
    return res.status(400).json({ erro: 'O id do Pokémon deve ser um número.' })
  }

  try {
    await prisma.captura.delete({
      where: { userId_pokemonId: { userId: usuarioId, pokemonId } },
    })
    res.status(200).json({})
  } catch (erro) {
    if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === 'P2025') {
      return res.status(404).json({ erro: 'Captura não encontrada.' })
    }
    console.error(erro)
    res.status(500).json({ erro: 'Erro ao remover a captura.' })
  }
})
