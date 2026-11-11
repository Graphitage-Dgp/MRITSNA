import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Icon } from '@iconify/react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

import { 
  fetchAdminProductReviews, 
  updateAdminReviewStatus,
  clearAdminProductReviews 
} from '../../../store/slices/reviewSlice';

const ReviewDetails = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { 
    productReviews, 
    reviewsLoading, 
    actionLoading 
  } = useSelector((state) => state.adminReviews);

  // Filter & Sort State
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  
  // Track which specific review is currently being updated to show a localized spinner
  const [updatingReviewId, setUpdatingReviewId] = useState(null);

  useEffect(() => {
    if (productId) {
      dispatch(fetchAdminProductReviews({ 
        productId, 
        status: statusFilter, 
        sort: sortOrder 
      }));
    }
    
    // Cleanup function when unmounting
    return () => {
      dispatch(clearAdminProductReviews());
    };
  }, [dispatch, productId, statusFilter, sortOrder]);

  const handleStatusUpdate = async (reviewId, newStatus) => {
    setUpdatingReviewId(reviewId);
    try {
      await dispatch(updateAdminReviewStatus({ reviewId, status: newStatus })).unwrap();
      toast.success(`Review successfully ${newStatus}.`);
    } catch (error) {
      toast.error("Failed to update review status.");
    } finally {
      setUpdatingReviewId(null);
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex gap-1 text-[#C5A880]">
        {[1, 2, 3, 4, 5].map((star) => (
          <Icon key={star} icon={star <= rating ? "ph:star-fill" : "ph:star"} width="14" />
        ))}
      </div>
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 text-[9px] uppercase tracking-widest font-bold">Approved</span>;
      case 'pending':
        return <span className="bg-orange-50 text-orange-600 border border-orange-200 px-2 py-0.5 text-[9px] uppercase tracking-widest font-bold">Pending</span>;
      case 'rejected':
        return <span className="bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 text-[9px] uppercase tracking-widest font-bold">Rejected</span>;
      default:
        return null;
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#f8f8f8] p-6 lg:p-10 font-sans text-[#1a1a1a]">
      <div className="max-w-[1200px] mx-auto">
        
        {/* Navigation & Header */}
        <button 
          onClick={() => navigate('/admin/reviews')}
          className="text-xs text-gray-500 uppercase tracking-widest hover:text-black transition-colors flex items-center gap-2 mb-8"
        >
          <Icon icon="ph:arrow-left" /> Back to Dashboard
        </button>

        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-2xl lg:text-3xl font-light tracking-wide uppercase text-black mb-2">
              Product Moderation
            </h1>
            <p className="text-xs text-gray-500 uppercase tracking-widest font-mono">
              ID: {productId}
            </p>
          </div>

          {/* Filters & Sorting */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex bg-white border border-black/10 p-1 rounded-sm">
              {['all', 'pending', 'approved', 'rejected'].map(status => (
                <button 
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 text-[10px] font-bold tracking-widest uppercase transition-colors ${statusFilter === status ? 'bg-[#f8f8f8] text-black shadow-sm' : 'text-gray-400 hover:text-black'}`}
                >
                  {status}
                </button>
              ))}
            </div>

            <select 
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="bg-white border border-black/10 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a] focus:outline-none cursor-pointer h-[34px]"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
            </select>
          </div>
        </header>

        {/* Reviews Feed */}
        {reviewsLoading ? (
          <div className="w-full bg-white p-20 flex flex-col items-center justify-center border border-black/5">
            <Icon icon="ph:spinner-gap-bold" className="animate-spin text-gray-300 mb-4" width="32" />
            <p className="text-[11px] text-gray-400 uppercase tracking-widest">Loading Reviews...</p>
          </div>
        ) : productReviews.length === 0 ? (
          <div className="w-full bg-white p-20 flex flex-col items-center justify-center border border-black/5">
            <Icon icon="ph:chat-teardrop-light" className="text-gray-200 mb-4" width="48" />
            <p className="text-[11px] text-gray-500 uppercase tracking-widest">No reviews found for this filter.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {productReviews.map((review) => {
              const isUpdatingThis = actionLoading && updatingReviewId === review._id;
              
              // Handle author display gracefully whether it's a registered user or a guest/admin
              const authorName = review.user 
                ? `${review.user.firstName} ${review.user.lastName}` 
                : review.guestName || 'Anonymous';
                
              const authorEmail = review.user?.email || review.guestEmail || 'No email provided';

              return (
                <div key={review._id} className={`bg-white p-6 lg:p-8 border transition-colors ${review.status === 'pending' ? 'border-orange-200 bg-orange-50/30' : 'border-black/5'} relative flex flex-col md:flex-row gap-8`}>
                  
                  {/* Left Column: Meta & Details */}
                  <div className="w-full md:w-1/3 flex flex-col gap-4 border-b md:border-b-0 md:border-r border-black/5 pb-6 md:pb-0 md:pr-6">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(review.status)}
                      <span className="text-[10px] text-gray-400 uppercase tracking-widest ml-auto">
                        {format(new Date(review.createdAt), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-bold text-[#1a1a1a]">{authorName}</h4>
                      <p className="text-[11px] text-gray-500 truncate">{authorEmail}</p>
                    </div>

                    <div className="mt-auto">
                      <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Purchased Variant</p>
                      <p className="text-xs font-medium text-black">{review.colorName || 'Default'}</p>
                    </div>
                  </div>

                  {/* Right Column: Review Content & Actions */}
                  <div className="w-full md:w-2/3 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      {renderStars(review.rating)}
                      {review.isAdminGenerated && (
                         <span className="text-[9px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-sm uppercase tracking-widest flex items-center gap-1">
                           <Icon icon="ph:robot" /> Seeded
                         </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-700 leading-relaxed mb-6 whitespace-pre-wrap">
                      {review.comment}
                    </p>

                    {review.images?.length > 0 && (
                      <div className="flex flex-wrap gap-3 mb-6">
                        {review.images.map((img) => (
                          <a 
                            key={img.imagekitFileId} 
                            href={img.baseUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="block w-16 h-16 bg-[#f8f8f8] border border-black/5 hover:border-black/30 transition-colors relative group"
                          >
                            <img src={`${img.baseUrl}?tr=w-150,h-150,q-80`} alt="Review upload" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <Icon icon="ph:arrows-out" width="14" />
                            </div>
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Inline Moderation Actions */}
                    <div className="mt-auto flex items-center justify-end gap-3 pt-4 border-t border-black/5">
                      {isUpdatingThis ? (
                        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-400 font-bold px-4 py-2">
                          <Icon icon="ph:spinner-gap-bold" className="animate-spin" width="14" /> Updating...
                        </div>
                      ) : (
                        <>
                          {review.status !== 'rejected' && (
                            <button 
                              onClick={() => handleStatusUpdate(review._id, 'rejected')}
                              className="px-4 py-2 text-[10px] font-bold tracking-widest uppercase text-red-600 hover:bg-red-50 transition-colors border border-transparent hover:border-red-100 cursor-pointer"
                            >
                              Reject
                            </button>
                          )}
                          
                          {review.status !== 'approved' && (
                            <button 
                              onClick={() => handleStatusUpdate(review._id, 'approved')}
                              className="px-6 py-2 text-[10px] font-bold tracking-widest uppercase text-white bg-green-700 hover:bg-green-800 transition-colors shadow-sm cursor-pointer"
                            >
                              Approve
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewDetails;