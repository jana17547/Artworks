import prisma from "../utils/prismaClient.js";

// Kreiranje notifikacije
export const createNotification = async (req, res) => {
  const { userId, artworkId, message } = req.body;

  try {
    // Pronađite naziv umetničkog dela
    const artwork = await prisma.artwork.findUnique({
      where: { id: parseInt(artworkId) },
      select: { title: true }, // Odaberite samo naslov dela
    });

    if (!artwork) {
      return res.status(404).json({ message: "Umetničko delo nije pronađeno." });
    }

    // Ažurirajte poruku da uključuje naziv umetničkog dela
    const fullMessage = `Nova licitacija za "${artwork.title}": ${message}`;

    const notification = await prisma.notification.create({
      data: {
        userId,
        artworkId,
        message: fullMessage,
      },
    });

    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Ažuriranje notifikacije
export const updateNotification = async (req, res) => {
  const { id } = req.params;
  const { isRead } = req.body;

  try {
    const notification = await prisma.notification.update({
      where: { id: parseInt(id) },
      data: { isRead },
    });

    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Brisanje notifikacije
export const deleteNotification = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.notification.delete({
      where: { id: parseInt(id) },
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUnreadNotifications = async (req, res) => {
  const { userId } = req.params;

  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId: parseInt(userId),
        isRead: false,
      },
      include: {
        artwork: {
          select: { title: true }, // Dodajemo naziv umetničkog dela
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!notifications) {
      return res.status(404).json({ message: "Nema pronađenih notifikacija." });
    }

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};