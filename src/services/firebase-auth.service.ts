import { DecodedIdToken } from 'firebase-admin/auth';
import { admin } from '../config/firebase-admin';

export class FirebaseAuthService {
    async verifyIdToken(idToken: string): Promise<DecodedIdToken> {
        return admin.auth().verifyIdToken(idToken);
    }
}
