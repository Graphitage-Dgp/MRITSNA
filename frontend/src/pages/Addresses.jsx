import React, { useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Icon } from "@iconify/react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import toast from "react-hot-toast";

import { logoutUser } from "../store/features/authSlice";
import { fetchAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress, clearAddressErrors } from "../store/features/addressSlice";

import AddressCard from "../components/addresses/AddressCard";
import AddressForm from "../components/addresses/AddressForm";

const Addresses = () => {
  const containerRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Redux States
  const { user, isLoading: authLoading } = useSelector((state) => state.auth);
  const { addresses, loading: dataLoading, actionLoading, error, actionError } = useSelector((state) => state.addresses);

  // Local Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  // --- MINIMALIST BRAND THEME ---
  const brandDark = "#171410";
  const brandLight = "#f8f8f8";

  const toastStyle = { 
    background: brandDark, 
    color: brandLight, 
    fontSize: '12px', 
    borderRadius: '2px', // Sharper edges
    letterSpacing: '0.05em'
  };

  // --- INITIALIZATION ---
  useEffect(() => {
    dispatch(fetchAddresses());
    return () => dispatch(clearAddressErrors());
  }, [dispatch]);

  // --- SYSTEM ERROR NOTIFICATIONS ---
  useEffect(() => {
    const activeError = error || actionError;
    if (activeError) {
      toast.error(activeError, { style: toastStyle });
      dispatch(clearAddressErrors());
    }
  }, [error, actionError, dispatch]);

  // --- ANIMATIONS ---
  gsap.registerPlugin(useGSAP);
  useGSAP(() => {
    gsap.fromTo(".dash-anim", 
      { opacity: 0, y: 20 }, 
      { opacity: 1, y: 0, duration: 0.8, stagger: 0.05, ease: "power2.out", delay: 0.1 }
    );
  }, { scope: containerRef, dependencies: [isFormOpen] });

  // --- HANDLERS ---
  const handleLogout = async () => {
    const resultAction = await dispatch(logoutUser());
    if (logoutUser.fulfilled.match(resultAction)) navigate("/account/signin");
  };

  const handleOpenForm = (address = null) => {
    setEditingAddress(address);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setEditingAddress(null);
    setIsFormOpen(false);
  };

  const handleSubmitForm = async (formData) => {
    const loadingId = toast.loading(editingAddress ? "Updating..." : "Saving...", { style: toastStyle });
    let result;
    
    if (editingAddress) {
      result = await dispatch(updateAddress({ id: editingAddress._id, data: formData }));
    } else {
      result = await dispatch(createAddress(formData));
    }
    
    if (result.meta.requestStatus === 'fulfilled') {
      handleCloseForm();
      toast.success(editingAddress ? "Address updated" : "Address saved", { id: loadingId, style: toastStyle });
    } else {
      toast.dismiss(loadingId); 
    }
  };

  // --- FIX: SAFE & MINIMALIST DELETE CONFIRMATION ---
  const handleDelete = (addressId) => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-[#171410]">Remove this address?</p>
        <div className="flex gap-2 mt-1">
          <button
            onClick={() => {
              // 1. Dismiss the toast cleanly first to prevent animation collisions
              toast.dismiss(t.id);
              
              // 2. Dispatch silently, THEN trigger the success toast upon resolution
              dispatch(deleteAddress(addressId)).then((res) => {
                if (res.meta.requestStatus === 'fulfilled') {
                  toast.success("Address removed", { style: toastStyle });
                }
              });
            }}
            className="bg-[#171410] text-[#f8f8f8] py-2 px-4 text-xs font-bold uppercase tracking-widest hover:opacity-80 transition-opacity"
          >
            Confirm
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="bg-transparent border border-[#171410]/20 text-[#171410] py-2 px-4 text-xs font-bold uppercase tracking-widest hover:border-[#171410] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    ), {
      id: `delete-${addressId}`,
      duration: Infinity, 
      style: {
        background: brandLight,
        color: brandDark,
        border: `1px solid ${brandDark}20`, // 20% opacity hex
        padding: '16px',
        borderRadius: '2px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
      }
    });
  };

  const handleSetDefault = async (addressId) => {
    const loadingId = toast.loading("Updating...", { style: toastStyle });
    const result = await dispatch(setDefaultAddress(addressId));
    if (result.meta.requestStatus === 'fulfilled') {
      toast.success("Default address set", { id: loadingId, style: toastStyle });
    } else {
      toast.dismiss(loadingId);
    }
  };

  if (!user) return null;

  return (
    <main ref={containerRef} className="w-full min-h-screen bg-[#f8f8f8] text-[#171410] pt-[120px] lg:pt-[160px] pb-20 px-6 lg:px-12">
      <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row gap-16 lg:gap-24">
        
        {/* --- SIDEBAR NAVIGATION --- */}
        <aside className="w-full lg:w-[250px] shrink-0 lg:sticky lg:top-[120px] h-fit">
          <h1 className="dash-anim head-font text-3xl mb-10">My Account</h1>
          <nav className="flex flex-col gap-6">
            <Link to="/account" className="dash-anim text-[0.65rem] font-bold tracking-[0.2em] uppercase opacity-50 hover:opacity-100 flex items-center gap-4 group transition-opacity">
              <span className="w-2 h-[1px] bg-[#171410] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" /> Overview
            </Link>
            <Link to="/account/orders" className="dash-anim text-[0.65rem] font-bold tracking-[0.2em] uppercase opacity-50 hover:opacity-100 flex items-center gap-4 group transition-opacity">
              <span className="w-2 h-[1px] bg-[#171410] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" /> Order History
            </Link>
            <Link to="/account/addresses" className="dash-anim text-[0.65rem] font-bold tracking-[0.2em] uppercase text-[#171410] flex items-center gap-4 group">
              <span className="w-2 h-[1px] bg-[#171410] scale-x-100 origin-left transition-transform duration-300" /> Address Book
            </Link>
            <button onClick={handleLogout} disabled={authLoading} className="dash-anim text-[0.65rem] font-bold tracking-[0.2em] uppercase opacity-50 hover:opacity-100 transition-opacity flex items-center gap-4 group mt-8 text-left disabled:opacity-30">
              <span className="w-2 h-[1px] bg-[#171410] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />
              {authLoading ? "Logging Out..." : "Log Out"}
            </button>
          </nav>
        </aside>

        {/* --- MAIN CONTENT AREA --- */}
        <section className="flex-1 flex flex-col gap-8">
          
          <div className="dash-anim flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#171410]/10 pb-6">
            <div>
              <h2 className="text-2xl head-font capitalize tracking-wide">Address Book</h2>
              <p className="text-[0.65rem] font-bold tracking-[0.2em] uppercase opacity-50 mt-2">Manage your shipping details</p>
            </div>
            {!isFormOpen && (
              <button onClick={() => handleOpenForm(null)} className="bg-[#171410] text-[#f8f8f8] px-6 py-3 rounded-none text-[0.65rem] font-bold tracking-[0.2em] uppercase hover:opacity-80 transition-all duration-300 flex items-center gap-2">
                <Icon icon="lucide:plus" width="14" /> Add New Address
              </button>
            )}
          </div>

          <div className="dash-anim">
            {dataLoading ? (
              <div className="w-full flex items-center justify-center py-32"><Icon icon="lucide:loader-2" className="animate-spin text-[#171410]/40" width="24" /></div>
            ) : isFormOpen ? (
              
              <AddressForm 
                initialData={editingAddress} 
                onSubmit={handleSubmitForm} 
                onCancel={handleCloseForm} 
                isActionLoading={actionLoading}
                userEmail={user.email}
              />

            ) : addresses.length > 0 ? (
              
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {addresses.map((address) => (
                  <AddressCard 
                    key={address._id}
                    address={address}
                    onEdit={handleOpenForm}
                    onDelete={handleDelete}
                    onSetDefault={handleSetDefault}
                    isActionLoading={actionLoading}
                  />
                ))}
              </div>

            ) : (
              
              <div className="w-full flex flex-col items-center justify-center py-32 bg-white border border-[#171410]/5 rounded-none text-center px-6">
                <Icon icon="lucide:map" className="text-[#171410]/20 mb-4" width="48" />
                <p className="text-xl head-font mb-2">No addresses saved</p>
                <p className="text-sm text-[#171410]/60 mb-8 max-w-md">Save your home or work addresses here to enjoy a faster, frictionless checkout experience.</p>
                <button onClick={() => handleOpenForm(null)} className="text-[0.65rem] font-bold tracking-widest uppercase bg-[#171410] text-[#f8f8f8] px-8 py-3.5 hover:opacity-80 transition-colors">
                  Add Your First Address
                </button>
              </div>
              
            )}
          </div>
        </section>

      </div>
    </main>
  );
};

export default Addresses;