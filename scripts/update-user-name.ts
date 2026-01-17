import clientPromise from '@/lib/mongodb';

async function updateUserName() {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB || 'tribalmingle');
  
  // Update cc@fg.cc user with first name
  const result = await db.collection('users').updateOne(
    { email: 'cc@fg.cc' },
    { 
      $set: { 
        firstName: 'Chinedu',
        lastName: 'Mendel',
        name: 'Chinedu Mendel'
      } 
    }
  );
  
  console.log('Updated user:', result);
  
  // Verify
  const user = await db.collection('users').findOne({ email: 'cc@fg.cc' });
  console.log('User data:', { 
    email: user?.email, 
    firstName: user?.firstName, 
    lastName: user?.lastName,
    name: user?.name 
  });
  
  process.exit(0);
}

updateUserName().catch(console.error);
