"use client";

export default function Template({ children }) {
    return (
        <div className="animate-blur-in">
            {children}
        </div>
    );
}
