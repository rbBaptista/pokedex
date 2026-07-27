import cors from 'cors'
import express from 'express'
import { pokemonsRouter } from './routes/pokemons.routes.ts'

const app = express()
const porta = 3001

// Libera acesso do frontend (roda em outra porta) durante o desenvolvimento
app.use(cors())

// Endpoint simples para verificar se a API está no ar
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/pokemons', pokemonsRouter)

app.listen(porta, () => {
  console.log(`API rodando em http://localhost:${porta}`)
})
