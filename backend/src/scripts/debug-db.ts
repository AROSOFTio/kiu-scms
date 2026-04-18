import { db } from '../config/database';

async function debug() {
  console.log('Starting database debug...');

  try {
    const [roles]: any = await db.query('SELECT * FROM roles');
    console.log('\nRoles table:');
    console.table(roles);

    const [users]: any = await db.query('SELECT id, role_id, email, is_active FROM users');
    console.log('\nUsers table (redacted):');
    console.table(users);

    const [testUser]: any = await db.query(
      'SELECT * FROM users WHERE email = ?',
      ['fbwire.hod@kiu.ac.ug']
    );

    if (testUser.length > 0) {
      console.log('\nDemo HOD user found.');
      console.log('HOD role ID:', testUser[0].role_id);
    } else {
      console.log('\nDemo HOD user not found.');
    }

    process.exit(0);
  } catch (err) {
    console.error('Debug failed:', err);
    process.exit(1);
  }
}

debug();
