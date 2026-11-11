import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Icon } from '@iconify/react';
import { format } from 'date-fns';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

import { fetchProductReviews, checkReviewEligibility } from '../../store/features/reviewSlice';
import WriteReview from './WriteReview';

// NEW LOGIC: Receive activeVariant
const ProductReviews = ({ product, activeVariant }) => {
  const dispatch = useDispatch();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const containerRef = useRef(null);
  const modalTl = useRef(null);
  
  const { 
    reviews, 
    isFetchingReviews, 
    eligibilityStatus, 
    isCheckingEligibility 
  } = useSelector((state) => state.reviews);

  useEffect(() => {
    if (product?.id && product?.slug) {
      dispatch(fetchProductReviews(product.slug));
      dispatch(checkReviewEligibility(product.id));
    }
  }, [dispatch, product]);

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isModalOpen]);

  useGSAP(() => {
    if (isModalOpen) {
      modalTl.current = gsap.timeline()
        .fromTo(".modal-backdrop", 
          { opacity: 0, backdropFilter: "blur(0px)" }, 
          { opacity: 1, backdropFilter: "blur(4px)", duration: 0.3, ease: "power2.out" }
        )
        .fromTo(".modal-content", 
          { opacity: 0, y: 30, scale: 0.96 }, 
          { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "back.out(1.2)" }, 
          "-=0.15"
        );
    }
  }, { dependencies: [isModalOpen], scope: containerRef });

  const handleCloseModal = () => {
    if (modalTl.current) {
      modalTl.current.reverse().then(() => setIsModalOpen(false));
    } else {
      setIsModalOpen(false);
    }
  };

  const renderStars = (rating, size = "14") => {
    return (
      <div className="flex gap-1 text-[#C5A880]">
        {[1, 2, 3, 4, 5].map((star) => (
          <Icon key={star} icon={star <= rating ? "ph:star-fill" : "ph:star"} width={size} />
        ))}
      </div>
    );
  };

  return (
    <section ref={containerRef} className="w-full max-w-[1400px] mx-auto px-6 lg:px-12 py-20 border-t border-black/5">
      <div className="flex flex-col lg:flex-row gap-16 lg:gap-24">
        
        {/* Left Column: Summary & Button */}
        <div className="w-full lg:w-[35%]">
          <h2 className="text-xl font-light uppercase tracking-widest mb-10">Customer Reviews</h2>
          
          <div className="flex items-center gap-6 mb-8">
            <div className="text-6xl font-light tracking-tighter text-[#1a1a1a]">
              {product.averageRating?.toFixed(1) || '0.0'}
            </div>
            <div className="flex flex-col gap-2 mt-1">
              {renderStars(Math.round(product.averageRating || 0), "18")}
              <span className="text-[11px] text-gray-500 uppercase tracking-widest">
                Based on {product.totalReviews || 0} Reviews
              </span>
            </div>
          </div>

          {/* Conditional Button Rendering */}
          {isCheckingEligibility ? (
             <div className="h-12 w-48 bg-[#f8f8f8] animate-pulse"></div>
          ) : (
            eligibilityStatus === 'CAN_REVIEW' ? (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-[#1a1a1a] text-white px-8 py-4 text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-black transition-colors"
              >
                Write Your Review
              </button>
            ) : eligibilityStatus === 'ALREADY_REVIEWED' ? (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="border border-[#1a1a1a] text-[#1a1a1a] px-8 py-4 text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-[#f8f8f8] transition-colors"
              >
                View Your Review
              </button>
            ) : null
          )}
        </div>

        {/* Right Column: Review List */}
        <div className="w-full lg:w-[65%]">
          {isFetchingReviews ? (
            <div className="flex items-center justify-center py-32">
              <Icon icon="ph:spinner-gap-bold" className="animate-spin text-gray-300" width="32" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="py-32 text-center border border-black/5 bg-white flex flex-col items-center">
              <Icon icon="ph:chat-teardrop-light" className="text-gray-200 mb-6" width="48" />
              <p className="text-sm font-light text-gray-500 uppercase tracking-widest">No reviews yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {reviews.map((review) => (
                <div key={review._id} className="bg-white p-8 border border-black/5 relative">
                  
                  {/* --- PREVIOUS LOGIC: PENDING BADGE --- */}
                  {/* {review.status === 'pending' && (
                    <span className="absolute top-8 right-8 text-[9px] bg-[#f8f8f8] text-gray-600 px-3 py-1 uppercase tracking-widest border border-black/5">
                      Pending Approval
                    </span>
                  )} */}

                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
                    {renderStars(review.rating)}
                    <span className="hidden sm:block text-gray-200">|</span>
                    <h4 className="text-sm font-bold uppercase tracking-wide">{review.author}</h4>
                    
                    {review.isVerifiedBuyer && (
                      <span className="text-[10px] text-black uppercase tracking-widest font-bold flex items-center gap-1.5 bg-[#f8f8f8] px-2.5 py-1 border border-black/5">
                        <Icon icon="ph:seal-check-fill" className="text-[#796c52]" width="14" /> Verified
                      </span>
                    )}
                    
                    <span className="text-[11px] text-gray-400 uppercase tracking-widest sm:ml-auto">
                      {format(new Date(review.createdAt), 'MMMM dd, yyyy')}
                    </span>
                  </div>

                  <p className="text-[11px] text-gray-500 uppercase tracking-widest mb-4">
                    Variant: <span className="font-bold text-black">{review.colorName}</span>
                  </p>

                  <p className="text-sm text-[#1a1a1a] leading-relaxed mb-6 font-light">{review.comment}</p>

                  {review.images?.length > 0 && (
                    <div className="flex flex-wrap gap-4 mt-2">
                      {review.images.map((img) => (
                        <a 
                          key={img.imagekitFileId} 
                          href={img.baseUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="block w-20 h-20 bg-[#f8f8f8] border border-black/5 hover:border-black/20 transition-colors"
                        >
                          <img src={`${img.baseUrl}?tr=w-150,h-150,q-80`} alt="Customer upload" className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* THE MODAL OVERLAY */}
      {isModalOpen && (
        <div 
          className="modal-backdrop fixed inset-0 z-[9999999] flex items-center justify-center p-4 sm:p-6 bg-black/40"
          onClick={handleCloseModal} 
        >
          <div 
            className="modal-content bg-white w-full max-w-[420px] max-h-[85vh] relative shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()} 
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            <button 
              onClick={handleCloseModal}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-colors z-20 bg-white"
              aria-label="Close modal"
            >
              <Icon icon="ph:x-bold" width="20" />
            </button>

            <div className="overflow-y-auto overscroll-contain flex-1 w-full p-8 lg:p-10 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-black/10 hover:[&::-webkit-scrollbar-thumb]:bg-black/20 [&::-webkit-scrollbar-track]:bg-transparent">
              <WriteReview 
                productId={product.id} 
                productSlug={product.slug} 
                activeColorName={activeVariant?.colorName} // <-- NEW LOGIC: Pass the color into the form
                onClose={handleCloseModal} 
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ProductReviews;