import bcrypt from 'bcrypt';
import { db } from '../config/database';

const DEMO_PASSWORD = 'Admin@123';

type StaffSeed = {
  firstName: string;
  lastName: string;
  email: string;
  staffNumber: string;
};

type StudentSeed = {
  firstName: string;
  lastName: string;
  email: string;
  studentNumber: string;
};

type DepartmentSeed = {
  id: number;
  facultyId: number;
  name: string;
  hod: StaffSeed;
  lecturers: StaffSeed[];
  students: StudentSeed[];
};

const FACULTIES = [
  { id: 1, name: 'Faculty of Computing & Informatics' },
  { id: 2, name: 'Faculty of Business' },
];

const DEPARTMENTS: DepartmentSeed[] = [
  {
    id: 1,
    facultyId: 1,
    name: 'Computer Science',
    hod: { firstName: 'Fred', lastName: 'Bwire', email: 'fbwire.hod@kiu.ac.ug', staffNumber: 'STF/2026/0001' },
    lecturers: [
      { firstName: 'Alice', lastName: 'Nanteza', email: 'lec1.computerscience@kiu.ac.ug', staffNumber: 'STF/2026/0002' },
      { firstName: 'Brian', lastName: 'Kato', email: 'lec2.computerscience@kiu.ac.ug', staffNumber: 'STF/2026/0003' },
      { firstName: 'Claire', lastName: 'Atwine', email: 'lec3.computerscience@kiu.ac.ug', staffNumber: 'STF/2026/0004' },
      { firstName: 'Daniel', lastName: 'Mugisha', email: 'lec4.computerscience@kiu.ac.ug', staffNumber: 'STF/2026/0005' },
      { firstName: 'Esther', lastName: 'Nankya', email: 'lec5.computerscience@kiu.ac.ug', staffNumber: 'STF/2026/0006' },
    ],
    students: [
      { firstName: 'Enoch', lastName: 'Micah', email: 'enoch.micah@kiu.ac.ug', studentNumber: '2026/KIU/CS001' },
      { firstName: 'Brian', lastName: 'Tumwesigye', email: 'std2.computerscience@kiu.ac.ug', studentNumber: '2026/KIU/CS002' },
      { firstName: 'Carol', lastName: 'Namugerwa', email: 'std3.computerscience@kiu.ac.ug', studentNumber: '2026/KIU/CS003' },
      { firstName: 'Diana', lastName: 'Akoth', email: 'std4.computerscience@kiu.ac.ug', studentNumber: '2026/KIU/CS004' },
      { firstName: 'Ethan', lastName: 'Mugenyi', email: 'std5.computerscience@kiu.ac.ug', studentNumber: '2026/KIU/CS005' },
    ],
  },
  {
    id: 2,
    facultyId: 1,
    name: 'Information Technology',
    hod: { firstName: 'Sarah', lastName: 'Namusoke', email: 'hod.informationtechnology@kiu.ac.ug', staffNumber: 'STF/2026/0007' },
    lecturers: [
      { firstName: 'Apio', lastName: 'Presiline', email: 'apio.presiline@kiu.ac.ug', staffNumber: 'STF/2026/0008' },
      { firstName: 'Denis', lastName: 'Ssemanda', email: 'lec2.informationtechnology@kiu.ac.ug', staffNumber: 'STF/2026/0009' },
      { firstName: 'Fiona', lastName: 'Nabirye', email: 'lec3.informationtechnology@kiu.ac.ug', staffNumber: 'STF/2026/0010' },
      { firstName: 'John', lastName: 'Mwesige', email: 'lec4.informationtechnology@kiu.ac.ug', staffNumber: 'STF/2026/0011' },
      { firstName: 'Lydia', lastName: 'Namata', email: 'lec5.informationtechnology@kiu.ac.ug', staffNumber: 'STF/2026/0012' },
    ],
    students: [
      { firstName: 'Faith', lastName: 'Nalubega', email: 'std1.informationtechnology@kiu.ac.ug', studentNumber: '2026/KIU/IT001' },
      { firstName: 'Henry', lastName: 'Ssembatya', email: 'std2.informationtechnology@kiu.ac.ug', studentNumber: '2026/KIU/IT002' },
      { firstName: 'Irene', lastName: 'Namutebi', email: 'std3.informationtechnology@kiu.ac.ug', studentNumber: '2026/KIU/IT003' },
      { firstName: 'Joel', lastName: 'Twinamatsiko', email: 'std4.informationtechnology@kiu.ac.ug', studentNumber: '2026/KIU/IT004' },
      { firstName: 'Kevin', lastName: 'Ochan', email: 'std5.informationtechnology@kiu.ac.ug', studentNumber: '2026/KIU/IT005' },
    ],
  },
  {
    id: 3,
    facultyId: 1,
    name: 'Software Engineering',
    hod: { firstName: 'Isaac', lastName: 'Kato', email: 'hod.softwareengineering@kiu.ac.ug', staffNumber: 'STF/2026/0013' },
    lecturers: [
      { firstName: 'Mark', lastName: 'Turyasingura', email: 'lec1.softwareengineering@kiu.ac.ug', staffNumber: 'STF/2026/0014' },
      { firstName: 'Peace', lastName: 'Atuhaire', email: 'lec2.softwareengineering@kiu.ac.ug', staffNumber: 'STF/2026/0015' },
      { firstName: 'Ronald', lastName: 'Ssekandi', email: 'lec3.softwareengineering@kiu.ac.ug', staffNumber: 'STF/2026/0016' },
      { firstName: 'Sharon', lastName: 'Mirembe', email: 'lec4.softwareengineering@kiu.ac.ug', staffNumber: 'STF/2026/0017' },
      { firstName: 'Victor', lastName: 'Twinomujuni', email: 'lec5.softwareengineering@kiu.ac.ug', staffNumber: 'STF/2026/0018' },
    ],
    students: [
      { firstName: 'Lillian', lastName: 'Auma', email: 'std1.softwareengineering@kiu.ac.ug', studentNumber: '2026/KIU/SE001' },
      { firstName: 'Martin', lastName: 'Sserwanja', email: 'std2.softwareengineering@kiu.ac.ug', studentNumber: '2026/KIU/SE002' },
      { firstName: 'Naomi', lastName: 'Kyomugisha', email: 'std3.softwareengineering@kiu.ac.ug', studentNumber: '2026/KIU/SE003' },
      { firstName: 'Oscar', lastName: 'Muhwezi', email: 'std4.softwareengineering@kiu.ac.ug', studentNumber: '2026/KIU/SE004' },
      { firstName: 'Patricia', lastName: 'Aciro', email: 'std5.softwareengineering@kiu.ac.ug', studentNumber: '2026/KIU/SE005' },
    ],
  },
  {
    id: 4,
    facultyId: 1,
    name: 'Data Science',
    hod: { firstName: 'Miriam', lastName: 'Ayo', email: 'hod.datascience@kiu.ac.ug', staffNumber: 'STF/2026/0019' },
    lecturers: [
      { firstName: 'Anna', lastName: 'Akello', email: 'lec1.datascience@kiu.ac.ug', staffNumber: 'STF/2026/0020' },
      { firstName: 'David', lastName: 'Otema', email: 'lec2.datascience@kiu.ac.ug', staffNumber: 'STF/2026/0021' },
      { firstName: 'Grace', lastName: 'Alupo', email: 'lec3.datascience@kiu.ac.ug', staffNumber: 'STF/2026/0022' },
      { firstName: 'Moses', lastName: 'Okello', email: 'lec4.datascience@kiu.ac.ug', staffNumber: 'STF/2026/0023' },
      { firstName: 'Ruth', lastName: 'Chebet', email: 'lec5.datascience@kiu.ac.ug', staffNumber: 'STF/2026/0024' },
    ],
    students: [
      { firstName: 'Queen', lastName: 'Nakato', email: 'std1.datascience@kiu.ac.ug', studentNumber: '2026/KIU/DS001' },
      { firstName: 'Richard', lastName: 'Okidi', email: 'std2.datascience@kiu.ac.ug', studentNumber: '2026/KIU/DS002' },
      { firstName: 'Stella', lastName: 'Namirembe', email: 'std3.datascience@kiu.ac.ug', studentNumber: '2026/KIU/DS003' },
      { firstName: 'Timothy', lastName: 'Opiro', email: 'std4.datascience@kiu.ac.ug', studentNumber: '2026/KIU/DS004' },
      { firstName: 'Violet', lastName: 'Achieng', email: 'std5.datascience@kiu.ac.ug', studentNumber: '2026/KIU/DS005' },
    ],
  },
  {
    id: 5,
    facultyId: 2,
    name: 'Business Admin',
    hod: { firstName: 'Brian', lastName: 'Ssenkaaba', email: 'hod.businessadmin@kiu.ac.ug', staffNumber: 'STF/2026/0025' },
    lecturers: [
      { firstName: 'Sentongo', lastName: 'Sayid', email: 'ssayid@kiu.ac.ug', staffNumber: 'STF/2026/0026' },
      { firstName: 'Brenda', lastName: 'Nakalema', email: 'lec2.businessadmin@kiu.ac.ug', staffNumber: 'STF/2026/0027' },
      { firstName: 'Charles', lastName: 'Byaruhanga', email: 'lec3.businessadmin@kiu.ac.ug', staffNumber: 'STF/2026/0028' },
      { firstName: 'Diana', lastName: 'Naigaga', email: 'lec4.businessadmin@kiu.ac.ug', staffNumber: 'STF/2026/0029' },
      { firstName: 'Peter', lastName: 'Walusimbi', email: 'lec5.businessadmin@kiu.ac.ug', staffNumber: 'STF/2026/0030' },
    ],
    students: [
      { firstName: 'Winnie', lastName: 'Nantege', email: 'std1.businessadmin@kiu.ac.ug', studentNumber: '2026/KIU/BA001' },
      { firstName: 'Xavier', lastName: 'Mugerwa', email: 'std2.businessadmin@kiu.ac.ug', studentNumber: '2026/KIU/BA002' },
      { firstName: 'Yvonne', lastName: 'Atuhairwe', email: 'std3.businessadmin@kiu.ac.ug', studentNumber: '2026/KIU/BA003' },
      { firstName: 'Zedekiah', lastName: 'Ssenyonjo', email: 'std4.businessadmin@kiu.ac.ug', studentNumber: '2026/KIU/BA004' },
      { firstName: 'Tracy', lastName: 'Namuli', email: 'std5.businessadmin@kiu.ac.ug', studentNumber: '2026/KIU/BA005' },
    ],
  },
];

