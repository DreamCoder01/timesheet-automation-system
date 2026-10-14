"use client";

import React, { useState, useRef } from "react";
import { Upload, FileSpreadsheet, RefreshCw } from "lucide-react";

interface FileUploaderProps {
  onUploadSuccess: (file: File) => void;
  isProcessing: boolean;
}

export default function FileUploader({
  onUploadSuccess,
  isProcessing,
}: FileUploaderProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith(".csv")) {
        onUploadSuccess(droppedFile);
      } else {
        alert(
          "Invalid file type. Please upload a structured .csv file report.",
        );
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadSuccess(e.target.files[0]);
    }
  };

  return (
    <div className="w-full bg-white rounded-xl border border-neutral-200 p-6 shadow-sm mb-8">
      <h2 className="text-sm font-semibold text-neutral-800 mb-2">
        Till system report
      </h2>

      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`w-full h-40 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors p-4 ${
          isDragActive
            ? "border-amber-500 bg-amber-50/50"
            : "border-neutral-300 hover:border-neutral-400 bg-neutral-50/50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
          disabled={isProcessing}
        />

        {isProcessing ? (
          <div className="flex flex-col items-center space-y-2 animate-pulse">
            <RefreshCw className="h-8 w-8 text-amber-600 animate-spin" />
            <p className="text-sm font-medium text-neutral-600">
              Processing timesheet records...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2 text-center">
            <div className="p-2 bg-white rounded-full shadow-sm border border-neutral-100">
              <Upload className="h-6 w-6 text-neutral-500" />
            </div>
            <p className="text-sm font-medium text-neutral-700">
              <span className="text-amber-600 font-semibold">Choose File</span>{" "}
              or drag and drop your report here
            </p>
            <p className="text-xs text-neutral-400 flex items-center gap-1">
              <FileSpreadsheet className="h-3 w-3" /> A CSV with employee_id,
              employee_name, clock_in, clock_out, till_id
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
