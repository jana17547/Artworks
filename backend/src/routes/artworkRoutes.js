import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import {
  createArtwork,
  getArtworks,
  getArtworkById,
  updateArtwork,
  deleteArtwork,
  getArtworksByCategory,
  getArtworksByArtist,
  upload
} from "../controllers/artworkController.js";

const router = express.Router();

// router.post("/", verifyToken, createArtwork);
router.post("/", verifyToken, upload.single('image'), createArtwork);

router.get("/", getArtworks);
router.get("/:id", getArtworkById);
// router.put("/:id", verifyToken, updateArtwork);
// router.put("/:id", verifyToken, upload.single('image'), updateArtwork);
router.put("/:id", verifyToken, upload.single('file'), updateArtwork); // upload.single('file') je dodato

router.delete("/:id", verifyToken, deleteArtwork);
router.get("/category/:category", getArtworksByCategory);
router.get("/artist/artworks", verifyToken, getArtworksByArtist);

export default router;
