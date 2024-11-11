import prisma from "../utils/prismaClient.js";
import { createTransaction } from './transactionController.js';
import { notifyClients } from '../app.js';


// export const createAuction = async (req, res) => {
//   const { artworkId, startingPrice, endDate } = req.body;
//   const userId = req.user.userId;

//   try {
//     // Pronađite umetnika prema korisničkom ID-u
//     const artist = await prisma.artist.findUnique({
//       where: { userId },
//     });

//     if (!artist) {
//       return res.status(403).json({ message: "User is not an artist." });
//     }

//     // Pronađite umetničko delo prema ID-u i ID-u umetnika
//     const artwork = await prisma.artwork.findUnique({
//       where: { id: parseInt(artworkId) },
//       include: {
//         artist: true,
//         category: true,  // Uključujemo kategoriju
//       },
//     });

//     if (!artwork || artwork.artist.id !== artist.id) {
//       return res.status(404).json({ message: "Artwork not found or not owned by artist." });
//     }

//     if (artwork.status !== 'AVAILABLE') {
//       return res.status(400).json({ message: "Artwork is not available for auction." });
//     }

//     const currentDate = new Date();
//     const endAuctionDate = new Date(endDate);

//     if (endAuctionDate <= currentDate) {
//       return res.status(400).json({ message: "End date must be in the future." });
//     }

//     // Provera postojanja aktivnih aukcija za dato umetničko delo
//     const activeAuction = await prisma.bid.findFirst({
//       where: {
//         artworkId: parseInt(artworkId),
//         endDate: {
//           gt: currentDate,
//         },
//       },
//     });

//     if (activeAuction) {
//       return res.status(400).json({ message: "An active auction already exists for this artwork." });
//     }

//     const auction = await prisma.bid.create({
//       data: {
//         artworkId: parseInt(artworkId),
//         startingPrice: parseFloat(startingPrice),
//         currentPrice: parseFloat(startingPrice),
//         endDate: endAuctionDate,
//       },
//     });

//     res.status(201).json(auction);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

