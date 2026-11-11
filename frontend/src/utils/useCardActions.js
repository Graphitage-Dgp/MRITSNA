import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addLocalItem,
  addToCartDB,
  hydrateGuestCartAPI,
  openCartDrawer,
} from "../store/features/cartSlice";
import {
  toggleWishlistDB,
  toggleLocalItem,
  hydrateGuestWishlistAPI,
} from "../store/features/wishlistSlice";
import { isDrinkwareProduct } from "../components/product/BundleRadioSelector";

const useCardActions = ({
  productId,
  variantId,
  slug,
  name,
  colorName,
  img,
  finalPrice,
  originalPrice,
  inStock,
  category,
}) => {
  const dispatch = useDispatch();
  const isAuth = useSelector((state) => state.auth?.isAuthenticated);
  const wishlistItems = useSelector((state) => state.wishlist?.items || []);

  const [isAdding, setIsAdding] = useState(false);
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);

  const isInWishlist = wishlistItems.some(
    (item) =>
      String(item.productId) === String(productId) &&
      String(item.variantId) === String(variantId)
  );

  const handleAddToCart = async () => {
    if (isAdding || inStock === false || !variantId) return;

    setIsAdding(true);
    try {
      if (isAuth) {
        dispatch(openCartDrawer());
        await dispatch(
          addToCartDB({ productId, variantId, quantity: 1 })
        ).unwrap();
      } else {
        const price = Math.round(finalPrice);
        dispatch(
          addLocalItem({
            cartItemId: `guest-${variantId}`,
            productId,
            variantId,
            slug,
            title: name,
            colorName: colorName || null,
            img,
            price,
            originalPrice: Math.round(originalPrice || finalPrice),
            quantity: 1,
            itemTotal: price,
            isDrinkware: isDrinkwareProduct({ category, title: name, slug }),
            bundleId: null,
            bundleLabel: null,
            replaceQuantity: false,
            maxLimit: 5,
          })
        );
        dispatch(openCartDrawer());
        dispatch(hydrateGuestCartAPI({ isMutation: true }));
      }
    } catch (error) {
      console.warn("Add to cart from card failed:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleWishlistToggle = async () => {
    if (isTogglingWishlist || !variantId) return;

    setIsTogglingWishlist(true);
    try {
      if (isAuth) {
        await dispatch(
          toggleWishlistDB({ productId, variantId })
        ).unwrap();
      } else {
        dispatch(toggleLocalItem({ productId, variantId }));
        dispatch(hydrateGuestWishlistAPI());
      }
    } catch (error) {
      console.warn("Wishlist toggle from card failed:", error);
    } finally {
      setIsTogglingWishlist(false);
    }
  };

  return {
    isInWishlist,
    isAdding,
    isTogglingWishlist,
    handleAddToCart,
    handleWishlistToggle,
  };
};

export default useCardActions;
