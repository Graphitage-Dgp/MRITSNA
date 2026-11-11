import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Icon } from '@iconify/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

import { submitReview, updateReview } from '../../store/features/reviewSlice';
import { userAxios } from '../../configs/axiosInstance';

const IMAGEKIT_PUBLIC_KEY = import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY;
const IMAGEKIT_UPLOAD_URL = import.meta.env.VITE_IMAGEKIT_UPLOAD_URL;
const IMAGEKIT_AUTH_ENDPOINT = '/reviews/imagekit/auth'; 
const IMAGEKIT_DELETE_ENDPOINT = '/reviews/imagekit'; 

// NEW LOGIC: Accept activeColorName as a prop
const WriteReview = ({ productId, productSlug, activeColorName, onClose }) => {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const formWrapperRef = useRef(null);
  
  const { eligibilityData, isSubmittingReview, eligibilityStatus } = useSelector((state) => state.reviews);
  
  // Local state
  const [isEditing, setIsEditing] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  
  // NEW LOGIC: Local state to capture guest identity manually
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');

  const [selectedFiles, setSelectedFiles] = useState([]); 
  
  const maxImages = 3;

  useGSAP(() => {
    gsap.fromTo(".form-reveal", 
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power2.out", delay: 0.2 }
    );
  }, { scope: formWrapperRef, dependencies: [isEditing, eligibilityStatus] });

  // Pre-fill form if user clicks "Edit"
  useEffect(() => {
    if (isEditing && eligibilityData?.review) {
      const rev = eligibilityData.review;
      setRating(rev.rating);
      setComment(rev.comment);
      // We don't need to pre-fill guestName/Email here because you can't edit identity, only the review payload.
      
      if (rev.images?.length > 0) {
        const mappedImages = rev.images.map(img => ({
          id: img.imagekitFileId, 
          preview: `${img.baseUrl}?tr=w-200,h-200`,
          isUploading: false,
          imagekitFileId: img.imagekitFileId,
          baseUrl: img.baseUrl
        }));
        setSelectedFiles(mappedImages);
      }
    }
  }, [isEditing, eligibilityData]);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const availableSlots = maxImages - selectedFiles.length;
    const filesToUpload = files.slice(0, availableSlots);

    if (files.length > availableSlots) {
      toast.error(`You can only upload a maximum of ${maxImages} images.`);
    }

    const tempFiles = filesToUpload.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      preview: URL.createObjectURL(file),
      isUploading: true,
      imagekitFileId: null,
      baseUrl: null
    }));

    setSelectedFiles(prev => [...prev, ...tempFiles]);
    if (fileInputRef.current) fileInputRef.current.value = ''; 

    for (const tempFile of tempFiles) {
      try {
        const authRes = await userAxios.get(IMAGEKIT_AUTH_ENDPOINT);
        const { token, expire, signature } = authRes.data;

        const formData = new FormData();
        formData.append('file', tempFile.file);
        formData.append('fileName', `review_${Date.now()}_${tempFile.file.name}`);
        formData.append('publicKey', IMAGEKIT_PUBLIC_KEY);
        formData.append('signature', signature);
        formData.append('expire', expire);
        formData.append('token', token);
        
        // --- PREVIOUS LOGIC ---
        // const targetFolder = eligibilityData?.sku ? `/reviews/${eligibilityData.sku}` : `/reviews/${productSlug}`;
        
        // --- NEW LOGIC ---
        // We just use the productSlug as the folder name since we don't strictly have an order SKU anymore
        const targetFolder = `/reviews/${productSlug}`;
        formData.append('folder', targetFolder); 

        const uploadRes = await axios.post(IMAGEKIT_UPLOAD_URL, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        setSelectedFiles(prev => prev.map(f => 
          f.id === tempFile.id 
            ? { ...f, isUploading: false, imagekitFileId: uploadRes.data.fileId, baseUrl: uploadRes.data.url } 
            : f
        ));
      } catch (error) {
        toast.error(`Failed to upload ${tempFile.file.name}`);
        setSelectedFiles(prev => prev.filter(f => f.id !== tempFile.id));
      }
    }
  };

  const removeFile = async (idToRemove) => {
    const fileToDelete = selectedFiles.find(f => f.id === idToRemove);
    if (!fileToDelete) return;

    setSelectedFiles(prev => prev.filter(f => f.id !== idToRemove));
    
    // Only revoke if it's a blob (newly uploaded file), not a remote ImageKit URL
    if (fileToDelete.preview && fileToDelete.preview.startsWith('blob:')) {
      URL.revokeObjectURL(fileToDelete.preview);
    }

    if (fileToDelete.imagekitFileId) {
      try {
        await userAxios.delete(`${IMAGEKIT_DELETE_ENDPOINT}/${fileToDelete.imagekitFileId}`);
      } catch (error) {
        console.error("Failed to delete image from ImageKit backend:", error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // NEW LOGIC: Validate Name input for new reviews
    if (!isEditing && guestName.trim().length < 2) {
      return toast.error("Please enter your name.");
    }

    if (comment.trim().length < 10) {
      return toast.error("Please write a review of at least 10 characters.");
    }
    
    if (selectedFiles.some(f => f.isUploading)) {
      return toast.error("Please wait for all images to finish uploading.");
    }

    try {
      const finalImages = selectedFiles.map(f => ({
        imagekitFileId: f.imagekitFileId,
        baseUrl: f.baseUrl
      }));

      // Dynamically dispatch Update OR Submit
      if (isEditing) {
        await dispatch(updateReview({
          reviewId: eligibilityData.review._id,
          reviewData: { rating, comment, images: finalImages }
        })).unwrap();
        toast.success("Review updated successfully!");
        setIsEditing(false);
      } else {
        await dispatch(submitReview({
          productId,
          
          // --- PREVIOUS LOGIC ---
          // orderId: eligibilityData?.orderId,
          // colorName: eligibilityData?.colorName,
          // guestName: eligibilityData?.guestName,
          // guestEmail: eligibilityData?.guestEmail,

          // --- NEW LOGIC ---
          colorName: activeColorName, // From the currently selected swatch
          guestName: guestName,       // From the new text input
          guestEmail: guestEmail,     // From the new text input

          rating,
          comment,
          images: finalImages
        })).unwrap();
        toast.success("Review submitted! It will be visible once approved.");
      }
      
      // Don't revoke remote ImageKit URLs during cleanup
      selectedFiles.forEach(f => {
        if (f.preview && f.preview.startsWith('blob:')) URL.revokeObjectURL(f.preview);
      });
      setSelectedFiles([]);
      setComment('');
      setRating(5);
      setGuestName('');
      setGuestEmail('');
      
      if (onClose) onClose();

    } catch (error) {
      console.error("Submission Error:", error);
      toast.error(error.message || "Failed to submit review. Please try again.");
    }
  };

  // --- UI: ALREADY REVIEWED (View Mode) ---
  if (eligibilityStatus === 'ALREADY_REVIEWED' && eligibilityData?.review && !isEditing) {
    const rev = eligibilityData.review;
    return (
      <div ref={formWrapperRef} className="w-full">
        <h3 className="form-reveal text-lg font-light uppercase tracking-widest mb-6 flex items-center justify-between">
          Your Review 
          {/* We keep the pending badge here ONLY for the author to see their own status */}
          <span className="text-[10px] bg-[#f8f8f8] text-black px-3 py-1 border border-black/10 tracking-widest">
            {rev.status}
          </span>
        </h3>
        <div className="form-reveal flex gap-1 mb-4 text-[#C5A880]">
          {[1, 2, 3, 4, 5].map((star) => (
            <Icon key={star} icon={star <= rev.rating ? "ph:star-fill" : "ph:star"} width="20" />
          ))}
        </div>
        <p className="form-reveal text-sm text-gray-600 leading-relaxed mb-6">{rev.comment}</p>
        {rev.images?.length > 0 && (
          <div className="form-reveal flex flex-wrap gap-4 mb-8">
            {rev.images.map(img => (
              <img key={img.imagekitFileId} src={`${img.baseUrl}?tr=w-100,h-100,q-80`} alt="Review" className="w-20 h-20 object-cover border border-black/10" />
            ))}
          </div>
        )}
        <div className="form-reveal pt-4 mt-2 border-t border-black/5">
          <button 
            onClick={() => setIsEditing(true)}
            className="w-full bg-[#f8f8f8] text-[#1a1a1a] border border-black/10 py-4 text-xs font-bold tracking-[0.2em] uppercase hover:bg-black hover:text-white transition-colors"
          >
            Edit Review
          </button>
        </div>
      </div>
    );
  }

  // --- UI: WRITE / EDIT REVIEW FORM ---
  const isAnyFileUploading = selectedFiles.some(f => f.isUploading);

  return (
    <div ref={formWrapperRef} className="w-full">
      <div className="form-reveal flex justify-between items-start mb-2">
        <h3 className="text-xl font-light tracking-wide uppercase">
          {isEditing ? 'Edit Review' : 'Write a Review'}
        </h3>
        {isEditing && (
          <button 
            onClick={() => setIsEditing(false)}
            className="text-[10px] uppercase tracking-widest text-gray-400 hover:text-black underline"
          >
            Cancel
          </button>
        )}
      </div>
      
      <div className="form-reveal border-b border-black/5 pb-4 mb-8">
        <p className="text-[11px] text-gray-500 uppercase tracking-widest">
          {/* --- PREVIOUS LOGIC --- */}
          {/* Purchasing: <span className="font-bold text-black">{eligibilityData?.colorName}</span> */}
          
          {/* --- NEW LOGIC --- */}
          Reviewing: <span className="font-bold text-black">{isEditing ? eligibilityData?.review?.colorName : activeColorName}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">

        {/* NEW LOGIC: Ask for Identity if writing a NEW review */}
        {!isEditing && (
          <div className="form-reveal grid grid-cols-1 gap-4">
            <div>
              <label className="block text-[11px] uppercase tracking-widest text-gray-500 mb-2">
                Your Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full bg-[#f8f8f8] border border-transparent p-3 text-sm focus:outline-none focus:border-black/20 focus:bg-white transition-colors rounded-sm"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-widest text-gray-500 mb-2">
                Your Email <span className="lowercase normal-case opacity-60">(optional)</span>
              </label>
              <input
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="jane@example.com"
                className="w-full bg-[#f8f8f8] border border-transparent p-3 text-sm focus:outline-none focus:border-black/20 focus:bg-white transition-colors rounded-sm"
              />
            </div>
          </div>
        )}
        
        <div className="form-reveal">
          <label className="block text-[11px] uppercase tracking-widest text-gray-500 mb-3">Overall Rating</label>
          <div className="flex gap-2 cursor-pointer w-max">
            {[1, 2, 3, 4, 5].map((star) => (
              <Icon 
                key={star} 
                icon={star <= rating ? "ph:star-fill" : "ph:star"} 
                width="28" 
                className={`transition-colors ${star <= rating ? "text-[#C5A880]" : "text-gray-200"}`}
                onClick={() => setRating(star)}
              />
            ))}
          </div>
        </div>

        <div className="form-reveal">
          <label className="block text-[11px] uppercase tracking-widest text-gray-500 mb-3">Your Experience</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us what you loved about this piece..."
            className="w-full bg-[#f8f8f8] border border-transparent p-4 text-sm focus:outline-none focus:border-black/20 focus:bg-white min-h-[120px] resize-y transition-colors rounded-sm"
            required
          />
        </div>

        <div className="form-reveal">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-[11px] uppercase tracking-widest text-gray-500">
              Add Photos <span className="lowercase normal-case opacity-60">({selectedFiles.length}/{maxImages})</span>
            </label>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {selectedFiles.map((item) => (
              <div key={item.id} className="relative w-16 h-16 group border border-black/10 bg-[#f8f8f8] overflow-hidden">
                <img 
                  src={item.preview} 
                  alt="Upload preview" 
                  className={`w-full h-full object-cover transition-opacity ${item.isUploading ? 'opacity-40 grayscale' : 'opacity-100'}`} 
                />
                
                {item.isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon icon="ph:spinner-gap-bold" className="animate-spin text-black" width="20" />
                  </div>
                )}

                {!item.isUploading && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      type="button" 
                      onClick={() => removeFile(item.id)}
                      className="p-1.5 bg-white text-red-600 hover:bg-red-50 transition-colors shadow-sm rounded-full"
                    >
                      <Icon icon="lucide:trash-2" width="14" />
                    </button>
                  </div>
                )}
              </div>
            ))}

            {selectedFiles.length < maxImages && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-16 h-16 border border-dashed border-black/20 flex flex-col items-center justify-center text-gray-400 hover:text-black hover:border-black/40 transition-colors bg-[#f8f8f8]"
              >
                <Icon icon="ph:camera-plus-light" width="20" className="mb-1" />
              </button>
            )}
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
              accept="image/jpeg, image/png, image/webp" 
              multiple 
              className="hidden" 
            />
          </div>
        </div>

        <div className="form-reveal pt-4 mt-2 border-t border-black/5">
          <button 
            type="submit" 
            disabled={isAnyFileUploading || isSubmittingReview}
            className="bg-[#1a1a1a] text-white py-4 text-xs font-bold tracking-[0.2em] uppercase hover:bg-black transition-colors disabled:opacity-50 flex justify-center items-center gap-3 w-full"
          >
            {isSubmittingReview ? (
              <>
                <Icon icon="ph:spinner-gap-bold" className="animate-spin" width="16" />
                {isEditing ? 'Updating...' : 'Submitting...'}
              </>
            ) : isAnyFileUploading ? (
              "Waiting for Uploads..."
            ) : (
              isEditing ? "Update Review" : "Submit Review"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default WriteReview;