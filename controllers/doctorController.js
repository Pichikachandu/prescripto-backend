import doctorModel from "../models/doctorModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import appointmentModel from "../models/appointmentModel.js";

const changeAvailability = async (req,res) => {
    try{
        const {docId}=req.body
        const docData = await doctorModel.findById(docId)
        await doctorModel.findByIdAndUpdate(docId,{availability:!docData.availability})
        res.json({success:true,message:"Availability changed successfully"})
    }catch (error) {
        console.log(error);
        res.json({success:false,message:error.message})
    }
}

const doctorList = async (req, res) => {
    try {
        console.log('🔍 Fetching doctors from database...');
        
        // Log the database connection info
        const db = mongoose.connection;
        console.log('📊 Database info:', {
            dbName: db.name,
            host: db.host,
            port: db.port,
            collections: (await db.db.listCollections().toArray()).map(c => c.name)
        });
        
        // Check if the collection exists
        const collections = await db.db.listCollections({ name: 'doctors' }).toArray();
        if (collections.length === 0) {
            console.warn('⚠️  Warning: "doctors" collection does not exist in the database');
        } else {
            console.log('✅ Found "doctors" collection');
            
            // Check document count
            const count = await doctorModel.countDocuments();
            console.log(`📊 Found ${count} doctors in the database`);
            
            if (count === 0) {
                console.log('ℹ️  No doctors found in the database');
            }
        }
        
        // Execute the query with logging
        const query = doctorModel.find({}).select(['-password', '-email']);
        console.log('🔍 Executing query:', query.getFilter());
        
        const doctors = await query.exec();
        console.log(`✅ Found ${doctors.length} doctors`);
        
        res.json({ success: true, doctors });
    } catch (error) {
        console.error('❌ Error in doctorList:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch doctors',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// API for Doctor Login
const loginDoctor = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Input validation
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: "Email and password are required" 
            });
        }

        // Find doctor by email (case-insensitive search)
        const doctor = await doctorModel.findOne({ 
            email: { $regex: new RegExp('^' + email + '$', 'i') } 
        }).select('+password'); // Explicitly select password field
        
        if (!doctor) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid email or password" 
            });
        }

        // Check if doctor is active
        if (doctor.availability === false) {
            return res.status(403).json({
                success: false,
                message: "Your account is not active. Please contact the administrator."
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, doctor.password);
        
        if (!isPasswordValid) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid email or password" 
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: doctor._id,
                email: doctor.email,
                name: doctor.name,
                role: 'doctor',
                speciality: doctor.speciality
            }, 
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Remove password from the response
        doctor.password = undefined;

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: doctor._id,
                name: doctor.name,
                email: doctor.email,
                role: 'doctor',
                speciality: doctor.speciality,
                image: doctor.image
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
}

// API to get doctor appointments for doctor panel
const appointmentsDoctor = async (req, res) => {
    try {
        // Get doctor ID from the authenticated request (set by authDoctor middleware)
        const docId = req.user?.id || req.body.docId;
        
        if (!docId) {
            console.error('No doctor ID found in request');
            return res.status(400).json({ 
                success: false, 
                message: 'Doctor ID is required' 
            });
        }

        console.log('Fetching appointments for doctor:', docId);
        
        // Find appointments and populate user details
        const appointments = await appointmentModel
            .find({ docId })
            .populate('userId', 'name email phone')
            .sort({ date: 1, time: 1 }); // Sort by date and time
            
        console.log(`Found ${appointments.length} appointments for doctor ${docId}`);
        
        res.json({ 
            success: true, 
            appointments,
            count: appointments.length
        });
    } catch(error){
      console.error('Error in appointmentsDoctor:', error);
      res.status(500).json({success:false, message: error.message})  
    }
}
// API to mark the appointment completed for doctor panel
const appointmentComplete = async (req,res) => {
    try{
    const {docId, appointmentId} = req.body
    const appointmentData = await appointmentModel.findById(appointmentId)
    if(appointmentData && appointmentData.docId === docId){
        await appointmentModel.findByIdAndUpdate(appointmentId,{isCompleted:true})
        return res.json({success:true,message:"Appointment completed successfully"})
    } else{
        return res.json({success:false,message:"Completion Failed"})
    }
    } catch(error){
        console.log(error)
        res.status(500).json({success:false, message: error.message})
    }
}
// API to cancel appointment for doctor panel
const appointmentCancel = async (req,res) => {
    try{
    const {docId, appointmentId} = req.body
    const appointmentData = await appointmentModel.findById(appointmentId)
    if(appointmentData && appointmentData.docId === docId){
        await appointmentModel.findByIdAndUpdate(appointmentId,{cancelled:true})
        return res.json({success:true,message:"Appointment cancelled successfully"})
    } else{
        return res.json({success:false,message:"Cancellation Failed"})
    }
    } catch(error){
        console.log(error)
        res.status(500).json({success:false, message: error.message})
    }
}

// API to get dashboard data for doctor panel
const doctorDashboard = async (req,res) => {
    try{
        const {docId} = req.body;
        const appointments = await appointmentModel.find({docId})
        let earnings = 0

        appointments.map((item)=>{
           if(item.isCompleted || item.payment){
            earnings += item.amount
           }
        })
        
        let patients =[]
        
        appointments.map((item)=>{
           if(!patients.includes(item.userId)){
            patients.push(item.userId)
           }
        })
    const dashData = {
        earnings,
        patients:patients.length,
        appointments: appointments.length,
        latestAppointments: appointments.reverse().slice(0, 5)
    }

    res.json({success:true,dashData})
    } catch(error){
        console.log(error)
        res.status(500).json({success:false, message: error.message})
    }
}

// API to get doctor profile data for doctor panel
const doctorProfile = async (req,res) => {
    try{
        const {docId} = req.body;
        const profileData = await doctorModel.findById(docId).select('-password')
        res.json({success:true,profileData})
    } catch(error){
        console.log(error)
        res.status(500).json({success:false, message: error.message})
    }
}

// API to update doctor profile data for doctor panel
const updateDoctorProfile = async (req,res) => {
    try{
        const {docId,fees,address,availability} = req.body;
        await doctorModel.findByIdAndUpdate(docId,{fees,address,availability})
        res.json({success:true,message:"Profile updated successfully"})
    } catch(error){
        console.log(error)
        res.status(500).json({success:false, message: error.message})
    }
}
export {changeAvailability,doctorList,loginDoctor,appointmentsDoctor,appointmentComplete,appointmentCancel,doctorDashboard,doctorProfile,updateDoctorProfile}