import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./features/authSlice";
import productReducer from "./features/productSlice";
import cartReducer from "./features/cartSlice";
import wishlistReducer from "./features/wishlistSlice";
import checkoutReducer from "./features/checkoutSlice";
import regionReducer from "./features/regionSlice";
import orderReducer from "./features/orderSlice";
import addressReducer from './features/addressSlice';
import reviewReducer from './features/reviewSlice';
import collectionReducer from './features/collectionSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    product: productReducer,
    cart: cartReducer,
    wishlist: wishlistReducer,
    checkout: checkoutReducer,
    region: regionReducer,
    orders: orderReducer,
    addresses: addressReducer,
    reviews: reviewReducer,
    collection: collectionReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: true,
    }),
});

export default store;