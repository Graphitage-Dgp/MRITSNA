import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInventoryList } from '../../store/slices/productSlice';
import * as XLSX from 'xlsx';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';

import ProductPageHeader from '../../components/product/ProductPageHeader';
import InventoryTable from '../../components/inventory/InventoryTable';

const Inventory = () => {
  const dispatch = useDispatch();
  const { inventory, isLoading } = useSelector((state) => state.adminProduct || state.product || {});
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    dispatch(fetchInventoryList());
  }, [dispatch]);

  // Client-side filtering
  const filteredInventory = inventory?.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.sku && item.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStockFilter = showLowStockOnly ? item.isLowStock : true;

    return matchesSearch && matchesStockFilter;
  }) || [];

  // NEW: Export to Excel logic
  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      // 1. Fetch the absolute latest data from the backend to ensure accuracy
      const freshData = await dispatch(fetchInventoryList()).unwrap();

      // 2. Format the raw data into clean rows for the Excel sheet
      const excelData = freshData.map(item => ({
        'Product Title': item.title,
        'SKU': item.sku || 'N/A',
        'Available Stock': item.stock || 0,
        'Low Stock Threshold': item.lowStockThreshold || 3,
        'Status': item.isLowStock ? 'Low Stock ⚠️' : 'In Stock ✅',
        'Premium': item.isPremium ? 'Yes' : 'No'
      }));

      // 3. Create a new workbook and append the formatted data
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory Report");

      // 4. Adjust column widths for better readability
      worksheet['!cols'] = [
        { wch: 40 }, // Product Title
        { wch: 20 }, // SKU
        { wch: 15 }, // Available Stock
        { wch: 20 }, // Low Stock Threshold
        { wch: 15 }, // Status
        { wch: 10 }  // Premium
      ];

      // 5. Generate date-stamped filename and trigger download
      const dateString = new Date().toISOString().split('T')[0];
      XLSX.writeFile(workbook, `Mritsna_Inventory_Report_${dateString}.xlsx`);

      toast.success("Inventory exported successfully!");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export inventory data.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 w-full max-w-7xl mx-auto pb-12">
      <ProductPageHeader 
        title="Inventory" 
        description="Fast stock management for all product variants."
      />

      {/* Basic Inventory Toolbar */}
      <div className="mt-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        
        {/* Left Side: Search & Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-80">
            <input 
              type="text" 
              placeholder="Search by product name or SKU..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Icon icon="lucide:search" width="16" />
            </span>
          </div>

          <label className="flex items-center gap-2 cursor-pointer w-full sm:w-auto">
            <input 
              type="checkbox" 
              checked={showLowStockOnly}
              onChange={(e) => setShowLowStockOnly(e.target.checked)}
              className="rounded border-gray-300 text-black focus:ring-black"
            />
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Show Low Stock Only</span>
          </label>
        </div>

        {/* Right Side: Export Button */}
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isExporting ? (
            <Icon icon="lucide:loader-2" className="animate-spin" width="16" />
          ) : (
            <Icon icon="lucide:download" width="16" />
          )}
          {isExporting ? 'Exporting...' : 'Export to Excel'}
        </button>

      </div>

      <InventoryTable 
        inventory={filteredInventory} 
        isLoading={isLoading} 
      />
    </div>
  );
};

export default Inventory;