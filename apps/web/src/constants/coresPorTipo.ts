// Classes Tailwind (fundo + texto) usadas nos badges de tipo de cada Pokémon.
export const CORES_POR_TIPO: Record<string, string> = {
  normal: 'bg-neutral-400 text-white',
  fire: 'bg-orange-500 text-white',
  water: 'bg-blue-500 text-white',
  electric: 'bg-yellow-400 text-neutral-900',
  grass: 'bg-green-500 text-white',
  ice: 'bg-cyan-300 text-neutral-900',
  fighting: 'bg-red-700 text-white',
  poison: 'bg-purple-500 text-white',
  ground: 'bg-amber-600 text-white',
  flying: 'bg-indigo-300 text-neutral-900',
  psychic: 'bg-pink-500 text-white',
  bug: 'bg-lime-500 text-neutral-900',
  rock: 'bg-yellow-700 text-white',
  ghost: 'bg-violet-700 text-white',
  dragon: 'bg-indigo-600 text-white',
  dark: 'bg-neutral-700 text-white',
  steel: 'bg-slate-400 text-neutral-900',
  fairy: 'bg-pink-300 text-neutral-900',
}

const COR_PADRAO = 'bg-neutral-300 text-neutral-900'

export function corDoTipo(tipo: string): string {
  return CORES_POR_TIPO[tipo] ?? COR_PADRAO
}
