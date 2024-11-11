import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import artworkRoutes from "./routes/artworkRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import artistRoutes from "./routes/artistRoutes.js";
import bidRoutes from "./routes/bidRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import transactionRoutes from './routes/transactionRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js'; // Ruta za notifikacije
import cron from 'node-cron';
import { checkExpiredAuctions } from './controllers/bidController.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import { WebSocketServer } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();

// Konfiguracija CORS-a
const corsOptions = {
  origin: "http://localhost:3000", // Dozvoljen origin
  credentials: true, // Dozvoljava slanje kolačića i drugih poverljivih podataka
};

app.use(cors(corsOptions));

// Ručno postavljanje CORS zaglavlja
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT,DELETE");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  next();
});

app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/artworks", artworkRoutes);
app.use("/api/artists", artistRoutes);
app.use("/api/bid", bidRoutes);
app.use("/api/categories", categoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/notifications', notificationRoutes); // Dodana ruta za notifikacije

const PORT = process.env.PORT || 5000;

// Kreiraj HTTP server iz Express aplikacije
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Kreiraj WebSocket server
const wss = new WebSocketServer({ server });

// Logujte greške prilikom pokretanja WebSocket servera
wss.on('connection', (ws, req) => {
  console.log(`New client connected from ${req.socket.remoteAddress}`);

  ws.isAlive = true;

  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', (message) => {
    try {
      const parsedMessage = JSON.parse(message);
      console.log('Primljena poruka:', parsedMessage);
    } catch (error) {
      console.error('Nevalidna poruka primljena:', message);
    }
  });

  ws.on('close', (code, reason) => {
    console.log('Client has disconnected', code, reason);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  ws.on('unexpected-response', (request, response) => {
    console.error('Unexpected response:', response.statusCode);
  });
});

// Interval za proveru aktivnih konekcija
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) {
      console.log('Terminating inactive connection');
      return ws.terminate();
    }

    ws.isAlive = false;
    ws.ping();
  });
}, 30000); // Ping svakih 30 sekundi

wss.on('close', () => {
  clearInterval(interval);
});

// Funkcija za slanje poruka svim povezanima klijentima
export const notifyClients = (message, auctionData) => {
  const fullMessage = {
    type: message.type,
    message: message.message,
    auction: auctionData ? auctionData : 'nepoznato delo'
  };

  console.log('Šaljemo poruku klijentima:', fullMessage);

  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(JSON.stringify(fullMessage));
    }
  });
};

// Cron job koji se pokreće svake minute
cron.schedule('* * * * *', async () => {
  const expiredAuctions = await checkExpiredAuctions(); // Pretpostavimo da checkExpiredAuctions vraća podatke o aukcijama
  console.log('Proverene aukcije: ', expiredAuctions);

  if (expiredAuctions && expiredAuctions.length > 0) {
    notifyClients({ type: 'AUCTION_STATUS_UPDATE', message: 'Aukcija je proverena.' }, expiredAuctions);
  } else {
    notifyClients({ type: 'AUCTION_STATUS_UPDATE', message: 'Nema aukcija za proveru.' });
  }
});

// Funkcija za obaveštavanje korisnika o novim notifikacijama
export const notifyUser = (userId, notification) => {
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN && client.userId === userId) {
      client.send(JSON.stringify(notification));
    }
  });
};
