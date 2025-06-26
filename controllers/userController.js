import validator from 'validator';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import userModel from '../models/userModel.js';
import appointmentModel from '../models/appointmentModel.js';
import doctorModel from '../models/doctorModel.js';
import { v2 as cloudinary } from 'cloudinary';

// API to register user
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: "All fields are required" })
        }
        // validatin email format
        if (!validator.isEmail(email)) {
            return res.status(400).json({ success: false, message: "Invalid email" })
        }
        // validating strong password
        if (password.length < 8) {
            return res.status(400).json({ success: false, message: "Password must be at least 8 characters long" })
        }

        // hashing user password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const userData = {
            name,
            email,
            password: hashedPassword
        }

        const newUser = new userModel(userData)
        const user = await newUser.save()

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' })

        res.json({ success: true, message: "User registered successfully", token })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}
// API to login user
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email })

        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" })
        }
        const isMatch = await bcrypt.compare(password, user.password)
        if (isMatch) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' })
            res.json({ success: true, message: "User logged in successfully", token })
        } else {
            return res.status(400).json({ success: false, message: "Invalid credentials" })
        }
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get user profile data
const getProfile = async (req, res) => {
    try {
        // Get user ID from the authenticated request
        const userId = req.user.id;

        // Find user by ID and exclude password
        const userData = await userModel.findById(userId).select('-password');

        if (!userData) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({
            success: true,
            message: 'User profile fetched successfully',
            user: userData
        });
    } catch (error) {
        console.error('Error in getProfile:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
};

// API to update user profile data
const updateProfile = async (req, res) => {
    try {
        // Get user ID from authenticated request
        const userId = req.user.id;
        const { name, phone, address, dob, gender } = req.body;
        const imageFile = req.file;

        // Basic validation
        if (!name || !phone || !dob || !gender) {
            return res.status(400).json({ 
                success: false, 
                message: "Name, phone, date of birth, and gender are required" 
            });
        }

        // Prepare update data
        const updateData = { 
            name, 
            phone, 
            dob, 
            gender 
        };

        // Parse address if provided
        if (address) {
            try {
                updateData.address = typeof address === 'string' ? JSON.parse(address) : address;
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid address format. Must be a valid JSON string.'
                });
            }
        }

        // Handle image upload if file exists
        if (imageFile) {
            try {
                // Upload image to Cloudinary using the buffer since we're using memory storage
                const imageUpload = await cloudinary.uploader.upload(
                    `data:${imageFile.mimetype};base64,${imageFile.buffer.toString('base64')}`, 
                    {
                        resource_type: 'image',
                        folder: 'user-profiles',
                        public_id: `user-${userId}-${Date.now()}`
                    }
                );
                updateData.image = imageUpload.secure_url;
            } catch (uploadError) {
                console.error('Error uploading image:', uploadError);
                return res.status(500).json({
                    success: false,
                    message: 'Error uploading profile image'
                });
            }
        }

        // Find and update user
        const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user: updatedUser
        });

    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error updating profile'
        });
    }
};
// API to upload profile image
const uploadProfileImage = async (req, res) => {
    try {
        const userId = req.user.id;
        const imageFile = req.file;

        if (!imageFile) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided'
            });
        }

        // Upload image to Cloudinary
        const imageUpload = await cloudinary.uploader.upload(
            `data:${imageFile.mimetype};base64,${imageFile.buffer.toString('base64')}`,
            {
                resource_type: 'image',
                folder: 'user-profiles',
                public_id: `user-${userId}-${Date.now()}`,
                width: 500,
                height: 500,
                crop: 'fill',
                gravity: 'face',
                quality: 'auto',
                fetch_format: 'auto'
            }
        );

        // Update user with new image URL
        const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            { image: imageUpload.secure_url },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Profile image uploaded successfully',
            imageUrl: imageUpload.secure_url
        });

    } catch (error) {
        console.error('Error uploading profile image:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error uploading profile image'
        });
    }
};

