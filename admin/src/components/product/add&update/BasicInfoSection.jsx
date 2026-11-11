import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Icon } from '@iconify/react';

const BasicInfoSection = () => {
  // We pull 'register' to bind the inputs, and 'errors' to show red warning text
  const { register, formState: { errors } } = useFormContext();

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm mb-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
        <Icon icon="lucide:info" width="20" className="text-gray-400" />
        Basic Information
      </h2>
      
      <div className="space-y-5">
        {/* Title Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Product Title <span className="text-red-500">*</span>
          </label>
          <input 
            {...register('title')} 
            type="text" 
            placeholder="e.g., Obsidian Matte Vase" 
            className={`w-full p-2.5 bg-gray-50 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
              errors.title ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-black/5'
            }`}
          />
          {/* Automatically display the Zod error message if validation fails */}
          {errors.title && (
            <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>
          )}
        </div>

        {/* Description Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea 
            {...register('description')} 
            rows="4"
            placeholder="Describe the product details, inspiration, and styling..." 
            className={`w-full p-2.5 bg-gray-50 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
              errors.description ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-black/5'
            }`}
          ></textarea>
          {errors.description && (
            <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BasicInfoSection;