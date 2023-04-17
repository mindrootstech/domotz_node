import mongoose from 'mongoose';

const { Schema } = mongoose;

const adminSchema = new Schema({
    firstname: { type: String },
    lasttname: { type: String },
    username: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'admin' },
}, { timestamps: true });

export default mongoose.model('Admin', adminSchema, 'admin');
