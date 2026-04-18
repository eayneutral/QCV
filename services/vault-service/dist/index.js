"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongodb_1 = require("mongodb");
const db_1 = __importDefault(require("./db"));
const app = (0, express_1.default)();
const port = process.env.VAULT_PORT || 3002;
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'your-super-secret-key';
app.use(express_1.default.json());
function startServer() {
    return __awaiter(this, void 0, void 0, function* () {
        const db = yield (0, db_1.default)();
        const vaultCollection = db.collection('vault');
        const usersCollection = db.collection('users');
        const authenticateJWT = (req, res, next) => {
            const authHeader = req.headers.authorization;
            if (authHeader) {
                const token = authHeader.split(' ')[1];
                try {
                    const decoded = jsonwebtoken_1.default.verify(token, ACCESS_TOKEN_SECRET);
                    req.user = decoded;
                    next();
                }
                catch (err) {
                    return res.sendStatus(403); // Forbidden
                }
            }
            else {
                res.sendStatus(401); // Unauthorized
            }
        };
        app.use(authenticateJWT);
        app.post('/vault/add', (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { data } = req.body;
                // The user property is now available on req
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                if (!data) {
                    return res.status(400).json({ message: "No data provided" });
                }
                if (!userId) {
                    return res.status(401).json({ message: "Unauthorized" });
                }
                yield vaultCollection.insertOne({ userId: new mongodb_1.ObjectId(userId), data });
                res.status(201).json({ message: "Data added to vault" });
            }
            catch (error) {
                console.error('Vault add error:', error);
                res.status(500).json({ message: 'Internal server error' });
            }
        }));
        app.get('/vault/list', (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _b;
            try {
                const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.userId;
                if (!userId) {
                    return res.status(401).json({ message: "Unauthorized" });
                }
                const userVault = yield vaultCollection.find({ userId: new mongodb_1.ObjectId(userId) }).toArray();
                const data = userVault.map((item) => item.data);
                res.json({ data });
            }
            catch (error) {
                console.error('Vault list error:', error);
                res.status(500).json({ message: 'Internal server error' });
            }
        }));
        app.post('/vault/share', (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { data, recipientEmail } = req.body;
                if (!data || !recipientEmail) {
                    return res.status(400).json({ message: "Data and recipient email are required" });
                }
                const recipient = yield usersCollection.findOne({ email: recipientEmail });
                if (!recipient) {
                    return res.status(404).json({ message: "Recipient not found" });
                }
                yield vaultCollection.insertOne({ userId: recipient._id, data });
                res.status(200).json({ message: "Data shared successfully" });
            }
            catch (error) {
                console.error('Vault share error:', error);
                res.status(500).json({ message: 'Internal server error' });
            }
        }));
        app.listen(port, () => {
            console.log(`Vault service listening at http://localhost:${port}`);
        });
    });
}
startServer();
