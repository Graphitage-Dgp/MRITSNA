import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchWishlistStats, fetchActiveWishlists } from "../../store/slices/wishlistSlice";
import WishlistMetrics from "../../components/wishlist/WishlistMetrics";
import WishlistTable from "../../components/wishlist/WishlistTable";
import WishlistDrawer from "../../components/wishlist/WishlistDrawer";

const Wishlists = () => {
  const dispatch = useDispatch();
  
  const { stats, wishlistsList, pagination, isLoading } = useSelector((state) => state.adminWishlist);

  const [currentRegion, setCurrentRegion] = useState("global");
  const [currentPage, setCurrentPage] = useState(1);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedWishlistId, setSelectedWishlistId] = useState(null);

  // Fetch Stats on mount
  useEffect(() => {
    dispatch(fetchWishlistStats());
  }, [dispatch]);

  // Fetch Table Data whenever page or region changes
  useEffect(() => {
    dispatch(fetchActiveWishlists({ 
      page: currentPage, 
      limit: 15, 
      region: currentRegion 
    }));
  }, [dispatch, currentPage, currentRegion]);

  const handleRegionChange = (region) => {
    setCurrentRegion(region);
    setCurrentPage(1); // Reset to page 1 on region change
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleRowClick = (wishlistId) => {
    setSelectedWishlistId(wishlistId);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    // Slight delay to allow slide-out animation to finish before clearing data
    setTimeout(() => setSelectedWishlistId(null), 300);
  };

  return (
    <div className="w-full min-h-screen bg-[#f8f8f8] text-[#1a1a1a]">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Header */}
        <header className="mb-10">
          <h1 className="text-2xl lg:text-3xl font-light tracking-widest uppercase mb-2">
            Customer Wishlists
          </h1>
          <p className="text-sm opacity-50">
            Track user intent, identify top-demanded products, and forecast inventory needs.
          </p>
        </header>

        {/* Metrics Grid */}
        <WishlistMetrics stats={stats} isLoading={isLoading} />

        {/* Data Table */}
        <div className="mt-10 bg-white border border-black/5 p-6 shadow-sm">
          <WishlistTable 
            wishlists={wishlistsList}
            pagination={pagination}
            isLoading={isLoading}
            currentRegion={currentRegion}
            onRegionChange={handleRegionChange}
            onPageChange={handlePageChange}
            onRowClick={handleRowClick}
          />
        </div>

      </div>

      {/* Deep-Dive Drawer */}
      <WishlistDrawer 
        isOpen={isDrawerOpen} 
        onClose={closeDrawer} 
        wishlistId={selectedWishlistId} 
      />
    </div>
  );
};

export default Wishlists;