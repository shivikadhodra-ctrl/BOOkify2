import express from "express";
import { requireAuth } from "@clerk/express";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import { createRoom, getRooms, toggleRoomAvailability, getOwnerRooms, } from "../controllers/roomController.js";

const roomRouter = express.Router();

roomRouter.post("/", upload.array("images", 5), requireAuth(), protect, createRoom);
roomRouter.get("/", getRooms);
roomRouter.get("/owner", requireAuth(), protect, getOwnerRooms);
roomRouter.post("/toggle-availability", requireAuth(), protect, toggleRoomAvailability);

export default roomRouter;
