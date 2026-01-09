"use client";

import { useStore } from "@/context/StoreContext";
import { useToast } from "@/context/ToastContext";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function CheckoutPage() {
    const { id } = useParams();
    const { availableBooks, createOrder, user } = useStore();
    const { showToast } = useToast();
    const router = useRouter();

    const [book, setBook] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        if (availableBooks.length > 0 && id) {
            const foundBook = availableBooks.find(b => b.id.toString() === id.toString());
            if (foundBook) setBook(foundBook);
            else {
                showToast("Book not found", "error");
                router.push("/");
            }
        }
    }, [availableBooks, id, router]);

    // Protect Route
    useEffect(() => {
        // give a small delay for user state to load
        const timer = setTimeout(() => {
            if (!localStorage.getItem("user")) {
                const returnUrl = encodeURIComponent(window.location.pathname);
                router.push(`/signin?returnUrl=${returnUrl}`);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [router]);


    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    };

    const processFile = (file) => {
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    }

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedFile || !book || !user) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", selectedFile);

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData
            });

            if (res.ok) {
                const data = await res.json();

                const order = {
                    userId: user.email,
                    userName: user.name,
                    bookId: book.id,
                    bookTitle: book.title,
                    price: book.price,
                    screenshot: data.filepath
                };

                createOrder(order);
                showToast("Payment Submitted! High-Fives Incoming! 🙌", "success");
                router.push("/library");
            } else {
                showToast("Upload failed. Please try again.", "error");
            }
        } catch (error) {
            console.error("Payment upload error:", error);
            showToast("An error occurred.", "error");
        } finally {
            setUploading(false);
        }
    };

    if (!book) return (
        <div className="container" style={{ paddingTop: '8rem', textAlign: 'center', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="spinner"></div>
        </div>
    );

    return (
        <div className="checkout-container">
            <div className="checkout-bg"></div>

            <div className="split-layout animate-fade-in-up">

                {/* Left: Product Summary */}
                <div className="summary-panel">
                    <div className="summary-content">
                        <div className="brand-badge">AURA BOOKS</div>

                        <div className="bill-header">
                            <h1>Order Summary</h1>
                            <p className="order-id">Order ID: #{Math.floor(Math.random() * 1000000)}</p>
                        </div>

                        <div className="book-preview-card">
                            <div className="book-cover-art"
                                style={{
                                    background: book.coverImage ? `url(${book.coverImage}) center/cover no-repeat` : book.gradient
                                }}>
                            </div>
                            <div className="book-info">
                                <h2>{book.title}</h2>
                                <p>by {book.author}</p>
                                <div className="price-tag">₹{book.price.toFixed(2)}</div>
                            </div>
                        </div>

                        <div className="invoice-details">
                            <div className="invoice-row">
                                <span>Subtotal</span>
                                <span>₹{book.price.toFixed(2)}</span>
                            </div>
                            <div className="invoice-row">
                                <span>Processing Fee</span>
                                <span>₹0.00</span>
                            </div>
                            <div className="invoice-divider"></div>
                            <div className="invoice-row total">
                                <span>Total to Pay</span>
                                <span>₹{book.price.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="security-badge">
                            🔒 256-bit Secure Encryption
                        </div>
                    </div>
                </div>

                {/* Right: Payment Interface */}
                <div className="payment-panel">
                    <div className="payment-header">
                        <h2>Finish Payment</h2>
                        <p>Scan the code below using any UPI app</p>
                    </div>

                    <div className="qr-container">
                        <div className="qr-box">
                            <img
                                src="/admin-qr-code.png"
                                alt="Payment QR Code"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.parentNode.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-weight:bold;color:black;">QR CODE</div>';
                                }}
                            />
                            <div className="scan-line"></div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="upload-form">
                        <label className="upload-label">Upload Payment Screenshot</label>

                        <div
                            className={`drop-zone ${isDragging ? 'dragging' : ''} ${previewUrl ? 'has-file' : ''}`}
                            onClick={() => document.getElementById('checkout-proof').click()}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            {previewUrl ? (
                                <div className="preview-container">
                                    <img src={previewUrl} alt="Preview" />
                                    <div className="change-overlay">
                                        <span>Change Image</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <span className="icon">📂</span>
                                    <p><strong>Click to upload</strong> or drag and drop</p>
                                    <p className="sub-text">PNG, JPG up to 10MB</p>
                                </div>
                            )}
                        </div>

                        <input
                            id="checkout-proof"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                            required={!selectedFile}
                        />

                        <button
                            type="submit"
                            className="pay-btn"
                            disabled={uploading || !selectedFile}
                        >
                            {uploading ? "Verifying Payment..." : `Confirm Payment of ₹${book.price.toFixed(2)}`}
                        </button>
                    </form>
                </div>
            </div>

            <style jsx>{`
                .checkout-container {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 8rem 2rem 4rem;
                    position: relative;
                }
                
                .checkout-bg {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: radial-gradient(circle at 10% 20%, rgba(212, 175, 55, 0.1) 0%, transparent 20%),
                                radial-gradient(circle at 90% 80%, rgba(56, 189, 248, 0.1) 0%, transparent 20%);
                    z-index: -1;
                }

                .split-layout {
                    display: grid;
                    grid-template-columns: 1fr 1.2fr;
                    max-width: 1100px;
                    width: 100%;
                    background: rgba(15, 23, 42, 0.6);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 24px;
                    overflow: hidden;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                }

                .summary-panel {
                    background: rgba(255, 255, 255, 0.03);
                    padding: 3rem;
                    border-right: 1px solid rgba(255, 255, 255, 0.05);
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                }

                .brand-badge {
                    font-size: 0.8rem;
                    letter-spacing: 2px;
                    font-weight: 700;
                    color: var(--primary);
                    margin-bottom: 2rem;
                }

                .bill-header h1 {
                    font-size: 2rem;
                    margin-bottom: 0.5rem;
                }

                .order-id {
                    opacity: 0.5;
                    font-size: 0.9rem;
                    margin-bottom: 2rem;
                }

                .book-preview-card {
                    display: flex;
                    gap: 1.5rem;
                    background: rgba(0,0,0,0.2);
                    padding: 1.5rem;
                    border-radius: 16px;
                    margin-bottom: 2rem;
                    border: 1px solid rgba(255,255,255,0.05);
                }

                .book-cover-art {
                    width: 80px;
                    height: 120px;
                    border-radius: 8px;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                }

                .book-info h2 {
                    font-size: 1.2rem;
                    margin-bottom: 0.5rem;
                }

                .book-info p {
                    opacity: 0.7;
                    font-size: 0.9rem;
                    margin-bottom: 1rem;
                }

                .price-tag {
                    color: var(--primary);
                    font-weight: 700;
                    font-size: 1.2rem;
                }

                .invoice-details {
                    border-top: 1px dashed rgba(255,255,255,0.2);
                    padding-top: 1.5rem;
                }

                .invoice-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 0.8rem;
                    opacity: 0.8;
                }

                .invoice-divider {
                    height: 1px;
                    background: rgba(255,255,255,0.1);
                    margin: 1rem 0;
                }

                .invoice-row.total {
                    opacity: 1;
                    font-weight: 700;
                    font-size: 1.2rem;
                    color: white;
                }

                .security-badge {
                    margin-top: 2rem;
                    font-size: 0.8rem;
                    opacity: 0.5;
                    text-align: center;
                }

                /* Payment Panel */
                .payment-panel {
                    padding: 3rem;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                }

                .payment-header {
                    text-align: center;
                    margin-bottom: 2rem;
                }
                
                .payment-header h2 {
                    font-size: 1.8rem;
                    margin-bottom: 0.5rem;
                }

                .payment-header p {
                    opacity: 0.6;
                }

                .qr-container {
                    display: flex;
                    justify-content: center;
                    margin-bottom: 2rem;
                }

                .qr-box {
                    background: white;
                    padding: 1rem;
                    border-radius: 16px;
                    border: 4px solid var(--primary);
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 0 30px rgba(212, 175, 55, 0.2);
                }

                .qr-box img {
                    width: 180px;
                    height: 180px;
                    display: block;
                }

                .scan-line {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 4px;
                    background: rgba(255, 0, 0, 0.5);
                    box-shadow: 0 0 4px red;
                    animation: scan 2s infinite linear;
                }

                @keyframes scan {
                    0% { top: 0; }
                    50% { top: 100%; }
                    100% { top: 0; }
                }

                .upload-label {
                    display: block;
                    margin-bottom: 0.8rem;
                    font-size: 0.9rem;
                    font-weight: 600;
                }

                .drop-zone {
                    border: 2px dashed rgba(255,255,255,0.2);
                    border-radius: 12px;
                    padding: 2rem;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    background: rgba(255,255,255,0.02);
                    position: relative;
                    overflow: hidden;
                }

                .drop-zone:hover, .drop-zone.dragging {
                    border-color: var(--primary);
                    background: rgba(212, 175, 55, 0.05);
                }

                .drop-zone.has-file {
                    padding: 0;
                    border-style: solid;
                    border-color: var(--primary);
                }

                .preview-container {
                    width: 100%;
                    height: 200px;
                    position: relative;
                }

                .preview-container img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .change-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.2s;
                }

                .preview-container:hover .change-overlay {
                    opacity: 1;
                }

                .empty-state .icon {
                    font-size: 2rem;
                    display: block;
                    margin-bottom: 1rem;
                }

                .empty-state .sub-text {
                    font-size: 0.8rem;
                    opacity: 0.5;
                    margin-top: 0.5rem;
                }

                .pay-btn {
                    width: 100%;
                    padding: 1.2rem;
                    background: linear-gradient(135deg, var(--primary) 0%, #FBB03B 100%);
                    border: none;
                    border-radius: 12px;
                    color: black;
                    font-weight: 700;
                    font-size: 1.1rem;
                    margin-top: 2rem;
                    cursor: pointer;
                    transition: transform 0.2s, box-shadow 0.2s;
                }

                .pay-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 20px rgba(212, 175, 55, 0.3);
                }

                .pay-btn:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                    filter: grayscale(1);
                }

                .animate-fade-in-up {
                    animation: fadeInUp 0.6s ease-out;
                }

                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @media (max-width: 900px) {
                    .split-layout {
                        grid-template-columns: 1fr;
                        max-width: 600px;
                    }
                    .summary-panel {
                        border-right: none;
                        border-bottom: 1px solid rgba(255,255,255,0.05);
                        padding: 2rem;
                    }
                    .payment-panel {
                        padding: 2rem;
                    }
                }
            `}</style>
        </div>
    );
}
