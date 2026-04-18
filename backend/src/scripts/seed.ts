import { db } from '../config/database';
import bcrypt from 'bcrypt';

async function seed() {
  console.log('Starting clear and clean user seeding...');

  try {
    await db.query('SET FOREIGN_KEY_CHECKS = 0;');
    
    console.log('Cleaning up old records...');
    await db.query('TRUNCATE TABLE students');
    await db.query('TRUNCATE TABLE staff');
    await db.query('TRUNCATE TABLE users');

    console.log('Setting up roles & departments...');
    await db.query(`INSERT IGNORE INTO roles (name) VALUES ('SuperAdmin'), ('HOD'), ('Lecturer'), ('Student'), ('Registrar'), ('Vice Chancellor'), ('Quality Assurance'), ('PRO')`);
    await db.query(`INSERT IGNORE INTO faculties (id, name) VALUES (1, 'Faculty of Computing & Informatics'), (2, 'Faculty of Business')`);
    await db.query(`INSERT IGNORE INTO departments (id, faculty_id, name) VALUES (1, 1, 'Computer Science'), (2, 1, 'Information Technology'), (3, 1, 'Software Engineering'), (4, 1, 'Data Science'), (5, 2, 'Business Admin')`);

    // Fetch IDs
    const [roles]: any = await db.query('SELECT id, name FROM roles');
    const getRoleId = (name: string) => roles.find((r: any) => r.name === name)?.id;
    const [depts]: any = await db.query('SELECT id, name FROM departments');
    const getDeptId = (name: string) => depts.find((d: any) => d.name === name)?.id;

    // Helper to generate hash dynamically to respect Name@2026 request
    const hashPwd = async (pwd: string) => bcrypt.hash(pwd, 10);

    const accountsToCreate = [
      // TOP MANAGEMENT
      { role: 'SuperAdmin', first: 'Adam', last: 'Admin', email: 'admin@kiu.ac.ug', pwd: 'Admin@123' },
      { role: 'Vice Chancellor', first: 'Sentongo', last: 'Sayid', email: 'ssayid@kiu.ac.ug', pwd: 'Sayid@2026' },
      { role: 'Registrar', first: 'Reg', last: 'User', email: 'registrar@kiu.ac.ug', pwd: 'User@2026' },
      { role: 'Quality Assurance', first: 'QA', last: 'Team', email: 'qa@kiu.ac.ug', pwd: 'Team@2026' },
      { role: 'PRO', first: 'PRO', last: 'Team', email: 'pro@kiu.ac.ug', pwd: 'Team@2026' },

      // HODs
      { role: 'HOD', first: 'Bwire', last: 'Fred', email: 'bfred.hod@kiu.ac.ug', pwd: 'Fred@2026', dept: 'Computer Science' },
      { role: 'HOD', first: 'Apio', last: 'Presiline', email: 'papio.hod@kiu.ac.ug', pwd: 'Presiline@2026', dept: 'Information Technology' },
      { role: 'HOD', first: 'Sof', last: 'Eng', email: 'hod.se@kiu.ac.ug', pwd: 'Eng@2026', dept: 'Software Engineering' },
      { role: 'HOD', first: 'Dat', last: 'Sci', email: 'hod.ds@kiu.ac.ug', pwd: 'Sci@2026', dept: 'Data Science' },
      { role: 'HOD', first: 'Bus', last: 'Adm', email: 'hod.ba@kiu.ac.ug', pwd: 'Adm@2026', dept: 'Business Admin' },

      // LECTURERS (5 total, distributed)
      { role: 'Lecturer', first: 'Lec', last: 'One', email: 'lecturer1@kiu.ac.ug', pwd: 'One@2026', dept: 'Computer Science' },
      { role: 'Lecturer', first: 'Lec', last: 'Two', email: 'lecturer2@kiu.ac.ug', pwd: 'Two@2026', dept: 'Computer Science' },
      { role: 'Lecturer', first: 'Lec', last: 'Three', email: 'lecturer3@kiu.ac.ug', pwd: 'Three@2026', dept: 'Information Technology' },
      { role: 'Lecturer', first: 'Lec', last: 'Four', email: 'lecturer4@kiu.ac.ug', pwd: 'Four@2026', dept: 'Information Technology' },
      { role: 'Lecturer', first: 'Lec', last: 'Five', email: 'lecturer5@kiu.ac.ug', pwd: 'Five@2026', dept: 'Software Engineering' },

      // STUDENTS (5 total, distributed)
      { role: 'Student', first: 'Enoch', last: 'Micah', email: 'enoch.micah@kiu.ac.ug', pwd: 'Micah@2026', dept: 'Computer Science', num: '2026/KIU/001' },
      { role: 'Student', first: 'Stu', last: 'Two', email: 'student2@kiu.ac.ug', pwd: 'Two@2026', dept: 'Computer Science', num: '2026/KIU/002' },
      { role: 'Student', first: 'Stu', last: 'Three', email: 'student3@kiu.ac.ug', pwd: 'Three@2026', dept: 'Information Technology', num: '2026/KIU/003' },
      { role: 'Student', first: 'Stu', last: 'Four', email: 'student4@kiu.ac.ug', pwd: 'Four@2026', dept: 'Information Technology', num: '2026/KIU/004' },
      { role: 'Student', first: 'Stu', last: 'Five', email: 'student5@kiu.ac.ug', pwd: 'Five@2026', dept: 'Software Engineering', num: '2026/KIU/005' },
    ];

    console.log('Inserting accounts...');

    for (const acc of accountsToCreate) {
      const rId = getRoleId(acc.role);
      const dId = acc.dept ? getDeptId(acc.dept) : 1;
      const hash = await hashPwd(acc.pwd);

      const [uRes]: any = await db.query(
        'INSERT INTO users (role_id, first_name, last_name, email, password_hash, is_active) VALUES (?, ?, ?, ?, ?, ?)',
        [rId, acc.first, acc.last, acc.email, hash, 1]
      );
      
      const insertId = uRes.insertId;

      if (acc.role === 'Student') {
        await db.query(
          'INSERT INTO students (user_id, student_number, department_id) VALUES (?, ?, ?)',
          [insertId, acc.num, dId]
        );
      } else if (['HOD', 'Lecturer', 'Registrar', 'PRO', 'Vice Chancellor'].includes(acc.role)) {
        await db.query(
          'INSERT INTO staff (user_id, staff_number, department_id, role_id) VALUES (?, ?, ?, ?)',
          [insertId, `STF/2026/${insertId}`, dId, rId]
        );
      }
    }

    await db.query('SET FOREIGN_KEY_CHECKS = 1;');
    
    console.log('✅ Seeding complete! All roles, HODs, Lecturers, and Students initialized.');
    process.exit(0);

  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
