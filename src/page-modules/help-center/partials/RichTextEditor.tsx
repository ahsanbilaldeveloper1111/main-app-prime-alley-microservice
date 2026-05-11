import React, { useRef, useEffect, useState, useCallback } from "react";
import { Button } from "react-bootstrap";
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
  Strikethrough,
  Link,
  Undo,
  Redo,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string, text: string) => void;
  placeholder?: string;
  minHeight?: string;
  maxHeight?: string;
  maxLength?: number;
  /** 'sm' reduces toolbar button padding and icon size */
  buttonSize?: "sm" | "md";
}

type AlignSide = "left" | "center" | "right";

type ActiveFormatsState = Record<string, boolean | string>;

const BLOCK_TAGS = new Set(["p", "h1", "h2", "h3", "h4", "h5", "h6", "div"]);

function mapTextAlignToSide(textAlign: string): AlignSide | null {
  if (textAlign === "center") return "center";
  if (textAlign === "right" || textAlign === "end") return "right";
  if (textAlign === "left" || textAlign === "start") return "left";
  return null;
}

function readAlignmentFromElement(element: Element): AlignSide | null {
  return mapTextAlignToSide(globalThis.getComputedStyle(element).textAlign);
}

function alignmentFromSelectionWithinEditor(editor: HTMLElement): AlignSide | null {
  const selection = globalThis.getSelection();
  if (!selection?.rangeCount) return null;
  const range = selection.getRangeAt(0);
  let node: Node | null = range.commonAncestorContainer;
  if (node?.nodeType === Node.TEXT_NODE) {
    node = node.parentElement;
  }
  if (!(node instanceof Element)) return null;
  let current: Element | null = node;
  while (current && current !== editor) {
    const side = readAlignmentFromElement(current);
    if (side) return side;
    current = current.parentElement;
  }
  return null;
}

function getCurrentAlignmentFromEditor(editor: HTMLElement): AlignSide {
  const fromSelection = alignmentFromSelectionWithinEditor(editor);
  if (fromSelection) return fromSelection;
  return readAlignmentFromElement(editor) ?? "left";
}

function queryCommandStateSafe(command: string): boolean {
  try {
    return document.queryCommandState(command); // NOSONAR — legacy contenteditable formatting API
  } catch (err: unknown) {
    console.warn("RichTextEditor: queryCommandState failed", command, err);
    return false;
  }
}

/**
 * Uses the deprecated document.execCommand API; replacing it would require adopting a full rich-text toolkit (e.g. TipTap/ProseMirror).
 */
function execRichTextCommand(command: string, showUi: boolean, value?: string): void {
  try {
    document.execCommand(command, showUi, value); // NOSONAR — legacy contenteditable formatting API
  } catch (err: unknown) {
    console.warn("RichTextEditor: execCommand failed", command, err);
  }
}

function isHeadingActiveAtSelection(editor: HTMLElement, level: 1 | 2): boolean {
  const selection = globalThis.getSelection();
  if (!selection?.rangeCount) return false;
  const node = selection.anchorNode;
  if (!node) return false;
  let element: Element | null =
    node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as Element);
  while (element && element !== editor) {
    if (element.tagName?.toLowerCase() === `h${level}`) return true;
    element = element.parentElement;
  }
  return false;
}

function getCurrentBlockTagAtSelection(editor: HTMLElement): string {
  const selection = globalThis.getSelection();
  if (!selection?.rangeCount) return "p";
  const node = selection.anchorNode;
  if (!node) return "p";
  let element: Element | null =
    node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as Element);
  while (element && element !== editor) {
    const tagName = element.tagName?.toLowerCase();
    if (tagName && BLOCK_TAGS.has(tagName)) {
      return tagName === "div" ? "p" : tagName;
    }
    element = element.parentElement;
  }
  return "p";
}

