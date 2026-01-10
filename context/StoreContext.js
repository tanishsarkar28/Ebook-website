"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useToast } from "@/context/ToastContext";
import { books as FALLBACK_BOOKS } from "@/lib/books";


const StoreContext = createContext();

export function StoreProvider({ children }) {
    const { data: session, status, update: updateSession } = useSession();
    const { showToast } = useToast();
    const [user, setUser] = useState(null);
    const [purchasedBooks, setPurchasedBooks] = useState([]);
    const [availableBooks, setAvailableBooks] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [isInitialized, setIsInitialized] = useState(false);

    // Sync session to user state and permissions
    useEffect(() => {
        if (status === "authenticated" && session?.user) {
            setUser(session.user);
            // Sync purchased books directly from session (which gets it from DB)
            setPurchasedBooks(session.user.purchasedBooks || []);

            // If admin, fetch all transactions
            if (session.user.isAdmin) {
                refreshTransactions();
            }
        } else if (status === "unauthenticated") {
            setUser(null);
            setPurchasedBooks([]);
            setTransactions([]);
        }
    }, [status, session]);

    const refreshTransactions = async () => {
        try {
            const res = await fetch('/api/orders');
            if (res.ok) {
                const data = await res.json();
                // Map _id to id for frontend compatibility
                const mappedTransactions = data.map(t => ({ ...t, id: t._id }));
                setTransactions(mappedTransactions);
                // Update pending orders derived from transactions
                setPendingOrders(mappedTransactions.filter(t => t.status === 'pending'));
            }
        } catch (error) {
            console.error("Failed to fetch transactions:", error);
        }
    };

    // Legacy login function (kept for compatibility with older components if any)
    const login = (userDataOrEmail) => {
        // Warning: This is client-side only and won't persist across refreshes like NextAuth
        console.warn("Using legacy login. Prefer NextAuth signIn.");
        // ... (simplified)
    };

    const logout = async () => {
        await signOut({ redirect: false });
        // State checks will handle cleanup
    };

    // Buy Book (Client-Side Optimistic - Actual logic is in Checkout Page)
    const buyBook = (bookId) => {
        // Deprecated: Checkout page handles this via API now.
        return true;
    };

    // Load Data on Mount (Books Only)
    useEffect(() => {
        fetch('/api/books')
            .then(async res => {
                if (!res.ok) throw new Error("Failed to fetch");
                return res.json();
            })
            .then(data => {
                if (Array.isArray(data)) {
                    const mappedBooks = data.map(b => ({ ...b, id: b._id }));
                    setAvailableBooks(mappedBooks);
                    setIsInitialized(true);
                }
            })
            .catch(err => {
                console.warn("Offline Mode:", err.message);
                setAvailableBooks(FALLBACK_BOOKS);
                setIsInitialized(true);
            });
    }, []);


    // Order Management (Server-Side)
    const [pendingOrders, setPendingOrders] = useState([]);

    // Create Order is now handled by Checkout Page calling API directly. 
    // We keep this function stub compliant if used elsewhere, but ideally remove usage.
    const createOrder = (order) => {
        // No-op or optimistic update if needed
    };

    const approveOrder = async (orderId) => {
        try {
            const res = await fetch(`/api/orders/${orderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'completed' })
            });
            if (res.ok) {
                showToast("Order Approved", "success");
                refreshTransactions(); // Reload data to reflect changes
            }
        } catch (error) {
            console.error("Approve failed:", error);
            showToast("Failed to approve", "error");
        }
    };

    const rejectOrder = async (orderId) => {
        try {
            const res = await fetch(`/api/orders/${orderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'rejected' })
            });
            if (res.ok) {
                showToast("Order Rejected", "error"); // Visual feedback
                refreshTransactions();
            }
        } catch (error) {
            console.error("Reject failed:", error);
        }
    };

    const revokeAccess = async (transactionId) => {
        try {
            const res = await fetch(`/api/orders/${transactionId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'revoked' })
            });
            if (res.ok) {
                showToast("Access Revoked", "success");
                refreshTransactions();
            }
        } catch (error) {
            console.error("Revoke failed:", error);
        }
    };

    // User Persistence (Handled by NextAuth Session now)
    // We remove the old localStorage effects for user/purchases/pendingOrders


    const [readingProgress, setReadingProgress] = useState({});

    // Load reading progress
    useEffect(() => {
        if (user) {
            const savedProgress = JSON.parse(localStorage.getItem(`readingProgress_${user.email}`) || "{}");
            setReadingProgress(savedProgress);
        } else {
            setReadingProgress({});
        }
    }, [user]);

    const updateReadingProgress = useCallback((bookId, page, totalPages) => {
        if (!user) return;
        setReadingProgress(prev => {
            const current = prev[bookId];
            if (current?.page === page && current?.totalPages === totalPages) return prev;

            const updated = { ...prev, [bookId]: { page, totalPages, lastRead: new Date().toISOString() } };
            localStorage.setItem(`readingProgress_${user.email}`, JSON.stringify(updated));
            return updated;
        });
    }, [user]);

    return (
        <StoreContext.Provider value={{
            user, login, logout,
            buyBook, hasPurchased, updateUser,
            availableBooks, addBook, deleteBook, updateBook, transactions,
            pendingOrders, createOrder, approveOrder, rejectOrder, revokeAccess,
            readingProgress, updateReadingProgress
        }}>
            {children}
        </StoreContext.Provider>
    );
}

export function useStore() {
    return useContext(StoreContext);
}
