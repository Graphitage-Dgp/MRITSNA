import React from "react";
import { Icon } from "@iconify/react";

const AddressCard = ({ address, onEdit, onDelete, onSetDefault, isActionLoading }) => {
  return (
    <div className={`bg-white border p-6 rounded-2xl flex flex-col justify-between transition-shadow hover:shadow-md ${address.isDefault ? 'border-black shadow-sm' : 'border-black/5'}`}>
      <div>
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-gray-100 text-[0.6rem] font-bold uppercase tracking-widest text-black rounded-sm">
              {address.type}
            </span>
            {address.isDefault && (
              <span className="text-[0.6rem] font-bold uppercase tracking-widest text-green-600 flex items-center gap-1">
                <Icon icon="lucide:check-circle-2" width="12" /> Default
              </span>
            )}
          </div>
        </div>
        <p className="font-semibold text-sm text-black mb-1">{address.firstName} {address.lastName}</p>
        <p className="text-xs text-gray-500 leading-relaxed mb-4">
          {address.street}<br/>
          {address.city}, {address.state} {address.pinCode}<br/>
          {address.country}
        </p>
        <p className="text-xs text-gray-500">Ph: {address.phone}</p>
      </div>

      <div className="flex gap-4 mt-6 pt-4 border-t border-black/5">
        <button 
          onClick={() => onEdit(address)} 
          disabled={isActionLoading}
          className="text-[0.65rem] font-bold uppercase tracking-widest text-gray-600 hover:text-black transition-colors flex items-center gap-1 disabled:opacity-50"
        >
          <Icon icon="lucide:edit-3" width="12" /> Edit
        </button>
        <button 
          onClick={() => onDelete(address._id)} 
          disabled={isActionLoading}
          className="text-[0.65rem] font-bold uppercase tracking-widest text-red-500 hover:text-red-700 transition-colors flex items-center gap-1 disabled:opacity-50"
        >
          <Icon icon="lucide:trash-2" width="12" /> Delete
        </button>
        
        {!address.isDefault && (
          <button 
            onClick={() => onSetDefault(address._id)}
            disabled={isActionLoading}
            className="text-[0.65rem] font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors ml-auto disabled:opacity-50"
          >
            Set Default
          </button>
        )}
      </div>
    </div>
  );
};

export default AddressCard;