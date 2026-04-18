import { db } from '../config/database';
import bcrypt from 'bcrypt';

async function seed() {
  console.log('Starting clear and clean user seeding (HOD, Lecturer, Student only)...');

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

    // Use consistent password for all generated demo users
    const hash = await bcrypt.hash('Admin@123', 10);

    const accountsToCreate: any[] = [];

    const deptsList = [
      'Computer Science',
      'Information Technology',
      'Software Engineering',
      'Data Science',
      'Business Admin'
    ];

    // HODs (1 per department = 5 HODs)
    deptsList.forEach((dept) => {
      if (dept === 'Computer Science') {
        accountsToCreate.push({ role: 'HOD', first: 'Fred', last: 'Bwire', email: 'fbwire.hod@kiu.ac.ug', dept: dept });
      } else {
        accountsToCreate.push({
          role: 'HOD',
          first: 'HOD',
          last: dept.split(' ')[0],
          email: `hod.${dept.toLowerCase().replace(' ', '')}@kiu.ac.ug`,
          dept: dept
        });
      }
    });

    // LECTURERS (5 per department = 25 Lecturers)
    deptsList.forEach((dept) => {
      for (let i = 1; i <= 5; i++) {
        if (dept === 'Information Technology' && i === 1) {
          accountsToCreate.push({ role: 'Lecturer', first: 'Apio', last: 'Presiline', email: 'apio.presiline@kiu.ac.ug', dept: dept });
        } else if (dept === 'Business Admin' && i === 1) {
          accountsToCreate.push({ role: 'Lecturer', first: 'Sentongo', last: 'Sayid', email: 'ssayid@kiu.ac.ug', dept: dept });
        } else {
          accountsToCreate.push({
            role: 'Lecturer',
            first: 'Lecturer',
            last: `${i} ${dept.split(' ')[0]}`,
            email: `lec${i}.${dept.toLowerCase().replace(' ', '')}@kiu.ac.ug`,
            dept: dept
          });
        }
      }
    });

    // STUDENTS (5 per Faculty = 10 Students)
    // Faculty 1 (Computing & Informatics): 5 Students in Computer Science
    for (let i = 1; i <= 5; i++) {
      if (i === 1) {
        accountsToCreate.push({ role: 'Student', first: 'Enoch', last: 'Micah', email: 'enoch.micah@kiu.ac.ug', dept: 'Computer Science', num: '2026/KIU/C001' });
      } else {
        accountsToCreate.push({
          role: 'Student',
          first: 'Stud',
          last: `Comp${i}`,
          email: `std.comp${i}@kiu.ac.ug`,
          dept: 'Computer Science',
          num: `2026/KIU/C${i.toString().padStart(3, '0')}`
        });
      }
    }

    // Faculty 2 (Business): 5 Students in Business Admin
    for (let i = 1; i <= 5; i++) {
        accountsToCreate.push({
          role: 'Student',
          first: 'Stud',
          last: `Bus${i}`,
          email: `std.bus${i}@kiu.ac.ug`,
          dept: 'Business Admin',
          num: `2026/KIU/B${i.toString().padStart(3, '0')}`
        });
    }

    console.log('Inserting accounts...');

    for (const acc of accountsToCreate) {
      const rId = getRoleId(acc.role);
      const dId = acc.dept ? getDeptId(acc.dept) : 1;

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
      } else if (['HOD', 'Lecturer'].includes(acc.role)) {
        await db.query(
          'INSERT INTO staff (user_id, staff_number, department_id, role_id) VALUES (?, ?, ?, ?)',
          [insertId, `STF/2026/${insertId.toString().padStart(4, '0')}`, dId, rId]
        );
      }
    }

    await db.query('SET FOREIGN_KEY_CHECKS = 1;');
    
    console.log('✅ Seeding complete! HODs, Lecturers, and Students initialized.');
    process.exit(0);

  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
