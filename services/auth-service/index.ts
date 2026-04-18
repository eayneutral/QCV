
import express from 'express';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import connectDB from './db';

const app = express();
const port = process.env.AUTH_PORT || 3001;

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'your-super-secret-key'; 
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-super-secret-refresh-key';
const ACCESS_TOKEN_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

app.use(express.json());

async function startServer() {
    const db = await connectDB();
    const usersCollection = db.collection('users');
    const refreshTokensCollection = db.collection('refreshTokens');

    app.post('/auth/register', async (req, res) => {
      try {
        const { email, password } = req.body;

        if (!email || !password) {
          return res.status(400).json({ message: 'Email and password are required' });
        }

        const existingUser = await usersCollection.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: 'User already exists' });
        }

        const passwordHash = await argon2.hash(password);

        const newUser = {
            email,
            passwordHash
        };
        const result = await usersCollection.insertOne(newUser);

        res.status(201).json({ message: 'User registered successfully', userId: result.insertedId });

      } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    });

    app.post('/auth/login', async (req, res) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ message: 'Email and password are required' });
            }

            const user = await usersCollection.findOne({ email });
            if (!user) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            const isPasswordValid = await argon2.verify(user.passwordHash, password);
            if (!isPasswordValid) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            const accessToken = jwt.sign({ userId: user._id, email: user.email }, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
            const refreshToken = jwt.sign({ userId: user._id, email: user.email }, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
            
            await refreshTokensCollection.insertOne({ token: refreshToken, userId: user._id });

            res.json({ accessToken, refreshToken });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    });

    app.post('/auth/refresh', async (req, res) => {
        const { token } = req.body;

        if (!token) {
            return res.sendStatus(401);
        }

        const existingToken = await refreshTokensCollection.findOne({ token });

        if (!existingToken) {
            return res.sendStatus(403);
        }

        jwt.verify(token, REFRESH_TOKEN_SECRET, (err, user) => {
            if (err) {
                return res.sendStatus(403);
            }

            const accessToken = jwt.sign({ userId: user.userId, email: user.email }, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });

            res.json({ accessToken });
        });
    });

    app.listen(port, () => {
      console.log(`Auth service listening at http://localhost:${port}`);
    });
}

startServer();
