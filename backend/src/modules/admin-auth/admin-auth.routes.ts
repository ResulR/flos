import { Router } from 'express'

import { validateRequest } from '../../http/validation.js'
import {
  adminLoginController,
  adminLogoutController,
} from './admin-auth.controller.js'
import { adminLoginSchema } from './admin-auth.schemas.js'

export const adminAuthRouter = Router()

adminAuthRouter.post(
  '/login',
  validateRequest({ body: adminLoginSchema }),
  adminLoginController,
)

adminAuthRouter.post('/logout', adminLogoutController)
