import { Router } from 'express'

import { validateRequest } from '../../http/validation.js'
import {
  adminLoginController,
  adminLogoutController,
  adminSessionController,
} from './admin-auth.controller.js'
import { requireAdminSession } from './admin-auth.middleware.js'
import { adminLoginRateLimit } from './admin-auth.rate-limit.js'
import { adminLoginSchema } from './admin-auth.schemas.js'

export const adminAuthRouter = Router()

adminAuthRouter.post(
  '/login',
  adminLoginRateLimit,
  validateRequest({ body: adminLoginSchema }),
  adminLoginController,
)

adminAuthRouter.post('/logout', adminLogoutController)

adminAuthRouter.get('/session', requireAdminSession, adminSessionController)
