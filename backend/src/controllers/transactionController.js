import prisma from "../utils/prismaClient.js";

// Metoda za kreiranje transakcije
export const createTransaction = async (buyerId, artworkId, amount) => {
  try {
    const transaction = await prisma.transaction.create({
      data: {
        buyerId,
        artworkId,
        amount,
      },
    });
    // console.log(`Transakcija kreirana za korisnika ID ${buyerId} i umetničko delo ID ${artworkId}.`);
    return transaction;
  } catch (error) {
    console.error('Greška prilikom kreiranja transakcije:', error);
    throw new Error('Error creating transaction: ' + error.message);
  }
};

// Metoda za vraćanje svih transakcija
export const getAllTransactions = async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      include: {
        buyer: true,
        artwork: true,
      }
    });
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
