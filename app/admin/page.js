"use client";

import { useStore } from "@/context/StoreContext";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import MarkdownEditor from "@/components/MarkdownEditor";

export default function AdminPage() {
    const { user, transactions, availableBooks, addBook, deleteBook, updateBook, pendingOrders, approveOrder, rejectOrder, revokeAccess } = useStore();
    const { showToast } = useToast();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    // Form State
    const [newBook, setNewBook] = useState({
        title: '',
        author: '',
        price: '',
        description: '',
        content: '', // Markdown content
        gradient: 'linear-gradient(135deg, #FF6B6B 0%, #556270 100%)' // Default gradient
    });

    useEffect(() => {
        // Simple client-side protection
        // In a real app, this check happens on the server (Middleware)
        if (!user || !user.isAdmin) {
            router.push("/");
        } else {
            setIsAuthorized(true);
        }
    }, [user, router]);

    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    // Edit State
    const [editingBookId, setEditingBookId] = useState(null);

    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [bookToDelete, setBookToDelete] = useState(null);

    // Revoke Modal State
    const [showRevokeModal, setShowRevokeModal] = useState(false);
    const [transactionToRevoke, setTransactionToRevoke] = useState(null);

    const promptRevoke = (transaction) => {
        setTransactionToRevoke(transaction);
        setShowRevokeModal(true);
    };

    const confirmRevoke = () => {
        if (transactionToRevoke) {
            revokeAccess(transactionToRevoke.id);
            setShowRevokeModal(false);
            setTransactionToRevoke(null);
            showToast("Access Revoked Successfully", "success");
        }
    };

    const cancelRevoke = () => {
        setShowRevokeModal(false);
        setTransactionToRevoke(null);
    };

    const promptDelete = (book) => {
        setBookToDelete(book);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        if (bookToDelete) {
            deleteBook(bookToDelete.id);
            setShowDeleteModal(false);
            setBookToDelete(null);
        }
    };

    const cancelDelete = () => {
        setShowDeleteModal(false);
        setBookToDelete(null);
    };

    const [pages, setPages] = useState(['']);
    const [currentPageIdx, setCurrentPageIdx] = useState(0);

    const handleEdit = (book) => {
        setNewBook({
            title: book.title,
            author: book.author,
            price: book.price.toString(),
            description: book.description,
            // content: book.content || '', // content is now derived from pages
            gradient: book.gradient,
        });

        const splitPages = book.content ? book.content.split(/\n-{3,}\n/) : [''];
        setPages(splitPages);
        setCurrentPageIdx(0);

        setEditingBookId(book.id);
        setActiveTab('studio');
        // Scroll to top
        window.scrollTo(0, 0);
    };

    useEffect(() => {
        // Simple client-side protection
        // In a real app, this check happens on the server (Middleware)
        if (!user || !user.isAdmin) {
            router.push("/");
        } else {
            setIsAuthorized(true);
        }
    }, [user, router]);

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        setUploading(true);

        let coverImagePath = null;

        try {
            // 1. Upload Image if selected
            if (selectedFile) {
                const formData = new FormData();
                formData.append("file", selectedFile);

                const res = await fetch("/api/upload", {
                    method: "POST",
                    body: formData
                });

                if (res.ok) {
                    const data = await res.json();
                    coverImagePath = data.filepath;
                }
            }

            const bookData = {
                title: newBook.title,
                author: newBook.author,
                price: parseFloat(newBook.price),
                description: newBook.description,
                gradient: newBook.gradient,
                content: pages.join('\n\n---\n\n'), // Join pages
            };

            if (coverImagePath) {
                bookData.coverImage = coverImagePath;
            }

            if (editingBookId) {
                // UPDATE existing book
                updateBook(editingBookId, bookData);
                showToast("Book Updated Successfully!", "success");
                setEditingBookId(null);
            } else {
                // ADD new book
                // If no cover image uploaded for new book, coverImage will be undefined/null, which is fine
                if (coverImagePath) bookData.coverImage = coverImagePath;
                addBook(bookData);
                showToast("Book Uploaded Successfully!", "success");
            }

            // Reset Form
            setNewBook({ title: '', author: '', price: '', description: '', content: '', gradient: 'linear-gradient(135deg, #FF6B6B 0%, #556270 100%)' });
            setSelectedFile(null);
            setPages(['']);
            setCurrentPageIdx(0);

            // If we were editing, maybe switch back to inventory (optional, but keep in studio for now or let user decide)
            // setActiveTab('inventory'); 

        } catch (err) {
            console.error(err);
            showToast("Failed to save book", "error");
        } finally {
            setUploading(false);
        }
    };

    if (!isAuthorized) return null;

    const totalRevenue = transactions.reduce((sum, t) => sum + t.price, 0);

    return (
        <div className="container" style={{ padding: '8rem 1.5rem 4rem' }}>
            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '3rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Admin Portal</h1>
                        <p style={{ color: '#94a3b8' }}>Manage your empire.</p>
                    </div>

                    <div className="admin-tabs" style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '12px', display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={() => setActiveTab('overview')}
                            style={{
                                background: activeTab === 'overview' ? 'var(--primary)' : 'transparent',
                                color: activeTab === 'overview' ? '#000' : '#fff',
                                border: 'none',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            📊 Overview & Sales
                        </button>
                        <button
                            onClick={() => setActiveTab('orders')}
                            style={{
                                background: activeTab === 'orders' ? 'var(--primary)' : 'transparent',
                                color: activeTab === 'orders' ? '#000' : '#fff',
                                border: 'none',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            🔔 Orders {pendingOrders?.filter(o => o.status === 'pending').length > 0 && <span style={{ background: '#ef4444', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '0.7rem', marginLeft: '5px' }}>{pendingOrders.filter(o => o.status === 'pending').length}</span>}
                        </button>
                        <button
                            onClick={() => setActiveTab('studio')}
                            style={{
                                background: activeTab === 'studio' ? 'var(--primary)' : 'transparent',
                                color: activeTab === 'studio' ? '#000' : '#fff',
                                border: 'none',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            ✍️ Book Studio
                        </button>
                        <button
                            onClick={() => setActiveTab('inventory')}
                            style={{
                                background: activeTab === 'inventory' ? 'var(--primary)' : 'transparent',
                                color: activeTab === 'inventory' ? '#000' : '#fff',
                                border: 'none',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            📦 Inventory
                        </button>
                    </div>
                </div>

                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div className="animate-fade-in">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
                            <div className="stat-card">
                                <h3>Total Revenue</h3>
                                <div className="value">₹{totalRevenue.toFixed(2)}</div>
                            </div>
                            <div className="stat-card">
                                <h3>Books Sold</h3>
                                <div className="value">{transactions.length}</div>
                            </div>
                            <div className="stat-card">
                                <h3>Active Titles</h3>
                                <div className="value">{availableBooks.length}</div>
                            </div>
                        </div>

                        <div>
                            <h2 style={{ marginBottom: '1.5rem' }}>Recent Sales History</h2>
                            {transactions.length === 0 ? (
                                <p style={{ opacity: 0.5, fontStyle: 'italic' }}>No sales recorded yet.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {transactions.map(t => (
                                        <div key={t.id} style={{
                                            background: 'rgba(255,255,255,0.03)',
                                            padding: '1.5rem',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            borderLeft: '4px solid var(--primary)'
                                        }}>
                                            <div>
                                                <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{t.bookTitle}</div>
                                                <div style={{ fontSize: '0.9rem', opacity: 0.6, marginTop: '0.2rem' }}>
                                                    {new Date(t.date).toLocaleDateString()} at {new Date(t.date).toLocaleTimeString()}
                                                </div>
                                                <div style={{ fontSize: '0.85rem', opacity: 0.4 }}>Buyer: {t.buyer}</div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>+₹{t.price.toFixed(2)}</div>
                                                <button
                                                    className="revoke-btn"
                                                    onClick={() => promptRevoke(t)}
                                                    style={{
                                                        background: 'rgba(239, 68, 68, 0.1)',
                                                        border: '1px solid rgba(239, 68, 68, 0.2)',
                                                        color: '#ef4444',
                                                        padding: '0.25rem 0.75rem',
                                                        borderRadius: '6px',
                                                        fontSize: '0.8rem',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Revoke
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ORDERS TAB */}
                {activeTab === 'orders' && (
                    <div className="animate-fade-in">
                        <h2 style={{ marginBottom: '1.5rem' }}>Pending Verifications</h2>

                        {pendingOrders.filter(o => o.status === 'pending').length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '4rem 0', opacity: 0.5 }}>
                                <h3>All quiet here. No pending orders.</h3>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: '1.5rem' }}>
                                {pendingOrders.filter(o => o.status === 'pending').map(order => (
                                    <div key={order.id} style={{
                                        background: 'rgba(255,255,255,0.03)',
                                        padding: '1.5rem',
                                        borderRadius: '12px',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        display: 'flex',
                                        gap: '2rem',
                                        alignItems: 'center'
                                    }}>
                                        {/* Screenshot Preview */}
                                        <div style={{ width: '150px', height: '200px', flexShrink: 0, borderRadius: '8px', overflow: 'hidden', border: '1px solid #333', background: '#000', cursor: 'pointer' }} onClick={() => window.open(order.screenshot, '_blank')}>
                                            <img src={order.screenshot} alt="Proof" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                        </div>

                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{order.bookTitle}</h3>
                                                <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>₹{order.price}</span>
                                            </div>
                                            <p style={{ margin: '0 0 1rem 0', opacity: 0.7, fontSize: '0.9rem' }}>
                                                Buyer: {order.userName} ({order.userId})<br />
                                                Date: {new Date(order.date).toLocaleString()}
                                            </p>

                                            <div style={{ display: 'flex', gap: '1rem' }}>
                                                <button
                                                    onClick={() => {
                                                        approveOrder(order.id);
                                                        showToast("Order Approved!", "success");
                                                    }}
                                                    className="btn btn-primary"
                                                    style={{ padding: '0.5rem 1.5rem', background: '#10b981', border: 'none' }}
                                                >
                                                    ✅ Approve Access
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        rejectOrder(order.id);
                                                        showToast("Order Rejected.", "error");
                                                    }}
                                                    className="btn btn-ghost"
                                                    style={{ padding: '0.5rem 1.5rem', color: '#ef4444', borderColor: '#ef4444' }}
                                                >
                                                    ❌ Reject
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* STUDIO TAB */}
                {activeTab === 'studio' && (
                    <div className="animate-fade-in">
                        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                            <h2 style={{ marginBottom: '2rem', textAlign: 'center' }}>
                                {editingBookId ? "Edit Masterpiece" : "Create a New Masterpiece"}
                            </h2>

                            {editingBookId && (
                                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                                    <button
                                        onClick={() => {
                                            setEditingBookId(null);
                                            setNewBook({ title: '', author: '', price: '', description: '', content: '', gradient: 'linear-gradient(135deg, #FF6B6B 0%, #556270 100%)' });
                                        }}
                                        className="btn btn-ghost"
                                        style={{ fontSize: '0.9rem' }}
                                    >
                                        &larr; Cancel Editing & Create New
                                    </button>
                                </div>
                            )}

                            <form onSubmit={handleUpload} style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '3rem', alignItems: 'start' }}>
                                {/* Left Column: Inputs */}
                                <div>
                                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', opacity: 0.8 }}>Book Title</label>
                                        <input
                                            type="text"
                                            className="auth-input"
                                            required
                                            value={newBook.title}
                                            onChange={e => setNewBook({ ...newBook, title: e.target.value })}
                                            placeholder="Enter title..."
                                        />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', opacity: 0.8 }}>Author</label>
                                        <input
                                            type="text"
                                            className="auth-input"
                                            required
                                            value={newBook.author}
                                            onChange={e => setNewBook({ ...newBook, author: e.target.value })}
                                            placeholder="Author name..."
                                        />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                        <div className="form-group">
                                            <label style={{ display: 'block', marginBottom: '0.5rem', opacity: 0.8 }}>Price (₹)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="auth-input"
                                                required
                                                value={newBook.price}
                                                onChange={e => setNewBook({ ...newBook, price: e.target.value })}
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label style={{ display: 'block', marginBottom: '0.5rem', opacity: 0.8 }}>Cover Image</label>
                                            <input
                                                type="file"
                                                className="auth-input"
                                                accept="image/*"
                                                onChange={handleFileSelect}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', opacity: 0.8 }}>Description</label>
                                        <textarea
                                            className="auth-input"
                                            rows="6"
                                            required
                                            value={newBook.description}
                                            onChange={e => setNewBook({ ...newBook, description: e.target.value })}
                                            placeholder="Short summary of the book..."
                                        />
                                    </div>

                                    {/* Page Management */}
                                    <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '2rem' }}>
                                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            Story Board
                                            <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>{pages.length} Pages</span>
                                        </h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                                            {pages.map((_, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => setCurrentPageIdx(idx)}
                                                    style={{
                                                        padding: '0.75rem',
                                                        borderRadius: '8px',
                                                        background: currentPageIdx === idx ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                                        color: currentPageIdx === idx ? '#000' : '#fff',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        transition: 'all 0.2s',
                                                        fontWeight: currentPageIdx === idx ? '600' : 'normal'
                                                    }}
                                                >
                                                    <span>Page {idx + 1}</span>
                                                    {pages.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (confirm('Delete this page?')) {
                                                                    const newPages = pages.filter((_, i) => i !== idx);
                                                                    setPages(newPages);
                                                                    if (currentPageIdx >= newPages.length) setCurrentPageIdx(Math.max(0, newPages.length - 1));
                                                                }
                                                            }}
                                                            style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6 }}
                                                            title="Delete Page"
                                                        >
                                                            🗑️
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPages([...pages, '']);
                                                setCurrentPageIdx(pages.length);
                                            }}
                                            className="btn btn-ghost"
                                            style={{ width: '100%', marginTop: '1rem', borderStyle: 'dashed' }}
                                        >
                                            + Add New Page
                                        </button>
                                    </div>

                                    <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', marginTop: '2rem' }} disabled={uploading}>
                                        {uploading ? "Processing..." : (editingBookId ? "💾 Save Changes" : "🚀 Publish Book")}
                                    </button>
                                </div>

                                {/* Right Column: Editor */}
                                <div style={{ height: '100%' }}>
                                    <div className="form-group" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', opacity: 0.8 }}>
                                            Content Editor - <span style={{ color: 'var(--primary)' }}>Page {currentPageIdx + 1}</span>
                                        </label>
                                        <div style={{ flex: 1, minHeight: '600px', border: '1px solid var(--glass-border)', borderRadius: '12px', overflow: 'hidden' }}>
                                            <MarkdownEditor
                                                value={pages[currentPageIdx] || ''}
                                                onChange={(val) => {
                                                    const newPages = [...pages];
                                                    newPages[currentPageIdx] = val;
                                                    setPages(newPages);
                                                }}
                                                style={{ height: '100%' }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* INVENTORY TAB */}
                {activeTab === 'inventory' && (
                    <div className="animate-fade-in">
                        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <h2 style={{ margin: 0 }}>Book Inventory</h2>
                                <span style={{ opacity: 0.6 }}>{availableBooks.length} titles available</span>
                            </div>

                            {availableBooks.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '4rem 0', opacity: 0.5 }}>
                                    <h3>Your shelves are empty.</h3>
                                    <button onClick={() => setActiveTab('studio')} className="btn btn-ghost" style={{ marginTop: '1rem' }}>Create your first book</button>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    {availableBooks.map(book => (
                                        <div key={book.id} style={{
                                            background: 'rgba(255,255,255,0.03)',
                                            padding: '1.5rem',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            border: '1px solid rgba(255,255,255,0.05)'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                                <div style={{
                                                    width: '60px',
                                                    height: '80px',
                                                    borderRadius: '4px',
                                                    background: (book.image || book.coverImage) ? `url(${book.image || book.coverImage}) center/cover no-repeat` : book.gradient,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '0.6rem',
                                                    overflow: 'hidden',
                                                    color: 'rgba(255,255,255,0.8)',
                                                    textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                                                }}>
                                                    {!(book.image || book.coverImage) && "No Image"}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.2rem' }}>{book.title}</div>
                                                    <div style={{ fontSize: '0.9rem', opacity: 0.6 }}>by {book.author}</div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                                                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--primary)' }}>₹{book.price.toFixed(2)}</div>
                                                <button
                                                    onClick={() => handleEdit(book)}
                                                    className="btn btn-ghost"
                                                    style={{ color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)', marginRight: '0.5rem' }}
                                                    onMouseOver={e => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)'}
                                                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    ✏️ Edit
                                                </button>
                                                <button
                                                    onClick={() => promptDelete(book)}
                                                    className="btn btn-ghost"
                                                    style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                                                    onMouseOver={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    🗑️ Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* CUSTOM DELETE MODAL */}
            {showDeleteModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(5px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    animation: 'fadeIn 0.2s ease-out'
                }}>
                    <div style={{
                        background: '#0f172a',
                        border: '1px solid rgba(255,255,255,0.1)',
                        padding: '2rem',
                        borderRadius: '16px',
                        maxWidth: '400px',
                        width: '90%',
                        textAlign: 'center',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    }}>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Delete Book?</h3>
                        <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
                            Are you sure you want to remove <strong style={{ color: '#fff' }}>{bookToDelete?.title}</strong>? This action cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button
                                onClick={cancelDelete}
                                className="btn"
                                style={{
                                    background: 'transparent',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    color: '#fff'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="btn"
                                style={{
                                    background: '#ef4444',
                                    border: 'none',
                                    color: 'white'
                                }}
                            >
                                Delete Forever
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CUSTOM REVOKE MODAL */}
            {showRevokeModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(5px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    animation: 'fadeIn 0.2s ease-out'
                }}>
                    <div style={{
                        background: '#0f172a',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        padding: '2rem',
                        borderRadius: '16px',
                        maxWidth: '400px',
                        width: '90%',
                        textAlign: 'center',
                        boxShadow: '0 25px 50px -12px rgba(239, 68, 68, 0.25)'
                    }}>
                        <div style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '2rem',
                            margin: '0 auto 1.5rem auto'
                        }}>
                            🔒
                        </div>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Revoke Access?</h3>
                        <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
                            Are you sure you want to remove access for <br />
                            <strong style={{ color: '#fff' }}>{transactionToRevoke?.buyer}</strong>?
                            <br /><span style={{ fontSize: '0.8rem', opacity: 0.7 }}>They will no longer be able to read this book.</span>
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button
                                onClick={cancelRevoke}
                                className="btn"
                                style={{
                                    background: 'transparent',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    color: '#fff',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmRevoke}
                                className="btn"
                                style={{
                                    background: '#ef4444',
                                    border: 'none',
                                    color: 'white',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                Yes, Revoke
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .stat-card {
                    background: rgba(255,255,255,0.03);
                    padding: 1.5rem;
                    border-radius: 12px;
                    border: 1px solid rgba(255,255,255,0.05);
                    transition: transform 0.2s;
                }
                .stat-card:hover {
                    transform: translateY(-2px);
                    background: rgba(255,255,255,0.05);
                }
                .stat-card h3 {
                    font-size: 0.9rem;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    opacity: 0.7;
                    margin-bottom: 0.5rem;
                }
                .stat-card .value {
                    font-size: 2rem;
                    font-weight: 700;
                    color: t(--primary);
                    text-shadow: 0 0 20px rgba(212, 175, 55, 0.3);
                }
                .animate-fade-in {
                    animation: fadeIn 0.4s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div >
    );
}
