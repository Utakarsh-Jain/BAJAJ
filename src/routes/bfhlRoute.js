import { Router } from "express";
import { handleHierarchyRequest } from "../controllers/bfhlController.js";

export const bfhlRouter = Router();

bfhlRouter.post("/bfhl", handleHierarchyRequest);
