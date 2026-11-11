import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';

const ProductTableRow = ({ product, onStatusToggle }) => {
  return (
    <tr className="gsap-row hover:bg-gray-50/50 transition-colors group opacity-0">
      {/* Product Identity */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200 flex items-center justify-center">
            {product.image ? (
              <img 
                src={`${product.image.baseUrl}?tr=w-100,h-100,q-80`} 
                alt={product.image.altText || product.title} 
                className="h-full w-full object-cover"
              />
            ) : (
              <Icon icon="lucide:package" className="text-gray-300 text-2xl" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-gray-900 group-hover:text-black transition-colors">
                {product.title}
              </p>
              {product.isPremium && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200 shadow-sm">
                  <Icon icon="lucide:star" width="10" />
                  Premium
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{product.category}</p>
          </div>
        </div>
      </td>

      {/* Status Toggle Pill */}
      <td className="px-6 py-4">
        <button 
          onClick={() => onStatusToggle(product._id, product.status)}
          className={`group/btn inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize transition-colors border cursor-pointer ${
            product.status === 'active' 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
              : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${product.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
          {product.status}
          <Icon 
            icon="lucide:refresh-cw" 
            className="ml-1.5 opacity-50 group-hover/btn:opacity-100 group-hover/btn:rotate-180 transition-all duration-300" 
            width="10" 
          />
        </button>
      </td>

      {/* Inventory & SKU */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-gray-900 font-medium">
            {product.stock || 0} in stock
          </span>
          {product.lowStock && (
            <Icon icon="lucide:alert-circle" className="text-amber-500" width="14" />
          )}
        </div>
        <p className="text-xs text-gray-500 mt-0.5 font-mono">SKU: {product.sku || 'N/A'}</p>
      </td>

      {/* Price */}
      <td className="px-6 py-4">
        <span className="font-bold text-gray-900 text-sm">
          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(product.price || 0)}
        </span>
      </td>

      {/* Actions */}
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
          <Link 
            to={`/admin/products/edit/${product._id}`}
            className="p-2 text-blue-500 lg:text-gray-400 lg:hover:text-blue-500 bg-blue-50 lg:bg-transparent lg:hover:bg-blue-50 rounded-lg transition-colors inline-flex"
          >
            <Icon icon="lucide:edit-2" width="16" />
          </Link>
        </div>
      </td>
    </tr>
  );
};

export default ProductTableRow;