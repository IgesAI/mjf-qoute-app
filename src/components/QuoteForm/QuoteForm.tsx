import React, { useState, useRef } from 'react';

interface QuoteFormProps {
  onFileUpload: (file: File) => void;
}

const QuoteForm: React.FC<QuoteFormProps> = ({ onFileUpload }) => {
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.name.toLowerCase().endsWith('.stl')) {
      setFile(selectedFile);
      onFileUpload(selectedFile);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const selectedFile = event.dataTransfer.files[0];
    if (selectedFile && selectedFile.name.toLowerCase().endsWith('.stl')) {
      setFile(selectedFile);
      onFileUpload(selectedFile);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
      <h2 className="text-xl font-bold mb-4">Upload 3D Model</h2>
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={(event) => event.preventDefault()}
        className="border-dashed border-2 border-gray-300 p-8 text-center cursor-pointer rounded-lg hover:border-blue-500 transition-colors"
      >
        {file ? (
          <p className="text-green-600">{file.name}</p>
        ) : (
          <div>
            <p className="text-gray-600">Drag and drop an STL file here, or click to select</p>
            <p className="text-sm text-gray-400 mt-2">Supported format: .STL</p>
          </div>
        )}
        <input
          ref={fileInputRef}
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