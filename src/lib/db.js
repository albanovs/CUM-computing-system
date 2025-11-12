import mongoose from 'mongoose';

export const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;

  try {
    await mongoose.connect(
      'mongodb+srv://adikzholdoshbekov:EIcGdcBjVsU2reek@cluster0.5d3dnsn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log('✅ DB connected');
  } catch (error) {
    console.error('❌ DB connection error', error);
  }
};
