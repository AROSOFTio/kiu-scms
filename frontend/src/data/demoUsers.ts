export type DemoRole = 'HOD' | 'Lecturer' | 'Student';

export interface DemoUser {
  name: string;
  email: string;
  role: DemoRole;
  faculty: string;
  department: string;
  identifier: string;
  password: string;
}

export interface DemoDepartmentGroup {
  faculty: string;
  department: string;
  hod: DemoUser;
  lecturers: DemoUser[];
  students: DemoUser[];
}

export const DEMO_PASSWORD = 'Admin@123';

const createUser = (
  name: string,
  email: string,
  role: DemoRole,
  faculty: string,
  department: string,
  identifier: string,
): DemoUser => ({
  name,
  email,
  role,
  faculty,
  department,
  identifier,
  password: DEMO_PASSWORD,
});

export const demoDepartments: DemoDepartmentGroup[] = [
  {
    faculty: 'Faculty of Computing & Informatics',
    department: 'Computer Science',
    hod: createUser(
      'Fred Bwire',
      'fbwire.hod@kiu.ac.ug',
      'HOD',
      'Faculty of Computing & Informatics',
      'Computer Science',
      'STF/2026/0001',
    ),
    lecturers: [
      createUser('Alice Nanteza', 'lec1.computerscience@kiu.ac.ug', 'Lecturer', 'Faculty of Computing & Informatics', 'Computer Science', 'STF/2026/0002'),
      createUser('Brian Kato', 'lec2.computerscience@kiu.ac.ug', 'Lecturer', 'Faculty of Computing & Informatics', 'Computer Science', 'STF/2026/0003'),
      createUser('Claire Atwine', 'lec3.computerscience@kiu.ac.ug', 'Lecturer', 'Faculty of Computing & Informatics', 'Computer Science', 'STF/2026/0004'),
      createUser('Daniel Mugisha', 'lec4.computerscience@kiu.ac.ug', 'Lecturer', 'Faculty of Computing & Informatics', 'Computer Science', 'STF/2026/0005'),
      createUser('Esther Nankya', 'lec5.computerscience@kiu.ac.ug', 'Lecturer', 'Faculty of Computing & Informatics', 'Computer Science', 'STF/2026/0006'),
    ],
    students: [
      createUser('Enoch Micah', 'enoch.micah@kiu.ac.ug', 'Student', 'Faculty of Computing & Informatics', 'Computer Science', '2026/KIU/CS001'),
      createUser('Brian Tumwesigye', 'std2.computerscience@kiu.ac.ug', 'Student', 'Faculty of Computing & Informatics', 'Computer Science', '2026/KIU/CS002'),
      createUser('Carol Namugerwa', 'std3.computerscience@kiu.ac.ug', 'Student', 'Faculty of Computing & Informatics', 'Computer Science', '2026/KIU/CS003'),
      createUser('Diana Akoth', 'std4.computerscience@kiu.ac.ug', 'Student', 'Faculty of Computing & Informatics', 'Computer Science', '2026/KIU/CS004'),
      createUser('Ethan Mugenyi', 'std5.computerscience@kiu.ac.ug', 'Student', 'Faculty of Computing & Informatics', 'Computer Science', '2026/KIU/CS005'),
    ],
  },
  {
    faculty: 'Faculty of Computing & Informatics',
    department: 'Information Technology',
    hod: createUser(
      'Sarah Namusoke',
      'hod.informationtechnology@kiu.ac.ug',
      'HOD',
      'Faculty of Computing & Informatics',
      'Information Technology',
      'STF/2026/0007',
    ),
    lecturers: [
      createUser('Apio Presiline', 'apio.presiline@kiu.ac.ug', 'Lecturer', 'Faculty of Computing & Informatics', 'Information Technology', 'STF/2026/0008'),
      createUser('Denis Ssemanda', 'lec2.informationtechnology@kiu.ac.ug', 'Lecturer', 'Faculty of Computing & Informatics', 'Information Technology', 'STF/2026/0009'),
      createUser('Fiona Nabirye', 'lec3.informationtechnology@kiu.ac.ug', 'Lecturer', 'Faculty of Computing & Informatics', 'Information Technology', 'STF/2026/0010'),
      createUser('John Mwesige', 'lec4.informationtechnology@kiu.ac.ug', 'Lecturer', 'Faculty of Computing & Informatics', 'Information Technology', 'STF/2026/0011'),
      createUser('Lydia Namata', 'lec5.informationtechnology@kiu.ac.ug', 'Lecturer', 'Faculty of Computing & Informatics', 'Information Technology', 'STF/2026/0012'),
    ],
    students: [
      createUser('Faith Nalubega', 'std1.informationtechnology@kiu.ac.ug', 'Student', 'Faculty of Computing & Informatics', 'Information Technology', '2026/KIU/IT001'),
      createUser('Henry Ssembatya', 'std2.informationtechnology@kiu.ac.ug', 'Student', 'Faculty of Computing & Informatics', 'Information Technology', '2026/KIU/IT002'),
      createUser('Irene Namutebi', 'std3.informationtechnology@kiu.ac.ug', 'Student', 'Faculty of Computing & Informatics', 'Information Technology', '2026/KIU/IT003'),
      createUser('Joel Twinamatsiko', 'std4.informationtechnology@kiu.ac.ug', 'Student', 'Faculty of Computing & Informatics', 'Information Technology', '2026/KIU/IT004'),
      createUser('Kevin Ochan', 'std5.informationtechnology@kiu.ac.ug', 'Student', 'Faculty of Computing & Informatics', 'Information Technology', '2026/KIU/IT005'),
    ],
  },
  {
    faculty: 'Faculty of Computing & Informatics',
    department: 'Software Engineering',
    hod: createUser(
      'Isaac Kato',
      'hod.softwareengineering@kiu.ac.ug',
      'HOD',
      'Faculty of Computing & Informatics',
      'Software Engineering',
      'STF/2026/0013',
    ),
    lecturers: [
      createUser('Mark Turyasingura', 'lec1.softwareengineering@kiu.ac.ug', 'Lecturer', 'Faculty of Computing & Informatics', 'Software Engineering', 'STF/2026/0014'),
      createUser('Peace Atuhaire', 'lec2.softwareengineering@kiu.ac.ug', 'Lecturer', 'Faculty of Computing & Informatics', 'Software Engineering', 'STF/2026/0015'),
      createUser('Ronald Ssekandi', 'lec3.softwareengineering@kiu.ac.ug', 'Lecturer', 'Faculty of Computing & Informatics', 'Software Engineering', 'STF/2026/0016'),
      createUser('Sharon Mirembe', 'lec4.softwareengineering@kiu.ac.ug', 'Lecturer', 'Faculty of Computing & Informatics', 'Software Engineering', 'STF/2026/0017'),
      createUser('Victor Twinomujuni', 'lec5.softwareengineering@kiu.ac.ug', 'Lecturer', 'Faculty of Computing & Informatics', 'Software Engineering', 'STF/2026/0018'),
    ],
    students: [
      createUser('Lillian Auma', 'std1.softwareengineering@kiu.ac.ug', 'Student', 'Faculty of Computing & Informatics', 'Software Engineering', '2026/KIU/SE001'),
      createUser('Martin Sserwanja', 'std2.softwareengineering@kiu.ac.ug', 'Student', 'Faculty of Computing & Informatics', 'Software Engineering', '2026/KIU/SE002'),
      createUser('Naomi Kyomugisha', 'std3.softwareengineering@kiu.ac.ug', 'Student', 'Faculty of Computing & Informatics', 'Software Engineering', '2026/KIU/SE003'),
      createUser('Oscar Muhwezi', 'std4.softwareengineering@kiu.ac.ug', 'Student', 'Faculty of Computing & Informatics', 'Software Engineering', '2026/KIU/SE004'),
      createUser('Patricia Aciro', 'std5.softwareengineering@kiu.ac.ug', 'Student', 'Faculty of Computing & Informatics', 'Software Engineering', '2026/KIU/SE005'),
    ],
  },
  {
    faculty: 'Faculty of Computing & Informatics',
    department: 'Data Science',
    hod: createUser(
      'Miriam Ayo',
      'hod.datascience@kiu.ac.ug',
      'HOD',
      'Faculty of Computing & Informatics',
      'Data Science',
      'STF/2026/0019',
    ),
    lecturers: [
      createUser('Anna Akello', 'lec1.datascience@kiu.ac.ug', 'Lecturer', 'Faculty of Computing & Informatics', 'Data Science', 'STF/2026/0020'),
      createUser('David Otema', 'lec2.datascience@kiu.ac.ug', 'Lecturer', 'Faculty of Computing & Informatics', 'Data Science', 'STF/2026/0021'),
      createUser('Grace Alupo', 'lec3.datascience@kiu.ac.ug', 'Lecturer', 'Faculty of Computing & Informatics', 'Data Science', 'STF/2026/0022'),
      createUser('Moses Okello', 'lec4.datascience@kiu.ac.ug', 'Lecturer', 'Faculty of Computing & Informatics', 'Data Science', 'STF/2026/0023'),
      createUser('Ruth Chebet', 'lec5.datascience@kiu.ac.ug', 'Lecturer', 'Faculty of Computing & Informatics', 'Data Science', 'STF/2026/0024'),
    ],
    students: [
      createUser('Queen Nakato', 'std1.datascience@kiu.ac.ug', 'Student', 'Faculty of Computing & Informatics', 'Data Science', '2026/KIU/DS001'),
      createUser('Richard Okidi', 'std2.datascience@kiu.ac.ug', 'Student', 'Faculty of Computing & Informatics', 'Data Science', '2026/KIU/DS002'),
      createUser('Stella Namirembe', 'std3.datascience@kiu.ac.ug', 'Student', 'Faculty of Computing & Informatics', 'Data Science', '2026/KIU/DS003'),
      createUser('Timothy Opiro', 'std4.datascience@kiu.ac.ug', 'Student', 'Faculty of Computing & Informatics', 'Data Science', '2026/KIU/DS004'),
      createUser('Violet Achieng', 'std5.datascience@kiu.ac.ug', 'Student', 'Faculty of Computing & Informatics', 'Data Science', '2026/KIU/DS005'),
    ],
  },
  {
    faculty: 'Faculty of Business',
    department: 'Business Admin',
    hod: createUser(
      'Brian Ssenkaaba',
      'hod.businessadmin@kiu.ac.ug',
      'HOD',
      'Faculty of Business',
      'Business Admin',
      'STF/2026/0025',
    ),
    lecturers: [
      createUser('Sentongo Sayid', 'ssayid@kiu.ac.ug', 'Lecturer', 'Faculty of Business', 'Business Admin', 'STF/2026/0026'),
      createUser('Brenda Nakalema', 'lec2.businessadmin@kiu.ac.ug', 'Lecturer', 'Faculty of Business', 'Business Admin', 'STF/2026/0027'),
      createUser('Charles Byaruhanga', 'lec3.businessadmin@kiu.ac.ug', 'Lecturer', 'Faculty of Business', 'Business Admin', 'STF/2026/0028'),
      createUser('Diana Naigaga', 'lec4.businessadmin@kiu.ac.ug', 'Lecturer', 'Faculty of Business', 'Business Admin', 'STF/2026/0029'),
      createUser('Peter Walusimbi', 'lec5.businessadmin@kiu.ac.ug', 'Lecturer', 'Faculty of Business', 'Business Admin', 'STF/2026/0030'),
    ],
    students: [
      createUser('Winnie Nantege', 'std1.businessadmin@kiu.ac.ug', 'Student', 'Faculty of Business', 'Business Admin', '2026/KIU/BA001'),
      createUser('Xavier Mugerwa', 'std2.businessadmin@kiu.ac.ug', 'Student', 'Faculty of Business', 'Business Admin', '2026/KIU/BA002'),
      createUser('Yvonne Atuhairwe', 'std3.businessadmin@kiu.ac.ug', 'Student', 'Faculty of Business', 'Business Admin', '2026/KIU/BA003'),
      createUser('Zedekiah Ssenyonjo', 'std4.businessadmin@kiu.ac.ug', 'Student', 'Faculty of Business', 'Business Admin', '2026/KIU/BA004'),
      createUser('Tracy Namuli', 'std5.businessadmin@kiu.ac.ug', 'Student', 'Faculty of Business', 'Business Admin', '2026/KIU/BA005'),
    ],
  },
];

export const demoUsers = demoDepartments.flatMap((group) => [
  group.hod,
  ...group.lecturers,
  ...group.students,
]);
