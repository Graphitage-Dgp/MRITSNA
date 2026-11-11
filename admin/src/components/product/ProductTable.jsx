import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import ProductTableRow from './ProductTableRow';

const ProductTable = ({ products, isLoading, onStatusToggle }) => {
  const tbodyRef = useRef(null);

  useEffect(() => {
    // Only run animation if we have data and we are not loading
    if (!isLoading && products?.length > 0 && tbodyRef.current) {
      
      // We use gsap.context to ensure React can safely clean up the animation 
      // if the component unmounts before the animation finishes.
      let ctx = gsap.context(() => {
        const rows = gsap.utils.toArray('.gsap-row');
        
        gsap.fromTo(
          rows,
          { opacity: 0, y: 15 },
          { 
            opacity: 1, 
            y: 0, 
            stagger: 0.05, 
            duration: 0.4, 
            ease: 'power2.out',
            // 🌟 THE FIX: Only clear the transform (y axis). 
            // If we clear 'all', Tailwind's opacity-0 class makes it vanish again!
            clearProps: 'transform' 
          }
        );
      }, tbodyRef);

      return () => ctx.revert(); // Cleanup function
    }
  }, [isLoading, products]);

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden mb-6">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-500">
            <tr>
              <th className="px-6 py-4 font-medium">Product</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Inventory</th>
              <th className="px-6 py-4 font-medium">Price</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          
          {isLoading ? (
            <tbody>
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-gray-400 animate-pulse">
                  Loading catalog...
                </td>
              </tr>
            </tbody>
          ) : (
            <tbody ref={tbodyRef} className="divide-y divide-gray-50">
              {products.map((product) => (
                <ProductTableRow 
                  key={product._id} 
                  product={product} 
                  onStatusToggle={onStatusToggle} 
                />
              ))}
            </tbody>
          )}
        </table>
      </div>
    </div>
  );
};

export default ProductTable;