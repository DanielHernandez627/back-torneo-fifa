import { User } from "../entities/user.entity";
import { AppDataSource } from "../config/database";
import { User as UserModel } from "../models/user.model";
import { UserResponse } from "../models/user-response.model";

export class UserService {
    private userRepository = AppDataSource.getRepository(User);

    private toUserResponse(user: User): UserResponse {
        return {
            id: user.id,
            username: user.username,
            email: user.email,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }

    async getUserById(id: number): Promise<UserResponse> {
        const user = await this.userRepository.findOneBy({ id });
        if (!user) {
            throw new Error("User not found");
        }
        return this.toUserResponse(user);
    }

    async getAllUsers(): Promise<UserResponse[]> {
        const users = await this.userRepository.find();
        return users.map((user) => this.toUserResponse(user));
    }

    async createUser(userData: UserModel): Promise<UserResponse> {
        const userEntity = this.userRepository.create({
            email: userData.email,
            password: userData.password,
            username: userData.username,
        });
        const savedUser = await this.userRepository.save(userEntity);
        return this.toUserResponse(savedUser);
    }

    async updateUser(id: number, userData: Partial<UserModel>): Promise<UserResponse> {
        const user = await this.userRepository.findOneBy({ id });
        if (!user) {
            throw new Error("User not found");
        }
        if (userData.email) user.email = userData.email;
        if (userData.password) user.password = userData.password;
        if (userData.username) user.username = userData.username;

        const updatedUser = await this.userRepository.save(user);
        return this.toUserResponse(updatedUser);
    }

    async deleteUser(id: number): Promise<void> {
        const user = await this.userRepository.findOneBy({ id });
        if (!user) {
            throw new Error("User not found");
        }
        await this.userRepository.remove(user);
    }

    async existsByEmailOrUsername(email?: string, username?: string): Promise<boolean> {
        const whereConditions = [];
        if (email) whereConditions.push({ email });
        if (username) whereConditions.push({ username });

        if (whereConditions.length === 0) return false;

        const count = await this.userRepository.count({ where: whereConditions });
        return count > 0;
    }

    async isUsernameAvailable(username: string): Promise<boolean> {
        const normalizedUsername = username.trim();
        if (!normalizedUsername) {
            throw new Error("Username is required");
        }

        const exists = await this.userRepository.exists({ where: { username: normalizedUsername } });
        return !exists;
    }
}