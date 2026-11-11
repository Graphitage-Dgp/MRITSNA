import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Icon } from '@iconify/react';

const AttributesSection = () => {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm mb-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
        <Icon icon="lucide:layers" width="20" className="text-gray-400" />
        Product Attributes
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Material <span className="text-red-500">*</span>
          </label>
          <input 
            {...register('attributes.material')} 
            type="text" 
            placeholder="e.g. Ceramic, Oak Wood" 
            className={`w-full p-2.5 bg-gray-50 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
              errors.attributes?.material ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-black/5'
            }`}
          />
          {errors.attributes?.material && (
            <p className="text-red-500 text-xs mt-1">{errors.attributes.material.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Finish / Texture</label>
          <input 
            {...register('attributes.finish')} 
            type="text" 
            placeholder="e.g. Matte, Glossy" 
            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
          />
        </div>
      </div>
    </div>
  );
};

export default AttributesSection;