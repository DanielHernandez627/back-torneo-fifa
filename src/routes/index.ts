import { Router } from "express";
import { readdirSync } from "fs";

const PATH_ROUTES = `${__dirname}`;
const router = Router();

const cleanFileName = (file: string) => file.split(".").shift();

readdirSync(PATH_ROUTES).forEach((file) => {
    const fileName = cleanFileName(file);
    if (fileName && fileName !== "index") {
        try {
            const module = require(`./${fileName}`);
            console.log(`Registering route: /${fileName}`);
            router.use(`/${fileName}`, module[`${fileName}Router`]);
        } catch (error) {
            console.error(`Error loading route: /${fileName}`, error);
        }
    }
});

export { router };