import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Book from "@/models/Book";

// PUT: Update a book
export async function PUT(request, context) {
    const session = await getServerSession(authOptions);
    // Await params
    const { id } = await context.params;

    if (!session || !session.user.isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const body = await request.json();
        await dbConnect();

        const updatedBook = await Book.findByIdAndUpdate(
            id,
            {
                title: body.title,
                author: body.author,
                price: body.price,
                description: body.description,
                image: body.coverImage || body.image,
                gradient: body.gradient,
                content: body.content,
            },
            { new: true, runValidators: true }
        );

        if (!updatedBook) {
            return NextResponse.json({ error: 'Book not found' }, { status: 404 });
        }

        return NextResponse.json(updatedBook);
    } catch (error) {
        console.error("Failed to update book:", error);
        return NextResponse.json({ error: 'Failed to update book' }, { status: 500 });
    }
}

// DELETE: Remove a book
export async function DELETE(request, context) {
    const session = await getServerSession(authOptions);
    const { id } = await context.params;

    if (!session || !session.user.isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        await dbConnect();
        const deletedBook = await Book.findByIdAndDelete(id);

        if (!deletedBook) {
            return NextResponse.json({ error: 'Book not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete book:", error);
        return NextResponse.json({ error: 'Failed to delete book' }, { status: 500 });
    }
}

// GET: Fetch single book (Public)
export async function GET(request, context) {
    const { id } = await context.params;
    await dbConnect();

    try {
        const book = await Book.findById(id);
        if (!book) {
            return NextResponse.json({ error: 'Book not found' }, { status: 404 });
        }
        return NextResponse.json(book);
    } catch (error) {
        return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }
}
