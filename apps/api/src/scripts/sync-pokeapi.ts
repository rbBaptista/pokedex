// Script para popular o banco local com dados reais da PokeAPI.
// Roda uma vez manualmente (npm run sync:pokeapi), não faz parte do servidor.
// Seguro de rodar mais de uma vez: usa upsert (cria se não existir, atualiza se já existir).
import { prisma } from '../prisma.ts'

const PRIMEIRA_GERACAO = 151
const TAMANHO_DO_LOTE = 10

// Nomes de stat da PokeAPI mapeados pros nossos campos em português.
const CHAVE_POR_STAT: Record<string, string> = {
  hp: 'hpBase',
  attack: 'ataqueBase',
  defense: 'defesaBase',
  'special-attack': 'ataqueEspecialBase',
  'special-defense': 'defesaEspecialBase',
  speed: 'velocidadeBase',
}

interface PokemonDaApi {
  id: number
  nome: string
  altura: number
  peso: number
  spriteUrl: string
  statsBase: Record<string, number>
  tipos: string[]
}

async function buscarPokemon(id: number): Promise<PokemonDaApi> {
  const resposta = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
  if (!resposta.ok) {
    throw new Error(`Falha ao buscar Pokémon ${id}: HTTP ${resposta.status}`)
  }
  const dados = await resposta.json()

  const statsBase: Record<string, number> = {}
  for (const stat of dados.stats) {
    const chave = CHAVE_POR_STAT[stat.stat.name]
    if (chave) statsBase[chave] = stat.base_stat
  }

  return {
    id: dados.id,
    nome: dados.name,
    altura: dados.height,
    peso: dados.weight,
    spriteUrl: dados.sprites.other['official-artwork'].front_default,
    statsBase,
    tipos: dados.types.map((t: { type: { name: string } }) => t.type.name),
  }
}

async function salvarPokemon(pokemon: PokemonDaApi) {
  await prisma.pokemon.upsert({
    where: { id: pokemon.id },
    update: {
      nome: pokemon.nome,
      altura: pokemon.altura,
      peso: pokemon.peso,
      spriteUrl: pokemon.spriteUrl,
      hpBase: pokemon.statsBase.hpBase,
      ataqueBase: pokemon.statsBase.ataqueBase,
      defesaBase: pokemon.statsBase.defesaBase,
      ataqueEspecialBase: pokemon.statsBase.ataqueEspecialBase,
      defesaEspecialBase: pokemon.statsBase.defesaEspecialBase,
      velocidadeBase: pokemon.statsBase.velocidadeBase,
    },
    create: {
      id: pokemon.id,
      nome: pokemon.nome,
      altura: pokemon.altura,
      peso: pokemon.peso,
      spriteUrl: pokemon.spriteUrl,
      hpBase: pokemon.statsBase.hpBase,
      ataqueBase: pokemon.statsBase.ataqueBase,
      defesaBase: pokemon.statsBase.defesaBase,
      ataqueEspecialBase: pokemon.statsBase.ataqueEspecialBase,
      defesaEspecialBase: pokemon.statsBase.defesaEspecialBase,
      velocidadeBase: pokemon.statsBase.velocidadeBase,
    },
  })

  for (const nomeDoTipo of pokemon.tipos) {
    const tipo = await prisma.type.upsert({
      where: { nome: nomeDoTipo },
      update: {},
      create: { nome: nomeDoTipo },
    })

    await prisma.pokemonType.upsert({
      where: { pokemonId_typeId: { pokemonId: pokemon.id, typeId: tipo.id } },
      update: {},
      create: { pokemonId: pokemon.id, typeId: tipo.id },
    })
  }
}

async function main() {
  const ids = Array.from({ length: PRIMEIRA_GERACAO }, (_, indice) => indice + 1)

  for (let inicio = 0; inicio < ids.length; inicio += TAMANHO_DO_LOTE) {
    const lote = ids.slice(inicio, inicio + TAMANHO_DO_LOTE)

    // Busca o lote em paralelo na PokeAPI (rede é o gargalo)...
    const pokemonsDoLote = await Promise.all(lote.map(buscarPokemon))

    // ...mas grava no banco um de cada vez, pra não disputar a mesma conexão SQLite.
    for (const pokemon of pokemonsDoLote) {
      await salvarPokemon(pokemon)
      console.log(`Sincronizado ${pokemon.id}/${PRIMEIRA_GERACAO}: ${pokemon.nome}`)
    }
  }

  console.log('Sincronização concluída.')
}

main()
  .catch((erro) => {
    console.error(erro)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
