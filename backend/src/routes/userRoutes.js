import express from "express";
import {
  createUser,
  getAdminProfile,
  getArtistProfile,
  getUserProfile,
  updateUserProfile,
  deleteUser,
  getAllUsers,
  updateUserStatus,
  createAdmin,
  changePassword,
  getWonProducts,
} from "../controllers/userController.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();
//Ruta za registraciju korisnika
router.post("/register", createUser);

//Ruta za dobijanje svih gorisnika
router.get("/", verifyToken, getAllUsers);

//Dodavanje admina
router.post("/register-admin", verifyToken, createAdmin);

//Rute za profile
router.get("/profile/user", verifyToken, getUserProfile);
router.get("/profile/artist", verifyToken, getArtistProfile);
router.get("/profile/admin", verifyToken, getAdminProfile);

//Rute za azuriranje i brisanje korisnika
router.put("/profile/:id", verifyToken, updateUserProfile);

router.delete("/profile", verifyToken, deleteUser);

//Ruta za azuriranje statusa korisnika
router.patch("/status/:id", verifyToken, updateUserStatus);

router.post('/change-password', verifyToken, changePassword);
router.get('/won-products', verifyToken, getWonProducts);

export default router;
