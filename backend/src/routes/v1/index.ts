import { Router } from 'express';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ message: 'API V1 operates normally' });
});

export default router;
