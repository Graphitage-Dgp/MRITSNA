import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useFormContext } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { Icon } from '@iconify/react';
import axios from 'axios';
import toast from 'react-hot-toast';

// dnd-kit imports for buttery smooth drag-and-drop
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors 
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { fetchImageKitAuth, deleteProductImage } from '../../../store/slices/productSlice';

const IMAGEKIT_PUBLIC_KEY = import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY;
const IMAGEKIT_UPLOAD_URL = import.meta.env.VITE_IMAGEKIT_UPLOAD_URL;

// --- NEW SUB-COMPONENT: The Draggable Image Card ---
const SortableImageCard = ({ id, image, index, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className={`relative group rounded-lg overflow-hidden border aspect-square bg-gray-50 cursor-grab active:cursor-grabbing
        ${isDragging ? 'border-black shadow-xl scale-105' : 'border-gray-200'}
      `}
    >
      <img 
        src={`${image.baseUrl}?tr=w-200,h-200,q-80,c-at_max`} 
        alt={image.altText || "Preview"} 
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      
      {/* Overlay Actions */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
        <div className="flex justify-end">
          <button 
            type="button"
            // onPointerDown stops the drag event so the click can register cleanly
            onPointerDown={(e) => e.stopPropagation()} 
            onClick={(e) => { e.stopPropagation(); onRemove(index); }}
            className="p-1.5 bg-white/90 text-red-600 rounded-md hover:bg-white transition-colors shadow-sm"
          >
            <Icon icon="lucide:trash-2" width="14" />
          </button>
        </div>
        
        {/* Visual Drag Indicator (Not a functional button) */}
        <div className="w-full py-1.5 bg-white/90 text-gray-700 text-xs font-medium rounded flex items-center justify-center gap-1.5 shadow-sm pointer-events-none">
          <Icon icon="lucide:move" width="14" />
          Drag to move
        </div>
      </div>

      {/* Primary Badge */}
      {image.isPrimary && (
        <div className="absolute top-2 left-2 px-2 py-1 bg-black text-white text-[10px] font-bold tracking-wider uppercase rounded shadow-sm">
          Cover
        </div>
      )}
    </div>
  );
};


// --- MAIN COMPONENT ---
const ImageUploader = ({ variantIndex }) => {
  const dispatch = useDispatch();
  const { watch, setValue, formState: { errors } } = useFormContext();
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const currentCategory = watch('category') || 'uncategorized';
  
  const fieldName = `variants.${variantIndex}.images`;
  const currentImages = watch(fieldName) || [];
  const maxImages = 5;

  // Set up smart sensors. A 5px drag distance prevents accidental drags when clicking buttons.
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const onDrop = useCallback(async (acceptedFiles) => {
    if (currentImages.length + acceptedFiles.length > maxImages) {
      toast.error(`Limit reached: Maximum ${maxImages} images per variant.`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    const successfullyUploadedImages = [];

    try {
      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i];

        const authData = await dispatch(fetchImageKitAuth()).unwrap();
        const { token, expire, signature } = authData;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileName', file.name);
        formData.append('publicKey', IMAGEKIT_PUBLIC_KEY);
        formData.append('signature', signature);
        formData.append('expire', expire);
        formData.append('token', token);
        
        const folderPath = `/products/${currentCategory.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        formData.append('folder', folderPath); 

        const uploadResponse = await axios.post(IMAGEKIT_UPLOAD_URL, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        });

        const { url, fileId } = uploadResponse.data;

        successfullyUploadedImages.push({
          imagekitFileId: fileId,
          baseUrl: url,
          altText: file.name.split('.')[0],
          isPrimary: currentImages.length === 0 && successfullyUploadedImages.length === 0,
          displayOrder: currentImages.length + successfullyUploadedImages.length
        });
      }

      if (successfullyUploadedImages.length > 0) {
        setValue(fieldName, [...currentImages, ...successfullyUploadedImages], { shouldValidate: true });
      }

    } catch (error) {
      console.error("ImageKit Upload Process Failed:", error);
      toast.error("Upload failed. Please check your connection.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [currentImages, setValue, fieldName, dispatch, currentCategory]);

  const onDropRejected = useCallback((fileRejections) => {
    toast.error(`Limit reached: You can only upload up to ${maxImages} images in total.`);
  }, [maxImages]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxFiles: maxImages - currentImages.length,
    disabled: currentImages.length >= maxImages || isUploading
  });

  const removeImage = async (indexToRemove) => {
    const imageToDelete = currentImages[indexToRemove];

    if (imageToDelete.imagekitFileId && !imageToDelete.imagekitFileId.startsWith('temp_')) {
      try {
        await dispatch(deleteProductImage(imageToDelete.imagekitFileId)).unwrap();
      } catch (error) {
        console.error("Failed to delete from cloud:", error);
        toast.error("Failed to delete image from cloud storage.");
        return; 
      }
    }

    const updatedImages = currentImages.filter((_, idx) => idx !== indexToRemove);
    
    if (currentImages[indexToRemove].isPrimary && updatedImages.length > 0) {
      updatedImages[0].isPrimary = true;
    }
    
    setValue(fieldName, updatedImages, { shouldValidate: true });
  };

  // --- THE NEW DRAG HANDLER ---
  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    // If they dropped it in a new spot
    if (over && active.id !== over.id) {
      const oldIndex = currentImages.findIndex(img => img.imagekitFileId === active.id);
      const newIndex = currentImages.findIndex(img => img.imagekitFileId === over.id);

      // Instantly swap the array order
      const reorderedArray = arrayMove(currentImages, oldIndex, newIndex);

      // Recalculate the primary badge based on whatever is now at index 0
      const finalArray = reorderedArray.map((img, idx) => ({
        ...img,
        isPrimary: idx === 0
      }));

      // Save it back to react-hook-form
      setValue(fieldName, finalArray, { shouldValidate: true });
    }
  };

  const imageErrors = errors?.variants?.[variantIndex]?.images;

  return (
    <div className="mt-6 border-t border-gray-100 pt-5">
      <div className="flex justify-between items-end mb-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Variant Images</label>
          <p className="text-xs text-gray-500 mt-0.5">Upload up to 5 images. Drag to reorder. The first image acts as the cover.</p>
        </div>
        <span className="text-xs font-medium bg-gray-100 px-2 py-1 rounded text-gray-600">
          {currentImages.length} / {maxImages}
        </span>
      </div>

      {currentImages.length < maxImages && (
        <div 
          {...getRootProps()} 
          className={`relative overflow-hidden p-6 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all duration-200 ease-in-out
            ${isDragActive ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}
            ${isUploading ? 'opacity-90 cursor-not-allowed border-black/20' : ''}
          `}
        >
          <input {...getInputProps()} />
          <Icon 
            icon={isUploading ? "lucide:loader-2" : "lucide:upload-cloud"} 
            className={`mx-auto text-gray-400 mb-3 ${isUploading ? 'animate-spin text-black' : ''}`} 
            width="28" 
          />
          <p className="text-sm font-medium text-gray-700 relative z-10">
            {isUploading ? `Uploading... ${uploadProgress}%` : isDragActive ? "Drop the images here..." : "Click or drag images to upload"}
          </p>
          <p className="text-xs text-gray-400 mt-1 relative z-10">JPEG, PNG, or WebP (Max 5MB per file)</p>
          
          {isUploading && (
             <div 
               className="absolute top-0 left-0 bottom-0 bg-gray-100/80 transition-all duration-300 ease-out z-0"
               style={{ width: `${uploadProgress}%` }}
             ></div>
          )}
        </div>
      )}

      {imageErrors && !Array.isArray(imageErrors) && (
        <p className="text-red-500 text-xs mt-2">{imageErrors.message}</p>
      )}

      {/* --- THE DRAG-AND-DROP GRID --- */}
      {currentImages.length > 0 && (
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-4">
            <SortableContext 
              items={currentImages.map(img => img.imagekitFileId)} 
              strategy={rectSortingStrategy} 
            >
              {currentImages.map((image, idx) => (
                <SortableImageCard
                  key={image.imagekitFileId}
                  id={image.imagekitFileId}
                  image={image}
                  index={idx}
                  onRemove={removeImage}
                />
              ))}
            </SortableContext>
          </div>
        </DndContext>
      )}
    </div>
  );
};

export default ImageUploader;