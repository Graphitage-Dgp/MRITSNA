import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom"; 
import { fetchStoreProducts, fetchFilterOptions } from "../store/features/productSlice";

import ShopHeader from "../components/shop/ShopHeader";
import FilterBar from "../components/shop/FilterBar";
import ProductGrid from "../components/shop/ProductGrid";
import Pagination from "../components/shop/Pagination";

const Shop = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const shopTopRef = useRef(null);

  const { products, pagination, isLoading, currencySymbol, categories, materials } = useSelector((state) => state.product);

  // Read URL parameters. If empty, default to empty string (which means "All" for our backend)
  const activeCategoriesStr = searchParams.get("category") || "";
  const activeMaterialsStr = searchParams.get("material") || "";
  // UPDATED: Default sort is now "None"
  const activeSort = searchParams.get("sort") || "None";
  const currentPage = parseInt(searchParams.get("page")) || 1;

  // Convert comma-separated strings to arrays so FilterBar can easily check what is selected
  const activeCategories = activeCategoriesStr ? activeCategoriesStr.split(',') : [];
  const activeMaterials = activeMaterialsStr ? activeMaterialsStr.split(',') : [];

  // UPDATED: Added "None" which triggers the Category Grouping in the backend
  const getApiSortValue = (uiSort) => {
    switch (uiSort) {
      case "Price: Low to High": return "price_asc";
      case "Price: High to Low": return "price_desc";
      case "Newest": return "newest";
      case "None": return "none";
      default: return "none";
    }
  };

  useEffect(() => {
    // Fetch both categories and materials in one call
    dispatch(fetchFilterOptions());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchStoreProducts({
      page: currentPage,
      limit: 12, 
      category: activeCategoriesStr, // Pass the raw comma-separated string to backend
      material: activeMaterialsStr,  // Pass the raw comma-separated string to backend
      sort: getApiSortValue(activeSort)
    }));
  }, [dispatch, activeCategoriesStr, activeMaterialsStr, activeSort, currentPage]);

  const handlePageChange = (newPage) => {
    searchParams.set("page", newPage);
    setSearchParams(searchParams);
    
    setTimeout(() => {
      if (shopTopRef.current) {
        shopTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50); 
  };

  return (
    <main ref={shopTopRef} className="w-full min-h-screen bg-[#f8f8f8]">
      <ShopHeader 
        totalProducts={pagination?.totalItems || 0} 
        totalCategories={categories?.length || 0} 
      />
      
      <FilterBar 
        categories={categories}
        materials={materials}
        activeCategories={activeCategories} 
        activeMaterials={activeMaterials}
        activeSort={activeSort}          
      />
      
      <ProductGrid 
        products={products} 
        isLoading={isLoading} 
        currencySymbol={currencySymbol || '₹'}
      />
      
      {(products.length > 0 || (pagination && pagination.totalPages > 1)) && (
        <Pagination 
          pagination={pagination} 
          onPageChange={handlePageChange} 
          isLoading={isLoading}
        />
      )}
    </main>
  );
};

export default Shop;