import React, { useState } from 'react';

interface QuoteFormProps {
  onFileUpload: (file: File) => void;
}

const QuoteForm: React.FC<QuoteFormProps> = ({ onFileUpload }) => {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      onFileUpload(selectedFile);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const selectedFile = event.dataTransfer.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      onFileUpload(selectedFile);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
      <h2 className="text-xl font-bold mb-4">Upload 3D Model</h2>
      <div
        onDrop={handleDrop}
        onDragOver={(event) => event.preventDefault()}
        className="border-dashed border-2 border-gray-300 p-4 text-center cursor-pointer"
      >
        {file ? (
          <p>{file.name}</p>
        ) : (
          <p>Drag and drop a file here, or click to select a file</p>
        )}
        <input
          type="file"
          accept=".stl"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default QuoteForm; 