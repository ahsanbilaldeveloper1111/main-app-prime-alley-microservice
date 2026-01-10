import React, { useRef, useEffect } from 'react';
import { Button } from 'react-bootstrap';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  Heading1,
  Heading2,
  Strikethrough,
  Link,
  Undo,
  Redo
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string, text: string) => void;
  placeholder?: string;
  minHeight?: string;
  maxHeight?: string;
  maxLength?: number;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Describe your issue in detail...",
  minHeight = '150px',
  maxHeight = '300px',
  maxLength = 500
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const colorPickerRef = useRef<HTMLInputElement>(null);

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  // Rich text formatting functions
  const applyFormat = (command: string, value?: string) => {
    if (!editorRef.current) return;
    
    editorRef.current.focus();
    document.execCommand(command, false, value);
    updateEditorContent();
  };

  const updateEditorContent = () => {
    if (!editorRef.current) return;
    
    const html = editorRef.current.innerHTML;
    const text = editorRef.current.innerText || editorRef.current.textContent || '';
    
    // Check max length
    if (text.length > maxLength) {
      // Revert if exceeds max length
      if (editorRef.current) {
        editorRef.current.innerHTML = value;
      }
      return;
    }
    
    onChange(html, text);
  };

  const handleEditorInput = () => {
    updateEditorContent();
  };

  const handleEditorPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    updateEditorContent();
  };

  const handleColorChange = (color: string) => {
    applyFormat('foreColor', color);
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      applyFormat('createLink', url);
    }
  };

  const getTextLength = (): number => {
    if (!editorRef.current) return 0;
    return (editorRef.current.innerText || editorRef.current.textContent || '').length;
  };

  return (
    <>
      {/* Rich Text Editor Container */}
      <div style={{
        border: '1px solid #dee2e6',
        borderRadius: '6px',
        background: '#fff'
      }}>
        {/* Rich Text Toolbar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '2px',
          padding: '8px 12px',
          background: '#f8f9fa',
          borderBottom: '1px solid #dee2e6',
          borderRadius: '6px 6px 0 0'
        }}>
          {/* Text Formatting */}
          <Button
            variant="link"
            onClick={() => applyFormat('bold')}
            onMouseDown={(e) => e.preventDefault()}
            style={{
              padding: '6px 8px',
              color: '#495057',
              minWidth: 'auto',
              border: 'none',
              borderRadius: '4px'
            }}
            title="Bold (Ctrl+B)"
          >
            <Bold size={16} />
          </Button>
          <Button
            variant="link"
            onClick={() => applyFormat('italic')}
            onMouseDown={(e) => e.preventDefault()}
            style={{
              padding: '6px 8px',
              color: '#495057',
              minWidth: 'auto',
              border: 'none',
              borderRadius: '4px'
            }}
            title="Italic (Ctrl+I)"
          >
            <Italic size={16} />
          </Button>
          <Button
            variant="link"
            onClick={() => applyFormat('underline')}
            onMouseDown={(e) => e.preventDefault()}
            style={{
              padding: '6px 8px',
              color: '#495057',
              minWidth: 'auto',
              border: 'none',
              borderRadius: '4px'
            }}
            title="Underline (Ctrl+U)"
          >
            <Underline size={16} />
          </Button>
          <Button
            variant="link"
            onClick={() => applyFormat('strikeThrough')}
            onMouseDown={(e) => e.preventDefault()}
            style={{
              padding: '6px 8px',
              color: '#495057',
              minWidth: 'auto',
              border: 'none',
              borderRadius: '4px'
            }}
            title="Strikethrough"
          >
            <Strikethrough size={16} />
          </Button>
          
          <div style={{
            width: '1px',
            height: '24px',
            background: '#dee2e6',
            margin: '0 4px'
          }} />

          {/* Headings */}
          <Button
            variant="link"
            onClick={() => applyFormat('formatBlock', '<h1>')}
            onMouseDown={(e) => e.preventDefault()}
            style={{
              padding: '6px 8px',
              color: '#495057',
              minWidth: 'auto',
              border: 'none',
              borderRadius: '4px'
            }}
            title="Heading 1"
          >
            <Heading1 size={16} />
          </Button>
          <Button
            variant="link"
            onClick={() => applyFormat('formatBlock', '<h2>')}
            onMouseDown={(e) => e.preventDefault()}
            style={{
              padding: '6px 8px',
              color: '#495057',
              minWidth: 'auto',
              border: 'none',
              borderRadius: '4px'
            }}
            title="Heading 2"
          >
            <Heading2 size={16} />
          </Button>
          
          <div style={{
            width: '1px',
            height: '24px',
            background: '#dee2e6',
            margin: '0 4px'
          }} />

          {/* Lists */}
          <Button
            variant="link"
            onClick={() => applyFormat('insertUnorderedList')}
            onMouseDown={(e) => e.preventDefault()}
            style={{
              padding: '6px 8px',
              color: '#495057',
              minWidth: 'auto',
              border: 'none',
              borderRadius: '4px'
            }}
            title="Bullet List"
          >
            <List size={16} />
          </Button>
          <Button
            variant="link"
            onClick={() => applyFormat('insertOrderedList')}
            onMouseDown={(e) => e.preventDefault()}
            style={{
              padding: '6px 8px',
              color: '#495057',
              minWidth: 'auto',
              border: 'none',
              borderRadius: '4px'
            }}
            title="Numbered List"
          >
            <ListOrdered size={16} />
          </Button>
          
          <div style={{
            width: '1px',
            height: '24px',
            background: '#dee2e6',
            margin: '0 4px'
          }} />

          {/* Alignment */}
          <Button
            variant="link"
            onClick={() => applyFormat('justifyLeft')}
            onMouseDown={(e) => e.preventDefault()}
            style={{
              padding: '6px 8px',
              color: '#495057',
              minWidth: 'auto',
              border: 'none',
              borderRadius: '4px'
            }}
            title="Align Left"
          >
            <AlignLeft size={16} />
          </Button>
          <Button
            variant="link"
            onClick={() => applyFormat('justifyCenter')}
            onMouseDown={(e) => e.preventDefault()}
            style={{
              padding: '6px 8px',
              color: '#495057',
              minWidth: 'auto',
              border: 'none',
              borderRadius: '4px'
            }}
            title="Align Center"
          >
            <AlignCenter size={16} />
          </Button>
          <Button
            variant="link"
            onClick={() => applyFormat('justifyRight')}
            onMouseDown={(e) => e.preventDefault()}
            style={{
              padding: '6px 8px',
              color: '#495057',
              minWidth: 'auto',
              border: 'none',
              borderRadius: '4px'
            }}
            title="Align Right"
          >
            <AlignRight size={16} />
          </Button>
          
          <div style={{
            width: '1px',
            height: '24px',
            background: '#dee2e6',
            margin: '0 4px'
          }} />

          {/* Color Picker */}
          <div style={{ position: 'relative' }}>
            <Button
              variant="link"
              onClick={() => {
                if (colorPickerRef.current) {
                  colorPickerRef.current.click();
                }
              }}
              onMouseDown={(e) => e.preventDefault()}
              style={{
                padding: '6px 8px',
                color: '#495057',
                minWidth: 'auto',
                border: 'none',
                borderRadius: '4px'
              }}
              title="Text Color"
            >
              <Palette size={16} />
            </Button>
            <input
              ref={colorPickerRef}
              type="color"
              onChange={(e) => handleColorChange(e.target.value)}
              style={{
                position: 'absolute',
                opacity: 0,
                width: 0,
                height: 0,
                pointerEvents: 'none'
              }}
            />
          </div>

          {/* Link */}
          <Button
            variant="link"
            onClick={insertLink}
            onMouseDown={(e) => e.preventDefault()}
            style={{
              padding: '6px 8px',
              color: '#495057',
              minWidth: 'auto',
              border: 'none',
              borderRadius: '4px'
            }}
            title="Insert Link"
          >
            <Link size={16} />
          </Button>

          <div style={{
            width: '1px',
            height: '24px',
            background: '#dee2e6',
            margin: '0 4px'
          }} />

          {/* Undo/Redo */}
          <Button
            variant="link"
            onClick={() => applyFormat('undo')}
            onMouseDown={(e) => e.preventDefault()}
            style={{
              padding: '6px 8px',
              color: '#495057',
              minWidth: 'auto',
              border: 'none',
              borderRadius: '4px'
            }}
            title="Undo (Ctrl+Z)"
          >
            <Undo size={16} />
          </Button>
          <Button
            variant="link"
            onClick={() => applyFormat('redo')}
            onMouseDown={(e) => e.preventDefault()}
            style={{
              padding: '6px 8px',
              color: '#495057',
              minWidth: 'auto',
              border: 'none',
              borderRadius: '4px'
            }}
            title="Redo (Ctrl+Y)"
          >
            <Redo size={16} />
          </Button>

          {/* Character Count */}
          <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#6c757d' }}>
            {getTextLength()}/{maxLength}
          </div>
        </div>

        {/* Rich Text Editor */}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleEditorInput}
          onPaste={handleEditorPaste}
          suppressContentEditableWarning
          style={{
            minHeight,
            maxHeight,
            padding: '12px 14px',
            fontSize: '14px',
            lineHeight: '1.5',
            color: '#495057',
            overflowY: 'auto',
            outline: 'none',
            borderRadius: '0 0 6px 6px'
          }}
          data-placeholder={placeholder}
        />
      </div>

      {/* Placeholder styling */}
      <style>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #6c757d;
          pointer-events: none;
        }
        [contenteditable] ul, [contenteditable] ol {
          padding-left: 20px;
          margin: 8px 0;
        }
        [contenteditable] h1 {
          font-size: 24px;
          font-weight: 600;
          margin: 12px 0;
        }
        [contenteditable] h2 {
          font-size: 20px;
          font-weight: 600;
          margin: 10px 0;
        }
        [contenteditable] a {
          color: #4680ff;
          text-decoration: underline;
        }
      `}</style>
    </>
  );
};

export default RichTextEditor;
