import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';

// Form Data & Redux
import { productValidationSchema } from '../../../utils/validations/productSchema';
import { 
  fetchProductById, 
  updateExistingProduct, 
  resetProductState, 
  clearProductDetails 
} from '../../../store/slices/productSlice'; 

// Reusable Components
import ProductPageHeader from '../../../components/product/ProductPageHeader';
import BasicInfoSection from '../../../components/product/add&update/BasicInfoSection';
import PricingSection from '../../../components/product/add&update/PricingSection';
import ShippingSection from '../../../components/product/add&update/ShippingSection';
import VariantManager from '../../../components/product/add&update/VariantManager';
import CareSection from '../../../components/product/add&update/CareSection';

const EditProduct = () => {
  const { id } = useParams(); 
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { productDetails, isLoading, isError, message } = useSelector(
    (state) => state.adminProduct || state.product || {}
  ); 

  const methods = useForm({
    resolver: zodResolver(productValidationSchema),
  });

  useEffect(() => {
    if (id) {
      dispatch(fetchProductById(id));
    }
    
    return () => {
      dispatch(clearProductDetails());
      dispatch(resetProductState());
    };
  }, [id, dispatch]);

  useEffect(() => {
    if (productDetails) {
      methods.reset({
        ...productDetails,
        care: {
          isTransitSafe: true,
          isFoodSafe: false,
          isMicrowaveDishwasherSafe: false,
          ...(productDetails.care || {}),
        },
      });
    }
  }, [productDetails, methods]);

  const onSubmit = async (data) => {
    try {
      await dispatch(updateExistingProduct({ id, updateData: data })).unwrap();
      toast.success("Product updated successfully!");
      navigate('/admin/products');
    } catch (error) {
      console.error("Failed to update product:", error);
      toast.error(error?.message || error || "Failed to update product. Please try again.");
    }
  };

  if (isLoading && !productDetails) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex flex-col items-center justify-center w-full">
        <Icon icon="lucide:loader-2" className="animate-spin text-gray-400 mb-4" width="32" />
        <p className="text-sm text-gray-500 font-medium">Loading product data...</p>
      </div>
    );
  }

  if (isError && !productDetails) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex flex-col items-center justify-center w-full">
        <Icon icon="lucide:alert-circle" className="text-red-400 mb-4" width="32" />
        <p className="text-sm text-gray-600 font-medium">{message || "Product not found"}</p>
        <button 
          onClick={() => navigate('/admin/products')}
          className="mt-4 px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 w-full max-w-7xl mx-auto pb-24">
      <ProductPageHeader 
        title="Edit Product" 
        description="Update inventory, variants, and product details."
        actionLabel="Cancel"
        actionLink="/admin/products"
      />

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="grid grid-cols-1 xl:grid-cols-3 gap-6 relative">
          
          {/* Main Left Column */}
          <div className="xl:col-span-2 space-y-6">
            <BasicInfoSection />
            <VariantManager />
          </div>

          {/* Right Sidebar Column */}
          <div className="space-y-6">
            
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Icon icon="lucide:settings" className="text-gray-400" width="18" />
                Organization
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Status</label>
                  <select 
                    {...methods.register('status')}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Category</label>
                  <select 
                    {...methods.register('category')}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                  >
                    <option value="Vase">Vase</option>
                    <option value="Dinnerset">Dinnerset</option>
                    <option value="Decor">Decor</option>
                    <option value="Bowl">Bowl</option>
                    <option value="Cup">Cup</option>
                    <option value="Mug">Mug</option>
                    <option value="Platter/Tray">Platter/Tray</option>
                    <option value="Tea">Tea</option>
                    <option value="Tealight Candle">Tealight Candle</option>
                    <option value="Teapot">Teapot</option>
                    <option value="Tumbler">Tumbler</option>
                    <option value="Serveware">Serveware</option>
                    <option value="Puja">Puja</option>
                    <option value="Aromatic Candle">Aromatic Candle</option>
                  </select>
                  {methods.formState.errors.category && (
                    <p className="text-red-500 text-xs mt-1">{methods.formState.errors.category.message}</p>
                  )}
                </div>

                {/* NEW: Premium Toggle Switch */}
                <div className="pt-4 border-t border-gray-100 mt-4">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm text-gray-800 font-medium flex items-center gap-2">
                      <Icon icon="lucide:star" className="text-amber-500" width="16" />
                      Premium Product
                    </span>
                    <div className="relative inline-flex items-center">
                      <input 
                        type="checkbox" 
                        {...methods.register('isPremium')}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-black"></div>
                    </div>
                  </label>
                  <p className="text-xs text-gray-500 mt-1.5">Highlight this item with premium badges across the storefront.</p>
                </div>

              </div>
            </div>

            <CareSection />
            <PricingSection />
            <ShippingSection />
          </div>

          {/* Sticky Bottom Save Bar */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex justify-end gap-3 px-8 z-40 md:pl-64 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <button 
              type="button"
              onClick={() => navigate('/admin/products')}
              className="px-5 py-2 text-sm font-medium text-gray-600 hover:text-black hover:bg-gray-50 rounded-lg transition-colors"
            >
              Discard Changes
            </button>
            <button 
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              {isLoading ? (
                <Icon icon="lucide:loader-2" className="animate-spin" width="18" />
              ) : (
                <Icon icon="lucide:save" width="18" />
              )}
              {isLoading ? 'Updating...' : 'Update Product'}
            </button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
};

export default EditProduct;