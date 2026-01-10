import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Transaction from '@/models/Transaction';

import User from '@/models/User';

export async function PUT(req, { params }) {
    try {
        await dbConnect();
        const { id } = params;
        const { status } = await req.json();

        if (!['pending', 'completed', 'rejected', 'revoked'].includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        const transaction = await Transaction.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!transaction) {
            return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
        }

        // If approved, grant access to the user
        if (status === 'completed') {
            const user = await User.findOne({ email: transaction.userId }); // userId usually stores email in our logic
            if (user) {
                if (!user.purchasedBooks.includes(transaction.bookId)) {
                    user.purchasedBooks.push(transaction.bookId);
                    await user.save();
                }
            }
        }

        return NextResponse.json(transaction);
    } catch (error) {
        console.error("Order update failed:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
