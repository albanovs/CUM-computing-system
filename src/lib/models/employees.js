import mongoose from "mongoose";

const EmployeesSchema = new mongoose.Schema({
    data_register: { type: Date, default: Date.now },
    name: String,
    phoneNumber: String,
    isWorking: Boolean,
    details: [{
        client: {
            name: String,
            price: Number,
            id: String,
            date: { type: Date, default: Date.now },
        }
    }]
}, { timestamps: true });

export const employeesModel =
    mongoose.models.employees ||
    mongoose.model('employees', EmployeesSchema);
