import { verify } from "../utilities/bycrypt.handler";
import { User } from "../entities/user.entity";
import { AppDataSource } from "../config/database";
import { generateToken } from "../utilities/jwt.handler";
export class AuthService {
    private userRepository = AppDataSource.getRepository(User);

    async verifyExistUser(email: string): Promise<User | null> {
        const user = await this.userRepository.findOneBy({ email });
        return user;
    }

    async login(email: string, password: string): Promise<string> {
        const user = await this.verifyExistUser(email);
        if (!user) {
            throw new Error("User not found");
        }

        const isPasswordValid = await verify(password, user.password);

        if (!isPasswordValid) {
            throw new Error("Invalid password");
        }

        return generateToken(user.id.toString(), user.username);
    }
}