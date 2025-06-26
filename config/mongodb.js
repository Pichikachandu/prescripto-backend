import mongoose from "mongoose";

const connectDB = async () => {
    try {
        // Log the MongoDB URI (without password for security)
        const mongoUriForLogging = process.env.MONGODB_URI || '';
        const safeMongoUri = mongoUriForLogging.replace(/:[^:]*@/, ':***@');
        console.log(`🔌 Connecting to MongoDB: ${safeMongoUri.split('?')[0]}`);

        mongoose.connection.on("connected", () => {
            console.log("✅ MongoDB connected successfully");
            console.log(`   - Host: ${mongoose.connection.host}`);
            console.log(`   - Port: ${mongoose.connection.port}`);
            console.log(`   - Database: ${mongoose.connection.name}`);
        });

        mongoose.connection.on("error", (err) => {
            console.error("❌ MongoDB connection error:", err);
        });

        mongoose.connection.on("disconnected", () => {
            console.log("ℹ️  MongoDB disconnected");
        });

        const connectionOptions = {
            serverSelectionTimeoutMS: 10000, // Increased timeout to 10s
            socketTimeoutMS: 45000,
        };

        // Connect to MongoDB with explicit database name
        const mongoUri = process.env.MONGODB_URI || '';
        
        // Extract database name from URI if present
        const dbNameMatch = mongoUri.match(/\/\/(?:[^/]+\/){1}([^?]+)/);
        const dbName = dbNameMatch ? dbNameMatch[1] : 'test';
        
        console.log(`🔗 Using database: ${dbName}`);
        
        const conn = await mongoose.connect(mongoUri, {
            ...connectionOptions,
            dbName: dbName
        });
        
        // Get the database instance
        const db = mongoose.connection.db;
        console.log(`✅ Connected to database: ${db.databaseName}`);
        
        // List all collections for debugging
        const collections = await db.listCollections().toArray();
        console.log('📂 Available collections:', collections.map(c => c.name));
        
        // Check if doctors collection exists
        const doctorCollection = collections.find(c => c.name === 'doctors');
        if (!doctorCollection) {
            console.warn('⚠️  Warning: "doctors" collection not found in database');
        } else {
            // Check document count in doctors collection
            const count = await db.collection('doctors').countDocuments();
            console.log(`📊 Found ${count} documents in 'doctors' collection`);
        }

        return conn;
    } catch (error) {
        console.error("❌ MongoDB connection failed:", error);
        console.error('Connection string used:', process.env.MONGODB_URI ? 
            process.env.MONGODB_URI.replace(/:[^:]*@/, ':***@') : 'Not set');
        process.exit(1);
    }
};

export default connectDB;