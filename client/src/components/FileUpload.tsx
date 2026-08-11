import { useState, useRef, type DragEvent, type ChangeEvent } from 'react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
  progress?: number;
}

export default function FileUpload({ onFileSelect, isLoading = false, progress = 0 }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    setError('');
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a PDF or image file (JPG, PNG).');
      return false;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError('File size exceeds 10 MB limit.');
      return false;
    }

    return true;
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (isLoading) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isLoading) setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    }
  };

  return (
    <div className="upload-container">
      {error && <div className="alert alert-error">{error}</div>}

      <div
        className={`upload-zone ${isDragOver ? 'drag-over' : ''} ${isLoading ? 'disabled' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isLoading && fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInput}
          accept=".pdf,.jpg,.jpeg,.png"
          style={{ display: 'none' }}
          disabled={isLoading}
        />

        <div className="upload-zone-icon">📁</div>

        <h3>
          {selectedFile ? selectedFile.name : 'Drag & drop medical report here'}
        </h3>
        
        <p>
          Supports PDF, JPG, PNG (Max file size: 10 MB)
        </p>

        {!selectedFile && (
          <button type="button" className="btn btn-secondary btn-sm mt-4" disabled={isLoading}>
            Browse File
          </button>
        )}
      </div>

      {isLoading && (
        <div className="upload-progress">
          <div className="progress-bar">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${progress}%` }} 
            />
          </div>
          <p className="text-xs text-secondary mt-2 text-center">
            Uploading report... {progress}%
          </p>
        </div>
      )}
    </div>
  );
}
