import mongoose from "mongoose";

// Log when the model is being created
console.log('🔧 Initializing doctor model...');

const doctorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    image: { type: String, required: true },
    speciality: { type: String, required: true },
    degree: { type: String, required: true },
    experience: { type: String, required: true },
    about: { type: String, required: true },
    availability: { type: Boolean, required: true },
    fees: { type: Number, required: true },
    address: { type: Object, required: true },
    date: { type: Number, required: true },
}, { 
    minimize: false,
    collection: 'doctors' // Explicitly set the collection name
});

// Add debug logging for schema registration
doctorSchema.post('save', function(doc) {
    console.log(`💾 Doctor saved: ${doc._id}`);
});

// Check if the model already exists to prevent OverwriteModelError
let doctorModel;
try {
    doctorModel = mongoose.model('doctor');
    console.log('✅ Using existing doctor model');
} catch (e) {
    doctorModel = mongoose.model('doctor', doctorSchema);
    console.log('✨ Created new doctor model');
}

// Log the collection name
console.log(`📁 Doctor model will use collection: '${doctorModel.collection.name}'`);

export default doctorModel;
