import { Router } from "express";
import { MatchController } from "../controllers/match";
import { checkJwt } from "../middlewares/session";

const matchesRouter = Router();
const matchController = new MatchController();

matchesRouter.get("/", checkJwt, matchController.getAllMatches);
matchesRouter.get("/:id", checkJwt, matchController.getMatchById);
matchesRouter.post("/", checkJwt, matchController.createMatch);
matchesRouter.put("/:id", checkJwt, matchController.updateMatch);
matchesRouter.delete("/:id", checkJwt, matchController.deleteMatch);

export { matchesRouter };
