import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true,
    },
    userEmail: { // Denormalized for easier display
        type: String,
        required: true,
    },
    bookId: {
        type: String,
        required: true,
    },
    bookTitle: {
        type: String, // Snapshot of title
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ['completed', 'pending', 'revoked', 'failed'],
        default: 'completed',
    },
    paymentId: { // For Stripe or other providers later
        type: String,
    },
    screenshot: {
        type: String, // Base64 string of the payment screenshot
    }
});

export default mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
