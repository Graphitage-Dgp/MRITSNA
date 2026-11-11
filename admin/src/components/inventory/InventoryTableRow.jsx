import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import { updateVariantStock } from '../../store/slices/productSlice';

const InventoryTableRow = ({ item }) => {
  const dispatch = useDispatch();
  
  // Local state for instant UI updates
  const [localStock, setLocalStock] = useState(item.stock);
  const [isSyncing, setIsSyncing] = useState(false);

  // Sync local state if Redux state changes from an external source
  useEffect(() => {
    setLocalStock(item.stock);
  }, [item.stock]);

  const isCurrentlyLowStock = localStock <= (item.lowStockThreshold || 3);

  // The Debounce Effect: Waits 500ms after the last click to send to DB
  useEffect(() => {
    // Don't sync if nothing changed
    if (localStock === item.stock) return;

    const timeoutId = setTimeout(async () => {
      setIsSyncing(true);
      try {
        await dispatch(updateVariantStock({
          productId: item.productId,
          variantId: item.variantId,
          newStock: localStock
        })).unwrap();
      } catch (error) {
        toast.error(error?.message || "Failed to update stock");
        setLocalStock(item.stock); // Revert UI on failure
      } finally {
        setIsSyncing(false);
      }
    }, 500); // 500ms delay

    return () => clearTimeout(timeoutId);
  }, [localStock, item.stock, item.productId, item.variantId, dispatch]);

  const handleIncrement = () => setLocalStock(prev => prev + 1);
  const handleDecrement = () => setLocalStock(prev => (prev > 0 ? prev - 1 : 0));
  
  const handleManualInput = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 0) {
      setLocalStock(value);
    } else if (e.target.value === '') {
      setLocalStock(0);
    }
  };

  return (
    <tr className="gsap-row hover:bg-gray-50/50 transition-colors group">
      {/* Product Identity */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200 flex items-center justify-center">
            {item.image ? (
              <img 
                src={`${item.image.baseUrl}?tr=w-100,h-100,q-80,c-at_max`} 
                alt={item.image.altText || "Product Thumbnail"} 
                className="h-full w-full object-cover"
              />
            ) : (
              <Icon icon="lucide:package" className="text-gray-300 text-xl" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-gray-900 group-hover:text-black transition-colors">
                {item.title}
              </p>
              {/* NEW: Premium Badge Integration */}
              {item.isPremium && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200 shadow-sm">
                  <Icon icon="lucide:star" width="10" />
                  Premium
                </span>
              )}
            </div>
          </div>
        </div>
      </td>

      {/* SKU */}
      <td className="px-6 py-4 text-sm text-gray-500 font-mono">
        {item.sku}
      </td>

      {/* Status Badge */}
      <td className="px-6 py-4">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
          isCurrentlyLowStock 
            ? 'bg-red-50 text-red-700 border-red-200' 
            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
        }`}>
          {isCurrentlyLowStock ? 'Low Stock' : 'In Stock'}
        </span>
      </td>

      {/* Quick Stock Editor */}
      <td className="px-6 py-4 text-right">
        {/* Added styling to grey-out the entire input box while syncing */}
        <div className={`inline-flex items-center bg-white border rounded-lg shadow-sm overflow-hidden transition-colors ${
          isSyncing ? 'border-gray-100 bg-gray-50 opacity-70' : 'border-gray-200 focus-within:ring-2 focus-within:ring-black/5'
        }`}>
          <button 
            onClick={handleDecrement}
            disabled={isSyncing}
            className="px-3 py-1.5 text-gray-500 hover:bg-gray-50 hover:text-black transition-colors border-r border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          >
            <Icon icon="lucide:minus" width="14" />
          </button>
          
          <div className="relative">
            <input 
              type="number" 
              value={localStock}
              onChange={handleManualInput}
              disabled={isSyncing}
              className="w-16 text-center text-sm font-medium text-gray-900 py-1.5 focus:outline-none appearance-none disabled:bg-transparent disabled:text-gray-500"
              style={{ MozAppearance: 'textfield' }} // Hides default arrows
            />
            {isSyncing && (
              <Icon icon="lucide:loader-2" className="absolute right-1 top-2 animate-spin text-gray-400" width="12" />
            )}
          </div>

          <button 
            onClick={handleIncrement}
            disabled={isSyncing}
            className="px-3 py-1.5 text-gray-500 hover:bg-gray-50 hover:text-black transition-colors border-l border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          >
            <Icon icon="lucide:plus" width="14" />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default InventoryTableRow;