import mongoose from 'mongoose';

const BookSchema = new mongoose.Schema({
    title: { type: String, required: true },
    author: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String },
    image: { type: String },
    gradient: { type: String },
    content: { type: String }, // For direct text content
    contentFile: { type: String }, // For file path reference
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Book || mongoose.model('Book', BookSchema);
