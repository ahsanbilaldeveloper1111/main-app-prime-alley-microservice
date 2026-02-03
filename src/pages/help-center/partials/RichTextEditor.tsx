import React, { useRef, useEffect, useState } from 'react';
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
  const [activeFormats, setActiveFormats] = useState<Record<string, boolean>>({});

  // Check if a format command is currently active
  const isFormatActive = (command: string): boolean => {
    if (!editorRef.current) return false;
    
    try {
      return document.queryCommandState(command);
    } catch (e) {
      return false;
    }
  };

  // Check alignment by inspecting computed styles
  const getCurrentAlignment = (): 'left' | 'center' | 'right' => {
    if (!editorRef.current) return 'left';
    
    const selection = window.getSelection();
    
    // If there's a selection, check the alignment of the selected element
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      let element: Node | Element | null = range.commonAncestorContainer;
      
      // Get the element (not text node)
      if (element && element.nodeType === Node.TEXT_NODE) {
        const parent = element.parentElement;
        if (parent) {
          element = parent;
        }
      }
      
      if (element && element instanceof Element) {
        // Walk up the DOM tree to find the element with text-align style
        let current: Element | null = element;
        while (current && current !== editorRef.current) {
          const computedStyle = window.getComputedStyle(current);
          const textAlign = computedStyle.textAlign;
          
          if (textAlign === 'center') {
            return 'center';
          } else if (textAlign === 'right' || textAlign === 'end') {
            return 'right';
          } else if (textAlign === 'left' || textAlign === 'start') {
            return 'left';
          }
          
          current = current.parentElement;
        }
      }
    }
    
    // If no selection or no explicit alignment found, check the editor's default alignment
    const editorStyle = window.getComputedStyle(editorRef.current);
    const editorAlign = editorStyle.textAlign;
    
    if (editorAlign === 'center') {
      return 'center';
    } else if (editorAlign === 'right' || editorAlign === 'end') {
      return 'right';
    }
    
    // Default to left (either explicitly set or as fallback)
    return 'left';
  };

  // Check if current selection is in a heading
  const isHeadingActive = (level: 1 | 2): boolean => {
    if (!editorRef.current) return false;
    
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const node = selection.anchorNode;
      if (node) {
        let element = node.nodeType === Node.TEXT_NODE ? node.parentElement : node as Element;
        while (element && element !== editorRef.current) {
          const tagName = element.tagName?.toLowerCase();
          if (tagName === `h${level}`) {
            return true;
          }
          element = element.parentElement as Element;
        }
      }
    }
    return false;
  };

  // Update active formats based on current selection
  const updateActiveFormats = () => {
    if (!editorRef.current) return;
    
    // Get current alignment from computed styles
    const currentAlignment = getCurrentAlignment();
    
    const formats: Record<string, boolean> = {
      bold: isFormatActive('bold'),
      italic: isFormatActive('italic'),
      underline: isFormatActive('underline'),
      strikeThrough: isFormatActive('strikeThrough'),
      justifyLeft: currentAlignment === 'left',
      justifyCenter: currentAlignment === 'center',
      justifyRight: currentAlignment === 'right',
      formatBlockH1: isHeadingActive(1),
      formatBlockH2: isHeadingActive(2),
      insertUnorderedList: isFormatActive('insertUnorderedList'),
      insertOrderedList: isFormatActive('insertOrderedList'),
    };

    setActiveFormats(formats);
  };

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value;
    }
    // Update active formats after content is initialized
    setTimeout(updateActiveFormats, 100);
  }, [value]);

  // Add event listeners to track selection changes
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const handleSelectionChange = () => {
      updateActiveFormats();
    };

    const handleMouseUp = () => {
      setTimeout(updateActiveFormats, 0);
    };

    const handleKeyUp = () => {
      setTimeout(updateActiveFormats, 0);
    };

    const handleClick = () => {
      setTimeout(updateActiveFormats, 0);
    };

    // Initial update when editor is ready
    setTimeout(updateActiveFormats, 100);

    document.addEventListener('selectionchange', handleSelectionChange);
    editor.addEventListener('mouseup', handleMouseUp);
    editor.addEventListener('keyup', handleKeyUp);
    editor.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      editor.removeEventListener('mouseup', handleMouseUp);
      editor.removeEventListener('keyup', handleKeyUp);
      editor.removeEventListener('click', handleClick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // updateActiveFormats is stable and doesn't need to be in deps

  // Rich text formatting functions
  const applyFormat = (command: string, value?: string) => {
    if (!editorRef.current) return;
    
    editorRef.current.focus();
    document.execCommand(command, false, value);
    updateEditorContent();
    // Update active formats after applying
    setTimeout(updateActiveFormats, 0);
  };

  const updateEditorContent = () => {
    if (!editorRef.current) return;
    
    const html = editorRef.current.innerHTML;
    const text = editorRef.current.innerText || editorRef.current.textContent || '';
    
    // Check max length
    // if (text.length > maxLength) {
    //   // Revert if exceeds max length
    //   if (editorRef.current) {
    //     editorRef.current.innerHTML = value;
    //   }
    //   return;
    // }
    
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
              color: activeFormats.bold ? '#0d6efd' : '#495057',
              backgroundColor: activeFormats.bold ? '#e7f1ff' : 'transparent',
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
              color: activeFormats.italic ? '#0d6efd' : '#495057',
              backgroundColor: activeFormats.italic ? '#e7f1ff' : 'transparent',
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
              color: activeFormats.underline ? '#0d6efd' : '#495057',
              backgroundColor: activeFormats.underline ? '#e7f1ff' : 'transparent',
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
              color: activeFormats.strikeThrough ? '#0d6efd' : '#495057',
              backgroundColor: activeFormats.strikeThrough ? '#e7f1ff' : 'transparent',
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
              color: activeFormats.formatBlockH1 ? '#0d6efd' : '#495057',
              backgroundColor: activeFormats.formatBlockH1 ? '#e7f1ff' : 'transparent',
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
              color: activeFormats.formatBlockH2 ? '#0d6efd' : '#495057',
              backgroundColor: activeFormats.formatBlockH2 ? '#e7f1ff' : 'transparent',
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
              color: activeFormats.insertUnorderedList ? '#0d6efd' : '#495057',
              backgroundColor: activeFormats.insertUnorderedList ? '#e7f1ff' : 'transparent',
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
              color: activeFormats.insertOrderedList ? '#0d6efd' : '#495057',
              backgroundColor: activeFormats.insertOrderedList ? '#e7f1ff' : 'transparent',
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
              color: activeFormats.justifyLeft ? '#0d6efd' : '#495057',
              backgroundColor: activeFormats.justifyLeft ? '#e7f1ff' : 'transparent',
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
              color: activeFormats.justifyCenter ? '#0d6efd' : '#495057',
              backgroundColor: activeFormats.justifyCenter ? '#e7f1ff' : 'transparent',
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
              color: activeFormats.justifyRight ? '#0d6efd' : '#495057',
              backgroundColor: activeFormats.justifyRight ? '#e7f1ff' : 'transparent',
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
          {/* <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#6c757d' }}>
            {getTextLength()}/{maxLength}
          </div> */}
        </div>

        {/* Rich Text Editor */}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleEditorInput}
          onPaste={handleEditorPaste}
          onFocus={() => {
            // Update active formats when editor is focused
            setTimeout(updateActiveFormats, 0);
          }}
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
            borderRadius: '0 0 6px 6px',
            textAlign: 'left' // Ensure default alignment is left
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
