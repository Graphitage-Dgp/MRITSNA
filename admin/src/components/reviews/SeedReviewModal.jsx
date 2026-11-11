import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import axios from 'axios';

import { seedAdminReview } from '../../store/slices/reviewSlice';
import adminAxios from '../../configs/axiosInstance'; 

const IMAGEKIT_PUBLIC_KEY = import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY;
const IMAGEKIT_UPLOAD_URL = import.meta.env.VITE_IMAGEKIT_UPLOAD_URL;
const ADMIN_IMAGEKIT_AUTH = '/products/imagekit/auth'; 
const ADMIN_IMAGEKIT_DELETE = '/products/imagekit';

const SeedReviewModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const modalRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // NEW: Ref to target the actual scrolling container for native event blocking
  const scrollContainerRef = useRef(null);
  
  const { products } = useSelector((state) => state.adminProduct);
  const { actionLoading } = useSelector((state) => state.adminReviews);

  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [colorName, setColorName] = useState('');
  const [guestName, setGuestName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  
  const maxImages = 3;

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [products, searchQuery]);

  // --- THE SCROLL FIX ---
  // Attaching a native event listener to block the scroll event from reaching global smooth scrollers
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el || !isOpen) return;

    const stopNativePropagation = (e) => {
      e.stopPropagation();
    };

    el.addEventListener('wheel', stopNativePropagation, { passive: false });
    el.addEventListener('touchmove', stopNativePropagation, { passive: false });

    return () => {
      el.removeEventListener('wheel', stopNativePropagation);
      el.removeEventListener('touchmove', stopNativePropagation);
    };
  }, [isOpen]);

  useGSAP(() => {
    if (isOpen) {
      gsap.fromTo(".modal-backdrop", { opacity: 0 }, { opacity: 1, duration: 0.3 });
      gsap.fromTo(".modal-content", 
        { opacity: 0, y: 20, scale: 0.98 }, 
        { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "power2.out" }
      );
      gsap.fromTo(".form-reveal", 
        { opacity: 0, y: 10 }, 
        { opacity: 1, y: 0, stagger: 0.05, duration: 0.4, delay: 0.1 }
      );
    }
  }, { dependencies: [isOpen], scope: modalRef });

  const handleClose = () => {
    gsap.to(".modal-backdrop", { opacity: 0, duration: 0.2 });
    gsap.to(".modal-content", { opacity: 0, y: 10, scale: 0.98, duration: 0.2, onComplete: onClose });
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const availableSlots = maxImages - selectedFiles.length;
    const filesToUpload = files.slice(0, availableSlots);

    if (files.length > availableSlots) toast.error(`Maximum ${maxImages} images allowed.`);

    const tempFiles = filesToUpload.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      preview: URL.createObjectURL(file),
      isUploading: true
    }));

    setSelectedFiles(prev => [...prev, ...tempFiles]);
    if (fileInputRef.current) fileInputRef.current.value = ''; 

    for (const tempFile of tempFiles) {
      try {
        const authRes = await adminAxios.get(ADMIN_IMAGEKIT_AUTH);
        const { token, expire, signature } = authRes.data;

        const formData = new FormData();
        formData.append('file', tempFile.file);
        formData.append('fileName', `admin_seeded_${Date.now()}_${tempFile.file.name}`);
        formData.append('publicKey', IMAGEKIT_PUBLIC_KEY);
        formData.append('signature', signature);
        formData.append('expire', expire);
        formData.append('token', token);
        formData.append('folder', `/reviews/admin_seeded`); 

        const uploadRes = await axios.post(IMAGEKIT_UPLOAD_URL, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        setSelectedFiles(prev => prev.map(f => 
          f.id === tempFile.id 
            ? { ...f, isUploading: false, imagekitFileId: uploadRes.data.fileId, baseUrl: uploadRes.data.url } 
            : f
        ));
      } catch (error) {
        toast.error("Upload failed.");
        setSelectedFiles(prev => prev.filter(f => f.id !== tempFile.id));
      }
    }
  };

  const removeFile = async (idToRemove) => {
    const fileToDelete = selectedFiles.find(f => f.id === idToRemove);
    setSelectedFiles(prev => prev.filter(f => f.id !== idToRemove));
    if (fileToDelete?.preview) URL.revokeObjectURL(fileToDelete.preview);
    if (fileToDelete?.imagekitFileId) {
      await adminAxios.delete(`${ADMIN_IMAGEKIT_DELETE}/${fileToDelete.imagekitFileId}`).catch(() => {});
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return toast.error("Please select a product.");
    if (selectedFiles.some(f => f.isUploading)) return toast.error("Wait for uploads to finish.");

    const finalImages = selectedFiles.map(f => ({ imagekitFileId: f.imagekitFileId, baseUrl: f.baseUrl }));

    await dispatch(seedAdminReview({
      productId: selectedProduct._id,
      guestName,
      colorName: colorName || 'Default',
      rating,
      comment,
      images: finalImages
    })).unwrap();

    toast.success("Review seeded and approved successfully.");
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div ref={modalRef} className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="modal-backdrop absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
      
      <div className="modal-content relative bg-white w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl border border-black/10">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-black/5">
          <h2 className="text-sm font-bold uppercase tracking-widest text-[#1a1a1a]">Seed Manual Review</h2>
          <button onClick={handleClose} className="p-2 text-gray-400 hover:text-black transition-colors rounded-full hover:bg-gray-100">
            <Icon icon="ph:x-bold" width="16" />
          </button>
        </div>

        {/* Scrollable Form Container */}
        {/* Added min-h-0 (flexbox bug fix), data-lenis-prevent (smooth scroll ignore), and scrollContainerRef */}
        <div 
          ref={scrollContainerRef}
          data-lenis-prevent="true"
          className="p-6 overflow-y-auto custom-scrollbar flex-1 min-h-0 overscroll-contain"
        >
          <form id="seed-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
            
            {/* Searchable Product Dropdown */}
            <div className="form-reveal relative z-[9999]">
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Target Product *</label>
              <div 
                className="w-full border border-black/10 bg-[#f8f8f8] p-3 text-sm flex justify-between items-center cursor-pointer"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <span className={selectedProduct ? "text-black" : "text-gray-400"}>
                  {selectedProduct ? selectedProduct.title : "Search and select a product..."}
                </span>
                <Icon icon="ph:caret-down" className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </div>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 w-full bg-white border border-black/10 mt-1 shadow-xl z-20 max-h-60 flex flex-col">
                  <div className="p-2 border-b border-black/5 bg-gray-50 sticky top-0">
                    <input 
                      type="text" 
                      placeholder="Type to search products..." 
                      className="w-full bg-white border border-black/10 text-xs p-2 focus:outline-none"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="overflow-y-auto custom-scrollbar" data-lenis-prevent="true">
                    {filteredProducts.map(p => (
                      <div 
                        key={p._id} 
                        className="p-3 text-sm hover:bg-[#f8f8f8] cursor-pointer border-b border-black/5 last:border-0 flex items-center gap-3"
                        onClick={() => { setSelectedProduct(p); setIsDropdownOpen(false); setSearchQuery(''); }}
                      >
                        <img src={p.image?.baseUrl || ''} alt="" className="w-8 h-8 object-cover border border-black/5 bg-gray-100" />
                        <span className="truncate">{p.title}</span>
                      </div>
                    ))}
                    {filteredProducts.length === 0 && <div className="p-4 text-xs text-gray-400 text-center">No products found.</div>}
                  </div>
                </div>
              )}
            </div>

            <div className="form-reveal grid grid-cols-2 gap-4 relative z-0">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Reviewer Name *</label>
                <input type="text" required value={guestName} onChange={e => setGuestName(e.target.value)} className="w-full border border-black/10 bg-[#f8f8f8] p-3 text-sm focus:outline-none focus:border-black" placeholder="e.g. John D." />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Variant / Color</label>
                <input type="text" value={colorName} onChange={e => setColorName(e.target.value)} className="w-full border border-black/10 bg-[#f8f8f8] p-3 text-sm focus:outline-none focus:border-black" placeholder="e.g. Matte Black" />
              </div>
            </div>

            <div className="form-reveal relative z-0">
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Star Rating</label>
              <div className="flex gap-2 cursor-pointer w-max">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Icon key={star} icon={star <= rating ? "ph:star-fill" : "ph:star"} width="28" className={star <= rating ? "text-[#C5A880]" : "text-gray-200"} onClick={() => setRating(star)} />
                ))}
              </div>
            </div>

            <div className="form-reveal relative z-0">
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">Review Content *</label>
              <textarea required value={comment} onChange={e => setComment(e.target.value)} className="w-full border border-black/10 bg-[#f8f8f8] p-4 text-sm focus:outline-none focus:border-black min-h-[120px] resize-y" placeholder="Write the review..." />
            </div>

            {/* Image Upload */}
            <div className="form-reveal border-t border-black/5 pt-4 relative z-0">
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-3">Attach Images ({selectedFiles.length}/{maxImages})</label>
              <div className="flex flex-wrap gap-3">
                {selectedFiles.map((item) => (
                  <div key={item.id} className="relative w-16 h-16 group border border-black/10 bg-[#f8f8f8] overflow-hidden">
                    <img src={item.preview} alt="Upload" className={`w-full h-full object-cover transition-opacity ${item.isUploading ? 'opacity-40 grayscale' : 'opacity-100'}`} />
                    {item.isUploading && <div className="absolute inset-0 flex items-center justify-center"><Icon icon="ph:spinner-gap-bold" className="animate-spin" /></div>}
                    {!item.isUploading && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button type="button" onClick={() => removeFile(item.id)} className="p-1.5 bg-white text-red-600 rounded-full shadow-sm"><Icon icon="lucide:trash-2" width="12" /></button>
                      </div>
                    )}
                  </div>
                ))}
                {selectedFiles.length < maxImages && (
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="w-16 h-16 border border-dashed border-black/20 flex items-center justify-center text-gray-400 hover:text-black hover:border-black/40 transition-colors bg-[#f8f8f8]">
                    <Icon icon="ph:plus" width="20" />
                  </button>
                )}
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/jpeg, image/png, image/webp" multiple className="hidden" />
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-black/5 bg-[#f8f8f8] flex justify-end">
          <button 
            type="submit" 
            form="seed-form"
            disabled={actionLoading || selectedFiles.some(f => f.isUploading)}
            className="bg-[#1a1a1a] text-white px-8 py-3 text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-black transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {actionLoading ? <><Icon icon="ph:spinner-gap-bold" className="animate-spin" /> Processing</> : "Publish Review"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default SeedReviewModal;