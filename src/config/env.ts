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

export const env: Env = {
    POSTGRES_HOST: getRequiredEnv('POSTGRES_HOST'),
    POSTGRES_PORT: Number(getRequiredEnv('POSTGRES_PORT')),
    POSTGRES_USER: getRequiredEnv('POSTGRES_USER'),
    POSTGRES_PASSWORD: getRequiredEnv('POSTGRES_PASSWORD'),
    POSTGRES_DB: getRequiredEnv('POSTGRES_DB'),
};

if (Number.isNaN(env.POSTGRES_PORT)) {
    throw new Error('POSTGRES_PORT must be a valid number');
}
