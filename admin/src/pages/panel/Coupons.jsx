import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Icon } from "@iconify/react";
import { fetchCouponStats, fetchCoupons } from "../../store/slices/couponSlice";
import CouponMetrics from "../../components/coupon/CouponMetrics";
import CouponTable from "../../components/coupon/CouponTable";
import CouponFormDrawer from "../../components/coupon/CouponFormDrawer";

const Coupons = () => {
  const dispatch = useDispatch();
  
  const { stats, couponsList, pagination, isLoading } = useSelector((state) => state.adminCoupon);

  // Table & Fetch State
  const [currentFilter, setCurrentFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  
  // Drawer State (For both Creating and Editing)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCouponId, setSelectedCouponId] = useState(null);

  // 1. Fetch Stats on mount
  useEffect(() => {
    dispatch(fetchCouponStats());
  }, [dispatch]);

  // 2. Fetch Table Data whenever page, filter, or search changes
  useEffect(() => {
    // Adding a small debounce effect for the search bar
    const delayDebounceFn = setTimeout(() => {
      dispatch(fetchCoupons({ 
        page: currentPage, 
        limit: 15, 
        filter: currentFilter,
        search: searchQuery 
      }));
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [dispatch, currentPage, currentFilter, searchQuery]);

  const handleFilterChange = (filter) => {
    setCurrentFilter(filter);
    setCurrentPage(1); 
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); 
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleEditClick = (couponId) => {
    setSelectedCouponId(couponId);
    setIsDrawerOpen(true);
  };

  const handleCreateNewClick = () => {
    setSelectedCouponId(null); // Null ID tells the drawer it's in "Create" mode
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedCouponId(null), 300);
  };

  return (
    <div className="w-full min-h-screen bg-[#f8f8f8] text-[#1a1a1a]">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Header with Create Action */}
        <header className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-light tracking-widest uppercase mb-2">
              Discount Engine
            </h1>
            <p className="text-sm opacity-50">
              Create, manage, and track promotional codes and automated discounts.
            </p>
          </div>
          <button 
            onClick={handleCreateNewClick}
            className="shrink-0 bg-black text-white px-6 py-3.5 text-[0.65rem] font-bold tracking-[0.2em] uppercase hover:bg-black/80 transition-colors flex items-center gap-2"
          >
            <Icon icon="ph:plus-bold" className="text-lg" />
            Create Coupon
          </button>
        </header>

        {/* Metrics Grid */}
        <CouponMetrics stats={stats} isLoading={isLoading} />

        {/* Data Table with Integrated Search */}
        <div className="mt-10 bg-white border border-black/5 p-6 shadow-sm">
          <CouponTable 
            coupons={couponsList}
            pagination={pagination}
            isLoading={isLoading}
            currentFilter={currentFilter}
            searchQuery={searchQuery}
            onFilterChange={handleFilterChange}
            onSearchChange={handleSearchChange}
            onPageChange={handlePageChange}
            onRowClick={handleEditClick}
          />
        </div>

      </div>

      {/* Deep-Dive / Form Drawer */}
      <CouponFormDrawer 
        isOpen={isDrawerOpen} 
        onClose={closeDrawer} 
        couponId={selectedCouponId} 
      />
    </div>
  );
};

export default Coupons;