"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/context/StoreContext';
import { useToast } from '@/context/ToastContext';

export default function Navbar() {
    const { user, login, logout } = useStore();
    const { showToast } = useToast();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <nav className="navbar">
            <div className="container nav-content">
                <Link href="/" className="nav-brand text-gradient" onClick={() => setIsMenuOpen(false)}>
                    Aura
                </Link>

                <button className="mobile-menu-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                    {isMenuOpen ? '✕' : '☰'}
                </button>

                <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
                    <Link href="/" className="nav-link" onClick={() => setIsMenuOpen(false)}>Discover</Link>
                    <Link
                        href="/library"
                        className="nav-link"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        My Library
                    </Link>
                    {user ? (
                        <div className="nav-user-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            {user.isAdmin && (
                                <Link href="/admin" className="nav-link" style={{ color: 'var(--primary)' }} onClick={() => setIsMenuOpen(false)}>
                                    Admin Dashboard
                                </Link>
                            )}
                            <Link href="/profile" style={{ fontSize: '0.9rem', color: '#fff' }} onClick={() => setIsMenuOpen(false)}>
                                Hi, {user.name}
                            </Link>
                            <button onClick={() => { logout(); setIsMenuOpen(false); }} className="btn btn-ghost" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                                Sign Out
                            </button>
                        </div>
                    ) : (
                        <Link href="/signin">
                            <button className="btn btn-primary" style={{ padding: '0.5rem 1.5rem', fontSize: '0.9rem' }} onClick={() => setIsMenuOpen(false)}>
                                Sign In
                            </button>
                        </Link>
                    )}
                </div>
            </div >
        </nav >
    );
}
