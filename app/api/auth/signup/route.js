import dbConnect from "@/lib/db";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        await dbConnect();

        const { name, email, password } = await request.json();

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json(
                { error: "User already exists" },
                { status: 400 }
            );
        }

        // Create new user
        const user = await User.create({
            name,
            email,
            password, // Note: In a production app, HASH this password with bcrypt!
        });

        return NextResponse.json({
            success: true,
            user: {
                name: user.name,
                email: user.email,
                isAdmin: user.email === 'sarkartanish2802@gmail.com',
            },
        });
    } catch (error) {
        console.error("Signup Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
