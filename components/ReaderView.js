"use client";

import { useStore } from "@/context/StoreContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import ReactMarkdown from 'react-markdown';

export default function ReaderView({ book, content }) {
    const { hasPurchased, readingProgress, updateReadingProgress } = useStore();
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);

    // Split content into pages based on '---' delimiter
    const chapters = content
        ? content.split(/\n-{3,}\n/).filter(Boolean)
        : ["# Loading...", "Please wait."];

    // Reader State
    // Initialize page from saved progress if available
    const savedPage = readingProgress?.[book.id]?.page || 1;
    const [fontSize, setFontSize] = useState(18);
    const [theme, setTheme] = useState('dark'); // 'dark', 'light', 'sepia'
    const [currentPage, setCurrentPage] = useState(savedPage);
    const [showControls, setShowControls] = useState(false);

    useEffect(() => {
        if (hasPurchased(book.id)) {
            setAuthorized(true);
        }
    }, [book.id, hasPurchased]);

    // Update progress whenever page changes
    useEffect(() => {
        if (authorized && chapters.length > 0) {
            updateReadingProgress(book.id, currentPage, chapters.length);
        }
    }, [currentPage, authorized, book.id, chapters.length, updateReadingProgress]);

    if (!authorized) {
        return (
            <div className="container" style={{ padding: '8rem 0', textAlign: 'center' }}>
                <h1 className="text-gradient">Access Denied</h1>
                <p style={{ margin: '2rem 0', color: '#94a3b8' }}>You must purchase this book to read it.</p>
                <Link href={`/books/${book.id}`}>
                    <button className="btn btn-primary">Go to Book Page</button>
                </Link>
            </div>
        );
    }

    const themes = {
        dark: { bg: '#111', fg: '#ddd', ui: 'rgba(255,255,255,0.1)' },
        light: { bg: '#fff', fg: '#333', ui: '#f0f0f0' },
        sepia: { bg: '#f4ecd8', fg: '#5b4636', ui: '#e6dec5' }
    };

    const currentTheme = themes[theme];

    return (
        <div className="reader-layout" style={{ background: currentTheme.bg, color: currentTheme.fg }}>
            <header className="reader-header" style={{ background: currentTheme.ui }}>
                <Link href={`/books/${book.id}`} className="btn-text" style={{ color: currentTheme.fg }}>&larr; Back</Link>
                <span className="reader-title">{book.title}</span>
                <div className="reader-controls">
                    <button className="btn-icon" onClick={() => setFontSize(s => Math.min(s + 2, 32))}>A+</button>
                    <button className="btn-icon" onClick={() => setFontSize(s => Math.max(s - 2, 14))}>A-</button>
                    <button className="btn-icon" onClick={() => setTheme(t => t === 'dark' ? 'light' : t === 'light' ? 'sepia' : 'dark')}>
                        {theme === 'dark' ? '🌙' : theme === 'light' ? '☀️' : '📖'}
                    </button>
                </div>
            </header>

            <div className="reader-content container" style={{ fontSize: `${fontSize}px` }}>
                <ReactMarkdown>{chapters[currentPage - 1]}</ReactMarkdown>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid currentColor', opacity: 0.2 }}></div>
                <div className="reader-footer">
                    <button
                        className="btn btn-ghost nav-btn"
                        disabled={currentPage === 1}
                        onClick={() => { setCurrentPage(p => p - 1); window.scrollTo(0, 0); }}
                        style={{ color: 'inherit', borderColor: 'currentColor', opacity: currentPage === 1 ? 0.3 : 0.8, cursor: currentPage === 1 ? 'default' : 'pointer' }}
                    >
                        &larr; Previous Page
                    </button>
                    <span className="chapter-indicator" style={{ fontSize: '0.9rem', opacity: 0.6 }}>Chapter {currentPage} of {chapters.length}</span>
                    <button
                        className="btn btn-ghost nav-btn"
                        disabled={currentPage === chapters.length}
                        onClick={() => { setCurrentPage(p => p + 1); window.scrollTo(0, 0); }}
                        style={{ color: 'inherit', borderColor: 'currentColor', opacity: currentPage === chapters.length ? 0.3 : 0.8, cursor: currentPage === chapters.length ? 'default' : 'pointer' }}
                    >
                        Next Page &rarr;
                    </button>
                </div>
            </div>

            <style jsx>{`
                .reader-layout {
                    min-height: 100vh;
                    transition: background 0.3s ease, color 0.3s ease;
                }
                .reader-header {
                    display: flex;
                    justify-content: space-between;
                    padding: 1rem 2rem;
                    position: sticky;
                    top: 0;
                    z-index: 50;
                    align-items: center;
                    backdrop-filter: blur(10px);
                }
                .reader-controls {
                    display: flex;
                    gap: 1rem;
                }
                .reader-content {
                    max-width: 800px;
                    padding: 4rem 1.5rem;
                    line-height: 1.8;
                    transition: font-size 0.2s ease;
                }
                .reader-content p {
                    margin-bottom: 2rem;
                }
                .btn-icon {
                    background: none;
                    border: 1px solid currentColor;
                    color: inherit;
                    cursor: pointer;
                    font-weight: 600;
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    font-size: 0.9rem;
                    opacity: 0.7;
                    transition: opacity 0.2s;
                }
                .btn-icon:hover {
                    opacity: 1;
                }
                
                /* Footer Navigation Styles */
                .reader-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: -1px;
                    gap: 1rem;
                }
                
                @media (max-width: 600px) {
                    .reader-footer {
                        flex-direction: column-reverse;
                        gap: 1.5rem;
                    }
                    .nav-btn {
                        width: 100%;
                        padding: 1rem;
                    }
                    .chapter-indicator {
                        margin-bottom: 0.5rem;
                    }
                }

                /* Force headers to inherit the theme color */
                .reader-content :global(h1), 
                .reader-content :global(h2), 
                .reader-content :global(h3),
                .reader-content :global(h4),
                .reader-content :global(h5),
                .reader-content :global(h6) {
                    color: inherit !important;
                }
            `}</style>
        </div>
    );
}
