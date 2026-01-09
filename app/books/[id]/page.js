"use client";

import { useStore } from "@/context/StoreContext";
import { useParams, useRouter } from "next/navigation";
import BookActions from "@/components/BookActions";
import { useEffect, useState } from "react";
import { useToast } from "@/context/ToastContext";

export default function BookDetails() {
    const { availableBooks } = useStore();
    const { id } = useParams();
    const [book, setBook] = useState(null);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    useEffect(() => {
        if (!availableBooks || !id) return;

        // Try to parse ID, but handle string IDs if we generate them that way later
        const foundBook = availableBooks.find((b) => b.id == id);

        if (foundBook) {
            setBook(foundBook);
        }
        setLoading(false);
    }, [id, availableBooks]);

    const handleShare = async () => {
        try {
            const url = `${window.location.origin}/books/${book.id}`;
            await navigator.clipboard.writeText(url);
            showToast("Link copied to clipboard!", "success");
        } catch (err) {
            console.error('Failed to copy link:', err);
            showToast("Failed to copy link.", "error");
        }
    };

    if (loading) return <div className="container" style={{ paddingTop: '8rem', textAlign: 'center' }}>Loading...</div>;

    if (!book) {
        return (
            <div className="container" style={{ paddingTop: '8rem', textAlign: 'center' }}>
                <h1>Book not found</h1>
                <p>The book you are looking for does not exist.</p>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="book-details">
                <div className="details-cover-wrapper">
                    {book.coverImage ? (
                        <img
                            src={book.coverImage}
                            alt={book.title}
                            className="details-cover"
                            style={{ objectFit: 'contain' }}
                        />
                    ) : (
                        <div
                            className="details-cover"
                            style={{
                                background: book.gradient,
                                position: 'relative'
                            }}
                        >
                            <div style={{ width: '20px', height: '100%', background: 'rgba(0,0,0,0.2)', position: 'absolute', left: 0 }}></div>
                        </div>
                    )}
                </div>

                <div className="details-info">
                    <h1 className="text-gradient">{book.title}</h1>
                    <span className="details-author">by {book.author}</span>

                    <p className="details-description">
                        {book.description}
                    </p>

                    <div className="details-actions">
                        <span className="details-price">₹{book.price.toFixed(2)}</span>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <BookActions book={book} />
                            <button
                                onClick={handleShare}
                                className="btn btn-ghost"
                                title="Share this book"
                                style={{
                                    border: '1px solid var(--glass-border)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.75rem 1rem'
                                }}
                            >
                                🔗 Share
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
