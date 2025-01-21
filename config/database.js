// const { MongoClient } = require('mongodb');
import { MongoClient } from 'mongodb';

class Database {
    constructor() {
        this.client = null;
        this.db = null;
    }

    async connect() {
        try {
            if (this.client) return this.db;

            const uri = process.env.MONGODB_URI;
            if (!uri) throw new Error('MongoDB connection string is not defined');

            this.client = new MongoClient(uri, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            });

            await this.client.connect();
            this.db = this.client.db(process.env.MONGODB_DB_NAME);
            
            console.log('Successfully connected to MongoDB.');
            return this.db;
        } catch (error) {
            console.error('MongoDB connection error:', error);
            throw error;
        }
    }

    async disconnect() {
        try {
            if (this.client) {
                await this.client.close();
                this.client = null;
                this.db = null;
                console.log('MongoDB connection closed.');
            }
        } catch (error) {
            console.error('Error closing MongoDB connection:', error);
            throw error;
        }
    }

    getDb() {
        if (!this.db) {
            throw new Error('Database not connected. Call connect() first.');
        }
        return this.db;
    }
}

export const database = new Database();
