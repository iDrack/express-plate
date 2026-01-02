import type { Request, Response, NextFunction } from 'express'
import { logger } from '../config/logger.js'

export class AppError extends Error {
  statusCode: number
  status: string

  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
    this.status = `${statusCode}`
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof AppError) {
    if(req.user.id) {
      logger.error(`user id: ${req.user.id} - ${err.message}`)
    } else {
      logger.error(`${err.message}`)
    }
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    })
  }

  logger.error(err.stack || err)
  return res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
  })
}