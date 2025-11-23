/**
 * MongoDB Connection Manager
 * Provides singleton connection pool for MongoDB Atlas
 */

import { MongoClient, Db, Collection } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'tribalmingle';
const options = {
  maxPoolSize: 10,
  minPoolSize: 2,
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 5000,
};

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

/**
 * Get MongoDB client (singleton pattern with connection pooling)
 */
export async function getMongoClient(): Promise<MongoClient> {
  if (client) {
    return client;
  }

  if (!clientPromise) {
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  }

  try {
    client = await clientPromise;
    return client;
  } catch (error) {
    clientPromise = null;
    throw error;
  }
}

/**
 * Get database instance
 */
export async function getDb(): Promise<Db> {
  const mongoClient = await getMongoClient();
  return mongoClient.db(dbName);
}

/**
 * Get specific collection
 */
import type { Document } from 'mongodb'

export async function getCollection<T extends Document = Document>(
  collectionName: string
): Promise<Collection<T>> {
  const db = await getDb();
  return db.collection<T>(collectionName);
}

/**
 * Close MongoDB connection (for cleanup)
 */
export async function closeConnection(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    clientPromise = null;
  }
}

/**
 * Health check - ping MongoDB
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const mongoClient = await getMongoClient();
    await mongoClient.db('admin').command({ ping: 1 });
    return true;
  } catch {
    return false;
  }
}
