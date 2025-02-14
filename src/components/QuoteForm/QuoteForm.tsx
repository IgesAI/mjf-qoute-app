import React from 'react';

interface QuoteFormProps {
  onFileUpload: (file: File) => void;
}

const QuoteForm: React.FC<QuoteFormProps> = ({ onFileUpload }) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
      <h2 className="text-xl font-bold mb-4">Upload 3D Model</h2>
      <div>
        <input
          type="file"
          accept=".stl"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500"
        />
      </div>
    </div>
  );
};

export default QuoteForm; 