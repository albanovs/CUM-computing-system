import mongoose from 'mongoose';

const warehouseSchema = new mongoose.Schema({
    data_register: { type: Date, default: Date.now },
    IMEI: String,
    phoneModel: String,
    color: String,
    storage: String,
    price: Number,
    duty: Boolean,
    dutyDetail: {
        data_register: { type: Date, default: Date.now },
        name: String,
        department: String,
        PhoneNumber: String,
        returnDate: Date,
        comment: String,
    },
    comment: String,
    currency: [{ type: String, default: 'СОМ', enum: ['СОМ', 'USD'] }],
}, { timestamps: true });

export const warehouseModel = mongoose.models.warehouse || mongoose.model('warehouse', warehouseSchema);
