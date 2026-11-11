import React from 'react';
import { Icon } from '@iconify/react';

const CheckoutAddresses = ({ isGuest, addresses, loading, selectedAddressId, onSelect }) => {
  // Guests do not have saved database addresses
  if (isGuest) return null;

  // Show a sleek loading state while pulling from DB
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-widest text-gray-400 mb-6">
        <Icon icon="lucide:loader-2" className="animate-spin" width="14" /> Fetching Address Book...
      </div>
    );
  }

  // Hide entirely if they have no saved addresses
  if (!addresses || addresses.length === 0) return null;

  return (
    <section>
      <h2 className="text-[0.65rem] font-bold tracking-[0.2em] uppercase text-gray-400 mb-6 flex items-center gap-2">
        <Icon icon="lucide:book-user" width="14" /> Saved Addresses
      </h2>
      
      {/* Sleek Horizontal Scroll Snap for Addresses */}
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar custom-scrollbar">
        {addresses.map((addr) => {
          const isSelected = selectedAddressId === addr._id;
          return (
            <button
              key={addr._id}
              onClick={() => onSelect(addr)}
              type="button"
              className={`snap-start flex-shrink-0 w-[280px] p-5 text-left rounded-xl transition-all duration-300 relative overflow-hidden group
                ${isSelected ? 'bg-white shadow-lg ring-1 ring-black' : 'bg-transparent border border-black/10 hover:border-black/30 hover:bg-white/50'}
              `}
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-[0.6rem] font-bold tracking-widest uppercase bg-gray-100 px-2 py-1 rounded-sm text-black">
                  {addr.type || 'Address'}
                </span>
                {isSelected && <Icon icon="lucide:check-circle-2" className="text-black" width="18" />}
              </div>
              <p className="font-medium text-sm text-black mb-1">{addr.firstName} {addr.lastName}</p>
              <p className="text-xs text-gray-500 leading-relaxed truncate">{addr.street}</p>
              <p className="text-xs text-gray-500 truncate">{addr.city}, {addr.state} {addr.pinCode}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default CheckoutAddresses;