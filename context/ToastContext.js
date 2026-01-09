"use client";

import { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext();

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'success') => { // type: success, error, info
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);

        // Auto remove after 3 seconds
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="toast-container">
                {toasts.map(toast => (
                    <div key={toast.id} className={`toast toast-${toast.type}`}>
                        {toast.type === 'success' && '✅ '}
                        {toast.type === 'error' && '❌ '}
                        {toast.type === 'info' && 'ℹ️ '}
                        {toast.message}
                    </div>
                ))}
            </div>

            <style jsx global>{`
                .toast-container {
                    position: fixed;
                    bottom: 2rem;
                    right: 2rem;
                    z-index: 9999;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    pointer-events: none;
                }
                .toast {
                    background: rgba(15, 23, 42, 0.9);
                    backdrop-filter: blur(10px);
                    color: white;
                    padding: 1rem 1.5rem;
                    border-radius: 8px;
                    border: 1px solid rgba(255,255,255,0.1);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                    font-size: 0.95rem;
                    font-weight: 500;
                    animation: slideIn 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .toast-success { border-left: 4px solid #10b981; }
                .toast-error { border-left: 4px solid #ef4444; }
                .toast-info { border-left: 4px solid #3b82f6; }

                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(20px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </ToastContext.Provider>
    );
}

export function useToast() {
    return useContext(ToastContext);
}
