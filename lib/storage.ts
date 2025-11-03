import { ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import { storage } from './firebase';

// Maximum file size: 5MB (reduced for better upload reliability)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Recommended file size: 2MB
const RECOMMENDED_FILE_SIZE = 2 * 1024 * 1024;

// Allowed image types
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

// Upload timeout: 2 minutes (for slower connections)
const UPLOAD_TIMEOUT = 120000;

/**
 * Validates an image file
 */
export const validateImageFile = (file: File): { valid: boolean; error?: string; warning?: string } => {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { 
      valid: false, 
      error: `File size exceeds ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(1)}MB. Please compress or resize your image first.` 
    };
  }

  if (file.size > RECOMMENDED_FILE_SIZE) {
    return { 
      valid: true, 
      warning: `Large file detected (${(file.size / 1024 / 1024).toFixed(1)}MB). Upload may take longer. Consider using a smaller image for faster uploads.` 
    };
  }

  return { valid: true };
};

/**
 * Uploads an image to Firebase Storage and returns the download URL with timeout and retry
 */
export const uploadMessageImage = async (file: File): Promise<string> => {
  // Validate the file
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Create a unique filename
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = file.name.split('.').pop();
  const filename = `message-images/${timestamp}_${randomString}.${extension}`;

  // Create storage reference
  const storageRef = ref(storage, filename);

  // Create upload metadata
  const metadata = {
    contentType: file.type,
    cacheControl: 'public,max-age=31536000', // Cache for 1 year
    customMetadata: {
      uploadedAt: new Date().toISOString(),
    }
  };

  try {
    // Use uploadBytesResumable for better control and monitoring
    return await new Promise<string>((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, file, metadata);
      
      // Set timeout
      const timeoutId = setTimeout(() => {
        uploadTask.cancel();
        reject(new Error('Upload timeout. Please check your connection and try again.'));
      }, UPLOAD_TIMEOUT);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Track progress (optional, can be used for progress bar)
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('Upload progress:', progress.toFixed(0) + '%');
        },
        (error) => {
          clearTimeout(timeoutId);
          console.error('Upload error:', error);
          
          // Handle specific error codes
          switch (error.code) {
            case 'storage/unauthorized':
              reject(new Error('Upload failed: Permission denied. Please check Firebase Storage rules.'));
              break;
            case 'storage/canceled':
              reject(new Error('Upload was canceled. Please try again.'));
              break;
            case 'storage/retry-limit-exceeded':
              reject(new Error('Upload failed after multiple retries. Please check your internet connection and try again.'));
              break;
            case 'storage/invalid-checksum':
              reject(new Error('Upload failed: File corrupted during transfer. Please try again.'));
              break;
            case 'storage/quota-exceeded':
              reject(new Error('Storage quota exceeded. Please contact the administrator.'));
              break;
            default:
              reject(new Error(`Upload failed: ${error.message || 'Unknown error'}`));
          }
        },
        async () => {
          clearTimeout(timeoutId);
          try {
            // Get the download URL
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (error) {
            reject(new Error('Failed to get download URL. Please try again.'));
          }
        }
      );
    });
  } catch (error) {
    console.error('Upload error:', error);
    throw error instanceof Error ? error : new Error('Failed to upload image. Please try again.');
  }
};

/**
 * Compresses an image file before upload (optional, for better performance)
 */
export const compressImage = async (file: File, maxWidth: number = 1200): Promise<File> => {
  return new Promise((resolve, reject) => {
    const fileSizeKB = file.size / 1024;
    
    // If file is already small enough, don't compress
    if (fileSizeKB < 300) { // Less than 300KB
      console.log(`Image is small enough (${fileSizeKB.toFixed(0)}KB), skipping compression`);
      resolve(file);
      return;
    }

    console.log(`Compressing image (${fileSizeKB.toFixed(0)}KB)...`);
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // More aggressive size reduction for large images
        let targetWidth = maxWidth;
        if (fileSizeKB > 2000) { // Over 2MB
          targetWidth = 800;
        } else if (fileSizeKB > 1000) { // Over 1MB
          targetWidth = 1000;
        }
        
        // Calculate new dimensions
        if (width > targetWidth) {
          height = (height * targetWidth) / width;
          width = targetWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        // Enable image smoothing for better quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        
        // Determine quality based on file size
        let quality = 0.8;
        if (fileSizeKB > 2000) {
          quality = 0.6; // More aggressive for large files
        } else if (fileSizeKB > 1000) {
          quality = 0.7;
        }
        
        // Always convert to JPEG for better compression (except GIF for animations)
        const outputType = file.type === 'image/gif' ? 'image/gif' : 'image/jpeg';
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name.replace(/\.\w+$/, '.jpg'), {
                type: outputType,
                lastModified: Date.now(),
              });
              const newSizeKB = blob.size / 1024;
              const reduction = ((1 - blob.size / file.size) * 100).toFixed(1);
              console.log(`✅ Image compressed: ${fileSizeKB.toFixed(0)}KB → ${newSizeKB.toFixed(0)}KB (${reduction}% reduction)`);
              resolve(compressedFile);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          outputType,
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image for compression'));
    };
    
    reader.onerror = () => reject(new Error('Failed to read file for compression'));
  });
};

