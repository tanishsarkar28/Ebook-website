import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";

// GET: Fetch purchased books and reading progress
export async function GET(request) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
        purchasedBooks: user.purchasedBooks || [],
        readingProgress: user.readingProgress || {},
        image: user.image
    });
}

// POST: Update reading progress
export async function POST(request) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookId, page } = await request.json();

    if (!bookId || page === undefined) {
        return NextResponse.json({ error: 'Missing bookId or page' }, { status: 400 });
    }

    await dbConnect();

    // Use findOneAndUpdate to atomically update the map entry
    // Note: Mongoose Maps use 'set'
    const user = await User.findOne({ email: session.user.email });

    if (user) {
        // Initialize if undefined (though schema default handles this)
        if (!user.readingProgress) user.readingProgress = new Map();

        user.readingProgress.set(bookId, page);
        await user.save();
        return NextResponse.json({ success: true });
    } else {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
}
