import { Tournament } from "../entities/tournaments.entity";

export interface UserResponse {
	id: number;
	username: string;
	email: string;
	createdAt: Date;
	updatedAt: Date;
}