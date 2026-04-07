import { Router } from 'express';
import { 
  loginUser, 
  registerStudent, 
  getCurrentUser, 
  forgotPassword, 
  resetPassword,
  getPublicDepartments
} from '../../controllers/auth.controller';
import { requireAuth } from '../../middlewares/auth.middleware';

const router = Router();

router.post('/login', loginUser);
router.post('/register/student', registerStudent);
router.get('/departments', getPublicDepartments);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

router.get('/me', requireAuth, getCurrentUser);

// Temporary hook to safely generate actual valid Bcrypt Hashes and inject into the live server database
router.get('/fix-passwords', async (req, res) => {
    try {
        const bcrypt = require('bcrypt');
        const { db } = require('../../config/database');
        
        const h1 = await bcrypt.hash('Admin@1234', 10);
        const h2 = await bcrypt.hash('Staff@1234', 10);
        const h3 = await bcrypt.hash('Student@1234', 10);

        await db.query('UPDATE users SET password_hash = ? WHERE role_id = 1', [h1]);
        await db.query('UPDATE users SET password_hash = ? WHERE role_id = 2', [h2]);
        await db.query('UPDATE users SET password_hash = ? WHERE role_id = 3', [h3]);

        res.json({ success: true, message: "Hashes injected successfully. You can now securely login." });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
