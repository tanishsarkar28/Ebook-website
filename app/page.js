"use client";

import { useStore } from "@/context/StoreContext";
import BookCard from "@/components/BookCard";
import { useState } from "react";

export default function Home() {
  const { availableBooks } = useStore();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredBooks = availableBooks.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container">
      <section className="hero">
        <h1 className="text-gradient">
          Expand Your Mind <br />
          One Page at a Time
        </h1>
        <p>
          Discover a curated collection of premium digital books.
          Immerse yourself in stories that matter.
        </p>

        <div style={{ position: 'relative', maxWidth: '500px', margin: '0 auto 2rem' }}>
          <input
            type="text"
            placeholder="Search by title or author..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '1rem 1.5rem',
              borderRadius: '9999px',
              border: '1px solid var(--glass-border)',
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              color: '#fff',
              fontSize: '1rem',
              outline: 'none',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              transition: 'all 0.3s ease'
            }}
            onFocus={(e) => {
              e.target.style.background = 'rgba(255,255,255,0.1)';
              e.target.style.borderColor = 'var(--primary)';
              e.target.style.boxShadow = '0 0 0 4px rgba(212, 175, 55, 0.2)';
            }}
            onBlur={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.05)';
              e.target.style.borderColor = 'var(--glass-border)';
              e.target.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)';
            }}
          />
          <span style={{ position: 'absolute', right: '1.5rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
        </div>

        <a href="#browse" className="btn btn-primary">Start Reading</a>
      </section>

      <section id="browse">
        <h2 style={{ fontSize: '2rem', marginBottom: '2rem' }}>
          {searchTerm ? `Search Results for "${searchTerm}"` : "Featured Collection"}
        </h2>

        {filteredBooks.length > 0 ? (
          <div className="book-grid">
            {filteredBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem 0', opacity: 0.6 }}>
            <h3>No books found.</h3>
            <p>Try searching for a different title or author.</p>
          </div>
        )}
      </section>
    </div>
  );
}
