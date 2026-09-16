import express from 'express'
import { env } from './config/env.js'

const app = express()

app.use(express.json())

app.get('/health', (_req, res) => {
  res.status(200).json({
    data: {
      status: 'ok',
    },
  })
})

app.listen(env.PORT, '127.0.0.1', () => {
  console.log(`Flos Bikes backend listening on http://127.0.0.1:${env.PORT}`)
})
