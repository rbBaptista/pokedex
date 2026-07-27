import express from 'express'

const app = express()
const porta = 3001

// Endpoint simples para verificar se a API está no ar
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.listen(porta, () => {
  console.log(`API rodando em http://localhost:${porta}`)
})
