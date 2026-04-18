
import { MongoClient } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = 'secure-vault';

let client;

async function connectDB() {
    if (client) {
        return client.db(DB_NAME);
    }

    try {
        client = new MongoClient(MONGO_URI);
        await client.connect();
        console.log('Connected to MongoDB');
        return client.db(DB_NAME);
    } catch (error) {
        console.error('Error connecting to MongoDB', error);
        process.exit(1);
    }
}

export default connectDB;
