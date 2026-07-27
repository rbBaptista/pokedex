import { Route, Routes } from 'react-router'
import Layout from './components/Layout'
import PaginaDetalhe from './pages/PaginaDetalhe'
import PaginaInicial from './pages/PaginaInicial'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<PaginaInicial />} />
        <Route path="pokemon/:id" element={<PaginaDetalhe />} />
      </Route>
    </Routes>
  )
}

export default App
