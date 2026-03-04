import { Router } from "express";
import { PhaseController } from "../controllers/phase";
import { checkJwt } from "../middlewares/session";

const phaseRouter = Router();
const phaseController = new PhaseController();

phaseRouter.get("/", checkJwt, phaseController.getAllPhases);
phaseRouter.get("/:id", checkJwt, phaseController.getPhaseById);
phaseRouter.post("/", checkJwt, phaseController.createPhase);
phaseRouter.put("/:id", checkJwt, phaseController.updatePhase);
phaseRouter.delete("/:id", checkJwt, phaseController.deletePhase);

export { phaseRouter };
