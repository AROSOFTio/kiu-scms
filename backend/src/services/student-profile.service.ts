import { db } from '../config/database';

export const STUDENT_PROFILE_MISSING_MESSAGE =
  'This account is missing a student profile. Select your department to continue, or ask an administrator to link your student record.';

export const STUDENT_PROFILE_DEPARTMENT_MESSAGE =
  'Your student profile does not have a valid department yet. Select your department to continue, or ask an administrator to update your record.';

export interface StudentProfileScope {
  studentId: number;
  studentNumber: string;
  departmentId: number;
  facultyId: number;
}

export interface StudentProfileResolution {
  profile: StudentProfileScope | null;
  status: 'ready' | 'missing_profile' | 'invalid_department';
  message: string;
  created?: boolean;
  updated?: boolean;
}

const buildPlaceholderStudentNumber = (userId: number) => `TEMP/${new Date().getFullYear()}/${userId}`;

const loadProfile = async (userId: number): Promise<StudentProfileResolution> => {
  const [rows]: any = await db.query(
    `SELECT s.id as student_id, s.student_number, s.department_id, d.faculty_id
     FROM students s
     LEFT JOIN departments d ON d.id = s.department_id
     WHERE s.user_id = ?
     LIMIT 1`,
    [userId],
  );

  if (rows.length === 0) {
    return {
      profile: null,
      status: 'missing_profile',
      message: STUDENT_PROFILE_MISSING_MESSAGE,
    };
  }

  const row = rows[0];
  if (!row.department_id || !row.faculty_id) {
    return {
      profile: null,
      status: 'invalid_department',
      message: STUDENT_PROFILE_DEPARTMENT_MESSAGE,
    };
  }

  return {
    profile: {
      studentId: row.student_id,
      studentNumber: row.student_number,
      departmentId: row.department_id,
      facultyId: row.faculty_id,
    },
    status: 'ready',
    message: 'Student profile is ready.',
  };
};

const getValidDepartment = async (departmentId: number) => {
  const [rows]: any = await db.query(
    'SELECT id, faculty_id FROM departments WHERE id = ? LIMIT 1',
    [departmentId],
  );
  return rows.length > 0 ? rows[0] : null;
};

export const findStudentProfile = async (userId: number): Promise<StudentProfileResolution> => loadProfile(userId);

export const ensureStudentProfile = async (
  userId: number,
  departmentId?: number | string | null,
): Promise<StudentProfileResolution> => {
  const current = await loadProfile(userId);
  if (current.status === 'ready') {
    return current;
  }

  const normalizedDepartmentId = Number(departmentId);
  if (!Number.isInteger(normalizedDepartmentId) || normalizedDepartmentId <= 0) {
    return current;
  }

  const department = await getValidDepartment(normalizedDepartmentId);
  if (!department) {
    return {
      profile: null,
      status: 'invalid_department',
      message: 'Selected department is invalid. Choose a valid department and try again.',
    };
  }

  const [existingRows]: any = await db.query(
    'SELECT id FROM students WHERE user_id = ? LIMIT 1',
    [userId],
  );

  if (existingRows.length === 0) {
    await db.query(
      `INSERT INTO students (user_id, student_number, department_id)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE department_id = VALUES(department_id)`,
      [userId, buildPlaceholderStudentNumber(userId), normalizedDepartmentId],
    );

    const resolved = await loadProfile(userId);
    return {
      ...resolved,
      created: resolved.status === 'ready',
    };
  }

  await db.query(
    'UPDATE students SET department_id = ? WHERE user_id = ?',
    [normalizedDepartmentId, userId],
  );

  const resolved = await loadProfile(userId);
  return {
    ...resolved,
    updated: resolved.status === 'ready',
  };
};
