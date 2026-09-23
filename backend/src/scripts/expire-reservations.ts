import { closeDatabaseConnection } from '../config/database.js'
import { logger } from '../config/logger.js'
import { expireDueReservations } from '../modules/reservations/reservations.service.js'

async function run() {
  const result = await expireDueReservations()

  logger.info(
    {
      expiredReservations: result.expiredReservations,
      releasedProducts: result.releasedProducts,
    },
    'Reservation expiration sweep completed',
  )
}

run()
  .catch((error) => {
    logger.error({ err: error }, 'Reservation expiration sweep failed')
    process.exitCode = 1
  })
  .finally(async () => {
    await closeDatabaseConnection()
  })
