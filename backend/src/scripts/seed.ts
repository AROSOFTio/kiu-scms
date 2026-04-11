import { db } from '../config/database';
import bcrypt from 'bcrypt';

async function seed() {
  console.log('🚀 Starting User Seeding...');
  
  try {
    // 1. Ensure Roles
    console.log('📦 Setting up roles...');
    await db.query(`INSERT IGNORE INTO roles (id, name) VALUES 
      (1, 'Admin'), 
      (2, 'Staff'), 
      (3, 'Student'), 
      (4, 'Department Officer')`);

    // 2. Ensure Departments
    console.log('🏢 Setting up departments...');
    await db.query(`INSERT IGNORE INTO faculties (id, name) VALUES (1, 'Faculty of Computing and Informatics')`);
    await db.query(`INSERT IGNORE INTO departments (id, faculty_id, name) VALUES (1, 1, 'Computer Science')`);

    const passwordHash = await bcrypt.hash('Admin@123', 10);

    // 3. Clear existing demo users
    console.log('🧹 Cleaning old test data...');
    const testEmails = ['admin@kiu.ac.ug', 'officer@kiu.ac.ug', 'staff@kiu.ac.ug', 'student@kiu.ac.ug'];
    await db.query('DELETE FROM users WHERE email IN (?)', [testEmails]);

    // 4. Create Admin
    console.log('👤 Creating Admin...');
    await db.query(
      'INSERT INTO users (role_id, first_name, last_name, email, password_hash) VALUES (?, ?, ?, ?, ?)',
      [1, 'System', 'Administrator', 'admin@kiu.ac.ug', passwordHash]
    );

    // 5. Create Dept Officer
    console.log('👤 Creating Department Officer...');
    const [offResult]: any = await db.query(
      'INSERT INTO users (role_id, first_name, last_name, email, password_hash) VALUES (?, ?, ?, ?, ?)',
      [4, 'John', 'Officer', 'officer@kiu.ac.ug', passwordHash]
    );
    await db.query(
      'INSERT INTO staff (user_id, staff_number, department_id, role_id) VALUES (?, ?, ?, ?)',
      [offResult.insertId, 'OFF-001', 1, 4]
    );

    // 6. Create Staff
    console.log('👤 Creating Staff...');
    const [stfResult]: any = await db.query(
      'INSERT INTO users (role_id, first_name, last_name, email, password_hash) VALUES (?, ?, ?, ?, ?)',
      [2, 'Sarah', 'Staff', 'staff@kiu.ac.ug', passwordHash]
    );
    await db.query(
      'INSERT INTO staff (user_id, staff_number, department_id, role_id) VALUES (?, ?, ?, ?)',
      [stfResult.insertId, 'STF-001', 1, 2]
    );

    // 7. Create Student
    console.log('👤 Creating Student...');
    const [stdResult]: any = await db.query(
      'INSERT INTO users (role_id, first_name, last_name, email, password_hash) VALUES (?, ?, ?, ?, ?)',
      [3, 'Enoch', 'Student', 'student@kiu.ac.ug', passwordHash]
    );
    await db.query(
      'INSERT INTO students (user_id, student_number, department_id) VALUES (?, ?, ?)',
      [stdResult.insertId, '2026/KIU/001', 1]
    );

    console.log('✅ Seeding Completed Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Failed:', error);
    process.exit(1);
  }
}

seed();
