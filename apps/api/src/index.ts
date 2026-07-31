import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import { adminRouter } from './routes/admin.routes.ts'
import { authRouter } from './routes/auth.routes.ts'
import { capturasRouter } from './routes/capturas.routes.ts'
import { geracoesRouter } from './routes/geracoes.routes.ts'
import { pokemonsRouter } from './routes/pokemons.routes.ts'

const app = express()
const porta = 3001

// Libera acesso do frontend (roda em outra porta) durante o desenvolvimento.
// origin precisa ser explícito (não "*") porque credentials:true manda o
// cookie de login junto — o navegador bloqueia isso com origem coringa.
app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
app.use(cookieParser())
app.use(express.json())

// Endpoint simples para verificar se a API está no ar
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/pokemons', pokemonsRouter)
app.use('/api/geracoes', geracoesRouter)
app.use('/api/auth', authRouter)
app.use('/api/capturas', capturasRouter)
app.use('/api/admin', adminRouter)

app.listen(porta, () => {
  console.log(`API rodando em http://localhost:${porta}`)
})
