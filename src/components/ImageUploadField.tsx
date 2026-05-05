import React, { useRef, useState, useCallback } from "react";
import { Upload, Link, X, Image } from "lucide-react";

interface ImageUploadFieldProps {
  label?: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  previewHeight?: string;
}

export function ImageUploadField({
  label,
  value,
  onChange,
  hint,
  previewHeight = "h-32",
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [dragging, setDragging] = useState(false);
  const [urlInput, setUrlInput] = useState(
    value && !value.startsWith("data:") ? value : ""
  );
  const [imgError, setImgError] = useState(false);

  const readFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          setImgError(false);
          onChange(result);
        }
      };
      reader.readAsDataURL(file);
    },
    [onChange]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) readFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) readFile(file);
  };

  const handleUrlCommit = () => {
    setImgError(false);
    onChange(urlInput.trim());
  };

  const clear = () => {
    onChange("");
    setUrlInput("");
    setImgError(false);
  };

  const isDataUrl = value.startsWith("data:");
  const hasImage = Boolean(value);

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
          {label}
        </label>
      )}

      {/* Mode toggle */}
      <div className="flex gap-1 p-0.5 bg-muted rounded-lg w-fit">
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            mode === "upload"
              ? "bg-white shadow text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Upload size={11} />
          Upload File
        </button>
        <button
          type="button"
          onClick={() => setMode("url")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            mode === "url"
              ? "bg-white shadow text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Link size={11} />
          URL
        </button>
      </div>

      {/* Upload dropzone */}
      {mode === "upload" && (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-5 cursor-pointer transition-colors ${
            dragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/40 hover:bg-muted/50"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <Image size={18} className="text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              Click to upload or drag & drop
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              PNG, JPG, WebP, GIF — stored locally
            </p>
          </div>
          {isDataUrl && (
            <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">
              ✓ File uploaded
            </span>
          )}
        </div>
      )}

      {/* URL input */}
      {mode === "url" && (
        <div className="flex gap-2">
          <input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onBlur={handleUrlCommit}
            onKeyDown={(e) => e.key === "Enter" && handleUrlCommit()}
            placeholder="https://example.com/image.jpg"
            className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {urlInput && (
            <button
              type="button"
              onClick={handleUrlCommit}
              className="px-3 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors"
            >
              Apply
            </button>
          )}
        </div>
      )}

      {/* Preview */}
      {hasImage && !imgError && (
        <div className={`relative ${previewHeight} rounded-xl overflow-hidden border border-border bg-muted`}>
          <img
            src={value}
            alt="preview"
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
          <div className="absolute bottom-2 left-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full">
            {isDataUrl ? "Uploaded" : "Preview"}
          </div>
          <button
            type="button"
            onClick={clear}
            className="absolute top-2 right-2 w-6 h-6 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {imgError && (
        <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">
          <span>⚠️</span> Image could not be loaded. Check the URL or try uploading the file directly.
        </div>
      )}

      {hint && !hasImage && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
