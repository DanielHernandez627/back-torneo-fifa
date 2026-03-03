import { Response } from 'express';

const errorHandler = (res: Response, statusCode: number, message: string) => {
    res.status(statusCode).json({ error: message });
}

export { errorHandler };