import express from 'express';
import { addDoctor, loginAdmin, allDoctors, appointmentsAdmin, appointmentCancel, adminDashboard } from '../controllers/adminController.js';
import authAdmin from '../middlewares/authAdmin.js';
import { changeAvailability } from '../controllers/doctorController.js';

const router = express.Router();

// Simple route to test if API is working
router.get('/test', (req, res) => {
  res.status(200).json({ success: true, message: 'API is working' });
});

router.post('/admin/add-doctor', authAdmin, addDoctor);
router.post('/admin/login', loginAdmin);
router.get('/admin/all-doctors', authAdmin, allDoctors);
router.post('/admin/change-availability', authAdmin, changeAvailability);
router.get('/admin/appointments', authAdmin, appointmentsAdmin);
router.post('/admin/appointment-cancel', authAdmin, appointmentCancel);
router.get('/admin/dashboard', authAdmin, adminDashboard);
// ...add other routes as needed...

export default router;