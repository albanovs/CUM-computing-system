import mongoose from "mongoose";

const OperationSchema = new mongoose.Schema({
    amount: Number,
    comment: String,
    paymentType: { type: String, enum: ["cash", "non-cash"], default: "cash" },
    createdAt: { type: Date, default: Date.now },
});

const CashSessionSchema = new mongoose.Schema({
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ["open", "closed"], default: "open" },
    income: [OperationSchema],
    expense: [OperationSchema],
}, { timestamps: true });

export default mongoose.models.CashSession || mongoose.model("CashSession", CashSessionSchema);