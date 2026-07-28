// Rotas relacionadas a Pokémon: listagem e detalhe.
import { Router } from 'express'
import { prisma } from '../prisma.ts'
import { Prisma } from '../generated/prisma/client.ts'

export const pokemonsRouter = Router()

// GET /api/pokemons — lista os Pokémon, em formato resumido.
// Aceita ?busca=texto, ?tipo=nome e ?geracao=numero (filtros combináveis).
pokemonsRouter.get('/', async (req, res) => {
  const busca = typeof req.query.busca === 'string' ? req.query.busca : undefined
  const tipo = typeof req.query.tipo === 'string' ? req.query.tipo : undefined
  const geracao = typeof req.query.geracao === 'string' ? Number(req.query.geracao) : undefined

  const where: Prisma.PokemonWhereInput = {
    ...(busca && { nome: { contains: busca } }),
    ...(tipo && { tipos: { some: { tipo: { nome: tipo } } } }),
    ...(geracao && { geracaoNumero: geracao }),
  }

  try {
    const pokemons = await prisma.pokemon.findMany({
      where,
      orderBy: { id: 'asc' },
      include: { tipos: { include: { tipo: true } } },
    })

    res.json(
      pokemons.map((pokemon) => ({
        id: pokemon.id,
        nome: pokemon.nome,
        spriteUrl: pokemon.spriteUrl,
        tipos: pokemon.tipos.map((pokemonType) => pokemonType.tipo.nome),
      })),
    )
  } catch (erro) {
    console.error(erro)
    res.status(500).json({ erro: 'Erro ao buscar os Pokémon.' })
  }
})

// GET /api/pokemons/:id — detalhe completo de um Pokémon.
pokemonsRouter.get('/:id', async (req, res) => {
  const id = Number(req.params.id)

  if (!Number.isInteger(id)) {
    return res.status(400).json({ erro: 'O id do Pokémon deve ser um número.' })
  }

  try {
    const pokemon = await prisma.pokemon.findUnique({
      where: { id },
      include: { tipos: { include: { tipo: true } } },
    })

    if (!pokemon) {
      return res.status(404).json({ erro: 'Pokémon não encontrado.' })
    }

    res.json({
      id: pokemon.id,
      nome: pokemon.nome,
      altura: pokemon.altura,
      peso: pokemon.peso,
      spriteUrl: pokemon.spriteUrl,
      tipos: pokemon.tipos.map((pokemonType) => pokemonType.tipo.nome),
      stats: {
        hp: pokemon.hpBase,
        ataque: pokemon.ataqueBase,
        defesa: pokemon.defesaBase,
        ataqueEspecial: pokemon.ataqueEspecialBase,
        defesaEspecial: pokemon.defesaEspecialBase,
        velocidade: pokemon.velocidadeBase,
      },
    })
  } catch (erro) {
    console.error(erro)
    res.status(500).json({ erro: 'Erro ao buscar o Pokémon.' })
  }
})
