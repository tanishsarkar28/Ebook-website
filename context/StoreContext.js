"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useToast } from "@/context/ToastContext";
import { books as FALLBACK_BOOKS } from "@/lib/books";


const StoreContext = createContext();

export function StoreProvider({ children }) {
    const { data: session, status } = useSession();
    const { showToast } = useToast();
    const [user, setUser] = useState(null);
    const [purchasedBooks, setPurchasedBooks] = useState([]);
    const [availableBooks, setAvailableBooks] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [isInitialized, setIsInitialized] = useState(false);

    // Sync session to user state
    useEffect(() => {
        if (status === "authenticated" && session?.user) {
            setUser(session.user);
        } else if (status === "unauthenticated") {
            setUser(null);
        }
    }, [status, session]);

    // Legacy login function (kept for compatibility if needed, but we should move to specific signIn)
    // Actually, we can remove it if we update signin page, but let's keep it as a wrapper or just simple state setter for now if manual override is needed
    // But for proper OAuth, we rely on session.
    const login = (userDataOrEmail) => {
        // This is kept for the existing "demo" flow if it bypasses next-auth, 
        // but ideally we should use next-auth for everything.
        // For now, we'll leave it but it might be overwritten by session effect if session is null.

        let userData;
        if (typeof userDataOrEmail === 'string') {
            const email = userDataOrEmail;
            userData = {
                name: email.split('@')[0],
                email: email,
                isAdmin: email === 'sarkartanish2802@gmail.com'
            };
        } else {
            userData = userDataOrEmail;
        }
        setUser(userData);
    };

    const logout = async () => {
        await signOut({ redirect: false });
        setUser(null);
    };

    const buyBook = (bookId) => {
        if (!purchasedBooks.includes(bookId)) {
            setPurchasedBooks((prev) => [...prev, bookId]);
            const book = availableBooks.find(b => b.id === bookId);
            if (book) {
                setTransactions(prev => [{
                    id: Date.now(),
                    bookTitle: book.title,
                    price: book.price,
                    date: new Date().toISOString(),
                    buyer: user?.email || "Anonymous",
                    bookId: book.id
                }, ...prev]);
            }
            return true;
        }
        return false;
    };

    // Load Data on Mount
    useEffect(() => {
        // Fetch Books from API
        fetch('/api/books')
            .then(async res => {
                if (!res.ok) throw new Error("Failed to fetch");
                return res.json();
            })
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    const mappedBooks = data.map(b => ({ ...b, id: b._id }));
                    setAvailableBooks(mappedBooks);
                } else {
                    // If API returns empty (no seed?) or error structure, use fallback
                    console.warn("API returned empty/invalid list. Using fallback.");
                    setAvailableBooks(FALLBACK_BOOKS);
                }
            })
            .catch(err => {
                console.warn("Offline Mode: API unreachable, using local books.", err.message);
                setAvailableBooks(FALLBACK_BOOKS);
            });

        // Load other local data
        const storedTransactions = JSON.parse(localStorage.getItem("transactions") || "[]");
        const storedPendingOrders = JSON.parse(localStorage.getItem("pendingOrders") || "[]");

        if (storedTransactions.length > 0) setTransactions(storedTransactions);
        if (storedPendingOrders) setPendingOrders(storedPendingOrders);

        setIsInitialized(true);
    }, []);

    // ... (keep auth/user effects) ...

    const addBook = async (newBook) => {
        try {
            const res = await fetch('/api/books', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newBook)
            });

            if (res.ok) {
                const savedBook = await res.json();
                const bookWithId = { ...savedBook, id: savedBook._id };
                setAvailableBooks(prev => [...prev, bookWithId]);
                return bookWithId;
            } else {
                showToast("Failed to create book", "error");
            }
        } catch (err) {
            console.error(err);
            showToast("Network error", "error");
        }
    };

    const deleteBook = async (bookId) => {
        // Optimistic update
        const previousBooks = [...availableBooks];
        setAvailableBooks(prev => prev.filter(book => book.id !== bookId));

        try {
            const res = await fetch(`/api/books/${bookId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error("Delete failed");
            showToast("Book deleted", "success");
        } catch (err) {
            // Revert
            setAvailableBooks(previousBooks);
            showToast("Failed to delete book", "error");
        }
    };

    const updateBook = async (id, updatedDetails) => {
        // Optimistic update
        setAvailableBooks(prev => prev.map(book =>
            book.id === id ? { ...book, ...updatedDetails } : book
        ));

        try {
            const res = await fetch(`/api/books/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedDetails)
            });
            if (!res.ok) throw new Error("Update failed");
        } catch (err) {
            console.error(err);
            showToast("Failed to save changes", "error");
            // Ideally revert here too
        }
    };

    const hasPurchased = (bookId) => purchasedBooks.includes(bookId);

    const updateUser = (updatedData) => {
        setUser(prev => ({ ...prev, ...updatedData }));
    };

    const [pendingOrders, setPendingOrders] = useState([]);

    const createOrder = (order) => {
        setPendingOrders(prev => [...prev, {
            ...order,
            id: Date.now(),
            date: new Date().toISOString(),
            status: 'pending'
        }]);
    };

    const approveOrder = (orderId) => {
        setPendingOrders(prev => prev.map(o =>
            o.id === orderId ? { ...o, status: 'approved' } : o
        ));

        const order = pendingOrders.find(o => o.id === orderId);
        if (order) {
            // Grant access to book (Fix: Write to BUYER'S storage, not just current user's state)
            const buyerEmail = order.userId || order.userName; // Assuming email is passed as userId/userName
            if (buyerEmail) {
                const userKey = `purchasedBooks_${buyerEmail}`;
                try {
                    const existingBooks = JSON.parse(localStorage.getItem(userKey) || "[]");
                    if (!existingBooks.includes(order.bookId)) {
                        existingBooks.push(order.bookId);
                        localStorage.setItem(userKey, JSON.stringify(existingBooks));
                    }
                } catch (e) {
                    console.error("Failed to grant access locally:", e);
                }
            }

            // Also update state if the BUYER is the CURRENT user (rare for admin, but good for testing)
            if (user && user.email === buyerEmail && !purchasedBooks.includes(order.bookId)) {
                setPurchasedBooks(prev => [...prev, order.bookId]);
            }

            // Record Transaction
            setTransactions(prev => [{
                id: Date.now(),
                bookTitle: order.bookTitle,
                price: order.price,
                date: new Date().toISOString(),
                buyer: buyerEmail,
                bookId: order.bookId
            }, ...prev]);
        }
    };

    const rejectOrder = (orderId) => {
        setPendingOrders(prev => prev.map(o =>
            o.id === orderId ? { ...o, status: 'rejected' } : o
        ));
    };

    const revokeAccess = (transactionId) => {
        const transaction = transactions.find(t => t.id === transactionId);
        if (transaction) {
            // 1. Remove from Buyer's Storage
            const buyerEmail = transaction.buyer;
            const userKey = `purchasedBooks_${buyerEmail}`;
            try {
                const existingBooks = JSON.parse(localStorage.getItem(userKey) || "[]");
                const updatedBooks = existingBooks.filter(id => id !== transaction.bookId);
                localStorage.setItem(userKey, JSON.stringify(updatedBooks));
            } catch (e) {
                console.error("Failed to revoke access locally:", e);
            }

            // 2. Remove Transaction Log
            setTransactions(prev => prev.filter(t => t.id !== transactionId));

            // 3. If the buyer is the current user, update state physically
            if (user && user.email === buyerEmail) {
                setPurchasedBooks(prev => prev.filter(id => id !== transaction.bookId));
            }
        }
    };

    // Load Data on Mount (Transactions & Orders are still local for now/transitioning)
    useEffect(() => {
        // We fetch books in a separate effect or here?
        // Let's keep this clean.
        const storedTransactions = JSON.parse(localStorage.getItem("transactions") || "[]");
        const storedPendingOrders = JSON.parse(localStorage.getItem("pendingOrders") || "[]");

        if (storedTransactions.length > 0) setTransactions(storedTransactions);
        if (storedPendingOrders) setPendingOrders(storedPendingOrders);

        setIsInitialized(true);
    }, []);

    // Save global state
    useEffect(() => {
        localStorage.setItem("transactions", JSON.stringify(transactions));
    }, [transactions]);

    useEffect(() => {
        localStorage.setItem("pendingOrders", JSON.stringify(pendingOrders));
    }, [pendingOrders]);

    useEffect(() => {
        if (isInitialized) {
            localStorage.setItem("availableBooks", JSON.stringify(availableBooks));
        }
    }, [availableBooks, isInitialized]);

    // User Persistence & Purchase Loading
    useEffect(() => {
        if (user) {
            // localStorage.setItem("user", JSON.stringify(user)); // Removed to rely on session, but maybe keep for other parts? 
            // Actually, keep writing it so if we reload page and session isn't ready immediately we might have jitter? 
            // NextAuth is fast. Let's remove manual user persistence to avoid conflicts.

            // Load this user's purchases
            const userKey = `purchasedBooks_${user.email}`;
            const userPurchases = JSON.parse(localStorage.getItem(userKey) || "[]");
            setPurchasedBooks(userPurchases);
        } else {
            // localStorage.removeItem("user");
            setPurchasedBooks([]); // No user = no purchases
        }
    }, [user]);

    // Save User Purchases
    useEffect(() => {
        if (user) {
            const userKey = `purchasedBooks_${user.email}`;
            localStorage.setItem(userKey, JSON.stringify(purchasedBooks));
        }
    }, [purchasedBooks, user]);

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
