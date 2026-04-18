"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const argon2_1 = __importDefault(require("argon2"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("./db"));
const app = (0, express_1.default)();
const port = process.env.AUTH_PORT || 3001;
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'your-super-secret-key';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-super-secret-refresh-key';
const ACCESS_TOKEN_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = '7d';
app.use(express_1.default.json());
function startServer() {
    return __awaiter(this, void 0, void 0, function* () {
        const db = yield (0, db_1.default)();
        const usersCollection = db.collection('users');
        const refreshTokensCollection = db.collection('refreshTokens');
        app.post('/auth/register', (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { email, password } = req.body;
                if (!email || !password) {
                    return res.status(400).json({ message: 'Email and password are required' });
                }
                const existingUser = yield usersCollection.findOne({ email });
                if (existingUser) {
                    return res.status(409).json({ message: 'User already exists' });
                }
                const passwordHash = yield argon2_1.default.hash(password);
                const newUser = {
                    email,
                    passwordHash
                };
                const result = yield usersCollection.insertOne(newUser);
                res.status(201).json({ message: 'User registered successfully', userId: result.insertedId });
            }
            catch (error) {
                console.error('Registration error:', error);
                res.status(500).json({ message: 'Internal server error' });
            }
        }));
        app.post('/auth/login', (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { email, password } = req.body;
                if (!email || !password) {
                    return res.status(400).json({ message: 'Email and password are required' });
                }
                const user = yield usersCollection.findOne({ email });
                if (!user) {
                    return res.status(401).json({ message: 'Invalid credentials' });
                }
                const isPasswordValid = yield argon2_1.default.verify(user.passwordHash, password);
                if (!isPasswordValid) {
                    return res.status(401).json({ message: 'Invalid credentials' });
                }
                const accessToken = jsonwebtoken_1.default.sign({ userId: user._id, email: user.email }, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
                const refreshToken = jsonwebtoken_1.default.sign({ userId: user._id, email: user.email }, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
                yield refreshTokensCollection.insertOne({ token: refreshToken, userId: user._id });
                res.json({ accessToken, refreshToken });
            }
            catch (error) {
                console.error('Login error:', error);
                res.status(500).json({ message: 'Internal server error' });
            }
        }));
        app.post('/auth/refresh', (req, res) => __awaiter(this, void 0, void 0, function* () {
            const { token } = req.body;
            if (!token) {
                return res.sendStatus(401);
            }
            const existingToken = yield refreshTokensCollection.findOne({ token });
            if (!existingToken) {
                return res.sendStatus(403);
            }
            try {
                const decoded = jsonwebtoken_1.default.verify(token, REFRESH_TOKEN_SECRET);
                if (typeof decoded === 'string') {
                    return res.sendStatus(403);
                }
                const accessToken = jsonwebtoken_1.default.sign({ userId: decoded.userId, email: decoded.email }, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
                res.json({ accessToken });
            }
            catch (err) {
                return res.sendStatus(403);
            }
        }));
        app.listen(port, () => {
            console.log(`Auth service listening at http://localhost:${port}`);
        });
    });
}
startServer();
