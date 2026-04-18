
import express from 'express';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import connectDB from './db';

const app = express();
const port = process.env.VAULT_PORT || 3002;

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'your-super-secret-key';

app.use(express.json());

async function startServer() {
    const db = await connectDB();
    const vaultCollection = db.collection('vault');
    const usersCollection = db.collection('users');

    const authenticateJWT = (req, res, next) => {
        const authHeader = req.headers.authorization;

        if (authHeader) {
            const token = authHeader.split(' ')[1];

            jwt.verify(token, ACCESS_TOKEN_SECRET, (err, user) => {
                if (err) {
                    return res.sendStatus(403);
                }

                req.user = user;
                next();
            });
        } else {
            res.sendStatus(401);
        }
    };

    app.use(authenticateJWT);

    app.post('/vault/add', async (req, res) => {
        try {
            const { data } = req.body;
            const { userId } = req.user;

            if (!data) {
                return res.status(400).json({ message: "No data provided" });
            }

            await vaultCollection.insertOne({ userId: new ObjectId(userId), data });
            res.status(201).json({ message: "Data added to vault" });
        } catch (error) {
            console.error('Vault add error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    });

    app.get('/vault/list', async (req, res) => {
        try {
            const { userId } = req.user;
            const userVault = await vaultCollection.find({ userId: new ObjectId(userId) }).toArray();
            const data = userVault.map(item => item.data);
            res.json({ data });
        } catch (error) {
            console.error('Vault list error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    });

    app.post('/vault/share', async (req, res) => {
        try {
            const { data, recipientEmail } = req.body;

            if (!data || !recipientEmail) {
                return res.status(400).json({ message: "Data and recipient email are required" });
            }

            const recipient = await usersCollection.findOne({ email: recipientEmail });

            if (!recipient) {
                return res.status(404).json({ message: "Recipient not found" });
            }

            await vaultCollection.insertOne({ userId: recipient._id, data });

            res.status(200).json({ message: "Data shared successfully" });
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
