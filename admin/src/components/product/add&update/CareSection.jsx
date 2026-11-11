import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Icon } from '@iconify/react';

const CareSection = () => {
  const { register } = useFormContext();

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
      <h3 className="text-sm font-medium text-gray-900 mb-1 flex items-center gap-2">
        <Icon icon="lucide:heart-handshake" className="text-gray-400" width="18" />
        Care Instructions
      </h3>
      <p className="text-xs text-gray-500 mb-4">
        Transit-safe coverage is included on every product. Select the additional
        care instructions that apply to this product.
      </p>

      <div className="space-y-3">
        <label className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200 cursor-not-allowed">
          <input
            type="checkbox"
            checked
            disabled
            readOnly
            className="mt-0.5 rounded border-gray-300 text-black focus:ring-black"
          />
          <span className="text-sm text-gray-800">
            <span className="font-medium">🛡 100% Transit Safe</span>
            <span className="block text-xs text-gray-500 mt-0.5">
              Instant free courier replacement if broken on delivery. Always included.
            </span>
          </span>
        </label>

        <label className="flex items-start gap-3 p-3 rounded-lg bg-white border border-gray-200 cursor-pointer hover:border-gray-300 transition-colors">
          <input
            type="checkbox"
            {...register('care.isFoodSafe')}
            className="mt-0.5 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
          />
          <span className="text-sm text-gray-800">
            <span className="font-medium">🍵 100% Food Safe &amp; Lead Free</span>
            <span className="block text-xs text-gray-500 mt-0.5">
              Premium studio stoneware.
            </span>
          </span>
        </label>

        <label className="flex items-start gap-3 p-3 rounded-lg bg-white border border-gray-200 cursor-pointer hover:border-gray-300 transition-colors">
          <input
            type="checkbox"
            {...register('care.isMicrowaveDishwasherSafe')}
            className="mt-0.5 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
          />
          <span className="text-sm text-gray-800">
            <span className="font-medium">⚡ Microwave &amp; Dishwasher Safe</span>
          </span>
        </label>
      </div>
    </div>
  );
};

export default CareSection;
