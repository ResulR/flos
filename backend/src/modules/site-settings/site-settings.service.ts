import { AppError } from '../../http/errors.js'
import {
  findDeliveryFeeCents,
  findPublicSiteSettings,
} from './site-settings.repository.js'

export type PublicSiteSettings = {
  phone: string | null
  email: string | null
  address: string | null
}

export async function getPublicSiteSettings(): Promise<PublicSiteSettings> {
  const settings = await findPublicSiteSettings()

  if (!settings) {
    throw new AppError(
      500,
      'INTERNAL_ERROR',
      'Les paramètres du site sont indisponibles',
    )
  }

  return {
    phone: settings.contact_phone,
    email: settings.contact_email,
    address: settings.contact_address,
  }
}

export async function getDeliveryFeeCents(): Promise<string> {
  const deliveryFeeCents = await findDeliveryFeeCents()

  if (deliveryFeeCents === null) {
    throw new AppError(
      500,
      'INTERNAL_ERROR',
      'Les paramètres du site sont indisponibles',
    )
  }

  return deliveryFeeCents
}
