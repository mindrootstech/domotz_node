import mongoose from 'mongoose';

const { Schema } = mongoose;

const userSchema = new Schema({
    firstname: { type: String, required: true },
    lastname: { type: String },
    phonenumber: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'customer' },
}, { timestamps: true });

export default mongoose.model('User', userSchema, 'users');
