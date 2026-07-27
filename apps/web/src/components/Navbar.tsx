// Barra superior simples, com o nome do site. Busca/filtro entram numa etapa futura.
function Navbar() {
  return (
    <header className="sticky top-0 z-10 bg-red-600 shadow-md">
      <div className="mx-auto max-w-6xl px-4 py-4">
        <h1 className="text-2xl font-bold text-white">Pokédex</h1>
      </div>
    </header>
  )
}

export default Navbar
