import prisma from "../utils/prismaClient.js";

export const createCategory = async (req, res) => {
    const { name } = req.body;
    const { role } = req.user; // Dobijamo ulogu korisnika iz tokena
  
    // Proverimo da li korisnik ima ulogu 'ADMIN'
    if (role !== 'ADMIN') {
      return res.status(403).json({ message: "Nemate dozvolu za kreiranje kategorije." });
    }
  
    try {
      const existingCategory = await prisma.category.findUnique({
        where: { name },
      });
  
      if (existingCategory) {
        return res.status(400).json({ message: "Kategorija već postoji." });
      }
  
      const category = await prisma.category.create({
        data: { name },
      });
  
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating category:", error.message);
      res.status(500).json({ error: error.message });
    }
  };
  
  export const getCategories = async (req, res) => {
    try {
      const categories = await prisma.category.findMany();
      res.status(200).json(categories);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };