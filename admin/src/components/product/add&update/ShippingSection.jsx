import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Icon } from '@iconify/react';

const ShippingSection = () => {
  // Pull register and errors straight from the master form context
  const { register, formState: { errors } } = useFormContext();

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm mb-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
        <Icon icon="lucide:truck" width="20" className="text-gray-400" />
        Shipping & Logistics
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        {/* Weight Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Weight (Grams) <span className="text-red-500">*</span>
          </label>
          <input 
            {...register('shipping.weightGrams')} 
            type="number" 
            min="1"
            placeholder="e.g. 500" 
            className={`w-full p-2.5 bg-gray-50 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
              errors.shipping?.weightGrams ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-black/5'
            }`}
          />
          {errors.shipping?.weightGrams && (
            <p className="text-red-500 text-xs mt-1">{errors.shipping.weightGrams.message}</p>
          )}
        </div>

        {/* Fragile Toggle Switch */}
        <div className="flex items-center mt-6">
          <label className="relative flex items-center cursor-pointer gap-3">
            <input 
              type="checkbox" 
              {...register('shipping.isFragile')} 
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-gray-100 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
            <span className="text-sm font-medium text-gray-700">Fragile Item</span>
          </label>
        </div>
      </div>

      {/* Dimensions Grid */}
      <div className="grid grid-cols-3 gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Length (cm)</label>
          <input 
            {...register('shipping.dimensions.lengthCm')} 
            type="number" 
            step="0.1"
            placeholder="0.0"
            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Width (cm)</label>
          <input 
            {...register('shipping.dimensions.widthCm')} 
            type="number" 
            step="0.1"
            placeholder="0.0"
            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
          <input 
            {...register('shipping.dimensions.heightCm')} 
            type="number" 
            step="0.1"
            placeholder="0.0"
            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
          />
        </div>
      </div>
    </div>
  );
};

export default ShippingSection;