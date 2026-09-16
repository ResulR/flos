import express from 'express'

const app = express()
const port = Number(process.env.PORT ?? 4700)

app.use(express.json())

app.get('/health', (_req, res) => {
  res.status(200).json({
    data: {
      status: 'ok',
    },
  })
})

app.listen(port, '127.0.0.1', () => {
  console.log(`Flos Bikes backend listening on http://127.0.0.1:${port}`)
})
