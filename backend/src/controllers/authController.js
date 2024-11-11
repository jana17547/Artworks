import prisma from "../utils/prismaClient.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ message: "Neispravni kredencijal." });
    }

      // Provera statusa korisnika
      if (user.status === "INACTIVE") {
        return res.status(403).json({ message: "Nalog je neaktivan. Kontaktirajte podršku." });
      }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Neispravni kredencijali." });
    }

    // Proširenje payload-a sa dodatnim informacijama o korisniku
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

    
    // Vraćamo token i korisničke informacije u odgovoru
    res.json({ message: "Login successful", token, user: payload });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
