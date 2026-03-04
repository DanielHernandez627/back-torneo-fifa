import { Response } from 'express';

const errorHandler = (res: Response, statusCode: number, errorRaw?: any) => {
    res.status(statusCode).json({ error: errorRaw });
}

export { errorHandler };