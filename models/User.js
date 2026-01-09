import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name'],
        maxlength: [60, 'Name cannot be more than 60 characters'],
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
    // In a real app, you would hash this password!
    password: {
        type: String,
        required: false, // Optional for now since we mock generic logins
    },
    image: {
        type: String,
    },
    purchasedBooks: {
        type: [String], // Array of Book IDs
        default: [],
    },
    readingProgress: {
        type: Map,
        of: Number, // Book ID -> Page Number
        default: {},
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
