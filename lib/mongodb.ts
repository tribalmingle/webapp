import { MongoClient, MongoClientOptions } from 'mongodb'

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
}

// Ensure the URI has the proper SSL parameters
let uri = process.env.MONGODB_URI

// Add SSL parameters if not present
if (!uri.includes('retryWrites')) {
  const separator = uri.includes('?') ? '&' : '?'
  uri = `${uri}${separator}retryWrites=true&w=majority&tls=true&tlsAllowInvalidCertificates=false`
}

const options: MongoClientOptions = {
  maxPoolSize: 10,
  minPoolSize: 1,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  retryWrites: true,
  retryReads: true,
}

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options)
    globalWithMongo._mongoClientPromise = client.connect()
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise

export async function getMongoDb() {
  const client = await clientPromise
  const dbName = process.env.MONGODB_DB || 'tribalmingle'
  return client.db(dbName)
}
