import prisma from "../utils/prismaClient.js";

export const createArtist = async (req, res) => {
  const { biography } = req.body;
  const userId = req.userId;

  try {
    const artist = await prisma.artist.create({
      data: {
        userId,
        biography,
      },
    });
    res.status(201).json(artist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Ažuriranje biografije umetnika
export const updateArtistBiography = async (req, res) => {
  const userId = req.user.userId; // Preuzmi ID korisnika iz JWT tokena
  const { biography } = req.body; // Preuzmi biografiju iz tela zahteva

  try {
    const updatedArtist = await prisma.artist.update({
      where: { userId: userId },
      data: { biography: biography },
    });

    res.json(updatedArtist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const getArtists = async (req, res) => {
  try {
    // Pretpostavljamo da želite ime iz povezane `User` tabele
    const artists = await prisma.artist.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true, // Pretpostavljamo da `User` model ima `name` polje
          }
        }
      }
    });

    // Izvlačimo samo potrebne podatke
    const artistNames = artists.map(artist => ({
      id: artist.id,
      name: artist.user.name,
    }));

    res.status(200).json(artistNames);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getArtistDetails = async (req, res) => {
  const { id } = req.params; // Uzimamo ID umetnika iz URL parametara

  try {
    // Pronalaženje umetnika i svih njegovih dela
    const artist = await prisma.artist.findUnique({
      where: { id: Number(id) }, // Pretvaramo ID u broj jer Prisma očekuje broj
      include: {
        Artworks: true, // Ispravka: koristimo "Artworks" umesto "artworks"
        user: true,     // Ako želite da uključite i informacije o korisniku
      },
    });

    if (!artist) {
      return res.status(404).json({ error: 'Umetnik nije pronađen' });
    }

    res.status(200).json(artist);
  } catch (error) {
    console.error('Greška prilikom preuzimanja detalja umetnika:', error);
    res.status(500).json({ error: 'Došlo je do greške prilikom preuzimanja detalja umetnika' });
  }
};
