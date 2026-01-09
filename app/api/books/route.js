import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Book from "@/models/Book";
import { books as initialBooks } from "@/lib/books";

// GET: Fetch all books
export async function GET(request) {
    try {
        await dbConnect();
        let books = await Book.find({});

        // Auto-Seed removed to allow deleting all books
        // if (books.length === 0) { ... }

        // Return reversed to show newest first? Or just default.
        return NextResponse.json(books);
    } catch (error) {
        console.error("Failed to fetch books:", error);
        return NextResponse.json({ error: 'Failed to fetch books' }, { status: 500 });
    }
}

// POST: Create a new book (Admin only)
export async function POST(request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const body = await request.json();
        await dbConnect();

        const newBook = await Book.create({
            title: body.title,
            author: body.author,
            price: body.price,
            description: body.description,
            image: body.coverImage, // Front-end sends 'coverImage', schema calls it 'image'
            gradient: body.gradient,
            content: body.content,
        });

        return NextResponse.json(newBook, { status: 201 });
    } catch (error) {
        console.error("Failed to create book:", error);
        return NextResponse.json({ error: 'Failed to create book' }, { status: 500 });
    }
}
