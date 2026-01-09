"use client";

import { useStore } from "@/context/StoreContext";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function ProfilePage() {
    const { user, updateUser, logout } = useStore();
    const { showToast } = useToast();
    const router = useRouter();
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.name || "");
        } else {
            // router.push("/signin?returnUrl=/profile");
        }
    }, [user, router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch("/api/user", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, password }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to update profile");

            updateUser(data.user); // Update local context
            setIsSaved(true);
            showToast("Profile updated successfully!", "success");

            if (password) {
                setPassword(""); // Clear password field after success
            }

            setTimeout(() => setIsSaved(false), 3000);

        } catch (error) {
            console.error(error);
            showToast(error.message, "error");
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) return <div className="container" style={{ paddingTop: '8rem', textAlign: 'center' }}>Please sign in.</div>;

    return (
        <div className="container" style={{ minHeight: '80vh', padding: '8rem 1.5rem 4rem', display: 'flex', justifyContent: 'center' }}>
            <div className="glass-panel" style={{ padding: '3rem', width: '100%', maxWidth: '600px' }}>
                <h1 className="text-gradient" style={{ marginBottom: '2rem', fontSize: '2rem', textAlign: 'center' }}>User Profile</h1>

                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: '3px solid var(--primary)',
                        background: '#333'
                    }}>
                        {user.image ? (
                            <img src={user.image} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', color: '#fff' }}>
                                {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                            </div>
                        )}
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.8rem', color: '#ccc' }}>Display Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="auth-input"
                            style={{ fontSize: '1.1rem', padding: '1rem' }}
                        />
                    </div>

                    <div style={{ marginBottom: '3rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.8rem', color: '#ccc' }}>New Password (Optional)</label>
                        <input
                            type="password"
                            placeholder="Leave blank to keep current"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="auth-input"
                            style={{ fontSize: '1.1rem', padding: '1rem' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isLoading}>
                            {isLoading ? "Saving Changes..." : isSaved ? "Saved!" : "Update Profile"}
                        </button>

                        <button
                            type="button"
                            onClick={() => { logout(); router.push("/"); }}
                            className="btn btn-ghost"
                            style={{ width: '100%', borderColor: '#ef4444', color: '#ef4444' }}
                        >
                            Sign Out
                        </button>
                    </div>
                </form>
            </div>

            <style jsx global>{`
                .auth-input {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    border-radius: var(--radius-md);
                    border: 1px solid var(--glass-border);
                    background: rgba(255,255,255,0.05);
                    color: #fff;
                    font-size: 1rem;
                    outline: none;
                    transition: border-color 0.2s;
                }
                .auth-input:focus {
                    border-color: var(--primary);
                }
            `}</style>
        </div>
    );
}
