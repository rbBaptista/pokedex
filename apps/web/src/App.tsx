import { Route, Routes } from 'react-router'
import Layout from './components/Layout'
import PaginaCadastro from './pages/PaginaCadastro'
import PaginaDetalhe from './pages/PaginaDetalhe'
import PaginaInicial from './pages/PaginaInicial'
import PaginaLogin from './pages/PaginaLogin'
import PaginaMinhaPokedex from './pages/PaginaMinhaPokedex'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<PaginaInicial />} />
        <Route path="pokemon/:id" element={<PaginaDetalhe />} />
        <Route path="login" element={<PaginaLogin />} />
        <Route path="cadastro" element={<PaginaCadastro />} />
        <Route path="minha-pokedex" element={<PaginaMinhaPokedex />} />
      </Route>
    </Routes>
  )
}

export default App
