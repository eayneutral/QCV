import express, { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import connectDB from './db';

// Define a custom interface for the user payload
interface UserPayload extends JwtPayload {
  userId: string;
  email: string;
}

// Extend the Express Request interface to include the user property
declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

const app = express();
const port = process.env.VAULT_PORT || 3002;

const ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET || 'your-super-secret-key';

app.use(express.json());

async function startServer() {
  const db = await connectDB();
  const vaultCollection = db.collection('vault');
  const usersCollection = db.collection('users');

  const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const token = authHeader.split(' ')[1];

      try {
        const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as UserPayload;
        req.user = decoded;
        next();
      } catch {
        return res.sendStatus(403); // Forbidden
      }
    } else {
      res.sendStatus(401); // Unauthorized
    }
  };

  app.use(authenticateJWT);

  app.post('/vault/add', async (req: Request, res: Response) => {
    try {
      const { data } = req.body;
      // The user property is now available on req
      const userId = req.user?.userId;

      if (!data) {
        return res.status(400).json({ message: 'No data provided' });
      }
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      await vaultCollection.insertOne({ userId: new ObjectId(userId), data });
      res.status(201).json({ message: 'Data added to vault' });
    } catch (error) {
      console.error('Vault add error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/vault/list', async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const userVault = await vaultCollection
        .find({ userId: new ObjectId(userId) })
        .toArray();
      const data = userVault.map((item: any) => item.data);
      res.json({ data });
    } catch (error) {
      console.error('Vault list error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/vault/share', async (req: Request, res: Response) => {
    try {
      const { data, recipientEmail } = req.body;

      if (!data || !recipientEmail) {
        return res
          .status(400)
          .json({ message: 'Data and recipient email are required' });
      }

      const recipient = await usersCollection.findOne({
        email: recipientEmail,
      });

      if (!recipient) {
        return res.status(404).json({ message: 'Recipient not found' });
      }

      await vaultCollection.insertOne({ userId: recipient._id, data });

      res.status(200).json({ message: 'Data shared successfully' });
    } catch (error) {
      console.error('Vault share error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.listen(port, () => {
    console.log(`Vault service listening at http://localhost:${port}`);
  });
}

startServer();
