import React, { useState, useMemo, useEffect } from "react";
import { Country, State } from "country-state-city";
import { Icon } from "@iconify/react";
import CustomSelect from "./CustomSelect";

const AddressForm = ({ initialData, onSubmit, onCancel, isActionLoading, userEmail }) => {
  // Setup default state based on whether we are creating or editing
  const [formData, setFormData] = useState({
    firstName: initialData?.firstName || "",
    lastName: initialData?.lastName || "",
    email: initialData?.email || userEmail || "",
    phone: initialData?.phone || "",
    street: initialData?.street || "",
    city: initialData?.city || "",
    pinCode: initialData?.pinCode || "",
    country: initialData?.country || "India",
    countryCode: initialData?.countryCode || "IN",
    state: initialData?.state || "",
    stateCode: initialData?.stateCode || "",
    type: initialData?.type || "Home",
    isDefault: initialData?.isDefault || false,
  });

  // --- GEOGRAPHY ENGINE ---
  const countries = useMemo(() => Country.getAllCountries(), []);
  const states = useMemo(() => State.getStatesOfCountry(formData.countryCode), [formData.countryCode]);
  const countryOptions = useMemo(() => countries.map(c => ({ label: c.name, value: c.isoCode })), [countries]);
  const stateOptions = useMemo(() => states.map(s => ({ label: s.name, value: s.isoCode })), [states]);

  const handleCountryChange = (selectedCountryCode) => {
    const selectedCountry = countries.find(c => c.isoCode === selectedCountryCode);
    setFormData(prev => ({ ...prev, countryCode: selectedCountryCode, country: selectedCountry ? selectedCountry.name : '', stateCode: '', state: '' }));
  };

  const handleStateChange = (selectedStateCode) => {
    const selectedState = states.find(s => s.isoCode === selectedStateCode);
    setFormData(prev => ({ ...prev, stateCode: selectedStateCode, state: selectedState ? selectedState.name : '' }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const inputClass = "w-full bg-transparent border-b border-black/20 pb-2 text-sm focus:outline-none focus:border-black transition-colors placeholder:text-gray-400 font-medium text-black";
  const labelClass = "block text-[0.6rem] font-bold tracking-[0.15em] uppercase text-gray-400 mb-2";

  return (
    <div className="bg-white border border-black/5 rounded-2xl p-8 lg:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center mb-10">
        <h3 className="text-sm font-bold tracking-[0.15em] uppercase text-black">
          {initialData ? "Edit Address" : "Add New Address"}
        </h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-black transition-colors bg-gray-50 p-2 rounded-full">
          <Icon icon="lucide:x" width="16" />
        </button>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className={labelClass}>First Name</label>
            <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required className={inputClass} placeholder="John" />
          </div>
          <div>
            <label className={labelClass}>Last Name</label>
            <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required className={inputClass} placeholder="Doe" />
          </div>
          <div>
            <label className={labelClass}>Email Address</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required className={inputClass} placeholder="john@example.com" />
          </div>
          <div>
            <label className={labelClass}>Phone Number</label>
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className={inputClass} placeholder="+91" />
          </div>

          <div className="md:col-span-2 pt-4 border-t border-gray-100">
            <label className={labelClass}>Country / Region</label>
            <CustomSelect options={countryOptions} value={formData.countryCode} onChange={handleCountryChange} placeholder="Select a country" searchPlaceholder="Search countries..." />
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Street Address</label>
            <input type="text" name="street" value={formData.street} onChange={handleChange} required className={inputClass} placeholder="Apartment, suite, unit, etc." />
          </div>
          
          <div>
            <label className={labelClass}>City</label>
            <input type="text" name="city" value={formData.city} onChange={handleChange} required className={inputClass} placeholder="Mumbai" />
          </div>
          
          <div>
            <label className={labelClass}>State / Province</label>
            {states && states.length > 0 ? (
              <CustomSelect options={stateOptions} value={formData.stateCode} onChange={handleStateChange} placeholder="Select a state" searchPlaceholder="Search states..." />
            ) : (
              <input type="text" name="state" value={formData.state} onChange={handleChange} className={inputClass} placeholder="State/Province" disabled={!formData.countryCode} />
            )}
          </div>
          
          <div>
            <label className={labelClass}>Postal Code</label>
            <input type="text" name="pinCode" value={formData.pinCode} onChange={handleChange} required className={inputClass} placeholder="400001" />
          </div>
        </div>

        <div className="pt-8 border-t border-gray-100 space-y-6">
          <div>
            <label className={labelClass}>Address Type</label>
            <div className="flex gap-4">
              {['Home', 'Work', 'Other'].map(type => (
                <label key={type} className={`cursor-pointer px-5 py-2 border rounded-md text-[0.65rem] font-bold uppercase tracking-widest transition-all duration-300 ${formData.type === type ? 'border-black bg-black text-white shadow-md' : 'border-gray-200 text-gray-500 hover:border-black'}`}>
                  <input type="radio" name="type" value={type} checked={formData.type === type} onChange={handleChange} className="hidden" />
                  {type}
                </label>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer group w-fit">
            <div className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-colors ${formData.isDefault ? 'bg-black border-black text-white' : 'border-gray-300 group-hover:border-black'}`}>
              {formData.isDefault && <Icon icon="lucide:check" width="12" />}
            </div>
            <input type="checkbox" name="isDefault" checked={formData.isDefault} onChange={handleChange} className="hidden" />
            <span className="text-sm text-black font-medium select-none">Set as default shipping address</span>
          </label>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-6">
          <button 
            type="submit" 
            disabled={isActionLoading}
            className="bg-black text-white px-8 py-3.5 rounded-lg text-[0.65rem] font-bold tracking-[0.2em] uppercase hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isActionLoading && <Icon icon="lucide:loader-2" className="animate-spin" width="14" />}
            {initialData ? "Update Address" : "Save Address"}
          </button>
          <button 
            type="button" 
            onClick={onCancel} 
            disabled={isActionLoading}
            className="bg-transparent border border-black/20 rounded-lg text-black px-8 py-3.5 text-[0.65rem] font-bold tracking-[0.2em] uppercase hover:border-black transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddressForm;