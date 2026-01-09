"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function LayoutWrapper({ children }) {
    const pathname = usePathname();
    const isReaderPage = pathname?.startsWith("/reader/");

    return (
        <>
            {!isReaderPage && <Navbar />}
            <main>{children}</main>
            {!isReaderPage && <Footer />}
        </>
    );
}
