import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  plan_date: { type: Date, required: true },
  plan: { type: Number, required: true },
  paid: { type: Number, default: 0 },
  comment: String,
  overdueDays: { type: Number, default: 0 },
  currency: { type: String, enum: ['СОМ', 'USD'], default: 'СОМ' },
});

const installmentSchema = new mongoose.Schema({
  data_register: { type: Date, default: Date.now },
  code: String,
  name: String,
  phoneNumber: String,
  address: String,
  comment: String,
  product: [],
  dopNumber: [],
  currency: { type: String, enum: ['СОМ', 'USD'], default: 'СОМ' },
  employees: { name: String, price: Number, id: String },
  paymentDay: { type: Number, min: 1, max: 31 },
  installmentTerm: Number,
  firstPaymentAmount: { type: Number, default: 0 },
  payments: [paymentSchema],
  remainingAmount: Number,
}, { timestamps: true });

export const InstallmentModel = mongoose.models.Installment || mongoose.model('Installment', installmentSchema);
