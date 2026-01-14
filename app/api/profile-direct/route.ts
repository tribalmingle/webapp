import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { MongoClient, ObjectId } from 'mongodb';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  let client;
  try {
    const currentUser = await getCurrentUser(req);
    
    if (!currentUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Direct MongoDB connection
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB || 'tribalmingle';
    
    client = new MongoClient(uri!);
    await client.connect();
    const db = client.db(dbName);
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne(
      { _id: new ObjectId(currentUser.userId) },
      { projection: { email: 1, firstName: 1, lastName: 1, age: 1, gender: 1 } }
    );

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      age: user.age,
      gender: user.gender,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  } finally {
    if (client) {
      await client.close();
    }
  }
}
