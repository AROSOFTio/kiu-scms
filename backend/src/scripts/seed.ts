import { db } from '../config/database';
import bcrypt from 'bcrypt';

async function seed() {
  console.log('🚀 Starting User Seeding (Dynamic Hashing Mode)...');
  
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
    await db.query(`INSERT IGNORE INTO faculties (id, name) VALUES (1, 'Faculty of Computing & Informatics')`);
    await db.query(`INSERT IGNORE INTO departments (id, faculty_id, name) VALUES (1, 1, 'Computer Science')`);

    // Dynamic Hashing for 100% Reliability
    const saltRounds = 10;
    const adminHash = await bcrypt.hash('Admin@1234', saltRounds);
    const staffHash = await bcrypt.hash('Staff@1234', saltRounds);
    const studentHash = await bcrypt.hash('Student@1234', saltRounds);
    const enochHash = await bcrypt.hash('Enoch@2023', saltRounds);

    // 3. Clear existing demo users to avoid UNIQUE constraints
    console.log('🧹 Cleaning old test data...');
    const testEmails = ['admin@kiu.ac.ug', 'officer@kiu.ac.ug', 'staff@kiu.ac.ug', 'student@student.kiu.ac.ug', 'student@kiu.ac.ug', 'enoch@kiu.ac.ug'];
    await db.query('DELETE FROM users WHERE email IN (?)', [testEmails]);

    // 4. Create Admin (admin@kiu.ac.ug / Admin@1234)
    console.log('👤 Creating Admin...');
    await db.query(
      'INSERT INTO users (role_id, first_name, last_name, email, password_hash, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [1, 'System', 'Administrator', 'admin@kiu.ac.ug', adminHash, 1]
    );

    // 5. Create Dept Officer (officer@kiu.ac.ug / Admin@1234)
    console.log('👤 Creating Department Officer...');
    const [offResult]: any = await db.query(
      'INSERT INTO users (role_id, first_name, last_name, email, password_hash, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [4, 'John', 'Officer', 'officer@kiu.ac.ug', adminHash, 1]
    );
    await db.query(
      'INSERT INTO staff (user_id, staff_number, department_id, role_id) VALUES (?, ?, ?, ?)',
      [offResult.insertId, 'OFF-001/2026', 1, 4]
    );

    // 6. Create Staff (staff@kiu.ac.ug / Staff@1234)
    console.log('👤 Creating Staff (Michael)...');
    const [stfResult]: any = await db.query(
      'INSERT INTO users (role_id, first_name, last_name, email, password_hash, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [2, 'Michael', 'Staff', 'staff@kiu.ac.ug', staffHash, 1]
    );
    await db.query(
      'INSERT INTO staff (user_id, staff_number, department_id, role_id) VALUES (?, ?, ?, ?)',
      [stfResult.insertId, 'STAFF/001/2026', 1, 2]
    );

    // 7. Create Staff (enoch@kiu.ac.ug / Enoch@2023)
    console.log('👤 Creating Staff (Enoch)...');
    const [enochResult]: any = await db.query(
      'INSERT INTO users (role_id, first_name, last_name, email, password_hash, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [2, 'Enoch', 'Staff', 'enoch@kiu.ac.ug', enochHash, 1]
    );
    await db.query(
      'INSERT INTO staff (user_id, staff_number, department_id, role_id) VALUES (?, ?, ?, ?)',
      [enochResult.insertId, 'STAFF/002/2026', 1, 2]
    );

    // 8. Create Student (student@student.kiu.ac.ug / Student@1234)
    console.log('👤 Creating Student...');
    const [stdResult]: any = await db.query(
      'INSERT INTO users (role_id, first_name, last_name, email, password_hash, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [3, 'Sarah', 'Student', 'student@student.kiu.ac.ug', studentHash, 1]
    );
    await db.query(
      'INSERT INTO students (user_id, student_number, department_id) VALUES (?, ?, ?)',
      [stdResult.insertId, 'STUD/001/2026', 1]
    );

    console.log('✅ Dynamic Seeding Completed Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Failed:', error);
    process.exit(1);
  }
}

seed();
