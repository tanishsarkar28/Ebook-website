import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Transaction from '@/models/Transaction';

export async function POST(req) {
    try {
        await dbConnect();
        const data = await req.json();

        // Basic validation
        if (!data.bookId || !data.userId || !data.screenshot) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const transaction = await Transaction.create({
            userId: data.userId,
            userEmail: data.userName || data.userId, // Fallback if name not provided
            bookId: data.bookId,
            bookTitle: data.bookTitle,
            price: data.price,
            screenshot: data.screenshot,
            status: 'pending',
            date: new Date()
        });

        return NextResponse.json(transaction, { status: 201 });
    } catch (error) {
        console.error("Order creation failed:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(req) {
    try {
        await dbConnect();

        // In a real app, strict admin check here. 
        // For now, we return all for the admin dashboard.

        const transactions = await Transaction.find({}).sort({ date: -1 });
        return NextResponse.json(transactions);
    } catch (error) {
        console.error("Fetching orders failed:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
