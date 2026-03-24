import { Response } from 'express';
import { ApiError, ErrorWithDriver, PostgresLikeError } from '../models/error.model';

const parseUniqueConstraint = (dbError: PostgresLikeError): { message: string; field?: string } => {
    const detail = dbError.detail ?? '';
    const detailMatch = detail.match(/Key \(([^)]+)\)=\(([^)]+)\) already exists\./);

    if (detailMatch) {
        const field = detailMatch[1];
        const value = detailMatch[2];

        if (field && value) {
            return {
                message: `The ${field} '${value}' is already in use`,
                field,
            };
        }

        return { message: 'A unique value already exists' };
    }

    const constraint = dbError.constraint ?? '';
    if (constraint.includes('_email_')) {
        return { message: 'The email is already in use', field: 'email' };
    }
    if (constraint.includes('_username_')) {
        return { message: 'The username is already in use', field: 'username' };
    }

    return { message: 'A unique value already exists' };
};

const buildApiError = (errorRaw?: unknown): ApiError => {
    const error = (errorRaw ?? {}) as ErrorWithDriver;
    const dbError = error.driverError ?? error;

    if (dbError.code === '23505') {
        return {
            code: 'DUPLICATE_VALUE',
            ...parseUniqueConstraint(dbError),
        };
    }

    if (typeof error.code === 'string' && error.code.trim() && typeof error.message === 'string' && error.message.trim()) {
        return {
            code: error.code,
            message: error.message,
            ...(typeof error.field === 'string' && error.field.trim() ? { field: error.field } : {}),
        };
    }

    if (typeof error.message === 'string' && error.message.trim()) {
        return {
            code: 'APP_ERROR',
            message: error.message,
        };
    }

    return {
        code: 'UNKNOWN_ERROR',
        message: 'Unexpected error',
    };
};

const errorHandler = (res: Response, statusCode: number, errorRaw?: unknown) => {
    res.status(statusCode).json({ error: buildApiError(errorRaw) });
};

export { errorHandler };