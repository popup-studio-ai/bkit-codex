---
name: bkend-storage
description: |
  bkend.ai file storage guide. File upload, download, presigned URLs,
  bucket management, and CDN integration with bkend.ai BaaS.
  Triggers: bkend storage, file upload, file download, presigned URL, bucket, CDN,
  bkend 스토리지, 파일 업로드, 파일 다운로드, bkendストレージ, ファイルアップロード,
  bkend存储, 文件上传, almacenamiento bkend, stockage bkend, bkend-Speicher
  Do NOT use for: auth (use $bkend-auth), data operations (use $bkend-data).
---

# bkend.ai File Storage

> Upload, download, and manage files with bkend.ai storage.

## Actions

| Action | Description | Example |
|--------|-------------|---------|
| `setup` | Configure storage | `$bkend-storage setup` |
| `upload` | Upload file guide | `$bkend-storage upload` |
| `cdn` | CDN configuration | `$bkend-storage cdn` |

## File Upload

### Basic Upload

```typescript
async function uploadFile(file: File, bucket: string = 'default') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('bucket', bucket);

  const token = localStorage.getItem('bkend_access_token');
  const res = await fetch(`${API_BASE}/storage/upload`, {
    method: 'POST',
    headers: {
      'x-project-id': PROJECT_ID,
      ...(token && { Authorization: `Bearer ${token}` }),
      // Do NOT set Content-Type for FormData
    },
    body: formData,
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();  // { url, key, size, contentType }
}
```

### Upload with Validation

```typescript
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) return 'File type not allowed';
  if (file.size > MAX_SIZE) return 'File too large (max 10MB)';
  return null;
}
```

## Image Upload Component

```typescript
'use client';
import { useState, ChangeEvent } from 'react';

interface ImageUploadProps {
  onUpload: (url: string) => void;
  maxSize?: number; // bytes
  accept?: string;
}

export function ImageUpload({ onUpload, maxSize = 5 * 1024 * 1024, accept = 'image/*' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSize) {
      alert(`File must be under ${Math.round(maxSize / 1024 / 1024)}MB`);
      return;
    }

    // Show preview
    setPreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      const { url } = await bkend.storage.upload(file, 'images');
      onUpload(url);
    } catch {
      alert('Upload failed');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block cursor-pointer">
        <input type="file" accept={accept} onChange={handleChange} className="hidden" />
        <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-blue-400">
          {preview ? (
            <img src={preview} alt="Preview" className="mx-auto max-h-48 rounded" />
          ) : (
            <p className="text-gray-500">{uploading ? 'Uploading...' : 'Click to upload'}</p>
          )}
        </div>
      </label>
    </div>
  );
}
```

## File Download

### Get Presigned URL

```typescript
const { url } = await bkend.storage.getUrl(fileKey);
window.open(url, '_blank');
```

### Download with Fetch

```typescript
async function downloadFile(key: string, filename: string) {
  const { url } = await bkend.storage.getUrl(key);
  const res = await fetch(url);
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
```

## Bucket Management

```typescript
// List files in bucket
const files = await bkend.storage.list('images');

// Delete file
await bkend.storage.delete(fileKey);
```

## CDN Configuration

bkend.ai serves files through CDN automatically:
- Files are cached at edge locations globally
- URLs include cache-busting via file key
- Images can be transformed via URL parameters

```
// Original
https://cdn.bkend.ai/project-id/images/photo.jpg

// Resized
https://cdn.bkend.ai/project-id/images/photo.jpg?w=300&h=200

// Format conversion
https://cdn.bkend.ai/project-id/images/photo.jpg?format=webp
```

## Best Practices

1. Validate file type and size before upload
2. Use appropriate buckets (images, documents, attachments)
3. Show upload progress for large files
4. Generate thumbnails for image-heavy apps
5. Clean up unused files periodically

## Reference

See `references/bkend-patterns.md` for complete storage API patterns.
