import { User } from "../entities/user.entity";
import { AppDataSource } from "../config/database";
import { User as UserModel } from "../models/user.model";

export class UserService {
    private userRepository = AppDataSource.getRepository(User);

    async createUser(userData: UserModel): Promise<User> {
        const userEntity = this.userRepository.create({
            email: userData.email,
            password: userData.password,
            username: userData.username,
        });
        return await this.userRepository.save(userEntity);
    }
}