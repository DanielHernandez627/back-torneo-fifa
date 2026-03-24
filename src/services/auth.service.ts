import { env } from '../config/env';
import { AuthenticatedUserModel } from '../models/authenticated-user.model';
import { User } from '../entities/user.entity';
import { FirebaseAuthService } from './firebase-auth.service';
import { FirebaseUserSyncService } from './firebase-user-sync.service';

type AuthFailure = {
    statusCode: number;
    code: string;
    message: string;
};

export class AuthService {
    private firebaseAuthService = new FirebaseAuthService();
    private firebaseUserSyncService = new FirebaseUserSyncService();

    private resolveFirebaseAuthError(errorRaw: unknown): AuthFailure {
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
    }

    private getBearerToken(authorization?: string): string {
        if (!authorization) {
            throw {
                statusCode: 401,
                code: 'TOKEN_MISSING',
                message: 'Missing or invalid Authorization Bearer token',
            } satisfies AuthFailure;
        }

        const [scheme, token] = authorization.split(' ');
        if (scheme !== 'Bearer' || !token) {
            throw {
                statusCode: 401,
                code: 'TOKEN_MISSING',
                message: 'Missing or invalid Authorization Bearer token',
            } satisfies AuthFailure;
        }

        return token;
    }

    private mapAuthenticatedUser(localUser: User, firebaseUid: string, emailVerified: boolean): AuthenticatedUserModel {
        return {
            id: localUser.id.toString(),
            userName: localUser.username,
            firebaseUid,
            email: localUser.email,
            emailVerified,
            ...(localUser.provider ? { provider: localUser.provider } : {}),
        };
    }

    private async verifyFirebaseAuthorization(authorizationHeader: string | undefined, requireEmailVerified = true) {
        const token = this.getBearerToken(authorizationHeader);
        const decodedToken = await this.firebaseAuthService.verifyIdToken(token);

        if (requireEmailVerified && env.FIREBASE_ENFORCE_EMAIL_VERIFIED && !decodedToken.email_verified) {
            throw {
                statusCode: 403,
                code: 'EMAIL_NOT_VERIFIED',
                message: 'Email is not verified',
            } satisfies AuthFailure;
        }

        return decodedToken;
    }

    async loginWithFirebaseToken(authorizationHeader?: string): Promise<AuthenticatedUserModel> {
        try {
            const decodedToken = await this.verifyFirebaseAuthorization(authorizationHeader);
            const localUser = await this.firebaseUserSyncService.syncUser(decodedToken);
            return this.mapAuthenticatedUser(localUser, decodedToken.uid, Boolean(decodedToken.email_verified));
        } catch (error) {
            if (typeof (error as Partial<AuthFailure>)?.statusCode === 'number') {
                throw error;
            }

            throw this.resolveFirebaseAuthError(error);
        }
    }

    async registerWithFirebaseToken(authorizationHeader: string | undefined, username: string): Promise<AuthenticatedUserModel> {
        const normalizedUsername = username.trim();
        if (!normalizedUsername) {
            throw {
                statusCode: 400,
                code: 'VALIDATION_ERROR',
                field: 'username',
                message: 'Username is required',
            };
        }

        try {
            const decodedToken = await this.verifyFirebaseAuthorization(authorizationHeader, false);
            const localUser = await this.firebaseUserSyncService.syncUser(decodedToken, {
                preferredUsername: normalizedUsername,
                requireUsernameForCreation: true,
                updateUsernameIfExisting: true,
            });

            return this.mapAuthenticatedUser(localUser, decodedToken.uid, Boolean(decodedToken.email_verified));
        } catch (error) {
            if (typeof (error as Partial<AuthFailure>)?.statusCode === 'number') {
                throw error;
            }

            throw this.resolveFirebaseAuthError(error);
        }
    }
}
