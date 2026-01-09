export default function Footer() {
    return (
        <footer className="footer">
            <div className="container">
                <p>&copy; {new Date().getFullYear()} Aura Books. All rights reserved.</p>
                <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center', opacity: 0.5 }}>
                    <span>Privacy</span>
                    <span>Terms</span>
                    <span>Contact</span>
                </div>
            </div>
        </footer>
    );
}
