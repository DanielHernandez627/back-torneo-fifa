import {hash,compare} from 'bcryptjs';

const encrypt = async (password: string) => {
    const hashedPassword = await hash(password, 10);
    return hashedPassword;
};

const verify = async (password: string, hashedPassword: string) => {
    const isMatch = await compare(password, hashedPassword);
    return isMatch;
};

export { encrypt, verify };