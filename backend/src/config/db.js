import mongoose from "mongoose";

const connectToDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(process.env.MONGO_URI);

    console.log(`[Database] Connected to MongoDB`);
    
    mongoose.connection.on("disconnected", () => {
      console.warn("[Database] Lost connection to MongoDB.");
    });

  } catch (error) {
    console.error("[Fatal Error] MongoDB connection failed.");
    console.error(error.message);

    throw error; 
  } 
};

export default connectToDB;