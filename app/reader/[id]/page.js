"use client";

import { useStore } from "@/context/StoreContext";
import ReaderView from "@/components/ReaderView";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ReaderPage() {
    const { availableBooks } = useStore(); // Get from context (includes uploaded books)
    const { id } = useParams();
    const router = useRouter();
    const [book, setBook] = useState(null);
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!availableBooks || !id) return;

        const foundBook = availableBooks.find((b) => b.id === parseInt(id));

        if (!foundBook) {
            // If not found in availableBooks, it might be loading or truly invalid.
            // We can stop loading for now.
            if (availableBooks.length > 0) setLoading(false);
            return;
        }

        setBook(foundBook);

        // Load Content Logic
        const loadContent = async () => {
            // Priority 1: Dynamic content in memory
            if (foundBook.content) {
                setContent(foundBook.content);
            }
            // Priority 2: contentFile property (Static file)
            else if (foundBook.contentFile) {
                try {
                    const res = await fetch(`/api/content?file=${foundBook.contentFile}`);
                    if (res.ok) {
                        const text = await res.text();
                        setContent(text);
                    } else {
                        setContent("# Error\nFailed to load content.");
                    }
                } catch (e) {
                    setContent("# Error\nNetwork error.");
                }
            } else {
                setContent("# Preview\nNo content available for this book.");
            }
            setLoading(false);
        };

        loadContent();
    }, [id, availableBooks]);

    if (loading) return <div className="container" style={{ paddingTop: '8rem', textAlign: 'center' }}>Loading Book...</div>;
    if (!book && !loading) return <div className="container" style={{ paddingTop: '8rem', textAlign: 'center' }}>Book not found.</div>;

    return <ReaderView book={book} content={content} />;
}
