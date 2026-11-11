import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Icon } from "@iconify/react";

// Redux Actions
import { fetchCollections } from "../store/features/collectionSlice";

// Sub-components
import CollectionHero from "../components/collection/CollectionHero";
import CollectionLookbook from "../components/collection/CollectionLookbook";
import CollectionGrid from "../components/collection/CollectionGrid";
import CollectionBundle from "../components/collection/CollectionBundle";

// Register ScrollTrigger globally for the page
gsap.registerPlugin(ScrollTrigger);

const Collection = () => {
  const dispatch = useDispatch();
  
  // Pull the massive populated array AND the dynamic currency from Redux
  const { collections, currencyCode = "INR", isLoading, isError, message } = useSelector((state) => state.collection);

  // Fetch data on mount
  useEffect(() => {
    dispatch(fetchCollections());
  }, [dispatch]);

  // Handle Loading State
  if (isLoading && collections.length === 0) {
    return (
      <div className="w-full min-h-screen bg-[#f8f8f8] flex flex-col items-center justify-center">
        <Icon icon="ph:spinner-gap-light" className="animate-spin text-5xl text-black/50 mb-4" />
        <p className="text-[0.65rem] font-bold tracking-[0.2em] uppercase text-black/40">Curating Collections</p>
      </div>
    );
  }

  // Handle Error State
  if (isError) {
    return (
      <div className="w-full min-h-screen bg-[#f8f8f8] flex flex-col items-center justify-center text-center px-6">
        <Icon icon="ph:warning-circle-light" className="text-5xl text-red-400 mb-4" />
        <h2 className="head-font text-3xl mb-2">Atmosphere Unavailable</h2>
        <p className="text-sm font-medium text-black/60 max-w-md mx-auto">{message}</p>
      </div>
    );
  }

  // Handle Empty State
  if (collections.length === 0) {
    return (
      <div className="w-full min-h-screen bg-[#f8f8f8] flex flex-col items-center justify-center text-center px-6">
        <h2 className="head-font text-3xl mb-2">No Active Collections</h2>
        <p className="text-sm font-medium text-black/60 max-w-md mx-auto">Our curators are currently preparing the next series. Check back soon.</p>
      </div>
    );
  }

  return (
    <main className="w-full min-h-screen bg-[#f8f8f8] text-[#1a1a1a]">
      {/* Map through the array and render a complete block for each active collection */}
      {collections.map((collection, index) => (
        <div key={collection._id} className="relative w-full border-b-[16px] border-[#1a1a1a]">
          
          {/* 1. Hero Section */}
          <CollectionHero collectionData={collection} />
          
          {/* 2. Interactive Lookbook */}
          {collection.lookbook?.image && (
            <CollectionLookbook 
              lookbookImage={collection.lookbook.image} 
              lookbookHotspots={collection.lookbook.hotspots || []}
              currencyCode={currencyCode} 
            />
          )}
          
          {/* 3. The Asymmetric Grid */}
          {collection.gridProducts?.length > 0 && (
            <CollectionGrid 
              products={collection.gridProducts} 
              currencyCode={currencyCode} 
            />
          )}
          
          {/* 4. The Complete Bundle Upsell */}
          {collection.bundle?.products?.length > 0 && (
            <CollectionBundle 
              bundleData={collection.bundle} 
              collectionTitle={collection.title}
              currencyCode={currencyCode}
            />
          )}

        </div>
      ))}
    </main>
  );
};

export default Collection;