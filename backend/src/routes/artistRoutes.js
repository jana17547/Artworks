import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { createArtist, updateArtistBiography, getArtists, getArtistDetails } from "../controllers/artistController.js";

const router = express.Router();

router.post("/", verifyToken, createArtist);
router.put("/biography", verifyToken, updateArtistBiography);
router.get('/', getArtists);
// Ruta za preuzimanje detalja umetnika sa svim njegovim delima
router.get('/:id', getArtistDetails);

export default router;
