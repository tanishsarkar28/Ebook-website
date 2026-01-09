import dbConnect from "@/lib/db";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        await dbConnect();

        const { email, password } = await request.json();

        // Find user
        // We strictly select the password field if it was excluded by default in schema (it's not, but good practice)
        const user = await User.findOne({ email });

        if (!user) {
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            );
        }

        // Check Password
        // In production, use bcrypt.compare(password, user.password)
        // For this prototype, we are doing simple string comparison as requested initially (or implied by lack of auth lib)
        if (user.password !== password) {
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            );
        }

        return NextResponse.json({
            success: true,
            user: {
                name: user.name,
                email: user.email,
                isAdmin: user.email === 'sarkartanish2802@gmail.com',
            },
        });
    } catch (error) {
        console.error("Login Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
