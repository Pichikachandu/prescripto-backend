import mongoose from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcrypt';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import doctorModel from '../models/doctorModel.js';
import appointmentModel from '../models/appointmentModel.js';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import express from 'express';
import authAdmin from '../middlewares/authAdmin.js';
import userModel from '../models/userModel.js';

// Load environment variables
dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Create uploads directory if it doesn't exist
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '../uploads/temp');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Utility function to delete temp file
const deleteTempFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error('Error deleting temp file:', err);
    }
  }
};

// Set up multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1024 * 1024 * 5 // 5 MB
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error('Please upload a valid image file'));
    }
    cb(undefined, true);
  }
});

// API for adding doctor
const addDoctor = async (req, res) => {
  try {
    // Validate image URL
    if (!req.body.image || typeof req.body.image !== 'string') {
      return res.status(400).json({ success: false, message: "Doctor image is required and must be a valid image URL" });
    }

    // Optional: Validate other required fields here

    // Check for duplicate email
    const existingDoctor = await doctorModel.findOne({ email: req.body.email });
    if (existingDoctor) {
      return res.status(400).json({ success: false, message: "Doctor with this email already exists" });
    }

    // Hash the password before saving
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);

    // Create doctor with hashed password
    const doctorData = {
      ...req.body,
      password: hashedPassword
    };

    const doctor = new doctorModel(doctorData);
    await doctor.save();
    res.json({ success: true, message: "Doctor added successfully!" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// API for admin Login
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      const token = jwt.sign({ email, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1d' })
      return res.json({ success: true, token })
    } else {
      res.json({ success: false, message: "Invalid credentials" })
    }

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })

  }
}

// API to get all doctor list for admin panel
const allDoctors = async (req, res) => {
  try {
    const doctors = await doctorModel.find({}).select('-password');
    res.json({ success: true, doctors });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching doctors',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// API to get all appointment list
const appointmentsAdmin = async (req, res) => {
  try {
    const appointments = await appointmentModel.find({})
    res.json({ success: true, appointments })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }

}

// API for appointment cancellation
const appointmentCancel = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { appointmentId } = req.body;

    if (!appointmentId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: "Appointment ID is required" });
    }

    const appointment = await appointmentModel.findById(appointmentId).session(session);
    if (!appointment) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    // Check if already cancelled
    if (appointment.cancelled) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: "Appointment is already cancelled" });
    }

    // Mark appointment as cancelled
    const updatedAppointment = await appointmentModel.findByIdAndUpdate(
      appointmentId,
      { $set: { cancelled: true, cancelledAt: new Date() } },
      { session, new: true }
    );

    // Releasing doctor slot
    const { docId, slotDate, slotTime } = appointment;
    await doctorModel.findByIdAndUpdate(
      docId,
      { $pull: { [`slots_booked.${slotDate}`]: slotTime } },
      { session }
    );

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "Appointment cancelled successfully",
      appointment: updatedAppointment
    });

  } catch (error) {
    // If there's an error, abort the transaction
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();

    console.error('Error cancelling appointment:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to cancel appointment"
    });
  }
}
// API to get dashboard data for admin panel
const adminDashboard = async (req, res) => {
  try {
    const doctors = await doctorModel.find({})
    const appointments = await appointmentModel.find({})
    const users = await userModel.find({})

    const dashData = {
      doctors: doctors.length,
      appointments: appointments.length,
      patients: users.length,
      latestAppointments: appointments.reverse().slice(0, 5)
    }
    res.json({ success: true, dashData })

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// Initialize router
const router = express.Router();

// Define routes
router.post('/add-doctor', authAdmin, upload.single('image'), addDoctor);
router.get('/all-doctors', authAdmin, allDoctors);
router.post('/login', loginAdmin);

// Export the router as default and named exports for individual functions
export {
  addDoctor,
  loginAdmin,
  allDoctors,
  appointmentsAdmin,
  appointmentCancel,
  adminDashboard
};

export default router;