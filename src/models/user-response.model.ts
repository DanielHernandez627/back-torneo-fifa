export interface UserResponse {
	id: number;
	username: string;
	email: string;
	firebaseUid: string | null;
	provider: string | null;
	isVerified: boolean;
	createdAt: Date;
	updatedAt: Date;
}