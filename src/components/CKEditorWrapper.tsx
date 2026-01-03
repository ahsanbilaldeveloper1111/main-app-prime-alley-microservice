'use client';

import React, { useState, useEffect } from 'react';

interface CKEditorWrapperProps {
  data: string;
  onChange: (event: any, editor: any) => void;
  config?: any;
}

const CKEditorWrapper: React.FC<CKEditorWrapperProps> = ({ data, onChange, config }) => {
  const [isClient, setIsClient] = useState(false);
  const [Editor, setEditor] = useState<any>(null);
  const [ClassicEditor, setClassicEditor] = useState<any>(null);

  useEffect(() => {
    setIsClient(true);
    // Dynamically import only on client side
    Promise.all([
      import('@ckeditor/ckeditor5-react'),
      import('@ckeditor/ckeditor5-build-classic')
    ]).then(([CKEditorModule, ClassicEditorModule]) => {
      setEditor(() => CKEditorModule.CKEditor);
      setClassicEditor(() => ClassicEditorModule.default);
    });
  }, []);

  if (!isClient || !Editor || !ClassicEditor) {
    return (
      <div className="p-3 text-center text-muted" style={{ minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Loading editor...
      </div>
    );
  }

  return (
    <Editor
      editor={ClassicEditor}
      data={data}
      onChange={onChange}
      config={config}
    />
  );
};

export default CKEditorWrapper;

