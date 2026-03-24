export interface AuthenticatedUserModel {
    id: string;
    userName: string;
    firebaseUid: string;
    email: string;
    emailVerified: boolean;
    provider?: string;
}
