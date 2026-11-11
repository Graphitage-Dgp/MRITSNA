import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useDispatch } from 'react-redux';
import { Icon } from '@iconify/react';
import axios from 'axios';
import toast from 'react-hot-toast';

// We use the existing auth fetcher from productSlice to get the signature
import { fetchImageKitAuth } from '../../store/slices/productSlice'; 

const IMAGEKIT_PUBLIC_KEY = import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY;
const IMAGEKIT_UPLOAD_URL = import.meta.env.VITE_IMAGEKIT_UPLOAD_URL;

const CollectionImageUploader = ({ onUploadSuccess, label = "Click or drag image here" }) => {
  const dispatch = useDispatch();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File is too large. Maximum size is 10MB.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 1. Fetch Auth Signature
      const authData = await dispatch(fetchImageKitAuth()).unwrap();
      const { token, expire, signature } = authData;

      // 2. Prepare FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', file.name);
      formData.append('publicKey', IMAGEKIT_PUBLIC_KEY);
      formData.append('signature', signature);
      formData.append('expire', expire);
      formData.append('token', token);
      
      // Target the specific collection folder
      formData.append('folder', '/collection/'); 

      // 3. Upload to ImageKit
      const uploadResponse = await axios.post(IMAGEKIT_UPLOAD_URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      const { url, fileId } = uploadResponse.data;

      // 4. Send data back to the parent form
      onUploadSuccess({ fileId, url, altText: file.name.split('.')[0] });
      toast.success("Image uploaded successfully!");

    } catch (error) {
      console.error("ImageKit Upload Failed:", error);
      toast.error("Upload failed. Please check your connection.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [dispatch, onUploadSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxFiles: 1,
    disabled: isUploading
  });

  return (
    <div 
      {...getRootProps()} 
      className={`w-full h-full flex flex-col items-center justify-center p-6 border-2 border-dashed transition-all duration-200 cursor-pointer relative overflow-hidden
        ${isDragActive ? 'border-black bg-black/5' : 'border-transparent hover:bg-black/5'}
        ${isUploading ? 'opacity-90 cursor-not-allowed' : ''}
      `}
    >
      <input {...getInputProps()} />
      
      <Icon 
        icon={isUploading ? "ph:spinner-gap-light" : "ph:upload-simple-light"} 
        className={`text-4xl mb-2 ${isUploading ? 'animate-spin text-black' : 'text-black/40'}`} 
      />
      
      <span className="text-sm font-medium text-black/60 relative z-10 text-center">
        {isUploading ? `Uploading ${uploadProgress}%` : isDragActive ? "Drop image here..." : label}
      </span>
      
      {!isUploading && (
        <span className="text-[0.65rem] text-black/40 uppercase tracking-widest mt-2 text-center">
          JPEG, PNG, WEBP (Max 5MB)
        </span>
      )}

      {/* Upload Progress Bar */}
      {isUploading && (
        <div 
          className="absolute left-0 bottom-0 h-1 bg-black transition-all duration-300 z-0"
          style={{ width: `${uploadProgress}%` }}
        />
      )}
    </div>
  );
};

export default CollectionImageUploader;