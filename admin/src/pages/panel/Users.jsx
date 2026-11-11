import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { fetchUserStats, fetchUsersList } from "../../store/slices/userSlice";
import UserMetrics from "../../components/users/UserMetrics";
import UserTable from "../../components/users/UserTable";
import UserDrawer from "../../components/users/UserDrawer";

const Users = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const { stats, usersList, pagination, isLoading, isStatsLoading } = useSelector(
    (state) => state.adminUser
  );

  // Read state directly from URL search params so page reloads preserve pagination & filters
  const currentPage = Math.max(1, parseInt(searchParams.get("page"), 10) || 1);
  const currentType = searchParams.get("type") || "all"; // 'all', 'user', 'visitor'
  const currentActivity = searchParams.get("activity") || "all";
  const currentRegion = searchParams.get("region") || "global";
  const urlSearch = searchParams.get("search") || "";

  // Local state for instant typing in the search input before syncing to URL
  const [searchQuery, setSearchQuery] = useState(urlSearch);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedEntityId, setSelectedEntityId] = useState(null);
  const [drawerInitialTab, setDrawerInitialTab] = useState("cart");

  // Keep search input synced if URL changes via browser Back/Forward navigation
  useEffect(() => {
    setSearchQuery(urlSearch);
  }, [urlSearch]);

  // Debounce search input updates to URL params
  useEffect(() => {
    if (searchQuery === urlSearch) return;

    const timer = setTimeout(() => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (searchQuery.trim()) {
            next.set("search", searchQuery.trim());
          } else {
            next.delete("search");
          }
          next.set("page", "1");
          return next;
        },
        { replace: true }
      );
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, urlSearch, setSearchParams]);

  // Fetch overview metrics on mount
  useEffect(() => {
    dispatch(fetchUserStats());
  }, [dispatch]);

  // Fetch paginated users/visitors whenever URL params change
  useEffect(() => {
    dispatch(
      fetchUsersList({
        page: currentPage,
        limit: 15,
        type: currentType,
        activity: currentActivity,
        region: currentRegion,
        search: urlSearch,
      })
    );
  }, [dispatch, currentPage, currentType, currentActivity, currentRegion, urlSearch]);

  // Clamp URL page parameter if it exceeds available totalPages after loading
  useEffect(() => {
    if (!isLoading && pagination?.totalPages > 0 && currentPage > pagination.totalPages) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("page", String(pagination.totalPages));
          return next;
        },
        { replace: true }
      );
    }
  }, [isLoading, pagination?.totalPages, currentPage, setSearchParams]);

  const handleTypeChange = (type) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (type && type !== "all") {
        next.set("type", type);
      } else {
        next.delete("type");
      }
      next.set("page", "1");
      return next;
    });
  };

  const handleActivityChange = (activity) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (activity && activity !== "all") {
        next.set("activity", activity);
      } else {
        next.delete("activity");
      }
      next.set("page", "1");
      return next;
    });
  };

  const handleRegionChange = (region) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (region && region !== "global") {
        next.set("region", region);
      } else {
        next.delete("region");
      }
      next.set("page", "1");
      return next;
    });
  };

  const handleSearchChange = (q) => {
    setSearchQuery(q);
  };

  const handlePageChange = (newPage) => {
    const validPage = Math.max(1, Number(newPage) || 1);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("page", String(validPage));
      return next;
    });
  };

  const handleInspectUser = (entityId, tab = "cart") => {
    setSelectedEntityId(entityId);
    setDrawerInitialTab(tab);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedEntityId(null), 300);
  };

  return (
    <div className="w-full min-h-screen bg-[#f8f8f8] text-[#1a1a1a]">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <header className="mb-10">
          <h1 className="text-2xl lg:text-3xl font-light tracking-widest uppercase mb-2">
            Users & Visitors
          </h1>
          <p className="text-sm opacity-50">
            Track registered members and anonymous visitors—inspect live carts, wishlists, order history, and product ratings in one place.
          </p>
        </header>

        {/* Metrics Grid */}
        <UserMetrics stats={stats} isLoading={isStatsLoading} />

        {/* Unified Directory Table */}
        <div className="mt-10 bg-white border border-black/5 p-6 shadow-sm">
          <UserTable
            users={usersList}
            pagination={pagination}
            currentPage={currentPage}
            isLoading={isLoading}
            currentType={currentType}
            currentActivity={currentActivity}
            currentRegion={currentRegion}
            searchQuery={searchQuery}
            onTypeChange={handleTypeChange}
            onActivityChange={handleActivityChange}
            onRegionChange={handleRegionChange}
            onSearchChange={handleSearchChange}
            onPageChange={handlePageChange}
            onInspectUser={handleInspectUser}
          />
        </div>
      </div>

      {/* 360-Degree Customer & Visitor Drawer */}
      <UserDrawer
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        entityId={selectedEntityId}
        initialTab={drawerInitialTab}
      />
    </div>
  );
};

export default Users;