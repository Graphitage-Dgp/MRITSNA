import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Icon } from '@iconify/react';

import { fetchAdminReviewSummary } from '../../store/slices/reviewSlice';
import { fetchAdminProducts } from '../../store/slices/productSlice'; 

import ReviewTable from '../../components/reviews/ReviewTable';
import SeedReviewModal from '../../components/reviews/SeedReviewModal';

const Reviews = () => {
  const dispatch = useDispatch();
  const [filter, setFilter] = useState('all');
  const [isSeedModalOpen, setIsSeedModalOpen] = useState(false);

  const { summaryList, summaryLoading } = useSelector((state) => state.adminReviews);

  useEffect(() => {
    dispatch(fetchAdminReviewSummary());
    // Fetch products in the background so the dropdown is ready when needed
    dispatch(fetchAdminProducts()); 
  }, [dispatch]);

  // Derived state for the table filter
  const displayedList = useMemo(() => {
    if (filter === 'pending') {
      return summaryList.filter(item => item.totalPending > 0);
    }
    return summaryList;
  }, [summaryList, filter]);

  // Calculate high-level stats for the header
  const totalSystemReviews = summaryList.reduce((acc, curr) => acc + curr.totalReviews, 0);
  const totalPendingModeration = summaryList.reduce((acc, curr) => acc + curr.totalPending, 0);

  return (
    <div className="w-full min-h-screen bg-[#f8f8f8] font-sans text-[#1a1a1a]">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Page Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-2xl lg:text-3xl font-light tracking-wide uppercase text-black mb-2">
              Review Management
            </h1>
            <p className="text-xs text-gray-500 uppercase tracking-widest flex items-center gap-4">
              <span>Total Reviews: <strong className="text-black">{totalSystemReviews}</strong></span>
              <span>|</span>
              <span className={totalPendingModeration > 0 ? "text-orange-600 font-bold" : ""}>
                Pending Approval: {totalPendingModeration}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Filter Toggle */}
            <div className="flex bg-white border border-black/10 p-1 rounded-sm">
              <button 
                onClick={() => setFilter('all')}
                className={`px-4 py-2 text-[10px] font-bold tracking-widest uppercase transition-colors ${filter === 'all' ? 'bg-[#f8f8f8] text-black shadow-sm' : 'text-gray-400 hover:text-black'}`}
              >
                All Products
              </button>
              <button 
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 text-[10px] font-bold tracking-widest uppercase transition-colors flex items-center gap-1.5 ${filter === 'pending' ? 'bg-[#f8f8f8] text-black shadow-sm' : 'text-gray-400 hover:text-black'}`}
              >
                Needs Review 
                {totalPendingModeration > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                )}
              </button>
            </div>

            {/* Add Review Button */}
            <button 
              onClick={() => setIsSeedModalOpen(true)}
              className="bg-[#1a1a1a] text-white px-6 py-3 text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-black transition-colors flex items-center gap-2 shadow-sm"
            >
              <Icon icon="ph:plus-bold" width="14" /> Add Review
            </button>
          </div>
        </header>

        {/* Data Table */}
        <ReviewTable 
          summaryList={displayedList} 
          isLoading={summaryLoading} 
        />

        {/* Manual Seed Modal */}
        <SeedReviewModal 
          isOpen={isSeedModalOpen} 
          onClose={() => setIsSeedModalOpen(false)} 
        />
        
      </div>
    </div>
  );
};

export default Reviews;