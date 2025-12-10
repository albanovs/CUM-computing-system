import mongoose from 'mongoose';

const DutySchema = new mongoose.Schema({
    data_register: { type: Date, default: Date.now },
    name: String,
    department: String,
    PhoneNumber: String,
    price: Number,
    currency: { type: String, enum: ['СОМ', 'USD'], default: 'СОМ' },
    return: Boolean,
    returnDate: Date,
    comment: String,
}, { timestamps: true });

export const dutyModel = mongoose.models.duty || mongoose.model('duty', DutySchema);
