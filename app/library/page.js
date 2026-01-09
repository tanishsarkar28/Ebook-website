"use client";

import { useStore } from "@/context/StoreContext";
import { books } from "@/lib/books";
import BookCard from "@/components/BookCard";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LibraryPage() {
    const { user, hasPurchased, pendingOrders } = useStore();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        // Simple auth check
        const checkAuth = () => {
            // Give a small grace period for context to load
            setTimeout(() => {
                if (!localStorage.getItem("user")) {
                    router.push("/signin?returnUrl=/library");
                }
                setIsLoading(false);
            }, 100);
        };

        checkAuth();
    }, [router]);

    if (isLoading) {
        return <div className="container" style={{ paddingTop: '8rem', textAlign: 'center' }}>Loading Library...</div>;
    }

    if (!user) return null; // Will redirect

    // Filter books that the user has purchased
    const myBooks = books.filter(book => hasPurchased(book.id));

    // Filter books that are pending for this user
    // We Map pending orders to book objects, but we need to find the book details from 'books' array or use the order details
    const pendingBooks = pendingOrders
        ? pendingOrders
            .filter(o => o.userId === user.email && o.status === 'pending')
            .map(o => {
                const originalBook = books.find(b => b.id === o.bookId);
                return originalBook ? { ...originalBook, isPending: true } : null;
            })
            .filter(Boolean)
        : [];

    const allBooks = [...myBooks, ...pendingBooks];

    // Remove duplicates if any (e.g. if logic allows buying pending book again)
    const uniqueBooks = Array.from(new Map(allBooks.map(item => [item.id, item])).values());

    const filteredBooks = uniqueBooks.filter(book =>
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container" style={{ minHeight: '80vh', padding: '8rem 1.5rem 4rem' }}>
            <div className="glass-panel" style={{ padding: '2rem' }}>
                <header style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '3rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <div>
                            <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>My Library</h1>
                            <p style={{ color: '#94a3b8' }}>Your personal collection of premium content.</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary)' }}>{uniqueBooks.length}</span>
                            <span style={{ color: '#94a3b8', fontSize: '0.9rem', marginLeft: '0.5rem' }}>Books Owned</span>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
                        <input
                            type="text"
                            placeholder="Search your library..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.8rem 1.2rem',
                                borderRadius: '9999px',
                                border: '1px solid var(--glass-border)',
                                background: 'rgba(255, 255, 255, 0.05)',
                                color: '#fff',
                                fontSize: '0.9rem',
                                outline: 'none',
                                transition: 'all 0.3s ease'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = 'var(--primary)';
                                e.target.style.background = 'rgba(255,255,255,0.1)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = 'var(--glass-border)';
                                e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                            }}
                        />
                        <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
                    </div>
                </header>

                {filteredBooks.length > 0 ? (
                    <div className="book-grid">
                        {filteredBooks.map((book) => (
                            <div key={book.id} style={{ position: 'relative' }}>
                                <BookCard book={book} />
                                {book.isPending && (
                                    <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        background: 'rgba(0,0,0,0.7)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: '16px', // Match BookCard border radius
                                        zIndex: 10,
                                        backdropFilter: 'blur(2px)'
                                    }}>
                                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
                                        <h3 style={{ margin: 0, color: '#FBB03B' }}>Verification Pending</h3>
                                        <p style={{ margin: '0.5rem 0 0', opacity: 0.8, fontSize: '0.9rem' }}>Admin processing...</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.3 }}>📚</div>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#fff' }}>Your library is empty</h3>
                        <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
                            You haven't purchased any books yet. Explore our collection to get started.
                        </p>
                        <Link href="/#browse" className="btn btn-primary">
                            Browse Books
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
