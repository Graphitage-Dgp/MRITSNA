import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import { 
  fetchAdminCollections, 
  deleteCollection, 
  changeCollectionStatus,
  resetCollectionState 
} from '../../store/slices/collectionSlice';

const Collections = () => {
  const dispatch = useDispatch();
  const { collections, isLoading, isError, message } = useSelector((state) => state.adminCollection);

  // Fetch data on mount
  useEffect(() => {
    dispatch(fetchAdminCollections());
  }, [dispatch]);

  // Handle Redux Errors
  useEffect(() => {
    if (isError) {
      toast.error(message || "Something went wrong");
      dispatch(resetCollectionState());
    }
  }, [isError, message, dispatch]);

  const handleDelete = async (id, title) => {
    if (window.confirm(`Are you sure you want to permanently delete "${title}"? This cannot be undone and will remove associated cloud images.`)) {
      try {
        await dispatch(deleteCollection(id)).unwrap();
        toast.success("Collection deleted successfully");
      } catch (error) {
        toast.error(error || "Failed to delete collection");
      }
    }
  };

  const handleStatusToggle = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'draft' : 'active';
    try {
      await dispatch(changeCollectionStatus({ id, status: newStatus })).unwrap();
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      toast.error(error || "Failed to update status");
    }
  };

  if (isLoading && collections.length === 0) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <Icon icon="ph:spinner-gap-light" className="animate-spin text-4xl text-black/50" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#1a1a1a] mb-1">Collections</h1>
          <p className="text-sm text-black/60 font-medium">Manage your editorial layouts and curated product bundles.</p>
        </div>
        <Link 
          to="/admin/collections/new"
          className="flex items-center gap-2 bg-[#1a1a1a] text-white px-6 py-3 text-[0.7rem] font-bold tracking-[0.2em] uppercase hover:bg-black/80 transition-colors"
        >
          <Icon icon="ph:plus-bold" className="text-lg" />
          Create Collection
        </Link>
      </div>

      {/* Data Table */}
      <div className="w-full bg-white border border-black/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-black/10 bg-[#f8f8f8]">
                <th className="p-4 text-[0.65rem] font-bold tracking-[0.2em] uppercase text-black/50">Collection</th>
                <th className="p-4 text-[0.65rem] font-bold tracking-[0.2em] uppercase text-black/50">Items</th>
                <th className="p-4 text-[0.65rem] font-bold tracking-[0.2em] uppercase text-black/50">Status</th>
                <th className="p-4 text-[0.65rem] font-bold tracking-[0.2em] uppercase text-black/50 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {collections.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-sm font-medium text-black/50">
                    No collections found. Create your first one to get started.
                  </td>
                </tr>
              ) : (
                collections.map((collection) => (
                  <tr key={collection._id} className="border-b border-black/5 hover:bg-[#f8f8f8]/50 transition-colors group">
                    
                    {/* Image & Title */}
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-[#f0f0f0] overflow-hidden flex-shrink-0">
                          {collection.image ? (
                            <img 
                              src={`${collection.image.baseUrl}?tr=w-100,h-100,fo-auto`} 
                              alt={collection.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-black/20">
                              <Icon icon="ph:image-light" className="text-2xl" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#1a1a1a] mb-0.5">{collection.title}</p>
                          <p className="text-xs text-black/50 font-medium">{collection.subtitle}</p>
                          <p className="text-[0.6rem] text-black/40 mt-1 uppercase tracking-widest">/{collection.slug}</p>
                        </div>
                      </div>
                    </td>

                    {/* Product Count */}
                    <td className="p-4 align-middle">
                      <span className="text-sm font-bold text-[#1a1a1a] bg-black/5 px-3 py-1 rounded-full">
                        {collection.productCount} <span className="font-medium text-black/50">linked</span>
                      </span>
                    </td>

                    {/* Status Toggle */}
                    <td className="p-4 align-middle">
                      <button 
                        onClick={() => handleStatusToggle(collection._id, collection.status)}
                        className={`text-[0.65rem] font-bold tracking-[0.1em] uppercase px-3 py-1.5 border transition-colors ${
                          collection.status === 'active' 
                            ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                            : 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100'
                        }`}
                      >
                        {collection.status}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="p-4 align-middle text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                        <Link 
                          to={`/admin/collections/edit/${collection._id}`}
                          className="p-2 text-black/50 hover:text-black hover:bg-black/5 transition-colors"
                          title="Edit Collection"
                        >
                          <Icon icon="ph:pencil-simple-light" className="text-xl" />
                        </Link>
                        <button 
                          onClick={() => handleDelete(collection._id, collection.title)}
                          className="p-2 text-black/50 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete Collection"
                        >
                          <Icon icon="ph:trash-light" className="text-xl" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Collections;