'use client';

import React, { useRef, useEffect } from 'react';
import { Editor } from '@tinymce/tinymce-react';

interface CKEditorWrapperProps {
  data: string;
  onChange: (event: any, editor: any) => void;
  config?: any;
}

const CKEditorWrapper: React.FC<CKEditorWrapperProps> = ({ data, onChange, config }) => {
  const editorRef = useRef<any>(null);
  const isInitializedRef = useRef(false);

  // Default TinyMCE configuration - completely free, no license required
  const defaultConfig = {
    height: 400,
    menubar: false,
    readonly: false, // Explicitly set to false to ensure editor is editable
    plugins: [
      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
      'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
      'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
    ],
    toolbar: 'undo redo | formatselect | bold italic forecolor | alignleft aligncenter ' +
      'alignright alignjustify | bullist numlist outdent indent | ' +
      'blockquote link | removeformat | help',
    content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
    branding: false, // Remove "Powered by TinyMCE" branding (optional)
    ...config
  };

  const handleEditorChange = (content: string, editor: any) => {
    // TinyMCE onChange provides content directly
    if (onChange) {
      // Simulate the CKEditor-style callback format for compatibility
      const mockEvent = { target: { value: content } };
      onChange(mockEvent, { getData: () => content });
    }
  };

  // Update editor content when data prop changes (for edit mode)
  useEffect(() => {
    if (editorRef.current && isInitializedRef.current && data !== editorRef.current.getContent()) {
      editorRef.current.setContent(data || '');
    }
  }, [data]);

  return (
    <Editor
      apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY || '5vxmk5g4wbq5iluyh2onewg50bjb4yrjuvw7903d59b7for5'}
      onInit={(_evt, editor) => {
        editorRef.current = editor;
        isInitializedRef.current = true;
        // Set initial content
        if (data) {
          editor.setContent(data);
        }
      }}
      initialValue={data || ''}
      onEditorChange={handleEditorChange}
      init={defaultConfig}
    />
  );
};

export default CKEditorWrapper;
