import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  plan_date: { type: Date, required: true },
  plan: { type: Number, required: true },
  paid: { type: Number, default: 0 },
  comment: String,
  overdueDays: { type: Number, default: 0 },
});

const installmentSchema = new mongoose.Schema({
  data_register: { type: Date, default: Date.now },
  id: String,
  code: String,
  name: String,
  phoneNumber: String,
  address: String,
  comment: String,
  phoneModel: String,
  phonePrice: Number,
  paymentDay: { type: Number, min: 1, max: 31 },
  installmentTerm: Number,
  firstPaymentAmount: { type: Number, default: 0 },
  payments: [paymentSchema],
  remainingAmount: Number,
}, { timestamps: true });

export const InstallmentModel = mongoose.models.Installment || mongoose.model('Installment', installmentSchema);