function buildActiveFormatsSnapshot(editor: HTMLElement): ActiveFormatsState {
  const currentAlignment = getCurrentAlignmentFromEditor(editor);
  const currentBlock = getCurrentBlockTagAtSelection(editor);
  return {
    bold: queryCommandStateSafe("bold"),
    italic: queryCommandStateSafe("italic"),
    underline: queryCommandStateSafe("underline"),
    strikeThrough: queryCommandStateSafe("strikeThrough"),
    justifyLeft: currentAlignment === "left",
    justifyCenter: currentAlignment === "center",
    justifyRight: currentAlignment === "right",
    formatBlockH1: isHeadingActiveAtSelection(editor, 1),
    formatBlockH2: isHeadingActiveAtSelection(editor, 2),
    insertUnorderedList: queryCommandStateSafe("insertUnorderedList"),
    insertOrderedList: queryCommandStateSafe("insertOrderedList"),
    currentBlockTag: currentBlock,
  };
}

interface ToolbarFormatButtonProps {
  active: boolean;
  title: string;
  buttonPadding: string;
  onPress: () => void;
  children: React.ReactNode;
}

function ToolbarFormatButton({
  active,
  title,
  buttonPadding,
  onPress,
  children,
}: Readonly<ToolbarFormatButtonProps>) {
  return (
    <Button
      variant="link"
      type="button"
      onClick={onPress}
      onMouseDown={(e) => e.preventDefault()}
      style={{
        padding: buttonPadding,
        color: active ? "#0d6efd" : "#495057",
        backgroundColor: active ? "#e7f1ff" : "transparent",
        minWidth: "auto",
        border: "none",
        borderRadius: "4px",
      }}
      title={title}
    >
      {children}
    </Button>
  );
}

function ToolbarDivider({ height }: Readonly<{ height: string }>) {
  return (
    <div
      style={{
        width: "1px",
        height,
        background: "#dee2e6",
        margin: "0 4px",
      }}
    />
  );
}

interface RichTextFormatToolbarProps {
  activeFormats: ActiveFormatsState;
  applyFormat: (command: string, value?: string) => void;
  insertLink: () => void;
  handleColorChange: (color: string) => void;
  colorPickerRef: React.RefObject<HTMLInputElement | null>;
  toolbarPadding: string;
  buttonPadding: string;
  iconSize: number;
  dividerHeight: string;
}

