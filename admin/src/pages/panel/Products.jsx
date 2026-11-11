import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast'; // Imported the toaster

// Added resetProductState to the imports
import { fetchAdminProducts, changeStatus, resetProductState } from '../../store/slices/productSlice';

import ProductPageHeader from '../../components/product/ProductPageHeader';
import ProductToolbar from '../../components/product/ProductToolbar';
import ProductTable from '../../components/product/ProductTable';

const Products = () => {
  const dispatch = useDispatch();
  
  // Pulled the success, error, and message states from Redux
  const { products, isLoading, isError, isSuccess, message } = useSelector((state) => state.adminProduct);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    dispatch(fetchAdminProducts());
  }, [dispatch]);

  const handleStatusToggle = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'draft' : 'active';
    
    try {
      await dispatch(changeStatus({ id, status: newStatus })).unwrap();
      toast.success("Status updated successfully!");
    } catch (error) {
      toast.error(error?.message || error || "Failed to update status");
    }
  };

  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50/50 w-full max-w-7xl mx-auto">
      <ProductPageHeader 
        title="Products" 
        description="Manage your inventory and catalog."
        actionLabel="Add Product"
        actionLink="/admin/products/new"
        actionIcon="lucide:plus"
      />

      <ProductToolbar 
        searchQuery={searchQuery} 
        onSearchChange={setSearchQuery} 
      />

      <ProductTable 
        products={filteredProducts} 
        isLoading={isLoading} 
        onStatusToggle={handleStatusToggle} 
      />
    </div>
  );
};

export default Products;