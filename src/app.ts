import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { conectBD } from './config/config';

dotenv.config();
const PORT = process.env.PORT || 3000;
const app = express();
app.use(cors());
app.use(express.json());

async function bootstrap(): Promise<void> {
    try {
        await conectBD();
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Error connecting to database', error);
        process.exit(1);
    }
}

bootstrap();