function RichTextFormatToolbar({
  activeFormats,
  applyFormat,
  insertLink,
  handleColorChange,
  colorPickerRef,
  toolbarPadding,
  buttonPadding,
  iconSize,
  dividerHeight,
}: Readonly<RichTextFormatToolbarProps>) {
  const onBlockFormatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    const tag = v === "p" ? "<p>" : `<${v}>`;
    applyFormat("formatBlock", tag);
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "2px",
        padding: toolbarPadding,
        background: "#f8f9fa",
        borderBottom: "1px solid #dee2e6",
        borderRadius: "6px 6px 0 0",
      }}
    >
      <ToolbarFormatButton
        active={Boolean(activeFormats.bold)}
        title="Bold (Ctrl+B)"
        buttonPadding={buttonPadding}
        onPress={() => applyFormat("bold")}
      >
        <Bold size={iconSize} />
      </ToolbarFormatButton>
      <ToolbarFormatButton
        active={Boolean(activeFormats.italic)}
        title="Italic (Ctrl+I)"
        buttonPadding={buttonPadding}
        onPress={() => applyFormat("italic")}
      >
        <Italic size={iconSize} />
      </ToolbarFormatButton>
      <ToolbarFormatButton
        active={Boolean(activeFormats.underline)}
        title="Underline (Ctrl+U)"
        buttonPadding={buttonPadding}
        onPress={() => applyFormat("underline")}
      >
        <Underline size={iconSize} />
      </ToolbarFormatButton>
      <ToolbarFormatButton
        active={Boolean(activeFormats.strikeThrough)}
        title="Strikethrough"
        buttonPadding={buttonPadding}
        onPress={() => applyFormat("strikeThrough")}
      >
        <Strikethrough size={iconSize} />
      </ToolbarFormatButton>

      <ToolbarDivider height={dividerHeight} />

      <select
        value={String(activeFormats.currentBlockTag || "p")}
        onChange={onBlockFormatChange}
        title="Block format"
        aria-label="Block format"
        style={{
          padding: buttonPadding,
          fontSize: iconSize,
          minHeight: iconSize + 12,
          border: "1px solid #dee2e6",
          borderRadius: "4px",
          background: "#fff",
          color: "#495057",
          cursor: "pointer",
          marginRight: "2px",
        }}
      >
        <option value="h1">Title</option>
        <option value="p">Paragraph</option>
        <option value="h1">H1</option>
        <option value="h2">H2</option>
        <option value="h3">H3</option>
        <option value="h4">H4</option>
        <option value="h5">H5</option>
        <option value="h6">H6</option>
      </select>

      <ToolbarDivider height={dividerHeight} />

      <ToolbarFormatButton
        active={Boolean(activeFormats.insertUnorderedList)}
        title="Bullet List"
        buttonPadding={buttonPadding}
        onPress={() => applyFormat("insertUnorderedList")}
      >
        <List size={iconSize} />
      </ToolbarFormatButton>
      <ToolbarFormatButton
        active={Boolean(activeFormats.insertOrderedList)}
        title="Numbered List"
        buttonPadding={buttonPadding}
        onPress={() => applyFormat("insertOrderedList")}
      >
        <ListOrdered size={iconSize} />
      </ToolbarFormatButton>

      <ToolbarDivider height={dividerHeight} />

      <ToolbarFormatButton
        active={Boolean(activeFormats.justifyLeft)}
        title="Align Left"
        buttonPadding={buttonPadding}
        onPress={() => applyFormat("justifyLeft")}
      >
        <AlignLeft size={iconSize} />
      </ToolbarFormatButton>
      <ToolbarFormatButton
        active={Boolean(activeFormats.justifyCenter)}
        title="Align Center"
        buttonPadding={buttonPadding}
        onPress={() => applyFormat("justifyCenter")}
      >
        <AlignCenter size={iconSize} />
      </ToolbarFormatButton>
      <ToolbarFormatButton
        active={Boolean(activeFormats.justifyRight)}
        title="Align Right"
        buttonPadding={buttonPadding}
        onPress={() => applyFormat("justifyRight")}
      >
        <AlignRight size={iconSize} />
      </ToolbarFormatButton>

      <ToolbarDivider height={dividerHeight} />

      <div style={{ position: "relative" }}>
        <Button
          variant="link"
          type="button"
          onClick={() => colorPickerRef.current?.click()}
          onMouseDown={(e) => e.preventDefault()}
          style={{
            padding: buttonPadding,
            color: "#495057",
            minWidth: "auto",
            border: "none",
            borderRadius: "4px",
          }}
          title="Text Color"
          aria-label="Text color"
        >
          <Palette size={iconSize} />
        </Button>
        <input
          ref={colorPickerRef}
          type="color"
          aria-hidden
          tabIndex={-1}
          onChange={(e) => handleColorChange(e.target.value)}
          style={{
            position: "absolute",
            opacity: 0,
            width: 0,
            height: 0,
            pointerEvents: "none",
          }}
        />
      </div>

      <ToolbarFormatButton
        active={false}
        title="Insert Link"
        buttonPadding={buttonPadding}
        onPress={insertLink}
      >
        <Link size={iconSize} />
      </ToolbarFormatButton>

      <ToolbarDivider height={dividerHeight} />

      <ToolbarFormatButton
        active={false}
        title="Undo (Ctrl+Z)"
        buttonPadding={buttonPadding}
        onPress={() => applyFormat("undo")}
      >
        <Undo size={iconSize} />
      </ToolbarFormatButton>
      <ToolbarFormatButton
        active={false}
        title="Redo (Ctrl+Y)"
        buttonPadding={buttonPadding}
        onPress={() => applyFormat("redo")}
      >
        <Redo size={iconSize} />
      </ToolbarFormatButton>
    </div>
  );
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Describe your issue in detail...",
  minHeight = "150px",
  maxHeight = "300px",
  maxLength = 500,
  buttonSize = "md",
}) => {
  const isSm = buttonSize === "sm";
  const toolbarPadding = isSm ? "6px 8px" : "8px 12px";
  const buttonPadding = isSm ? "4px 6px" : "6px 8px";
  const iconSize = isSm ? 14 : 16;
  const dividerHeight = isSm ? "20px" : "24px";
  const editorRef = useRef<HTMLDivElement>(null);
  const colorPickerRef = useRef<HTMLInputElement>(null);
  const [activeFormats, setActiveFormats] = useState<ActiveFormatsState>({});

  const updateActiveFormats = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    setActiveFormats(buildActiveFormatsSnapshot(el));
  }, []);

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value;
    }
    const t = globalThis.setTimeout(updateActiveFormats, 100);
    return () => globalThis.clearTimeout(t);
  }, [value, updateActiveFormats]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const scheduleUpdate = () => {
      globalThis.setTimeout(updateActiveFormats, 0);
    };

    const handleSelectionChange = () => {
      updateActiveFormats();
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    editor.addEventListener("mouseup", scheduleUpdate);
    editor.addEventListener("keyup", scheduleUpdate);
    editor.addEventListener("click", scheduleUpdate);

    const initialT = globalThis.setTimeout(updateActiveFormats, 100);

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      editor.removeEventListener("mouseup", scheduleUpdate);
      editor.removeEventListener("keyup", scheduleUpdate);
      editor.removeEventListener("click", scheduleUpdate);
      globalThis.clearTimeout(initialT);
    };
  }, [updateActiveFormats]);

  const updateEditorContent = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const html = el.innerHTML;
    const text = el.innerText || el.textContent || "";
    onChange(html, text);
  }, [onChange]);

  const applyFormat = useCallback(
    (command: string, cmdValue?: string) => {
      const el = editorRef.current;
      if (!el) return;
      el.focus();
      execRichTextCommand(command, false, cmdValue);
      updateEditorContent();
      globalThis.setTimeout(updateActiveFormats, 0);
    },
    [updateActiveFormats, updateEditorContent],
  );

  const handleEditorInput = useCallback(() => {
    updateEditorContent();
  }, [updateEditorContent]);

  const handleEditorPaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const text = e.clipboardData.getData("text/plain");
      execRichTextCommand("insertText", false, text);
      updateEditorContent();
    },
    [updateEditorContent],
  );

  const handleColorChange = useCallback(
    (color: string) => {
      applyFormat("foreColor", color);
    },
    [applyFormat],
  );

  const insertLink = useCallback(() => {
    const url = globalThis.prompt("Enter URL:");
    if (url) {
      applyFormat("createLink", url);
    }
  }, [applyFormat]);

  return (
    <>
      <div
        style={{
          border: "1px solid #dee2e6",
          borderRadius: "6px",
          background: "#fff",
        }}
      >
        <RichTextFormatToolbar
          activeFormats={activeFormats}
          applyFormat={applyFormat}
          insertLink={insertLink}
          handleColorChange={handleColorChange}
          colorPickerRef={colorPickerRef}
          toolbarPadding={toolbarPadding}
          buttonPadding={buttonPadding}
          iconSize={iconSize}
          dividerHeight={dividerHeight}
        />

        <div /* NOSONAR: rich text editor requires non-native contentEditable textbox */
        ref={editorRef}
        role="textbox"
        aria-multiline="true"
        aria-label="Rich text editor"
        aria-placeholder={placeholder}
        tabIndex={0}
        contentEditable
        onKeyDown={() => {
          globalThis.setTimeout(updateActiveFormats, 0);
        }}
        onInput={handleEditorInput}
        onPaste={handleEditorPaste}
        onFocus={() => {
          globalThis.setTimeout(updateActiveFormats, 0);
        }}
        suppressContentEditableWarning
        style={{
          minHeight,
          maxHeight,
          padding: "12px 14px",
          fontSize: "14px",
          lineHeight: "1.5",
          color: "#495057",
          overflowY: "auto",
          outline: "none",
          borderRadius: "0 0 6px 6px",
          textAlign: "left",
        }}
        data-placeholder={placeholder}
        data-max-length={maxLength}
        />
      </div>

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
