import mongoose from 'mongoose';

const cashPaymentSchema = new mongoose.Schema({
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'CashSession', required: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    amount: { type: Number, required: true },
    comment: { type: String },
    date: { type: Date, default: Date.now },
});

export default mongoose.models.CashPayment || mongoose.model('CashPayment', cashPaymentSchema);