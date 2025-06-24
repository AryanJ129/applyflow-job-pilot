
import React, { useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';

interface FileUploadCardProps {
  onFileUpload: (file: File) => void;
  uploadedFile: File | null;
}

const FileUploadCard = ({ onFileUpload, uploadedFile }: FileUploadCardProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (allowedTypes.includes(file.type)) {
        onFileUpload(file);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileUpload(files[0]);
    }
  };

  const removeFile = () => {
    onFileUpload(null as any);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type === 'application/pdf') return '📄';
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return '📝';
    return '📄';
  };

  return (
    <Card className="p-8 border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
      {uploadedFile ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{getFileIcon(uploadedFile)}</div>
            <div>
              <p className="font-medium text-[hsl(222.2_84%_4.9%)]">{uploadedFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          <button
            onClick={removeFile}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
      ) : (
        <div
          className={`text-center cursor-pointer transition-colors ${
            isDragOver ? 'bg-blue-50' : ''
          }`}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[hsl(222.2_84%_4.9%)] mb-2">
            Upload Your Resume
          </h3>
          <p className="text-muted-foreground mb-4">
            Drag and drop your resume here, or click to browse
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            <strong>Supported formats:</strong> PDF (.pdf) and Word (.docx)
          </p>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <p className="text-sm font-medium text-blue-800">💡 Best Results</p>
                <p className="text-xs text-blue-700">
                  For optimal text extraction, use text-based PDFs or native Word documents. Scanned documents may not work well.
                </p>
              </div>
            </div>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}
    </Card>
  );
};

export default FileUploadCard;
