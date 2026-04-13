import { Router } from 'express';
import { 
  loginUser, 
  registerStudent, 
  getCurrentUser, 
  forgotPassword, 
  resetPassword,
  getPublicDepartments,
  getPublicFaculties
} from '../../controllers/auth.controller';
import { requireAuth } from '../../middlewares/auth.middleware';

const router = Router();

router.post('/login', loginUser);
router.post('/register/student', registerStudent);
router.get('/departments', getPublicDepartments);
router.get('/faculties', getPublicFaculties);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

router.get('/me', requireAuth, getCurrentUser);


export default router;
