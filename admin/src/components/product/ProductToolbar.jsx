import React from 'react';
import { Icon } from '@iconify/react';

const ProductToolbar = ({ searchQuery, onSearchChange }) => {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between gap-4 mb-6">
      <div className="relative w-full sm:max-w-xs">
        <Icon 
          icon="lucide:search" 
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" 
          width="18" 
        />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search products..." 
          className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
        />
      </div>
    </div>
  );
};

export default ProductToolbar;