export const createAuction = async (req, res) => {
  const { artworkId, startingPrice, endDate } = req.body;
  const userId = req.user.userId;

  try {
    // Pronađite umetnika prema korisničkom ID-u
    const artist = await prisma.artist.findUnique({
      where: { userId },
    });

    if (!artist) {
      return res.status(403).json({ message: "User is not an artist." });
    }

    // Pronađite umetničko delo prema ID-u i ID-u umetnika
    const artwork = await prisma.artwork.findUnique({
      where: { id: parseInt(artworkId) },
      include: {
        artist: true,
        category: true,
      },
    });

    if (!artwork || artwork.artist.id !== artist.id) {
      return res.status(404).json({ message: "Artwork not found or not owned by artist." });
    }

    // Provera statusa umetničkog dela
    if (artwork.status !== 'AVAILABLE' && artwork.status !== 'UNSOLD') {
      return res.status(400).json({ message: "Artwork is not available for auction." });
    }

    const currentDate = new Date();
    const endAuctionDate = new Date(endDate);

    if (endAuctionDate <= currentDate) {
      return res.status(400).json({ message: "End date must be in the future." });
    }

    // Provera postojanja aktivnih aukcija za dato umetničko delo
    const activeAuction = await prisma.bid.findFirst({
      where: {
        artworkId: parseInt(artworkId),
        endDate: {
          gt: currentDate,
        },
        currentPrice: {
          not: null, // Provera da li je aukcija aktivna
        },
      },
    });

    if (activeAuction) {
      return res.status(400).json({ message: "An active auction already exists for this artwork." });
    }

    // Kreiraj novu aukciju
    const auction = await prisma.bid.create({
      data: {
        artworkId: parseInt(artworkId),
        startingPrice: parseFloat(startingPrice),
        currentPrice: parseFloat(startingPrice),
        endDate: endAuctionDate,
      },
    });

    // Ažuriranje statusa umetničkog dela na UNSOLD ili neki odgovarajući status
    await prisma.artwork.update({
      where: { id: parseInt(artworkId) },
      data: { status: "AVAILABLE" },
    });

    res.status(201).json(auction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const getAuctionDetails = async (req, res) => {
  const { id } = req.params;

  try {
    const auction = await prisma.bid.findUnique({
      where: { id: parseInt(id) },
      include: {
        artwork: {
          include: {
            category: true, // Učitavanje kategorije umetničkog dela
          },
        },
        BidHistory: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!auction) {
      return res
        .status(404)
        .json({ message: "Auction not found or has ended." });
    }

    res.status(200).json(auction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Provera aktivne aukcije za određeno umetničko delo
export const checkActiveAuction = async (req, res) => {
  const { artworkId } = req.params;

  try {
    const currentDate = new Date();

    const activeAuction = await prisma.bid.findFirst({
      where: {
        artworkId: parseInt(artworkId),
        endDate: {
          gt: currentDate,
        },
      },
    });

    res.status(200).json({ activeAuction: !!activeAuction });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Metoda za dobijanje svih aukcija sa detaljima o umetničkom delu
export const getAllAuctions = async (req, res) => {
  try {
    const auctions = await prisma.bid.findMany({
      include: {
        artwork: {
          include: {
            category: true,  // Učitavanje kategorije umetničkog dela
          },
        },
      },
      orderBy: {
        endDate: "asc",
      },
    });

    res.status(200).json(auctions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

////////////////////////////////////////////

// Funkcija za postavljanje ponude
// export const placeBid = async (req, res) => {
//   const { artworkId, bidAmount } = req.body;
//   const userId = req.user.userId;

//   console.log("Request Body:", req.body);
//   console.log("User ID:", userId);

//   if (!artworkId || !bidAmount) {
//     console.log("Invalid input data.");
//     return res.status(400).json({ message: "Invalid input data." });
//   }

//   try {
//     const auction = await prisma.bid.findFirst({
//       where: { artworkId },
//     });

//     console.log("Auction found:", auction);

//     if (!auction || new Date(auction.endDate) < new Date()) {
//       console.log("Auction not found or has ended.");
//       return res.status(400).json({ message: "Auction not found or has ended." });
//     }

//     if (bidAmount <= auction.currentPrice) {
//       console.log("Bid amount must be higher than the current price.");
//       return res.status(400).json({ message: "Bid amount must be higher than the current price." });
//     }

//     const newBid = await prisma.bidHistory.create({
//       data: {
//         bidId: auction.id,
//         userId,
//         bidAmount: parseFloat(bidAmount), 
//       },
//     });

//     console.log("New Bid:", newBid);

//     await prisma.bid.update({
//       where: { id: auction.id },
//       data: { currentPrice: parseFloat(bidAmount) },
//     });

//     // Pronađi sve ponude nakon ažuriranja
//     const updatedAuction = await prisma.bid.findUnique({
//       where: { id: auction.id },
//       include: {
//         BidHistory: {
//           include: {
//             user: true, // Uključuje podatke o korisnicima koji su napravili ponude
//           },
//           orderBy: {
//             bidTime: 'desc' // Redosled ponuda po vremenu
//           }
//         },
//       },
//     });

//     console.log("Updated Auction with Bid History:", updatedAuction);

//     // Kreiranje notifikacija za sve korisnike osim trenutnog koji je postavio ponudu
//     const usersToNotify = updatedAuction.BidHistory
//       .filter(bid => bid.user.id !== userId)
//       .map(bid => bid.user);

//     for (const user of usersToNotify) {
//       await prisma.notification.create({
//         data: {
//           userId: user.id,
//           artworkId: artworkId,
//           message: `Novi bid je postavljen na umetničko delo na kojem ste i vi licitirali.`,
//         },
//       });
//     }


//     res.status(201).json(newBid);
//   } catch (error) {
//     console.log("Error in placeBid:", error);
//     res.status(500).json({ error: error.message });
//   }
// };

export const placeBid = async (req, res) => {
  const { artworkId, bidAmount } = req.body;
  const userId = req.user.userId;

  // console.log("Request Body:", req.body);
  // console.log("User ID:", userId);

  if (!artworkId || !bidAmount) {
    console.log("Nevažeći ulazni podaci.");
    return res.status(400).json({ message: "Nevažeći ulazni podaci." });
  }

  try {
    // Pronađi umetničko delo kako bi se proverio vlasnik
      // Provera vlasništva umetničkog dela
      const artwork = await prisma.artwork.findUnique({
        where: { id: artworkId },
        select: {
          artist: {
            select: {
              userId: true // Korisnički ID umetnika
            }
          }
        }
      });

    if (!artwork) {
      console.log("Umetničko delo nije pronađeno.");
      return res.status(404).json({ message: "Umetničko delo nije pronađeno." });
    }

    // Provera da li je korisnik umetnik umetničkog dela
    if (artwork.artist.userId === userId) {
      return res.status(403).json({ message: "Ne možete dati ponudu za svoje umetničko delo." });
    }

//     console.log("User ID from token:", userId);
// console.log("Artist ID of artwork:", artwork.artistId);


    const auction = await prisma.bid.findFirst({
      where: { artworkId },
    });

    // console.log("Auction found:", auction);

    if (!auction || new Date(auction.endDate) < new Date()) {
      console.log("Aukcija nije pronađena ili je završena.");
      return res.status(400).json({ message: "Aukcija nije pronađena ili je završena." });
    }

    if (bidAmount <= auction.currentPrice) {
      console.log("Iznos ponude mora biti veći od trenutne cene.");
      return res.status(400).json({ message: "Iznos ponude mora biti veći od trenutne cene." });
    }

    const newBid = await prisma.bidHistory.create({
      data: {
        bidId: auction.id,
        userId,
        bidAmount: parseFloat(bidAmount),
      },
    });

    // console.log("New Bid:", newBid);

    await prisma.bid.update({
      where: { id: auction.id },
      data: { currentPrice: parseFloat(bidAmount) },
    });

    // Pronađi sve ponude nakon ažuriranja
    const updatedAuction = await prisma.bid.findUnique({
      where: { id: auction.id },
      include: {
        BidHistory: {
          include: {
            user: true,
          },
          orderBy: {
            bidTime: 'desc',
          },
        },
      },
    });

    // console.log("Updated Auction with Bid History:", updatedAuction);

    // Kreiranje notifikacija za sve korisnike osim trenutnog koji je postavio ponudu
    const usersToNotify = updatedAuction.BidHistory
      .filter(bid => bid.user.id !== userId)
      .map(bid => bid.user);

    for (const user of usersToNotify) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          artworkId: artworkId,
          message: `Nova ponuda je postavljena za umetničko delo na kojem ste i vi licitirali.`,
        },
      });
    }

    res.status(201).json(newBid);
  } catch (error) {
    console.log("Error in placeBid:", error);
    res.status(500).json({ error: error.message });
  }
};


//Ponude za umetnicko delo
export const getBidsForArtwork = async (req, res) => {
  const { artworkId } = req.params;

  try {
    const bids = await prisma.bidHistory.findMany({
      where: { bid: { artworkId: parseInt(artworkId) } },
      include: {
        user: true,
      },
      orderBy: {
        bidTime: "desc",
      },
    });

    res.status(200).json(bids);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/////////////ADMIN-prosireno//////////////

// Vrati sve aukcije
export const getAllAuctions1 = async (req, res) => {
  const { status, category, sortBy } = req.query;

  // console.log("Query Params:", { status, category, sortBy });

  // Definisanje filtera i uslova za sortiranje
  const filterConditions = {};
  const orderConditions = [];

  if (status || category) {
    filterConditions.artwork = {};
    if (status) {
      filterConditions.artwork.status = status.toUpperCase();
    }
    if (category) {
      filterConditions.artwork.category = category;
    }
  }

  if (sortBy) {
    const [field, order] = sortBy.split('_');
    orderConditions.push({ [field]: order.toLowerCase() });
  } else {
    orderConditions.push({ endDate: 'asc' });
  }

  try {
    const auctions = await prisma.bid.findMany({
      where: filterConditions,
      include: {
        artwork: true,
      },
      orderBy: orderConditions,
    });

    // console.log("Fetched Auctions:", auctions);

    res.status(200).json(auctions);
  } catch (error) {
    console.error("Error fetching auctions:", error);
    res.status(500).json({ error: error.message });
  }
};

export const updateAuction = async (req, res) => {
  const { id } = req.params;
  const { artworkId, startingPrice, endDate, status } = req.body;

  try {
    const auction = await prisma.bid.update({
      where: { id: parseInt(id) },
      data: {
        artworkId: parseInt(artworkId),
        startingPrice: parseFloat(startingPrice),
        endDate: new Date(endDate),
        status: status, // Dodajte polje status ako je potrebno
      },
    });

    res.status(200).json(auction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Metoda za brisanje aukcije
export const deleteAuction = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.bid.delete({
      where: { id: parseInt(id) },
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getBidsForAuction = async (req, res) => {
  const { id } = req.params;

  try {
    const bids = await prisma.bidHistory.findMany({
      where: { bidId: parseInt(id) },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        bidTime: "desc",
      },
    });

    res.status(200).json(bids);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Funkcija za proveru isteka aukcija
export const checkExpiredAuctions = async () => {
  try {
    const now = new Date();

    const expiredAuctions = await prisma.bid.findMany({
      where: {
        endDate: {
          lte: now,
        },
        currentPrice: {
          not: null,
        },
      },
      include: {
        BidHistory: {
          orderBy: {
            bidAmount: "desc",
          },
          take: 1,
          include: {
            user: true,
          },
        },
        artwork: true,
      },
    });

    for (const auction of expiredAuctions) {
      const winner = auction.BidHistory[0]?.user;

      if (winner) {
        let shoppingCart = await prisma.shoppingCart.findUnique({
          where: {
            userId: winner.id,
          },
        });

        if (!shoppingCart) {
          shoppingCart = await prisma.shoppingCart.create({
            data: {
              userId: winner.id,
            },
          });
        }

        await prisma.transaction.create({
          data: {
            buyerId: winner.id,
            artworkId: auction.artwork.id,
            amount: auction.currentPrice,
          },
        });

        await prisma.artwork.update({
          where: { id: auction.artwork.id },
          data: { status: "SOLD" },
        });

        await prisma.cartItem.create({
          data: {
            cartId: shoppingCart.id,
            artworkId: auction.artwork.id,
            quantity: 1,
          },
        });
        // Notifikacija za pobednika
        await prisma.notification.create({
          data: {
            userId: winner.id,
            artworkId: auction.artwork.id,
            message: `Čestitamo! Pobedili ste na aukciji za umetničko delo "${auction.artwork.title}". Autor će vas uskoro kontaktirati radi daljeg dogovora o preuzimanju.`,
          },
        });

        // Notifikacije za ostale korisnike koji su licitirali, a nisu pobedili
        const losingUsers = await prisma.bidHistory.findMany({
          where: {
            bidId: auction.id,
            userId: {
              not: winner.id,
            },
          },
          distinct: ['userId'],
          include: {
            user: true,
          },
        });

        for (const losingUser of losingUsers) {
          await prisma.notification.create({
            data: {
              userId: losingUser.user.id,
              artworkId: auction.artwork.id,
              message: `Nažalost, niste pobedili na aukciji za umetničko delo "${auction.artwork.title}".`,
            },
          });
        }
      } else {
        await prisma.artwork.update({
          where: { id: auction.artwork.id },
          data: { status: "UNSOLD" },
        });

         // Notifikacije za sve korisnike da aukcija nije imala pobednika
         const bidders = await prisma.bidHistory.findMany({
          where: {
            bidId: auction.id,
          },
          distinct: ['userId'],
          include: {
            user: true,
          },
        });

        for (const bidder of bidders) {
          await prisma.notification.create({
            data: {
              userId: bidder.user.id,
              artworkId: auction.artwork.id,
              message: `Aukcija za umetničko delo "${auction.artwork.title}" je završena bez pobednika.`,
            },
          });
        }
      }

      await prisma.bid.update({
        where: { id: auction.id },
        data: { currentPrice: null },
      });

     
    }

    // console.log("Provera isteka aukcija je uspešno izvršena.");
  } catch (error) {
    console.error("Greška prilikom provere isteka aukcija:", error);
  }
};

// Funkcija za dodavanje umetničkog dela u korpu pobednika
const addItemToCart = async (userId, artworkId) => {
  try {
    const cart = await prisma.shoppingCart.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
      },
    });

    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        artworkId,
        quantity: 1
      },
    });
    // console.log(`Umetničko delo ID ${artworkId} dodato u korpu korisnika ID ${userId}.`);
  } catch (error) {
    console.error('Greška prilikom dodavanja u korpu:', error);
  }
};

export const getActiveAuctions = async (req, res) => {
  try {
    const activeAuctions = await prisma.bid.findMany({
      where: {
        endDate: {
          gt: new Date() // Prikaži aukcije koje još uvek nisu istekle
        },
        currentPrice: {
          not: null // Aukcija mora imati bar jednu ponudu
        }
      },
      include: {
        artwork: true,
        BidHistory: true
      }
    });

    res.status(200).json(activeAuctions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};