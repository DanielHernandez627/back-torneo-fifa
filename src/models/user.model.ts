import { Auth } from './auth.model';

export interface User extends Auth {
    username: string;
}