// API to book appointment
const bookAppointment = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const { docId, slotDate, slotTime } = req.body;
        const userId = req.user.id;

        console.log('Booking request:', { docId, slotDate, slotTime });

        // 1. Check if the slot is already booked
        const existingAppointment = await appointmentModel.findOne({
            docId,
            slotDate,
            slotTime,
            cancelled: false
        }).session(session);

        if (existingAppointment) {
            await session.abortTransaction();
            session.endSession();
            return res.json({ 
                success: false, 
                message: "This slot is already booked. Please choose another time." 
            });
        }


        // 2. Get doctor data
        const doctor = await doctorModel.findById(docId).session(session);
        if (!doctor) {
            await session.abortTransaction();
            session.endSession();
            return res.json({ success: false, message: "Doctor not found" });
        }


        if (!doctor.availability) {
            await session.abortTransaction();
            session.endSession();
            return res.json({ success: false, message: "Doctor is not available for appointments" });
        }

        // 3. Get user data
        const userData = await userModel.findById(userId).select('-password').session(session);
        if (!userData) {
            await session.abortTransaction();
            session.endSession();
            return res.json({ success: false, message: "User not found" });
        }

        // 4. Create appointment
        const appointmentData = {
            userId,
            docId,
            userData,
            docData: {
                name: doctor.name,
                speciality: doctor.speciality,
                fees: doctor.fees,
                image: doctor.image,
                experience: doctor.experience,
                degree: doctor.degree,
                about: doctor.about
            },
            amount: doctor.fees,
            slotDate,
            slotTime,
            date: Date.now(),
            isCompleted: false,
            payment: false,
            cancelled: false
        };

        const newAppointment = new appointmentModel(appointmentData);
        await newAppointment.save({ session });

        // 5. Commit the transaction
        await session.commitTransaction();
        session.endSession();

        res.json({ 
            success: true, 
            message: "Appointment booked successfully",
            appointmentId: newAppointment._id
        });
    }catch(error){
        console.log(error)
        res.json({success:false, message:error.message})
    }
}
// API to get user appointments for frontend my-appointments page
const listAppointment = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log('Fetching appointments for user ID:', userId);
        
        // Find all appointments for the user
        const appointments = await appointmentModel.find({ userId });
            
        console.log('Raw appointments from DB:', JSON.stringify(appointments, null, 2));
        
        // Format the response to match frontend expectations
        const formattedAppointments = appointments.map(appointment => {
            // Convert date format from 25_6_2025 to 25-6-2025
            const formattedDate = appointment.slotDate ? appointment.slotDate.replace(/_/g, '-') : '';
            
            return {
                _id: appointment._id,
                slotDate: formattedDate,
                slotTime: appointment.slotTime,
                cancelled: appointment.cancelled || false,
                cancelledAt: appointment.cancelledAt || null,
                docData: {
                    name: appointment.docData?.name || 'Doctor',
                    speciality: appointment.docData?.speciality || 'General',
                    image: appointment.docData?.image || '/default-doctor.png',
                    docId: appointment.docId // Include docId for reference
                },
                userData: {
                    name: appointment.userData?.name || 'User',
                    address: appointment.userData?.address || { line1: '', line2: '' }
                },
                // Include other relevant fields that might be needed
                payment: appointment.payment || false,
                isCompleted: appointment.isCompleted || false
            };
        });
        
        console.log('Formatted appointments:', JSON.stringify(formattedAppointments, null, 2));
        
        res.json({ success: true, appointments: formattedAppointments });
    } catch (error) {
        console.error('Error in listAppointment:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch appointments',
            error: error.message 
        });
    }
}

// API to cancel appointment
const cancelAppointment = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const { appointmentId } = req.body;
        const userId = req.user.id; // Get userId from authenticated user
        
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

        // verify appointment user
        if (appointment.userId.toString() !== userId) {
            await session.abortTransaction();
            session.endSession();
            return res.status(403).json({ success: false, message: "Unauthorized action" });
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

// API to mark appointment as completed
const completeAppointment = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const { appointmentId } = req.body;
        const userId = req.user.id; // Get userId from authenticated user
        
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

        // verify appointment user
        if (appointment.userId.toString() !== userId) {
            await session.abortTransaction();
            session.endSession();
            return res.status(403).json({ success: false, message: "Unauthorized action" });
        }

        // Check if already completed
        if (appointment.isCompleted) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ success: false, message: "Appointment is already marked as completed" });
        }

        // Mark appointment as completed
        const updatedAppointment = await appointmentModel.findByIdAndUpdate(
            appointmentId,
            { $set: { isCompleted: true, completedAt: new Date() } },
            { session, new: true }
        );
        
        // Commit the transaction
        await session.commitTransaction();
        session.endSession();
        
        res.status(200).json({ 
            success: true, 
            message: "Appointment marked as completed successfully",
            appointment: updatedAppointment
        });
        
    } catch (error) {
        // If there's an error, abort the transaction
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        session.endSession();
        
        console.error('Error completing appointment:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || "Failed to mark appointment as completed" 
        });
    }
};

export { registerUser, loginUser, getProfile, updateProfile, uploadProfileImage, bookAppointment, listAppointment, cancelAppointment, completeAppointment }