import React from 'react';
import { Icon } from '@iconify/react';
import InventoryTableRow from './InventoryTableRow';

const InventoryTable = ({ inventory, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm mt-6">
        <Icon icon="lucide:loader-2" className="animate-spin text-gray-400 mb-4" width="32" />
        <p className="text-sm text-gray-500 font-medium">Loading inventory data...</p>
      </div>
    );
  }

  if (!inventory || inventory.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm mt-6">
        <Icon icon="lucide:package-open" className="text-gray-300 mb-4" width="48" />
        <p className="text-sm text-gray-600 font-medium">No inventory items found.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mt-6">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-500">
            <tr>
              <th className="px-6 py-4 font-medium">Product & Variant</th>
              <th className="px-6 py-4 font-medium">SKU</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Available Stock</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {inventory.map((item) => (
              // Using a composite key because a product might not have variants
              <InventoryTableRow 
                key={`${item.productId}-${item.variantId}`} 
                item={item} 
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryTable;