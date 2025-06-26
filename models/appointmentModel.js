import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
    userId: {type: String, required:true},
    docId: {type: String, required:true},
    slotDate: {type: String, required:true},
    slotTime: {type: String, required:true},
    userData: {type: Object, required:true},
    docData: {type: Object, required:true},
    amount: {type: Number, required:true},
    date: {type: Number, required:true},
    cancelled: {type: Boolean, required: true, default: false},
    cancelledAt: {type: Date},
    payment: {type: Boolean, required: true},
    isCompleted: {type: Boolean, required: true, default: false},
    completedAt: {type: Date},
    
})

const appointmentModel = mongoose.models.appointment || mongoose.model("appointment", appointmentSchema);
export default appointmentModel