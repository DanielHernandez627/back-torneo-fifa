import { config } from 'dotenv';
import { Env } from '../env.model';

config();

const getRequiredEnv = (name: keyof Env): string => {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
};

const getOptionalEnv = (name: keyof Env): string | undefined => {
    const value = process.env[name];
    if (!value) {
        return undefined;
    }

    return value;
};

const parseBooleanEnv = (value: string | undefined, defaultValue: boolean): boolean => {
    if (typeof value === 'undefined') {
        return defaultValue;
    }

    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') {
        return true;
    }
    if (normalized === 'false') {
        return false;
    }

    throw new Error(`Invalid boolean value: ${value}`);
};

const firebaseProjectId = getOptionalEnv('FIREBASE_PROJECT_ID');
const firebaseClientEmail = getOptionalEnv('FIREBASE_CLIENT_EMAIL');
const firebasePrivateKey = getOptionalEnv('FIREBASE_PRIVATE_KEY');
const firebaseServiceAccountPath = getOptionalEnv('FIREBASE_SERVICE_ACCOUNT_PATH');

export const env: Env = {
    POSTGRES_HOST: getRequiredEnv('POSTGRES_HOST'),
    POSTGRES_PORT: Number(getRequiredEnv('POSTGRES_PORT')),
    POSTGRES_USER: getRequiredEnv('POSTGRES_USER'),
    POSTGRES_PASSWORD: getRequiredEnv('POSTGRES_PASSWORD'),
    POSTGRES_DB: getRequiredEnv('POSTGRES_DB'),
    ...(firebaseProjectId ? { FIREBASE_PROJECT_ID: firebaseProjectId } : {}),
    ...(firebaseClientEmail ? { FIREBASE_CLIENT_EMAIL: firebaseClientEmail } : {}),
    ...(firebasePrivateKey ? { FIREBASE_PRIVATE_KEY: firebasePrivateKey } : {}),
    ...(firebaseServiceAccountPath ? { FIREBASE_SERVICE_ACCOUNT_PATH: firebaseServiceAccountPath } : {}),
    FIREBASE_ENFORCE_EMAIL_VERIFIED: parseBooleanEnv(getOptionalEnv('FIREBASE_ENFORCE_EMAIL_VERIFIED'), true),
};

if (Number.isNaN(env.POSTGRES_PORT)) {
    throw new Error('POSTGRES_PORT must be a valid number');
}