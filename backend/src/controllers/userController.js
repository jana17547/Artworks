import prisma from "../utils/prismaClient.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Kreiranje korisnika i shoping cart
export const createUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  // HASH THE PASSWORD
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        status: "ACTIVE", // Defaultni status
      },
    });

    // CREATE A NEW ARTIST ENTRY IF THE ROLE IS 'ARTIST'
    if (role === "ARTIST") {
      await prisma.artist.create({
        data: {
          userId: user.id,
          biography: null, // Initial biography is set to null
        },
      });
    }

    // AUTOMATICALLY CREATE A SHOPPING CART FOR THE USER
    await prisma.shoppingCart.create({
      data: {
        userId: user.id,
      },
    });

    //AUTOMATIC LOGIN AFTER REGISTRATION
    const payload = {
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn: "3h" });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
    // Vraćamo token u odgovoru
    res
      .status(201)
      .json({ message: "User created and logged in successfully", token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Dohvatanje svih korisnika
export const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Dohvatanje korisničkog profila
export const getUserProfile = async (req, res) => {
  const userId = req.user.userId;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });
    if (!user) {
      return res.status(404).json({ message: "Buyer not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



// Dohvatanje profila umetnika
export const getArtistProfile = async (req, res) => {
  const userId = req.user.userId;
  try {
    const artist = await prisma.artist.findUnique({
      where: { userId },
      select: {
        id: true,
        biography: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
    if (!artist) {
      return res.status(404).json({ message: "Artist not found" });
    }
    res.json(artist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Dohvatanje profila admina
export const getAdminProfile = async (req, res) => {
  const userId = req.user.userId;
  try {
    const admin = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });
    res.json(admin);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// Ažuriranje korisničkog profila
export const updateUserProfile = async (req, res) => {
  const { id } = req.params; // Izvuci ID korisnika iz URL-a
  const { name, email, status } = req.body;

  try {
    const data = { name, email, status };

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) }, // Koristi ID iz URL-a
      data,
    });

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Brisanje korisničkog naloga
export const deleteUser = async (req, res) => {
  const { id } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { id: id },
      include: { Artist: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.role === "ARTIST" && user.Artist) {
      // Brisanje svih umetničkih dela korisnika
      await prisma.artwork.deleteMany({
        where: { artistId: user.Artist.id },
      });

      // Brisanje umetnika
      await prisma.artist.delete({
        where: { userId: id },
      });
    }

    // Brisanje korisnika
    await prisma.user.delete({
      where: { id: id },
    });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Promena statusa korisnika
export const updateUserStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // Očekujemo da se prosledi status iz frontenda

  try {
    // Ažurirajte korisnika sa prosleđenim statusom
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { status },
    });

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Kreiranje admina
export const createAdmin = async (req, res) => {
  const { name, email, password } = req.body;

  // Hashovanje lozinke
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const admin = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "ADMIN",
        status: "ACTIVE",
      },
    });

    res.status(201).json({ message: "Admin created successfully", admin });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Funkcija za promenu lozinke
export const changePassword = async (req, res) => {
  const { email, oldPassword, newPassword, confirmNewPassword } = req.body;

  try {
    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: 'Nova lozinka i potvrda lozinke se ne poklapaju' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ message: 'Korisnik nije pronađen' });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Pogrešna stara lozinka' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    res.json({ message: 'Lozinka je uspešno promenjena' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Greška na serveru' });
  }
};

export const getWonProducts = async (req, res) => {
  const userId = req.user.userId; // Preuzimanje korisničkog ID iz tokena

  try {
    const wonProducts = await prisma.transaction.findMany({
      where: { buyerId: userId },
      include: {
        artwork: {
          include: {
            category: true, // Uključivanje kategorije umetničkog dela
          },
        },
      },
    });

    res.status(200).json(wonProducts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};