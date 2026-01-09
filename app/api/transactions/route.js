import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Transaction from "@/models/Transaction";
import User from "@/models/User";

// POST: Record a new purchase
export async function POST(request) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookId, bookTitle, price } = await request.json();

    if (!bookId || !bookTitle || price === undefined) {
        return NextResponse.json({ error: 'Missing transaction details' }, { status: 400 });
    }

    await dbConnect();

    try {
        // 1. Create Transaction Record
        const newTransaction = await Transaction.create({
            userId: session.user.email, // Using email as ID for simplicity consistent with auth
            userEmail: session.user.email,
            bookId,
            bookTitle,
            price,
            status: 'completed' // Assuming immediate success for mock payment
        });

        // 2. Add Book to User's Library
        // Use $addToSet to prevent duplicates
        await User.findOneAndUpdate(
            { email: session.user.email },
            { $addToSet: { purchasedBooks: bookId } }
        );

        return NextResponse.json({ success: true, transactionId: newTransaction._id });

    } catch (error) {
        console.error("Transaction Error:", error);
        return NextResponse.json({ error: 'Transaction failed' }, { status: 500 });
    }
}

// GET: Fetch all transactions (Admin only)
export async function GET(request) {
    const session = await getServerSession(authOptions);

    if (!session) { // Add admin check here in real app
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Basic Admin Check
    if (session.user.email !== 'sarkartanish2802@gmail.com') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const transactions = await Transaction.find({}).sort({ date: -1 });

    return NextResponse.json(transactions);
}
