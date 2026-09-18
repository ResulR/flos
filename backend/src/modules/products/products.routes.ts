import { Router } from 'express'

import { getPublicProducts } from './products.controller.js'

export const productsRouter = Router()

productsRouter.get('/', getPublicProducts)
