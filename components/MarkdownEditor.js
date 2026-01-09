"use client";

import { useRef } from 'react';

export default function MarkdownEditor({ value, onChange, style }) {
    const textareaRef = useRef(null);

    const applyFormat = (type) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const selectedText = text.substring(start, end);

        let formattedText = '';
        let newCursorPos = end;

        switch (type) {
            case 'bold':
                formattedText = `**${selectedText || 'bold text'}**`;
                newCursorPos = end + 4; // adjust for **...**
                if (!selectedText) newCursorPos = start + 2;
                break;
            case 'italic':
                formattedText = `*${selectedText || 'italic text'}*`;
                newCursorPos = end + 2;
                if (!selectedText) newCursorPos = start + 1;
                break;
            case 'h1':
                formattedText = `# ${selectedText || 'Heading 1'}`;
                newCursorPos = end + 2;
                break;
            case 'h2':
                formattedText = `## ${selectedText || 'Heading 2'}`;
                newCursorPos = end + 3;
                break;
            case 'list':
                formattedText = `\n- ${selectedText || 'List item'}`;
                newCursorPos = end + 3;
                break;
            case 'quote':
                formattedText = `\n> ${selectedText || 'Quote'}`;
                newCursorPos = end + 3;
                break;
            default:
                return;
        }

        const newValue = text.substring(0, start) + formattedText + text.substring(end);

        // Update parent state
        onChange(newValue);

        // Restore focus and selection (async to let React render)
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(
                start + formattedText.length,
                start + formattedText.length
            );
        }, 0);
    };

    return (
        <div className="markdown-editor" style={{
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            background: 'rgba(255, 255, 255, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            ...style
        }}>
            <div className="toolbar" style={{
                display: 'flex',
                gap: '0.5rem',
                padding: '0.5rem',
                background: 'rgba(255, 255, 255, 0.05)',
                borderBottom: '1px solid var(--glass-border)',
                flexShrink: 0
            }}>
                <ToolbarButton onClick={() => applyFormat('bold')} label="B" title="Bold" style={{ fontWeight: 'bold' }} />
                <ToolbarButton onClick={() => applyFormat('italic')} label="I" title="Italic" style={{ fontStyle: 'italic' }} />
                <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', margin: '0 0.5rem' }}></div>
                <ToolbarButton onClick={() => applyFormat('h1')} label="H1" title="Heading 1" />
                <ToolbarButton onClick={() => applyFormat('h2')} label="H2" title="Heading 2" />
                <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', margin: '0 0.5rem' }}></div>
                <ToolbarButton onClick={() => applyFormat('list')} label="• List" title="Bullet List" />
                <ToolbarButton onClick={() => applyFormat('quote')} label="❝ Quote" title="Blockquote" />
            </div>
            <textarea
                ref={textareaRef}
                className="auth-input"
                placeholder="# Start writing your masterpiece..."
                required
                value={value}
                onChange={(e) => onChange(e.target.value)}
                style={{
                    border: 'none',
                    background: 'transparent',
                    borderRadius: '0 0 var(--radius-md) var(--radius-md)',
                    resize: 'none',
                    width: '100%',
                    padding: '1rem',
                    fontFamily: 'monospace',
                    flex: 1,
                    minHeight: '200px'
                }}
            />
        </div>
    );
}

function ToolbarButton({ onClick, label, title, style }) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#fff',
                padding: '0.4rem 0.8rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                minWidth: '32px',
                ...style
            }}
            onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
            onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
        >
            {label}
        </button>
    )
}
