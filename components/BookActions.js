"use client";

import { useStore } from "@/context/StoreContext";
import { useToast } from "@/context/ToastContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function BookActions({ book }) {
    const { hasPurchased, user, pendingOrders } = useStore();
    const { showToast } = useToast();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    const isPurchased = hasPurchased(book.id);
    const isPending = pendingOrders?.some(o => o.bookId === book.id && o.status === 'pending');

    const handleBuy = () => {
        if (!user) {
            const returnUrl = encodeURIComponent(window.location.pathname);
            window.location.href = `/signin?returnUrl=${returnUrl}`;
            return;
        }
        router.push(`/checkout/${book.id}`);
    };

    if (isPurchased) {
        return (
            <Link href={`/reader/${book.id}`}>
                <button className="btn btn-primary">Read Now</button>
            </Link>
        );
    }

    if (isPending) {
        return (
            <button className="btn btn-ghost" disabled style={{ opacity: 0.7, cursor: 'not-allowed', border: '1px dashed currentColor' }}>
                ⏳ Verification Pending
            </button>
        );
    }

    // Default: Show Buy & Preview buttons
    return (
        <>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <button
                    className="btn btn-primary"
                    onClick={handleBuy}
                    disabled={loading}
                >
                    {loading ? "Processing..." : "Buy Now"}
                </button>
                <button
                    className="btn btn-ghost"
                    onClick={() => setShowPreview(true)}
                >
                    Preview
                </button>
            </div>

            {/* PREVIEW MODAL */}
            {showPreview && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2000,
                    animation: 'fadeIn 0.3s ease-out'
                }}>
                    <div style={{
                        background: '#0f172a',
                        border: '1px solid rgba(255,255,255,0.1)',
                        padding: '2.5rem',
                        borderRadius: '20px',
                        maxWidth: '600px',
                        width: '90%',
                        position: 'relative',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    }}>
                        <button
                            onClick={() => setShowPreview(false)}
                            style={{
                                position: 'absolute',
                                top: '1.5rem',
                                right: '1.5rem',
                                background: 'transparent',
                                border: 'none',
                                color: '#94a3b8',
                                fontSize: '1.5rem',
                                cursor: 'pointer'
                            }}
                        >
                            ✕
                        </button>

                        <h2 className="text-gradient" style={{ marginBottom: '0.5rem', fontSize: '1.8rem' }}>{book.title}</h2>
                        <h4 style={{ color: '#94a3b8', marginBottom: '2rem', fontWeight: 400 }}>Free Preview</h4>

                        <div style={{
                            background: 'rgba(255,255,255,0.03)',
                            padding: '1.5rem',
                            borderRadius: '12px',
                            marginBottom: '2rem',
                            maxHeight: '300px',
                            overflowY: 'auto',
                            lineHeight: '1.8',
                            color: '#e2e8f0',
                            textAlign: 'left',
                            whiteSpace: 'pre-wrap'
                        }}>
                            {book.content ? book.content.substring(0, 800) + "..." : "No preview available for this book."}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button
                                onClick={() => setShowPreview(false)}
                                className="btn"
                                style={{
                                    background: 'transparent',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    color: '#fff',
                                    padding: '0.75rem 2rem'
                                }}
                            >
                                Close
                            </button>
                            <button
                                onClick={() => { setShowPreview(false); handleBuy(); }}
                                className="btn btn-primary"
                                style={{ padding: '0.75rem 2rem' }}
                            >
                                Unlock Full Book
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
