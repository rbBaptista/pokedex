import { Outlet } from 'react-router'
import Navbar from './Navbar'

// Estrutura compartilhada por todas as páginas: Navbar fixa + conteúdo da rota atual.
function Layout() {
  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
