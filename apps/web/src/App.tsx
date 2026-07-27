import Navbar from './components/Navbar'
import PokemonGrid from './components/PokemonGrid'

function App() {
  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <PokemonGrid />
      </main>
    </div>
  )
}

export default App
