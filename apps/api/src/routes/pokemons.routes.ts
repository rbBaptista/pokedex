// Rotas relacionadas a Pokémon: listagem e detalhe.
import { Router } from 'express'
import { prisma } from '../prisma.ts'
import { Prisma } from '../generated/prisma/client.ts'

export const pokemonsRouter = Router()

const LIMITE_PADRAO = 96
const LIMITE_MAXIMO = 100

// Normaliza um valor de query param pra um inteiro positivo, caindo no padrão
// quando o valor não é numérico, é zero/negativo, ou nem foi informado.
// Quando um máximo é passado, valores acima dele são saturados (não descartados).
function normalizarInteiroPositivo(valor: unknown, padrao: number, maximo?: number): number {
  const numero = Number(valor)
  if (!Number.isInteger(numero) || numero <= 0) {
    return padrao
  }
  if (maximo !== undefined && numero > maximo) {
    return maximo
  }
  return numero
}

// GET /api/pokemons — lista os Pokémon, paginada, em formato resumido.
// Aceita ?busca=texto, ?tipo=nome e ?geracao=numero (filtros combináveis),
// além de ?limite=N (padrão 96, máximo 100) e ?pagina=N (padrão 1).
pokemonsRouter.get('/', async (req, res) => {
  const busca = typeof req.query.busca === 'string' ? req.query.busca : undefined
  const tipo = typeof req.query.tipo === 'string' ? req.query.tipo : undefined
  const geracao = typeof req.query.geracao === 'string' ? Number(req.query.geracao) : undefined
  const limite = normalizarInteiroPositivo(req.query.limite, LIMITE_PADRAO, LIMITE_MAXIMO)
  const pagina = normalizarInteiroPositivo(req.query.pagina, 1)

  const where: Prisma.PokemonWhereInput = {
    ...(busca && { nome: { contains: busca } }),
    ...(tipo && { tipos: { some: { tipo: { nome: tipo } } } }),
    ...(geracao && { geracaoNumero: geracao }),
  }

  try {
    const [pokemons, total] = await Promise.all([
      prisma.pokemon.findMany({
        where,
        orderBy: { id: 'asc' },
        include: { tipos: { include: { tipo: true } } },
        skip: (pagina - 1) * limite,
        take: limite,
      }),
      prisma.pokemon.count({ where }),
    ])

    res.json({
      itens: pokemons.map((pokemon) => ({
        id: pokemon.id,
        nome: pokemon.nome,
        spriteUrl: pokemon.spriteUrl,
        tipos: pokemon.tipos.map((pokemonType) => pokemonType.tipo.nome),
      })),
      total,
      pagina,
      limite,
    })
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
