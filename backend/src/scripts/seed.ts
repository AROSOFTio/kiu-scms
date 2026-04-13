import { db } from '../config/database';
import bcrypt from 'bcrypt';

async function seed() {
  console.log('🚀 Starting User Seeding (Robust Dynamic Mode)...');
  
  try {
    // 1. Ensure Roles
    console.log('📦 Setting up roles...');
    await db.query(`INSERT IGNORE INTO roles (name) VALUES ('Admin'), ('Staff'), ('Student'), ('Department Officer')`);

    // 2. Fetch Actual IDs (Vital for reliability)
    const [roles]: any = await db.query('SELECT id, name FROM roles');
    const getRoleId = (name: string) => roles.find((r: any) => r.name === name)?.id;

    const adminRoleId = getRoleId('Admin');
    const staffRoleId = getRoleId('Staff');
    const studentRoleId = getRoleId('Student');
    const officerRoleId = getRoleId('Department Officer');

    console.log(`Role IDs found: Admin=${adminRoleId}, Staff=${staffRoleId}, Student=${studentRoleId}, Officer=${officerRoleId}`);

    // 3. Ensure Departments
    console.log('🏢 Setting up departments...');
    await db.query(`INSERT IGNORE INTO faculties (id, name) VALUES (1, 'Faculty of Computing & Informatics')`);
    await db.query(`INSERT IGNORE INTO departments (id, faculty_id, name) VALUES (1, 1, 'Computer Science')`);

    const saltRounds = 10;
    const adminHash = await bcrypt.hash('Admin@1234', saltRounds);
    const staffHash = await bcrypt.hash('Staff@1234', saltRounds);
    const studentHash = await bcrypt.hash('Student@1234', saltRounds);
    const enochHash = await bcrypt.hash('Enoch@2023', saltRounds);

    // 4. Ensure Test Users (Using INSERT IGNORE to prevent overwriting existing custom credentials)
    console.log('👤 Ensuring standard test users exist...');


    // 5. Create Admin (admin@kiu.ac.ug / Admin@1234)
    console.log('👤 Creating Admin...');
    await db.query(
      'INSERT IGNORE INTO users (role_id, first_name, last_name, email, password_hash, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [adminRoleId, 'System', 'Administrator', 'admin@kiu.ac.ug', adminHash, 1]
    );

    // 6. Create Dept Officer (officer@kiu.ac.ug / Admin@1234)
    console.log('👤 Creating Department Officer...');
    const [offResult]: any = await db.query(
      'INSERT IGNORE INTO users (role_id, first_name, last_name, email, password_hash, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [officerRoleId, 'John', 'Officer', 'officer@kiu.ac.ug', adminHash, 1]
    );
    if (offResult.insertId) {
      await db.query(
        'INSERT IGNORE INTO staff (user_id, staff_number, department_id, role_id) VALUES (?, ?, ?, ?)',
        [offResult.insertId, 'OFF-001/2026', 1, officerRoleId]
      );
    }

    // 7. Create Staff (staff@kiu.ac.ug / Staff@1234)
    console.log('👤 Creating Staff (Michael)...');
    const [stfResult]: any = await db.query(
      'INSERT IGNORE INTO users (role_id, first_name, last_name, email, password_hash, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [staffRoleId, 'Michael', 'Staff', 'staff@kiu.ac.ug', staffHash, 1]
    );
    if (stfResult.insertId) {
      await db.query(
        'INSERT IGNORE INTO staff (user_id, staff_number, department_id, role_id) VALUES (?, ?, ?, ?)',
        [stfResult.insertId, 'STAFF/001/2026', 1, staffRoleId]
      );
    }

    // 8. Create Staff (enoch@kiu.ac.ug / Enoch@2023)
    console.log('👤 Creating Staff (Enoch)...');
    const [enochResult]: any = await db.query(
      'INSERT IGNORE INTO users (role_id, first_name, last_name, email, password_hash, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [staffRoleId, 'Enoch', 'Staff', 'enoch@kiu.ac.ug', enochHash, 1]
    );
    if (enochResult.insertId) {
      await db.query(
        'INSERT IGNORE INTO staff (user_id, staff_number, department_id, role_id) VALUES (?, ?, ?, ?)',
        [enochResult.insertId, 'STAFF/002/2026', 1, staffRoleId]
      );
    }

    // 9. Create Student (student@student.kiu.ac.ug / Student@1234)
    console.log('👤 Creating Student...');
    const [stdResult]: any = await db.query(
      'INSERT IGNORE INTO users (role_id, first_name, last_name, email, password_hash, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [studentRoleId, 'Sarah', 'Student', 'student@student.kiu.ac.ug', studentHash, 1]
    );
    if (stdResult.insertId) {
      await db.query(
        'INSERT IGNORE INTO students (user_id, student_number, department_id) VALUES (?, ?, ?)',
        [stdResult.insertId, 'STUD/001/2026', 1]
      );
    }

    console.log('✅ Robust Seeding Completed Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Failed:', error);
    process.exit(1);
  }
}

seed();
