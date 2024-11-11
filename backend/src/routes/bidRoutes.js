import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { checkExpiredAuctions } from '../controllers/bidController.js';
import {
  createAuction,
  getAuctionDetails,
  getBidsForArtwork,
  placeBid,
  getAllAuctions,
  checkActiveAuction,
  getAllAuctions1,
  updateAuction,
  deleteAuction,
  getBidsForAuction
} from "../controllers/bidController.js";

const router = express.Router();

//Postavljanje licitacije
router.post("/auction", verifyToken, createAuction);

// Ruta za proveru isteka aukcija
router.get('/checkExpired', checkExpiredAuctions);

//Ponudjivanje
router.post("/placeBid", verifyToken, placeBid);

//Detalji licitacije
router.get("/auction/:id", getAuctionDetails);

//Ponude za umetnicko delo
router.get("/artwork/:artworkId/bids", getBidsForArtwork);

//Vrati sve aukcije
router.get("/auctions", getAllAuctions);



// Provera aktivne aukcije za umetničko delo
router.get("/artwork/:artworkId/active-auction", verifyToken, checkActiveAuction);

//ADMIN
router.get('/all-auctions', getAllAuctions1);
// Nova ruta za ažuriranje aukcije
router.put('/auctions/:id', updateAuction);

// Nova ruta za brisanje aukcije
router.delete('/auctions/:id', deleteAuction);

// Nova ruta za dobavljanje ponuda za aukciju
router.get('/auctions/:id/bids', getBidsForAuction);

router.get('/checkExpired', async (req, res) => {
  try {
    await checkExpiredAuctions();
    res.status(200).json({ message: "Provera isteka aukcija je uspešno završena." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
