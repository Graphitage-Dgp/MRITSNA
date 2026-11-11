import React, { useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";

import { verifyStock, addToCartDB, addLocalItem, hydrateGuestCartAPI } from "../../store/features/cartSlice";

const CollectionBundle = ({ bundleData, collectionTitle, currencyCode }) => {
  const dispatch = useDispatch();
  const [isAddingSet, setIsAddingSet] = useState(false);

  const { user } = useSelector((state) => state.auth || {}); 
  const isAuthenticated = Boolean(user);

  const { basePrice, discountedPrice, isOutOfStock } = useMemo(() => {
    let base = 0;
    let outOfStock = false;

    if (!bundleData || !bundleData.products) {
      return { basePrice: 0, discountedPrice: 0, isOutOfStock: true };
    }

    bundleData.products.forEach(product => {
      const variant = product.variants?.[0];
      
      const quantity = variant?.inventory?.quantity || 0;
      if (quantity < 1) {
        outOfStock = true;
      }

      base += variant?.pricing?.price || 0;
    });

    const discount = bundleData.discountPercentage || 0;
    const finalPrice = base - (base * (discount / 100));

    return { basePrice: base, discountedPrice: finalPrice, isOutOfStock: outOfStock };
  }, [bundleData]);

  const locale = currencyCode === 'INR' ? 'en-IN' : 'en-US';
  
  const formattedPrice = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode || 'INR',
    maximumFractionDigits: 0
  }).format(discountedPrice);

  const formattedBase = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode || 'INR',
    maximumFractionDigits: 0
  }).format(basePrice);

  const handleShopSet = async () => {
    setIsAddingSet(true);
    
    try {
      for (const product of bundleData.products) {
        const variant = product.variants?.[0];
        
        if (!product._id || !variant?._id) {
          throw new Error(`Data error: Missing Variant ID for ${product.title}`);
        }
        
        await dispatch(verifyStock({
          productId: product._id,
          variantId: variant._id,
          requestedQuantity: 1
        })).unwrap();
      }

      for (const product of bundleData.products) {
        const variant = product.variants[0];
        const originalPrice = variant.pricing?.price || 0;
        const itemDiscountedPrice = originalPrice - (originalPrice * ((bundleData.discountPercentage || 0) / 100));
        
        const primaryImage = variant.images?.find(img => img.isPrimary)?.baseUrl || variant.images?.[0]?.baseUrl;

        if (isAuthenticated) {
          await dispatch(addToCartDB({
            productId: product._id,
            variantId: variant._id,
            quantity: 1
          })).unwrap();
        } else {
          dispatch(addLocalItem({
            cartItemId: `guest-${variant._id}`,
            productId: product._id,
            variantId: variant._id,
            slug: product.slug,
            title: product.title,
            colorName: variant.colorName,
            img: primaryImage,
            price: itemDiscountedPrice,
            originalPrice: originalPrice,
            quantity: 1,
            itemTotal: itemDiscountedPrice,
            maxLimit: variant.inventory?.allowBackorder ? 3 : Math.min(3, variant.inventory?.quantity || 1)
          }));
        }
      }

      // Sync the newly added guest bundle items to MongoDB
      if (!isAuthenticated) {
        dispatch(hydrateGuestCartAPI({ isMutation: true }));
      }

      toast.success(`The ${collectionTitle} set has been added to your cart.`);

    } catch (error) {
      toast.error(typeof error === 'string' ? error : "Sorry, a piece in this collection is currently out of stock.");
    } finally {
      setIsAddingSet(false);
    }
  };

  if (!bundleData || !bundleData.products || bundleData.products.length === 0) {
    return null; 
  }

  return (
    <section className="w-full bg-[#1a1a1a] text-white py-24 lg:py-32 px-6 lg:px-12">
      <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row justify-between items-start lg:items-center gap-16">
        
        <div className="w-full lg:w-1/2">
          <h2 className="head-font text-5xl lg:text-7xl mb-8">Acquire the <br className="hidden lg:block"/> Complete Look</h2>
          <ul className="flex flex-col gap-4 text-sm font-medium text-white/60">
            {bundleData.products.map((product) => (
              <li key={product._id} className="flex items-center gap-4">
                <Icon icon="ph:check-light" className="text-xl text-white/40 shrink-0" /> 
                1x {product.title}
              </li>
            ))}
          </ul>
        </div>

        <div className="w-full lg:w-auto flex flex-col items-start lg:items-end border-t border-white/20 lg:border-none pt-12 lg:pt-0">
          
          {bundleData.discountPercentage > 0 && (
            <div className="flex flex-col items-start lg:items-end mb-2">
               <span className="text-[0.65rem] font-bold tracking-[0.2em] uppercase text-white/50 bg-white/10 px-2 py-1 mb-2">
                 Save {bundleData.discountPercentage}%
               </span>
               <span className="text-sm font-bold text-white/40 line-through">
                 Value: {formattedBase}
               </span>
            </div>
          )}
          
          <span className="text-[0.65rem] font-bold tracking-[0.2em] uppercase opacity-50 mb-2">
            Curated Bundle Price
          </span>
          <span className="head-font text-4xl lg:text-5xl mb-6">{formattedPrice}</span>
          
          {isOutOfStock && (
            <p className="text-xs font-bold text-red-400 tracking-widest uppercase mb-4 flex items-center gap-2">
              <Icon icon="ph:warning-circle-bold" className="text-base" />
              Some pieces are out of stock
            </p>
          )}

          <button 
            onClick={handleShopSet}
            disabled={isAddingSet || isOutOfStock}
            className="w-full lg:w-[300px] h-14 bg-white text-[#1a1a1a] flex items-center justify-center gap-3 text-[0.65rem] font-bold tracking-[0.2em] uppercase hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAddingSet ? (
              <><Icon icon="ph:spinner-gap-light" className="animate-spin text-lg" /> Curating Set...</>
            ) : isOutOfStock ? (
              "Currently Unavailable"
            ) : (
              "Add Collection to Cart"
            )}
          </button>
        </div>
        
      </div>
    </section>
  );
};

export default CollectionBundle;