const COMPLAINT_CATEGORIES = [
  ['Academic', 'Issues related to lectures, exams, marks, and academic performance'],
  ['Technical', 'Portal issues, WiFi, lab equipment, software problems'],
  ['Hostel', 'Accommodation, utilities, room allocation complaints'],
  ['Financial', 'Fee payments, bursaries, scholarships, refunds'],
  ['Library', 'Books, resources, library access problems'],
  ['Administration', 'Registration, documents, certificates, staff conduct'],
  ['Other', 'General complaints not covered by other categories'],
];

const SYSTEM_SETTINGS = [
  ['system_name', 'KIU Student Complaint Management System'],
  ['system_email', 'scms@kiu.ac.ug'],
  ['max_file_size_mb', '10'],
  ['allowed_file_types', 'pdf,jpg,jpeg,png,doc,docx'],
];

async function seed() {
  const connection = await db.getConnection();

  try {
    console.log('Starting clean academic demo seeding...');
    await connection.beginTransaction();

    const cleanupStatements = [
      'DELETE FROM appointments',
      'DELETE FROM hod_availability',
      'DELETE FROM audit_logs',
      'DELETE FROM feedback',
      'DELETE FROM notifications',
      'DELETE FROM complaint_internal_notes',
      'DELETE FROM complaint_status_history',
      'DELETE FROM complaint_attachments',
      'DELETE FROM complaints',
      'DELETE FROM staff',
      'DELETE FROM students',
      'DELETE FROM users',
      'DELETE FROM complaint_categories',
      'DELETE FROM system_settings',
      'DELETE FROM departments',
      'DELETE FROM faculties',
      'DELETE FROM roles',
    ];

    for (const statement of cleanupStatements) {
      await connection.query(statement);
    }

    await connection.query(
      `INSERT INTO roles (id, name) VALUES
       (1, 'HOD'),
       (2, 'Lecturer'),
       (3, 'Student')`
    );

    for (const faculty of FACULTIES) {
      await connection.query('INSERT INTO faculties (id, name) VALUES (?, ?)', [faculty.id, faculty.name]);
    }

    for (const department of DEPARTMENTS) {
      await connection.query(
        'INSERT INTO departments (id, faculty_id, name) VALUES (?, ?, ?)',
        [department.id, department.facultyId, department.name]
      );
    }

    for (const [name, description] of COMPLAINT_CATEGORIES) {
      await connection.query(
        'INSERT INTO complaint_categories (name, description) VALUES (?, ?)',
        [name, description]
      );
    }

    for (const [key, value] of SYSTEM_SETTINGS) {
      await connection.query(
        'INSERT INTO system_settings (key_name, value) VALUES (?, ?)',
        [key, value]
      );
    }

    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

    const [roleRows]: any = await connection.query('SELECT id, name FROM roles');
    const roleIds = roleRows.reduce((acc: Record<string, number>, row: { id: number; name: string }) => {
      acc[row.name] = row.id;
      return acc;
    }, {});

    for (const department of DEPARTMENTS) {
      const staffMembers: Array<StaffSeed & { roleName: 'HOD' | 'Lecturer' }> = [
        { ...department.hod, roleName: 'HOD' },
        ...department.lecturers.map((lecturer) => ({ ...lecturer, roleName: 'Lecturer' as const })),
      ];

      for (const staffMember of staffMembers) {
        const [userResult]: any = await connection.query(
          'INSERT INTO users (role_id, first_name, last_name, email, password_hash, is_active) VALUES (?, ?, ?, ?, ?, 1)',
          [
            roleIds[staffMember.roleName],
            staffMember.firstName,
            staffMember.lastName,
            staffMember.email,
            passwordHash,
          ]
        );

        await connection.query(
          'INSERT INTO staff (user_id, staff_number, department_id, role_id) VALUES (?, ?, ?, ?)',
          [userResult.insertId, staffMember.staffNumber, department.id, roleIds[staffMember.roleName]]
        );
      }

      for (const student of department.students) {
        const [userResult]: any = await connection.query(
          'INSERT INTO users (role_id, first_name, last_name, email, password_hash, is_active) VALUES (?, ?, ?, ?, ?, 1)',
          [roleIds.Student, student.firstName, student.lastName, student.email, passwordHash]
        );

        await connection.query(
          'INSERT INTO students (user_id, student_number, department_id) VALUES (?, ?, ?)',
          [userResult.insertId, student.studentNumber, department.id]
        );
      }
    }

    await connection.commit();

    const lecturerCount = DEPARTMENTS.reduce((sum, department) => sum + department.lecturers.length, 0);
    const studentCount = DEPARTMENTS.reduce((sum, department) => sum + department.students.length, 0);

    console.log(`Seed complete. HODs: ${DEPARTMENTS.length}, Lecturers: ${lecturerCount}, Students: ${studentCount}`);
    process.exit(0);
  } catch (error) {
    await connection.rollback();
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    connection.release();
  }
}

seed();
