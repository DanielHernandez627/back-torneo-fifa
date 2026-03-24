import fs from 'fs';
import admin from 'firebase-admin';
import { env } from './env';

type ServiceAccountFile = {
    project_id: string;
    client_email: string;
    private_key: string;
};

const readServiceAccountFile = (serviceAccountPath: string) => {
    const raw = fs.readFileSync(serviceAccountPath, 'utf-8');
    const parsed = JSON.parse(raw) as ServiceAccountFile;

    if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT_PATH does not include required fields');
    }

    return {
        projectId: parsed.project_id,
        clientEmail: parsed.client_email,
        privateKey: parsed.private_key,
    };
};

const resolveFirebaseCredentials = () => {
    if (env.FIREBASE_SERVICE_ACCOUNT_PATH) {
        return readServiceAccountFile(env.FIREBASE_SERVICE_ACCOUNT_PATH);
    }

    if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_CLIENT_EMAIL || !env.FIREBASE_PRIVATE_KEY) {
        throw new Error(
            'Missing Firebase credentials. Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY',
        );
    }

    return {
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
};

const initializeFirebaseAdmin = () => {
    if (admin.apps.length > 0) {
        return admin.app();
    }

    const { projectId, clientEmail, privateKey } = resolveFirebaseCredentials();

    return admin.initializeApp({
        credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
        }),
    });
};

initializeFirebaseAdmin();

export { admin };
