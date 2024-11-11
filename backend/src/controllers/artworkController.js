import prisma from "../utils/prismaClient.js";
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';


// Definišemo __filename i __dirname za ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/')); // Ispravna putanja za čuvanje slika
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname); // Dodajemo timestamp kao prefiks za naziv fajla
  },
});

const upload = multer({ storage });

// Funkcija za kreiranje umetničkog dela sa uploadom slike
export const createArtwork = async (req, res) => {
  const { title, description, price, category, status } = req.body;
  const userId = req.user.userId;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null; // Sačuvajte putanju slike sa servera

  try {
    // Pronađite umetnika prema userId
    const artist = await prisma.artist.findUnique({
      where: { userId: userId },
    });

    if (!artist) {
      return res.status(403).json({ message: "User is not an artist." });
    }

    // Pronađite kategoriju po nazivu
    const categoryRecord = await prisma.category.findUnique({
      where: { name: category },
    });

    if (!categoryRecord) {
      return res.status(404).json({ message: "Category not found." });
    }

    // Kreirajte umetničko delo sa odgovarajućim categoryId
    const artwork = await prisma.artwork.create({
      data: {
        title,
        description,
        price: parseFloat(price),
        categoryId: categoryRecord.id,
        imageUrl, // Koristite imageUrl za putanju slike sa servera
        status: status.toUpperCase(),
        artistId: artist.id,
      },
    });

    res.status(201).json(artwork);
  } catch (error) {
    console.error("Greška prilikom stvaranja umetničkog dela:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const getArtworksByArtist = async (req, res) => {
  const userId = req.user.userId;

  try {
    const artist = await prisma.artist.findUnique({
      where: { userId: parseInt(userId) },
    });

    if (!artist) {
      return res.status(404).json({ message: "Umetnik nije pronadjen." });
    }

    const artworks = await prisma.artwork.findMany({
      where: {
        artistId: artist.id,
      },
      include: {
        category: true, // Uključujemo relaciju kategorije da bismo dobili sve podatke o kategoriji, uključujući naziv
      },
    });

    // Mapiramo rezultate da prikažemo samo potrebne informacije i proverimo postojanje aktivnih aukcija
    const formattedArtworks = await Promise.all(
      artworks.map(async (artwork) => {
        // Proverite da li postoji aktivni bid (aukcija) za dati artwork na osnovu endDate
        const activeBid = await prisma.bid.findFirst({
          where: {
            artworkId: artwork.id,
            endDate: {
              gt: new Date(), // Proveravamo da li je datum završetka aukcije u budućnosti
            },
          },
        });

        return {
          id: artwork.id,
          title: artwork.title,
          description: artwork.description,
          price: artwork.price,
          category: artwork.category ? artwork.category.name : null,
          imageUrl: artwork.imageUrl,
          status: artwork.status,
          artistId: artwork.artistId,
          createdAt: artwork.createdAt,
          updatedAt: artwork.updatedAt,
          auctionId: activeBid ? activeBid.id : null, // Dodajemo ID aktivne aukcije ako postoji
        };
      })
    );

    res.status(200).json(formattedArtworks);
  } catch (error) {
    console.error("Error fetching artworks by artist:", error.message);
    res.status(500).json({ error: error.message });
  }
};



export const getArtworks = async (req, res) => {
  try {
    const artworks = await prisma.artwork.findMany({
      include: {
        category: true, // Uključujemo relaciju kategorije da bismo dobili sve podatke o kategoriji, uključujući naziv
      },
    });

    // Mapiramo rezultate da prikažemo samo potrebne informacije
    const formattedArtworks = artworks.map((artwork) => ({
      id: artwork.id,
      title: artwork.title,
      description: artwork.description,
      price: artwork.price,
      category: artwork.category ? artwork.category.name : null, // Prikazujemo naziv kategorije ako postoji
      imageUrl: artwork.imageUrl,
      status: artwork.status,
      artistId: artwork.artistId,
      createdAt: artwork.createdAt,
      updatedAt: artwork.updatedAt,
    }));

    res.status(200).json(formattedArtworks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const getArtworkById = async (req, res) => {
  const { id } = req.params;

  try {
    const artwork = await prisma.artwork.findUnique({
      where: { id: parseInt(id) },
      include: {
        category: true, // Uključujemo podatke o kategoriji
      },
    });

    if (!artwork) {
      return res.status(404).json({ message: "Artwork not found" });
    }

    const artworkData = {
      id: artwork.id,
      title: artwork.title,
      description: artwork.description,
      price: artwork.price,
      category: artwork.category ? artwork.category.name : null, // Vraćamo naziv kategorije
      imageUrl: artwork.imageUrl,
      status: artwork.status,
      artistId: artwork.artistId,
      createdAt: artwork.createdAt,
      updatedAt: artwork.updatedAt,
    };

    res.status(200).json(artworkData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Funkcija za ažuriranje umetničkog dela
export const updateArtwork = async (req, res) => {
  const { id } = req.params;
  const { title, description, price, category, status } = req.body;
  const userId = req.user.userId;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : req.body.imageUrl; // Ako je nova slika, uzmi je; inače koristi postojeću

  try {
    // Provera da li umetničko delo postoji
    const artwork = await prisma.artwork.findUnique({
      where: { id: parseInt(id) },
    });

    if (!artwork) {
      return res.status(404).json({ message: "Artwork not found." });
    }

    // Proverimo da li umetnik postoji i da li je povezan sa umetničkim delom
    const artist = await prisma.artist.findUnique({
      where: { id: artwork.artistId },
    });

    if (!artist || artist.userId !== userId) {
      return res.status(403).json({ message: "You do not have permission to update this artwork." });
    }

    // Pronađite kategoriju po nazivu
    const categoryRecord = await prisma.category.findUnique({
      where: { name: category },
    });

    if (!categoryRecord) {
      return res.status(404).json({ message: "Category not found." });
    }

    // Ažuriranje umetničkog dela
    const updatedArtwork = await prisma.artwork.update({
      where: { id: parseInt(id) },
      data: {
        title,
        description,
        price: parseFloat(price),
        categoryId: categoryRecord.id,
        imageUrl, // Koristite novu ili postojeću putanju slike
        status: status.toUpperCase(),
      },
    });

    res.status(200).json(updatedArtwork);
  } catch (error) {
    console.error("Error updating artwork:", error.message);
    res.status(500).json({ error: error.message });
  }
};


export const deleteArtwork = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId; // Koristimo userId iz tokena

  try {
    // Proverimo da li umetničko delo postoji i da li pripada trenutnom korisniku u jednom upitu
    const artwork = await prisma.artwork.findUnique({
      where: { id: parseInt(id) },
      include: {
        artist: true, // Uključimo umetnika da bismo proverili vlasništvo
      },
    });

    if (!artwork) {
      return res.status(404).json({
        message: "Artwork not found.",
      });
    }

    // Proverimo da li je umetničko delo povezano sa trenutnim korisnikom
    if (artwork.artist.userId !== userId) {
      return res.status(403).json({
        message: "You do not have permission to delete this artwork.",
      });
    }

    await prisma.artwork.delete({
      where: { id: parseInt(id) },
    });
    
    res.status(200).json({ message: "Artwork deleted successfully." });
  } catch (error) {
    console.error("Error deleting artwork:", error.message);
    res.status(500).json({ error: error.message });
  }
};

/////////////////////////////////////////////////////////////////////////
export const getArtworksByCategory = async (req, res) => {
  const { category } = req.params;

  try {
    const artworks = await prisma.artwork.findMany({
      where: { category },
    });
    res.status(200).json(artworks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export { upload };
