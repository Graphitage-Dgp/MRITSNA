import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';

// Redux Actions
import { 
  createNewCollection, 
  updateExistingCollection, 
  fetchCollectionById,
  clearCollectionDetails,
  deleteCollectionImage
} from '../../../store/slices/collectionSlice';
import { fetchAdminProducts } from '../../../store/slices/productSlice';

// Sub-components
import CollectionHotspotEditor from '../../../components/collection/CollectionHotspotEditor';
import ProductMultiSelect from '../../../components/collection/ProductMultiSelect';
import CollectionImageUploader from '../../../components/collection/CollectionImageUploader';

const CollectionForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isEditMode = Boolean(id);

  // Redux State
  const { collectionDetails, isLoading } = useSelector((state) => state.adminCollection);
  const { products } = useSelector((state) => state.adminProduct);

  // Local Form State
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    status: 'active',
    heroImage: null, 
    lookbook: {
      image: null,
      hotspots: []
    },
    gridProducts: [],
    bundle: {
      products: [],
      discountPercentage: 0
    },
    seo: {
      metaTitle: '',
      metaDescription: ''
    }
  });

  useEffect(() => {
    if (products.length === 0) {
      dispatch(fetchAdminProducts());
    }
    if (isEditMode) {
      dispatch(fetchCollectionById(id));
    }
    return () => {
      dispatch(clearCollectionDetails());
    };
  }, [dispatch, id, isEditMode, products.length]);

  useEffect(() => {
    if (isEditMode && collectionDetails) {
      setFormData({
        title: collectionDetails.title || '',
        subtitle: collectionDetails.subtitle || '',
        description: collectionDetails.description || '',
        status: collectionDetails.status || 'draft',
        heroImage: collectionDetails.heroImage || null,
        lookbook: {
          image: collectionDetails.lookbook?.image || null,
          hotspots: collectionDetails.lookbook?.hotspots?.map(h => ({
            ...h,
            product: typeof h.product === 'object' ? h.product._id : h.product,
            _productName: typeof h.product === 'object' ? h.product.title : 'Linked Product'
          })) || []
        },
        gridProducts: collectionDetails.gridProducts?.map(p => typeof p === 'object' ? p._id : p) || [],
        bundle: {
          products: collectionDetails.bundle?.products?.map(p => typeof p === 'object' ? p._id : p) || [],
          discountPercentage: collectionDetails.bundle?.discountPercentage || 0
        },
        seo: {
          metaTitle: collectionDetails.seo?.metaTitle || '',
          metaDescription: collectionDetails.seo?.metaDescription || ''
        }
      });
    }
  }, [isEditMode, collectionDetails]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNestedChange = (category, field, value) => {
    setFormData(prev => ({
      ...prev,
      [category]: { ...prev[category], [field]: value }
    }));
  };

  // --- Real-Time Image Upload Handlers ---
  const onHeroUploadSuccess = ({ fileId, url, altText }) => {
    setFormData(prev => ({ 
      ...prev, 
      heroImage: { 
        imagekitFileId: fileId, 
        baseUrl: url, 
        altText: formData.title || altText 
      } 
    }));
  };

  const onLookbookUploadSuccess = ({ fileId, url, altText }) => {
    handleNestedChange('lookbook', 'image', { 
      imagekitFileId: fileId, 
      baseUrl: url, 
      altText: formData.title ? `${formData.title} Lookbook` : altText 
    });
  };

  const handleRemoveHeroImage = async () => {
    if (formData.heroImage?.imagekitFileId) {
      try {
        await dispatch(deleteCollectionImage(formData.heroImage.imagekitFileId)).unwrap();
        setFormData(prev => ({ ...prev, heroImage: null }));
        toast.success("Image removed from cloud");
      } catch (error) {
        toast.error("Failed to remove image from cloud storage");
      }
    }
  };

  const handleRemoveLookbookImage = async () => {
    if (formData.lookbook.image?.imagekitFileId) {
      try {
        await dispatch(deleteCollectionImage(formData.lookbook.image.imagekitFileId)).unwrap();
        handleNestedChange('lookbook', 'image', null);
        toast.success("Image removed from cloud");
      } catch (error) {
        toast.error("Failed to remove image from cloud storage");
      }
    }
  };

  // --- Submission ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.heroImage) return toast.error("Hero image is required");
    if (!formData.lookbook.image) return toast.error("Lookbook image is required");
    if (formData.gridProducts.length === 0) return toast.error("Select at least one product for the grid");
    if (formData.bundle.products.length > 0 && formData.bundle.products.length < 2) {
      return toast.error("A bundle must contain at least 2 products");
    }

    try {
      if (isEditMode) {
        await dispatch(updateExistingCollection({ id, updateData: formData })).unwrap();
        toast.success("Collection updated successfully");
      } else {
        await dispatch(createNewCollection(formData)).unwrap();
        toast.success("Collection created successfully");
        navigate('/admin/collections');
      }
    } catch (error) {
      toast.error(typeof error === 'string' ? error : "An error occurred during save");
    }
  };

  if (isLoading && isEditMode && !collectionDetails) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <Icon icon="ph:spinner-gap-light" className="animate-spin text-4xl text-black/50" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto pb-32">
      <div className="flex items-center justify-between mb-8">
        <div>
          <button 
            onClick={() => navigate('/admin/collections')}
            className="text-xs font-bold tracking-[0.1em] text-black/50 uppercase hover:text-black flex items-center gap-2 mb-2 transition-colors"
          >
            <Icon icon="ph:arrow-left-light" /> Back to List
          </button>
          <h1 className="text-3xl font-bold text-[#1a1a1a]">
            {isEditMode ? 'Edit Collection' : 'Create New Collection'}
          </h1>
        </div>
      </div>

      <form className="flex flex-col gap-12" id="collection-form" onSubmit={handleSubmit}>
        
        {/* --- 1. Core Details --- */}
        <section className="bg-white p-8 border border-black/10">
          <h2 className="text-sm font-bold uppercase tracking-[0.1em] border-b border-black/10 pb-4 mb-6">Core Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-xs font-bold text-black/70 uppercase tracking-widest mb-2">Title</label>
              <input 
                type="text" 
                name="title"
                value={formData.title} 
                onChange={handleChange}
                required
                className="w-full border border-black/20 p-3 text-sm focus:outline-none focus:border-black"
                placeholder="e.g. The Obsidian Series"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-black/70 uppercase tracking-widest mb-2">Subtitle</label>
              <input 
                type="text" 
                name="subtitle"
                value={formData.subtitle} 
                onChange={handleChange}
                required
                className="w-full border border-black/20 p-3 text-sm focus:outline-none focus:border-black"
                placeholder="e.g. Autumn / Winter 2026"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-xs font-bold text-black/70 uppercase tracking-widest mb-2">Description</label>
            <textarea 
              name="description"
              value={formData.description} 
              onChange={handleChange}
              required
              rows="4"
              className="w-full border border-black/20 p-3 text-sm focus:outline-none focus:border-black resize-none"
              placeholder="Narrative description for the hero section..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-black/70 uppercase tracking-widest mb-2">Status</label>
            <select 
              name="status"
              value={formData.status} 
              onChange={handleChange}
              className="w-full md:w-1/3 border border-black/20 p-3 text-sm focus:outline-none focus:border-black bg-transparent cursor-pointer"
            >
              <option value="draft">Draft (Hidden)</option>
              <option value="active">Active (Published)</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </section>

        {/* --- 2. Media & Interactive Lookbook --- */}
        <section className="bg-white p-8 border border-black/10">
          <h2 className="text-sm font-bold uppercase tracking-[0.1em] border-b border-black/10 pb-4 mb-6">Media & Atmosphere</h2>
          
          <div className="mb-12">
            <label className="block text-xs font-bold text-black/70 uppercase tracking-widest mb-2">Hero Background Image</label>
            <p className="text-xs text-black/50 mb-4">High-resolution, landscape orientation recommended (e.g. 3200x1800).</p>
            
            <div className="w-full min-h-[300px] bg-[#f8f8f8] border border-black/10 flex flex-col items-center justify-center relative overflow-hidden group">
              {formData.heroImage ? (
                <>
                  <img src={formData.heroImage.baseUrl} alt="Hero" className="w-full h-full object-cover aspect-[21/9]" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      type="button"
                      onClick={handleRemoveHeroImage}
                      className="bg-white text-black px-4 py-2 text-xs font-bold tracking-widest uppercase hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      Remove & Replace
                    </button>
                  </div>
                </>
              ) : (
                <CollectionImageUploader 
                  onUploadSuccess={onHeroUploadSuccess} 
                  label="Upload Hero Image" 
                />
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-black/70 uppercase tracking-widest mb-4">Interactive Lookbook</label>
            
            <div className="mb-8 w-full md:w-1/2">
               {!formData.lookbook.image ? (
                 <div className="w-full h-48 bg-[#f8f8f8] border border-black/10">
                    <CollectionImageUploader 
                      onUploadSuccess={onLookbookUploadSuccess} 
                      label="Upload Lookbook Image" 
                    />
                 </div>
               ) : (
                 <div className="flex justify-between items-center bg-[#f8f8f8] p-3 border border-black/10">
                    <span className="text-sm font-medium truncate">Lookbook Image Uploaded</span>
                    <button type="button" onClick={handleRemoveLookbookImage} className="text-xs text-red-500 font-bold tracking-widest uppercase hover:text-red-700">Remove</button>
                 </div>
               )}
            </div>

            <CollectionHotspotEditor 
              lookbookImage={formData.lookbook.image}
              hotspots={formData.lookbook.hotspots}
              setHotspots={(newHotspots) => handleNestedChange('lookbook', 'hotspots', newHotspots)}
              availableProducts={products}
            />
          </div>
        </section>

        {/* --- 3. Product Roster & Bundle --- */}
        <section className="bg-white p-8 border border-black/10">
          <h2 className="text-sm font-bold uppercase tracking-[0.1em] border-b border-black/10 pb-4 mb-6">Inventory Links</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <ProductMultiSelect
                label="The Pieces (Asymmetric Grid)"
                subtitle="Select products to feature on the page"
                products={products}
                selectedIds={formData.gridProducts}
                onChange={(newIds) => setFormData(prev => ({ ...prev, gridProducts: newIds }))}
              />
            </div>

            <div className="flex flex-col gap-6">
              <ProductMultiSelect
                label="The Collective (Shop the Set)"
                subtitle="Curate items for the final checkout block"
                products={products}
                selectedIds={formData.bundle.products}
                onChange={(newIds) => handleNestedChange('bundle', 'products', newIds)}
              />
              
              <div className="p-4 border border-black/20 bg-[#f8f8f8]">
                <label className="block text-[0.65rem] font-bold text-black/70 uppercase tracking-widest mb-2">Bundle Discount Percentage</label>
                <div className="relative w-full">
                  <input 
                    type="number" 
                    min="0" max="100"
                    value={formData.bundle.discountPercentage}
                    onChange={(e) => handleNestedChange('bundle', 'discountPercentage', Number(e.target.value))}
                    className="w-full border border-black/20 p-3 pr-8 text-sm focus:outline-none focus:border-black bg-white"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-black/50 font-bold">%</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </form>

      {/* --- 4. The Fixed Footer Bar --- */}
      <div className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-sm border-t border-black/10 p-4 md:px-12 flex justify-between items-center z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <div className="hidden md:block">
          <p className="text-sm font-bold text-[#1a1a1a]">{formData.title || 'Untitled Collection'}</p>
          <p className="text-[0.65rem] text-black/50 font-bold uppercase tracking-widest mt-1">
            Status: <span className={formData.status === 'active' ? 'text-green-600' : 'text-yellow-600'}>{formData.status}</span>
          </p>
        </div>
        <button 
          form="collection-form"
          type="submit"
          disabled={isLoading}
          className="w-full md:w-auto bg-[#1a1a1a] text-white px-10 py-4 text-[0.7rem] font-bold tracking-[0.2em] uppercase hover:bg-black/80 transition-colors disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {isLoading ? (
            <><Icon icon="ph:spinner-gap-light" className="animate-spin text-xl" /> Saving Setup...</>
          ) : (
            <><Icon icon="ph:check-bold" className="text-lg" /> {isEditMode ? 'Update Collection' : 'Create Collection'}</>
          )}
        </button>
      </div>
    </div>
  );
};

export default CollectionForm;