import React from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Icon } from '@iconify/react';
import ImageUploader from './ImageUploader';

const VariantManager = () => {
  // We bring in 'watch' and 'setValue' to handle the bi-directional color sync and auto-fills
  const { control, register, watch, setValue, formState: { errors } } = useFormContext();
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants"
  });

  const addVariant = () => {
    append({
      isMulticolor: false,
      colorName: '',
      colorHex: '#000000',
      sku: '',
      pricing: { price: 0, discountPercentage: 0 },
      attributes: { material: '', finish: '' },
      careInstructions: '',
      inventory: { quantity: 0, lowStockThreshold: 3, allowBackorder: false },
      images: []
    });
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <Icon icon="lucide:palette" width="20" className="text-gray-400" />
          Color Variants & Inventory
        </h2>
        <button
          type="button"
          onClick={addVariant}
          className="text-sm font-medium text-black bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1"
        >
          <Icon icon="lucide:plus" width="16" /> Add Variant
        </button>
      </div>

      {errors.variants?.message && (
        <p className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-lg border border-red-100">
          {errors.variants.message}
        </p>
      )}

      <div className="space-y-6">
        {fields.map((field, index) => {
          // Watch the specific hex code AND the multicolor flag for THIS variant
          const currentColorHex = watch(`variants.${index}.colorHex`);
          const isMulticolor = watch(`variants.${index}.isMulticolor`);

          return (
            <div key={field.id} className="p-5 border border-gray-200 rounded-lg bg-gray-50 relative group transition-all hover:border-gray-300">
              <button
                type="button"
                onClick={() => remove(index)}
                className="absolute top-4 right-4 text-gray-400 hover:text-red-600 transition-colors"
                title="Remove Variant"
              >
                <Icon icon="lucide:trash-2" width="18" />
              </button>

              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Variant {index + 1}
                </h3>
                
                {/* THE MULTICOLOR TOGGLE */}
                <label className="flex items-center gap-2 cursor-pointer mr-8 bg-white px-3 py-1.5 rounded border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors">
                  <input 
                    type="checkbox" 
                    {...register(`variants.${index}.isMulticolor`, {
                      onChange: (e) => {
                        // When toggled ON, automatically fill "Multicolor" and clear the hex
                        if (e.target.checked) {
                          setValue(`variants.${index}.colorName`, 'Multicolor', { shouldValidate: true });
                          setValue(`variants.${index}.colorHex`, '', { shouldValidate: true });
                        } else {
                          // When toggled OFF, clear the name so they can type a new one
                          setValue(`variants.${index}.colorName`, '', { shouldValidate: true });
                          setValue(`variants.${index}.colorHex`, '#000000', { shouldValidate: true });
                        }
                      }
                    })}
                    className="rounded border-gray-300 text-black focus:ring-black w-4 h-4 cursor-pointer" 
                  />
                  <span className="text-sm font-medium text-gray-700">Multicolor / Assorted</span>
                </label>
              </div>

              {/* ROW 1: IDENTITY */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Color Name <span className="text-red-500">*</span></label>
                  <input 
                    {...register(`variants.${index}.colorName`)} 
                    type="text" 
                    placeholder="e.g. Obsidian"
                    disabled={isMulticolor}
                    className={`w-full p-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black/5 ${isMulticolor ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                  />
                  {errors.variants?.[index]?.colorName && <p className="text-red-500 text-xs mt-1">{errors.variants[index].colorName.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Hex Code {!isMulticolor && <span className="text-red-500">*</span>}</label>
                  <div className="flex gap-2">
                    {/* Visual Color Box or Rainbow Swatch */}
                    {isMulticolor ? (
                      <div className="h-9 w-12 rounded-md flex-shrink-0 bg-gradient-to-r from-red-500 via-yellow-400 to-blue-500 border border-gray-200 shadow-inner" title="Multicolor"></div>
                    ) : (
                      <input 
                        type="color" 
                        value={currentColorHex || '#000000'}
                        onChange={(e) => setValue(`variants.${index}.colorHex`, e.target.value, { shouldValidate: true })}
                        className="h-9 w-12 p-0.5 bg-white border border-gray-200 rounded-md cursor-pointer flex-shrink-0"
                      />
                    )}
                    
                    {/* Text Input */}
                    <input 
                      {...register(`variants.${index}.colorHex`)} 
                      type="text" 
                      maxLength={7}
                      disabled={isMulticolor}
                      placeholder={isMulticolor ? "N/A" : "#000000"}
                      className={`w-full p-2 border border-gray-200 rounded-md text-sm uppercase focus:outline-none focus:ring-2 focus:ring-black/5 ${isMulticolor ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white'}`}
                    />
                  </div>
                  {errors.variants?.[index]?.colorHex && <p className="text-red-500 text-xs mt-1">{errors.variants[index].colorHex.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">SKU <span className="text-red-500">*</span></label>
                  <input 
                    {...register(`variants.${index}.sku`)} 
                    type="text" 
                    placeholder="VASE-OBS-01"
                    className="w-full p-2 bg-white border border-gray-200 rounded-md text-sm uppercase focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                  {errors.variants?.[index]?.sku && <p className="text-red-500 text-xs mt-1">{errors.variants[index].sku.message}</p>}
                </div>
              </div>

              <hr className="border-gray-200 mb-5" />

              {/* ROW 2 & 3: PRICING AND ATTRIBUTES */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 mb-5">
                
                {/* Variant Price */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Price (INR) <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Icon icon="lucide:indian-rupee" width="14" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      {...register(`variants.${index}.pricing.price`, { valueAsNumber: true })} 
                      type="number" 
                      min="0"
                      placeholder="0.00"
                      className="w-full pl-7 pr-2 py-2 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                    />
                  </div>
                  {errors.variants?.[index]?.pricing?.price && <p className="text-red-500 text-xs mt-1">{errors.variants[index].pricing.price.message}</p>}
                </div>

                {/* Variant Discount */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Discount (%)</label>
                  <div className="relative">
                    <Icon icon="lucide:percent" width="14" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      {...register(`variants.${index}.pricing.discountPercentage`, { valueAsNumber: true })} 
                      type="number" 
                      min="0"
                      max="100"
                      placeholder="0"
                      className="w-full pl-7 pr-2 py-2 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                    />
                  </div>
                  {errors.variants?.[index]?.pricing?.discountPercentage && <p className="text-red-500 text-xs mt-1">{errors.variants[index].pricing.discountPercentage.message}</p>}
                </div>

                {/* Variant Material */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Material <span className="text-red-500">*</span></label>
                  <input 
                    {...register(`variants.${index}.attributes.material`)} 
                    type="text" 
                    placeholder="e.g. Matte Ceramic"
                    className="w-full p-2 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                  {errors.variants?.[index]?.attributes?.material && <p className="text-red-500 text-xs mt-1">{errors.variants[index].attributes.material.message}</p>}
                </div>

                {/* Variant Finish */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Finish / Texture</label>
                  <input 
                    {...register(`variants.${index}.attributes.finish`)} 
                    type="text" 
                    placeholder="e.g. Unglazed"
                    className="w-full p-2 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                  {errors.variants?.[index]?.attributes?.finish && <p className="text-red-500 text-xs mt-1">{errors.variants[index].attributes.finish.message}</p>}
                </div>

                {/* NEW: Variant Care Instructions */}
                <div className="md:col-span-2 mt-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Care Instructions <span className="text-red-500">*</span></label>
                  <textarea 
                    {...register(`variants.${index}.careInstructions`)} 
                    placeholder="e.g. Wash with liquid soap and wipe with a dry cloth. Microwave safe."
                    rows="2"
                    className="w-full p-2 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black/5 resize-none"
                  />
                  {errors.variants?.[index]?.careInstructions && <p className="text-red-500 text-xs mt-1">{errors.variants[index].careInstructions.message}</p>}
                </div>
              </div>

              <hr className="border-gray-200 mb-5" />

              {/* ROW 4: INVENTORY */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Stock Quantity <span className="text-red-500">*</span></label>
                  <input 
                    {...register(`variants.${index}.inventory.quantity`, { valueAsNumber: true })} 
                    type="number" 
                    min="0"
                    className="w-full p-2 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                  {errors.variants?.[index]?.inventory?.quantity && <p className="text-red-500 text-xs mt-1">{errors.variants[index].inventory.quantity.message}</p>}
                </div>
                <div className="flex items-center mt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      {...register(`variants.${index}.inventory.allowBackorder`)} 
                      className="rounded border-gray-300 text-black focus:ring-black" 
                    />
                    <span className="text-sm text-gray-600">Allow Backorders</span>
                  </label>
                </div>
              </div>

              {/* ROW 5: IMAGES */}
              <ImageUploader variantIndex={index} />

            </div>
          );
        })}

        {fields.length === 0 && (
          <div className="text-center p-8 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
            <p className="text-sm text-gray-500">No variants added yet. Products require at least one color variant.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VariantManager;