import React, { useRef, useEffect, useCallback } from "react";
import { Bold, Italic, Underline, Link, Image } from "lucide-react";

export interface RichNoteEditorProps {
  id?: string;
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  height?: number;
  disabled?: boolean;
}

const RichNoteEditor: React.FC<RichNoteEditorProps> = ({
  id,
  value,
  onChange,
  placeholder = "Start typing…",
  height = 120,
  disabled = false,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastEmittedRef = useRef<string>("");

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (value !== lastEmittedRef.current) {
      lastEmittedRef.current = value;
      el.innerHTML = value || "";
    }
  }, [value]);

  const emitChange = useCallback(() => {
    const html = editorRef.current?.innerHTML ?? "";
    lastEmittedRef.current = html;
    onChange(html);
  }, [onChange]);

  const exec = useCallback(
    (cmd: string, value?: string) => {
      editorRef.current?.focus();
      // NOSONAR: document.execCommand is deprecated but still needed for this lightweight rich text editor.
      document.execCommand(cmd, false, value ?? undefined);
      emitChange();
    },
    [emitChange],
  );

  const handleBold = () => exec("bold");
  const handleItalic = () => exec("italic");
  const handleUnderline = () => exec("underline");

  const handleLink = () => {
    const url = globalThis.prompt("Enter URL:", "https://");
    if (url == null) return;
    if (url) {
      exec("createLink", url.startsWith("http") ? url : `https://${url}`);
    }
    emitChange();
  };

  const handleImage = () => {
    const url = globalThis.prompt("Enter image URL:", "https://");
    if (!url?.trim()) return;
    const imgUrl = url.startsWith("http") ? url : `https://${url}`;
    const alt = (globalThis.prompt("Image description (alt text):", "Image") ?? "Image").replaceAll('"', "&quot;");
    const html = `<img src="${imgUrl}" alt="${alt}" style="max-width:100%;height:auto;" />`;
    exec("insertHTML", html);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const file = Array.from(items).find((i) => i.kind === "file" && i.type.startsWith("image/"));
    if (file) {
      e.preventDefault();
      const blob = file.getAsFile();
      if (!blob) return;
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const html = `<img src="${dataUrl}" alt="Pasted image" style="max-width:100%;height:auto;" />`;
        exec("insertHTML", html);
      };
      reader.readAsDataURL(blob);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case "b":
          e.preventDefault();
          handleBold();
          return;
        case "i":
          e.preventDefault();
          handleItalic();
          return;
        case "u":
          e.preventDefault();
          handleUnderline();
          return;
        case "k":
          e.preventDefault();
          handleLink();
          return;
      }
    }
  };

  const toolbarBtn = (
    onClick: () => void,
    title: string,
    icon: React.ReactNode,
  ) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        background: "transparent",
        border: "none",
        padding: "6px",
        cursor: disabled ? "not-allowed" : "pointer",
        color: "#141414",
        display: "flex",
        alignItems: "center",
        borderRadius: "3px",
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.backgroundColor = "#f5f8fa";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      {icon}
    </button>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          padding: "8px 0",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        {toolbarBtn(handleBold, "Bold (Ctrl+B)", <Bold size={16} />)}
        {toolbarBtn(handleItalic, "Italic (Ctrl+I)", <Italic size={16} />)}
        {toolbarBtn(handleUnderline, "Underline (Ctrl+U)", <Underline size={16} />)}
        {toolbarBtn(handleLink, "Insert link", <Link size={16} />)}
        {toolbarBtn(handleImage, "Insert image", <Image size={16} aria-label="Insert image" />)}
      </div>
      <div /* NOSONAR: rich text editor requires non-native contentEditable textbox */
        ref={editorRef}
        id={id}
        contentEditable={!disabled}
        role="textbox"
        aria-multiline="true"
        aria-label={placeholder || "Rich text editor"}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : 0}
        data-placeholder={placeholder}
        onInput={emitChange}
        onBlur={emitChange}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        suppressContentEditableWarning
        style={{
          height: `${height}px`,
          width: "100%",
          padding: "10px 12px",
          border: "1px solid #cbd5e0",
          borderRadius: "4px",
          fontSize: "14px",
          color: "#141414",
          lineHeight: "1.6",
          fontFamily: "inherit",
          outline: "none",
          overflow: "auto",
        }}
        className="rich-note-editor"
      />
      <style>{`
        .rich-note-editor:empty::before {
          content: attr(data-placeholder);
          color: #94a3b8;
        }
        .rich-note-editor a { color: #006162; text-decoration: none; }
        .rich-note-editor a:hover { text-decoration: underline; }
      `}</style>
    </div>
  );
};

export default RichNoteEditor;
