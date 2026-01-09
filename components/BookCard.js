import Link from 'next/link';

export default function BookCard({ book }) {
    return (
        <Link href={`/books/${book.id}`} className="book-card-link">
            <div className="book-card glass-panel">
                <div className="book-cover" style={{
                    background: (book.image || book.coverImage) ? `url(${book.image || book.coverImage}) center/cover no-repeat` : book.gradient,
                    position: 'relative'
                }}>
                    {!(book.image || book.coverImage) && <div className="book-spine"></div>}
                    <span className="book-badge">New</span>
                </div>
                <div className="book-info">
                    <h3 className="book-title">{book.title}</h3>
                    <p className="book-author">{book.author}</p>
                    <div className="book-meta">
                        <span className="book-price">₹{book.price.toFixed(2)}</span>
                        <span className="btn-text">Details &rarr;</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
