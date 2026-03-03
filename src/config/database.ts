import { DataSource } from 'typeorm';
import { env } from './env';

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: env.POSTGRES_HOST,
    port: env.POSTGRES_PORT,
    username: env.POSTGRES_USER,
    password: env.POSTGRES_PASSWORD,
    database: env.POSTGRES_DB,
    entities: ['src/entities/**/*.ts'],
    migrations: ['src/migrations/**/*.ts'],
    synchronize: false,
    logging: true,
});

export async function conectBD(): Promise<void> {
    if (AppDataSource.isInitialized) {
        return;
    }

    await AppDataSource.initialize();
    console.log('PostgreSQL connected');
}
