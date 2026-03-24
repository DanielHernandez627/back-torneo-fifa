import { DecodedIdToken } from 'firebase-admin/auth';
import { AppDataSource } from '../config/database';
import { User } from '../entities/user.entity';

type SyncUserOptions = {
    preferredUsername?: string;
    requireUsernameForCreation?: boolean;
    updateUsernameIfExisting?: boolean;
};

export class FirebaseUserSyncService {
    private userRepository = AppDataSource.getRepository(User);

    private normalizePreferredUsername(username: string): string {
        return username.trim();
    }

    private async ensureUsernameIsAvailable(username: string, currentUserId?: number) {
        const existing = await this.userRepository.findOne({ where: { username } });
        if (!existing) {
            return;
        }

        if (typeof currentUserId === 'number' && existing.id === currentUserId) {
            return;
        }

        throw {
            statusCode: 409,
            code: 'DUPLICATE_VALUE',
            field: 'username',
            message: `The username '${username}' is already in use`,
        };
    }

    private normalizeUsernameBase(email: string, firebaseUid: string): string {
        const fromEmail = email.split('@')[0]?.trim().toLowerCase() || '';
        const sanitized = fromEmail.replace(/[^a-z0-9._-]/g, '').slice(0, 40);

        if (sanitized.length > 0) {
            return sanitized;
        }

        return `user_${firebaseUid.slice(0, 8)}`;
    }

    private async resolveUniqueUsername(base: string): Promise<string> {
        const normalizedBase = base.slice(0, 60);
        const existsBase = await this.userRepository.exists({ where: { username: normalizedBase } });
        if (!existsBase) {
            return normalizedBase;
        }

        for (let attempt = 1; attempt <= 9999; attempt += 1) {
            const suffix = `_${attempt}`;
            const candidate = `${normalizedBase.slice(0, Math.max(1, 60 - suffix.length))}${suffix}`;
            const exists = await this.userRepository.exists({ where: { username: candidate } });
            if (!exists) {
                return candidate;
            }
        }

        throw new Error('Could not generate a unique username');
    }

    private resolveProvider(decodedToken: DecodedIdToken): string {
        return decodedToken.firebase?.sign_in_provider || 'firebase';
    }

    async syncUser(decodedToken: DecodedIdToken, options?: SyncUserOptions): Promise<User> {
        const firebaseUid = decodedToken.uid;
        const email = decodedToken.email?.trim().toLowerCase();
        const isVerified = Boolean(decodedToken.email_verified);
        const preferredUsernameRaw = options?.preferredUsername;
        const preferredUsername =
            typeof preferredUsernameRaw === 'string' ? this.normalizePreferredUsername(preferredUsernameRaw) : undefined;

        if (options?.requireUsernameForCreation && !preferredUsername) {
            throw {
                statusCode: 400,
                code: 'VALIDATION_ERROR',
                field: 'username',
                message: 'Username is required',
            };
        }

        if (!email) {
            throw new Error('Firebase token does not contain a valid email');
        }

        const existingByFirebaseUid = await this.userRepository.findOne({
            where: { firebaseUid },
        });

        if (existingByFirebaseUid) {
            let shouldSave = false;

            if (existingByFirebaseUid.email !== email) {
                existingByFirebaseUid.email = email;
                shouldSave = true;
            }

            const provider = this.resolveProvider(decodedToken);
            if (existingByFirebaseUid.provider !== provider) {
                existingByFirebaseUid.provider = provider;
                shouldSave = true;
            }

            if (existingByFirebaseUid.isVerified !== isVerified) {
                existingByFirebaseUid.isVerified = isVerified;
                shouldSave = true;
            }

            if (
                options?.updateUsernameIfExisting &&
                preferredUsername &&
                existingByFirebaseUid.username !== preferredUsername
            ) {
                await this.ensureUsernameIsAvailable(preferredUsername, existingByFirebaseUid.id);
                existingByFirebaseUid.username = preferredUsername;
                shouldSave = true;
            }

            if (shouldSave) {
                return this.userRepository.save(existingByFirebaseUid);
            }

            return existingByFirebaseUid;
        }

        const existingByEmail = await this.userRepository.findOne({
            where: { email },
        });

        if (existingByEmail) {
            existingByEmail.firebaseUid = firebaseUid;
            existingByEmail.provider = this.resolveProvider(decodedToken);
            existingByEmail.isVerified = isVerified;

            if (options?.updateUsernameIfExisting && preferredUsername && existingByEmail.username !== preferredUsername) {
                await this.ensureUsernameIsAvailable(preferredUsername, existingByEmail.id);
                existingByEmail.username = preferredUsername;
            }

            return this.userRepository.save(existingByEmail);
        }

        let username: string;
        if (preferredUsername) {
            await this.ensureUsernameIsAvailable(preferredUsername);
            username = preferredUsername;
        } else {
            const usernameBase = this.normalizeUsernameBase(email, firebaseUid);
            username = await this.resolveUniqueUsername(usernameBase);
        }

        const created = this.userRepository.create({
            firebaseUid,
            email,
            username,
            provider: this.resolveProvider(decodedToken),
            isVerified,
        });

        return this.userRepository.save(created);
    }
}
