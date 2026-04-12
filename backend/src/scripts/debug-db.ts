import { db } from '../config/database';

async function debug() {
  console.log('🔍 Starting Database Debug...');
  
  try {
    const [roles]: any = await db.query('SELECT * FROM roles');
    console.log('\n📋 Roles table:');
    console.table(roles);

    const [users]: any = await db.query('SELECT id, role_id, email, is_active FROM users');
    console.log('\n👤 Users table (Redacted):');
    console.table(users);

    const [testUser]: any = await db.query('SELECT * FROM users WHERE email = ?', ['admin@kiu.ac.ug']);
    if (testUser.length > 0) {
      console.log('\n✅ Admin user found!');
      console.log('Admin Role ID:', testUser[0].role_id);
    } else {
      console.log('\n❌ Admin user NOT found!');
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Debug failed:', err);
    process.exit(1);
  }
}

debug();
