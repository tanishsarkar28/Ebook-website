"use client";

import { useState, useRef } from 'react';

export default function PaymentModal({ book, onClose, onSubmit }) {
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [uploading, setUploading] = useState(false);

    // This would ideally be a real admin QR code
    const qrCodeUrl = "C:/Users/sarka/.gemini/antigravity/brain/55d1dceb-a9bb-42fa-af9d-38371e995021/admin_qr_code_1767633035377.png";
    // Note: Since this local path won't work in a real browser <img> tag unless served, 
    // In a real app we'd move this to public/ or use an imported asset. 
    // For this environment, I'll use a placeholder or assume it's moved.
    // actually, I'll use a data placeholder for now to be safe or just a simple styled box if the image isn't servable.

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedFile) return;

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
                onSubmit(data.filepath);
            } else {
                alert("Upload failed. Please try again.");
            }
        } catch (error) {
            console.error("Payment upload error:", error);
            alert("An error occurred.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="payment-modal-overlay">
            <div className="payment-modal glass-panel">
                <button className="close-btn" onClick={onClose}>&times;</button>

                <h2 className="text-gradient" style={{ textAlign: 'center', marginBottom: '1rem' }}>Complete Your Purchase</h2>
                <p style={{ textAlign: 'center', color: '#94a3b8', marginBottom: '2rem' }}>
                    Scan the QR code to pay <strong>₹{book.price}</strong> for "{book.title}".
                </p>

                <div className="qr-container">
                    {/* Placeholder for the QR Code - using a styled div if image fails */}
                    <div style={{
                        width: '200px',
                        height: '200px',
                        background: 'white',
                        margin: '0 auto 2rem',
                        padding: '1rem',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '4px solid var(--primary)'
                    }}>
                        <img
                            src="/admin-qr-code.png"
                            alt="Payment QR Code"
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentNode.innerHTML = '<span style="color:black;font-weight:bold;text-align:center">SCAN ME<br/>(Placeholder)</span>';
                            }}
                        />
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Upload Payment Screenshot</label>
                        <div className="file-upload-box" onClick={() => document.getElementById('payment-proof').click()}>
                            {previewUrl ? (
                                <img src={previewUrl} alt="Preview" style={{ maxHeight: '150px', borderRadius: '8px' }} />
                            ) : (
                                <div style={{ padding: '2rem', textAlign: 'center', border: '2px dashed rgba(255,255,255,0.2)', borderRadius: '8px', cursor: 'pointer' }}>
                                    <span style={{ fontSize: '2rem' }}>📸</span>
                                    <p style={{ marginTop: '0.5rem', opacity: 0.7 }}>Click to upload proof</p>
                                </div>
                            )}
                        </div>
                        <input
                            id="payment-proof"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: '1.5rem', padding: '1rem' }}
                        disabled={uploading || !selectedFile}
                    >
                        {uploading ? "Verifying..." : "Submit for Verification"}
                    </button>
                </form>
            </div>

            <style jsx>{`
                .payment-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: rgba(0,0,0,0.8);
                    backdrop-filter: blur(8px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2000;
                    animation: fadeIn 0.3s ease;
                }
                .payment-modal {
                    width: 90%;
                    max-width: 500px;
                    padding: 2.5rem;
                    position: relative;
                    animation: scaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    max-height: 90vh;
                    overflow-y: auto;
                }
                .close-btn {
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    background: none;
                    border: none;
                    color: white;
                    font-size: 2rem;
                    cursor: pointer;
                    opacity: 0.5;
                    transition: opacity 0.2s;
                }
                .close-btn:hover { opacity: 1; }

                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            `}</style>
        </div>
    );
}
