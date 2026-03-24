import { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { FirebaseAuthService } from '../services/firebase-auth.service';
import { FirebaseUserSyncService } from '../services/firebase-user-sync.service';
import { errorHandler } from '../utilities/error.handler';

const firebaseAuthService = new FirebaseAuthService();
const firebaseUserSyncService = new FirebaseUserSyncService();

const getBearerToken = (authorization?: string): string | null => {
    if (!authorization) {
        return null;
    }

    const [scheme, token] = authorization.split(" ");
    if (scheme !== "Bearer" || !token) {
        return null;
    }

    return token;
};

const resolveFirebaseAuthError = (errorRaw: unknown): { statusCode: number; code: string; message: string } => {
    const error = errorRaw as { code?: string; message?: string };

    if (error?.code === 'auth/id-token-expired') {
        return {
            statusCode: 401,
            code: 'TOKEN_EXPIRED',
            message: 'Firebase token expired',
        };
    }

    if (error?.code === 'auth/argument-error' || error?.code === 'auth/invalid-id-token') {
        return {
            statusCode: 401,
            code: 'TOKEN_INVALID',
            message: 'Invalid Firebase token',
        };
    }

    return {
        statusCode: 401,
        code: 'UNAUTHORIZED',
        message: error?.message || 'Unauthorized',
    };
};

const checkJwt = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = getBearerToken(req.headers.authorization);
        if (!token) {
            return errorHandler(res, 401, {
                code: 'TOKEN_MISSING',
                message: 'Missing or invalid Authorization Bearer token',
            });
        }

        const decodedToken = await firebaseAuthService.verifyIdToken(token);
        if (env.FIREBASE_ENFORCE_EMAIL_VERIFIED && !decodedToken.email_verified) {
            return errorHandler(res, 403, {
                code: 'EMAIL_NOT_VERIFIED',
                message: 'Email is not verified',
            });
        }

        const localUser = await firebaseUserSyncService.syncUser(decodedToken);
        req.user = {
            id: localUser.id.toString(),
            userName: localUser.username,
            firebaseUid: decodedToken.uid,
            email: localUser.email,
            emailVerified: Boolean(decodedToken.email_verified),
            ...(localUser.provider ? { provider: localUser.provider } : {}),
        };

        return next();
    } catch (error) {
        const resolvedError = resolveFirebaseAuthError(error);
        return errorHandler(res, resolvedError.statusCode, {
            code: resolvedError.code,
            message: resolvedError.message,
        });
    }
};

export { checkJwt };