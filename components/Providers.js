"use client";

import { StoreProvider } from "@/context/StoreContext";
import { ToastProvider } from "@/context/ToastContext";
import { SessionProvider } from "next-auth/react";

export default function Providers({ children }) {
    return (
        <SessionProvider>
            <ToastProvider>
                <StoreProvider>
                    {children}
                </StoreProvider>
            </ToastProvider>
        </SessionProvider>
    );
}
