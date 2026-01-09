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

        // Auto-Seed if empty
        if (books.length === 0) {
            console.log("Seeding database with initial books...");
            // Remove IDs from initialBooks to let Mongo generate them, or keep them if they are safe strings?
            // lib/books.js has numeric IDs. Mongo uses ObjectIds.
            // Let's map them to match schema.
            const seedData = initialBooks.map(b => ({
                title: b.title,
                author: b.author,
                price: b.price,
                description: b.description,
                image: b.image,
                gradient: b.gradient,
                contentFile: b.contentFile
            }));

            books = await Book.insertMany(seedData);
        }

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
