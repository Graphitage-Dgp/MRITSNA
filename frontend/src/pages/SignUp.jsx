import React, { useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { registerUser, clearError } from "../store/features/authSlice";

// list of global dial codes
const countryData = [
  { co: "af", name: "Afghanistan", code: "+93" },
  { co: "al", name: "Albania", code: "+355" },
  { co: "dz", name: "Algeria", code: "+213" },
  { co: "as", name: "American Samoa", code: "+1-684" },
  { co: "ad", name: "Andorra", code: "+376" },
  { co: "ao", name: "Angola", code: "+244" },
  { co: "ai", name: "Anguilla", code: "+1-264" },
  { co: "ag", name: "Antigua and Barbuda", code: "+1-268" },
  { co: "ar", name: "Argentina", code: "+54" },
  { co: "am", name: "Armenia", code: "+374" },
  { co: "aw", name: "Aruba", code: "+297" },
  { co: "au", name: "Australia", code: "+61" },
  { co: "at", name: "Austria", code: "+43" },
  { co: "az", name: "Azerbaijan", code: "+994" },
  { co: "bs", name: "Bahamas", code: "+1-242" },
  { co: "bh", name: "Bahrain", code: "+973" },
  { co: "bd", name: "Bangladesh", code: "+880" },
  { co: "bb", name: "Barbados", code: "+1-246" },
  { co: "by", name: "Belarus", code: "+375" },
  { co: "be", name: "Belgium", code: "+32" },
  { co: "bz", name: "Belize", code: "+501" },
  { co: "bj", name: "Benin", code: "+229" },
  { co: "bm", name: "Bermuda", code: "+1-441" },
  { co: "bt", name: "Bhutan", code: "+975" },
  { co: "bo", name: "Bolivia", code: "+591" },
  { co: "ba", name: "Bosnia and Herzegovina", code: "+387" },
  { co: "bw", name: "Botswana", code: "+267" },
  { co: "br", name: "Brazil", code: "+55" },
  { co: "io", name: "British Indian Ocean Territory", code: "+246" },
  { co: "vg", name: "British Virgin Islands", code: "+1-284" },
  { co: "bn", name: "Brunei", code: "+673" },
  { co: "bg", name: "Bulgaria", code: "+359" },
  { co: "bf", name: "Burkina Faso", code: "+226" },
  { co: "bi", name: "Burundi", code: "+257" },
  { co: "kh", name: "Cambodia", code: "+855" },
  { co: "cm", name: "Cameroon", code: "+237" },
  { co: "ca", name: "Canada", code: "+1" },
  { co: "cv", name: "Cape Verde", code: "+238" },
  { co: "ky", name: "Cayman Islands", code: "+1-345" },
  { co: "cf", name: "Central African Republic", code: "+236" },
  { co: "td", name: "Chad", code: "+235" },
  { co: "cl", name: "Chile", code: "+56" },
  { co: "cn", name: "China", code: "+86" },
  { co: "cx", name: "Christmas Island", code: "+61" },
  { co: "cc", name: "Cocos Islands", code: "+61" },
  { co: "co", name: "Colombia", code: "+57" },
  { co: "km", name: "Comoros", code: "+269" },
  { co: "ck", name: "Cook Islands", code: "+682" },
  { co: "cr", name: "Costa Rica", code: "+506" },
  { co: "hr", name: "Croatia", code: "+385" },
  { co: "cu", name: "Cuba", code: "+53" },
  { co: "cw", name: "Curacao", code: "+599" },
  { co: "cy", name: "Cyprus", code: "+357" },
  { co: "cz", name: "Czech Republic", code: "+420" },
  { co: "cd", name: "Democratic Republic of the Congo", code: "+243" },
  { co: "dk", name: "Denmark", code: "+45" },
  { co: "dj", name: "Djibouti", code: "+253" },
  { co: "dm", name: "Dominica", code: "+1-767" },
  { co: "do", name: "Dominican Republic", code: "+1-809" },
  { co: "tl", name: "East Timor", code: "+670" },
  { co: "ec", name: "Ecuador", code: "+593" },
  { co: "eg", name: "Egypt", code: "+20" },
  { co: "sv", name: "El Salvador", code: "+503" },
  { co: "gq", name: "Equatorial Guinea", code: "+240" },
  { co: "er", name: "Eritrea", code: "+291" },
  { co: "ee", name: "Estonia", code: "+372" },
  { co: "et", name: "Ethiopia", code: "+251" },
  { co: "fk", name: "Falkland Islands", code: "+500" },
  { co: "fo", name: "Faroe Islands", code: "+298" },
  { co: "fj", name: "Fiji", code: "+679" },
  { co: "fi", name: "Finland", code: "+358" },
  { co: "fr", name: "France", code: "+33" },
  { co: "pf", name: "French Polynesia", code: "+689" },
  { co: "ga", name: "Gabon", code: "+241" },
  { co: "gm", name: "Gambia", code: "+220" },
  { co: "ge", name: "Georgia", code: "+995" },
  { co: "de", name: "Germany", code: "+49" },
  { co: "gh", name: "Ghana", code: "+233" },
  { co: "gi", name: "Gibraltar", code: "+350" },
  { co: "gr", name: "Greece", code: "+30" },
  { co: "gl", name: "Greenland", code: "+299" },
  { co: "gd", name: "Grenada", code: "+1-473" },
  { co: "gu", name: "Guam", code: "+1-671" },
  { co: "gt", name: "Guatemala", code: "+502" },
  { co: "gg", name: "Guernsey", code: "+44-1481" },
  { co: "gn", name: "Guinea", code: "+224" },
  { co: "gw", name: "Guinea-Bissau", code: "+245" },
  { co: "gy", name: "Guyana", code: "+592" },
  { co: "ht", name: "Haiti", code: "+509" },
  { co: "hn", name: "Honduras", code: "+504" },
  { co: "hk", name: "Hong Kong", code: "+852" },
  { co: "hu", name: "Hungary", code: "+36" },
  { co: "is", name: "Iceland", code: "+354" },
  { co: "in", name: "India", code: "+91" },
  { co: "id", name: "Indonesia", code: "+62" },
  { co: "ir", name: "Iran", code: "+98" },
  { co: "iq", name: "Iraq", code: "+964" },
  { co: "ie", name: "Ireland", code: "+353" },
  { co: "im", name: "Isle of Man", code: "+44-1624" },
  { co: "il", name: "Israel", code: "+972" },
  { co: "it", name: "Italy", code: "+39" },
  { co: "ci", name: "Ivory Coast", code: "+225" },
  { co: "jm", name: "Jamaica", code: "+1-876" },
  { co: "jp", name: "Japan", code: "+81" },
  { co: "je", name: "Jersey", code: "+44-1534" },
  { co: "jo", name: "Jordan", code: "+962" },
  { co: "kz", name: "Kazakhstan", code: "+7" },
  { co: "ke", name: "Kenya", code: "+254" },
  { co: "ki", name: "Kiribati", code: "+686" },
  { co: "xk", name: "Kosovo", code: "+383" },
  { co: "kw", name: "Kuwait", code: "+965" },
  { co: "kg", name: "Kyrgyzstan", code: "+996" },
  { co: "la", name: "Laos", code: "+856" },
  { co: "lv", name: "Latvia", code: "+371" },
  { co: "lb", name: "Lebanon", code: "+961" },
  { co: "ls", name: "Lesotho", code: "+266" },
  { co: "lr", name: "Liberia", code: "+231" },
  { co: "ly", name: "Libya", code: "+218" },
  { co: "li", name: "Liechtenstein", code: "+423" },
  { co: "lt", name: "Lithuania", code: "+370" },
  { co: "lu", name: "Luxembourg", code: "+352" },
  { co: "mo", name: "Macau", code: "+853" },
  { co: "mk", name: "Macedonia", code: "+389" },
  { co: "mg", name: "Madagascar", code: "+261" },
  { co: "mw", name: "Malawi", code: "+265" },
  { co: "my", name: "Malaysia", code: "+60" },
  { co: "mv", name: "Maldives", code: "+960" },
  { co: "ml", name: "Mali", code: "+223" },
  { co: "mt", name: "Malta", code: "+356" },
  { co: "mh", name: "Marshall Islands", code: "+692" },
  { co: "mr", name: "Mauritania", code: "+222" },
  { co: "mu", name: "Mauritius", code: "+230" },
  { co: "yt", name: "Mayotte", code: "+262" },
  { co: "mx", name: "Mexico", code: "+52" },
  { co: "fm", name: "Micronesia", code: "+691" },
  { co: "md", name: "Moldova", code: "+373" },
  { co: "mc", name: "Monaco", code: "+377" },
  { co: "mn", name: "Mongolia", code: "+976" },
  { co: "me", name: "Montenegro", code: "+382" },
  { co: "ms", name: "Montserrat", code: "+1-664" },
  { co: "ma", name: "Morocco", code: "+212" },
  { co: "mz", name: "Mozambique", code: "+258" },
  { co: "mm", name: "Myanmar", code: "+95" },
  { co: "na", name: "Namibia", code: "+264" },
  { co: "nr", name: "Nauru", code: "+674" },
  { co: "np", name: "Nepal", code: "+977" },
  { co: "nl", name: "Netherlands", code: "+31" },
  { co: "nc", name: "New Caledonia", code: "+687" },
  { co: "nz", name: "New Zealand", code: "+64" },
  { co: "ni", name: "Nicaragua", code: "+505" },
  { co: "ne", name: "Niger", code: "+227" },
  { co: "ng", name: "Nigeria", code: "+234" },
  { co: "nu", name: "Niue", code: "+683" },
  { co: "kp", name: "North Korea", code: "+850" },
  { co: "mp", name: "Northern Mariana Islands", code: "+1-670" },
  { co: "no", name: "Norway", code: "+47" },
  { co: "om", name: "Oman", code: "+968" },
  { co: "pk", name: "Pakistan", code: "+92" },
  { co: "pw", name: "Palau", code: "+680" },
  { co: "ps", name: "Palestine", code: "+970" },
  { co: "pa", name: "Panama", code: "+507" },
  { co: "pg", name: "Papua New Guinea", code: "+675" },
  { co: "py", name: "Paraguay", code: "+595" },
  { co: "pe", name: "Peru", code: "+51" },
  { co: "ph", name: "Philippines", code: "+63" },
  { co: "pn", name: "Pitcairn", code: "+870" },
  { co: "pl", name: "Poland", code: "+48" },
  { co: "pt", name: "Portugal", code: "+351" },
  { co: "pr", name: "Puerto Rico", code: "+1-787" },
  { co: "qa", name: "Qatar", code: "+974" },
  { co: "cg", name: "Republic of the Congo", code: "+242" },
  { co: "re", name: "Reunion", code: "+262" },
  { co: "ro", name: "Romania", code: "+40" },
  { co: "ru", name: "Russia", code: "+7" },
  { co: "rw", name: "Rwanda", code: "+250" },
  { co: "bl", name: "Saint Barthelemy", code: "+590" },
  { co: "sh", name: "Saint Helena", code: "+290" },
  { co: "kn", name: "Saint Kitts and Nevis", code: "+1-869" },
  { co: "lc", name: "Saint Lucia", code: "+1-758" },
  { co: "mf", name: "Saint Martin", code: "+590" },
  { co: "pm", name: "Saint Pierre and Miquelon", code: "+508" },
  { co: "vc", name: "Saint Vincent and the Grenadines", code: "+1-784" },
  { co: "ws", name: "Samoa", code: "+685" },
  { co: "sm", name: "San Marino", code: "+378" },
  { co: "st", name: "Sao Tome and Principe", code: "+239" },
  { co: "sa", name: "Saudi Arabia", code: "+966" },
  { co: "sn", name: "Senegal", code: "+221" },
  { co: "rs", name: "Serbia", code: "+381" },
  { co: "sc", name: "Seychelles", code: "+248" },
  { co: "sl", name: "Sierra Leone", code: "+232" },
  { co: "sg", name: "Singapore", code: "+65" },
  { co: "sx", name: "Sint Maarten", code: "+1-721" },
  { co: "sk", name: "Slovakia", code: "+421" },
  { co: "si", name: "Slovenia", code: "+386" },
  { co: "sb", name: "Solomon Islands", code: "+677" },
  { co: "so", name: "Somalia", code: "+252" },
  { co: "za", name: "South Africa", code: "+27" },
  { co: "kr", name: "South Korea", code: "+82" },
  { co: "ss", name: "South Sudan", code: "+211" },
  { co: "es", name: "Spain", code: "+34" },
  { co: "lk", name: "Sri Lanka", code: "+94" },
  { co: "sd", name: "Sudan", code: "+249" },
  { co: "sr", name: "Suriname", code: "+597" },
  { co: "sj", name: "Svalbard and Jan Mayen", code: "+47" },
  { co: "sz", name: "Swaziland", code: "+268" },
  { co: "se", name: "Sweden", code: "+46" },
  { co: "ch", name: "Switzerland", code: "+41" },
  { co: "sy", name: "Syria", code: "+963" },
  { co: "tw", name: "Taiwan", code: "+886" },
  { co: "tj", name: "Tajikistan", code: "+992" },
  { co: "tz", name: "Tanzania", code: "+255" },
  { co: "th", name: "Thailand", code: "+66" },
  { co: "tg", name: "Togo", code: "+228" },
  { co: "tk", name: "Tokelau", code: "+690" },
  { co: "to", name: "Tonga", code: "+676" },
  { co: "tt", name: "Trinidad and Tobago", code: "+1-868" },
  { co: "tn", name: "Tunisia", code: "+216" },
  { co: "tr", name: "Turkey", code: "+90" },
  { co: "tm", name: "Turkmenistan", code: "+993" },
  { co: "tc", name: "Turks and Caicos Islands", code: "+1-649" },
  { co: "tv", name: "Tuvalu", code: "+688" },
  { co: "vi", name: "U.S. Virgin Islands", code: "+1-340" },
  { co: "ug", name: "Uganda", code: "+256" },
  { co: "ua", name: "Ukraine", code: "+380" },
  { co: "ae", name: "United Arab Emirates", code: "+971" },
  { co: "gb", name: "United Kingdom", code: "+44" },
  { co: "us", name: "United States", code: "+1" },
  { co: "uy", name: "Uruguay", code: "+598" },
  { co: "uz", name: "Uzbekistan", code: "+998" },
  { co: "vu", name: "Vanuatu", code: "+678" },
  { co: "va", name: "Vatican", code: "+379" },
  { co: "ve", name: "Venezuela", code: "+58" },
  { co: "vn", name: "Vietnam", code: "+84" },
  { co: "wf", name: "Wallis and Futuna", code: "+681" },
  { co: "eh", name: "Western Sahara", code: "+212" },
  { co: "ye", name: "Yemen", code: "+967" },
  { co: "zm", name: "Zambia", code: "+260" },
  { co: "zw", name: "Zimbabwe", code: "+263" }
].sort((a, b) => a.name.localeCompare(b.name));

const SignUp = () => {
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);
  const eyeIconRef = useRef(null);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error: reduxError } = useSelector((state) => state.auth);

  // React Hook Form initialization
  const { register, handleSubmit, formState: { errors }, clearErrors } = useForm();

  const [showPassword, setShowPassword] = useState(false);
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  
  const defaultCountry = countryData.find(c => c.co === "in") || countryData[0];
  const [selectedCountry, setSelectedCountry] = useState(defaultCountry);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCountries = countryData.filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.code.includes(searchTerm)
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsCountryOpen(false);
        setSearchTerm(""); 
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Clear Redux error on unmount or retry
  useEffect(() => {
    if (reduxError) {
      const timer = setTimeout(() => dispatch(clearError()), 5000);
      return () => clearTimeout(timer);
    }
  }, [reduxError, dispatch]);

  useGSAP(() => {
    gsap.fromTo(
      ".auth-anim",
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1, stagger: 0.1, ease: "power3.out", delay: 0.2 }
    );
  }, { scope: containerRef });

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
    gsap.fromTo(eyeIconRef.current, 
      { rotationY: 0 }, 
      { rotationY: 180, duration: 0.4, ease: "power2.inOut", clearProps: "all" }
    );
  };

  // Extract the first form error to display
  const hookFormError = Object.values(errors)[0]?.message;
  const displayError = hookFormError || reduxError;

  const onSubmitForm = async (data) => {
    // Append the selected country code to the payload
    const payload = {
      firstName: data.firstName,
      lastName: data.lastName,
      phoneCode: selectedCountry.code,
      phoneNumber: data.phoneNumber,
      email: data.email,
      password: data.password
    };

    const resultAction = await dispatch(registerUser(payload));
  };

  return (
    <main ref={containerRef} className="w-full min-h-screen bg-[#f8f8f8] text-[#1a1a1a] flex items-center justify-center pt-[100px] pb-20 px-6">
      <div className="w-full max-w-[450px] flex flex-col">
        
        <div className="mb-12 text-center">
          <h1 className="auth-anim head-font text-4xl lg:text-5xl tracking-wide mb-4">Create Account</h1>
          <p className="auth-anim text-sm font-light opacity-60 tracking-widest uppercase">
            Join our private collection
          </p>
        </div>

        {/* Error Display */}
        {displayError && (
          <div className="auth-anim bg-red-50 text-red-600 text-xs text-center tracking-wide font-medium py-3 px-4 mb-6 border border-red-100">
            {displayError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmitForm)} className="flex flex-col gap-8 w-full">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-6">
            <div className="auth-anim relative flex flex-col">
              <label className="text-[0.6rem] font-bold tracking-[0.2em] uppercase opacity-50 mb-2">First Name</label>
              <input 
                type="text" 
                {...register("firstName", { 
                  required: "First name is required.",
                  minLength: { value: 2, message: "First name must be at least 2 characters." }
                })}
                className="w-full bg-transparent border-b border-black/20 py-3 text-sm focus:outline-none focus:border-black transition-colors" 
              />
            </div>
            <div className="auth-anim relative flex flex-col">
              <label className="text-[0.6rem] font-bold tracking-[0.2em] uppercase opacity-50 mb-2">Last Name</label>
              <input 
                type="text" 
                {...register("lastName", { 
                  required: "Last name is required.",
                  minLength: { value: 2, message: "Last name must be at least 2 characters." }
                })}
                className="w-full bg-transparent border-b border-black/20 py-3 text-sm focus:outline-none focus:border-black transition-colors" 
              />
            </div>
          </div>

          <div className="auth-anim relative flex flex-col z-20">
            <label className="text-[0.6rem] font-bold tracking-[0.2em] uppercase opacity-50 mb-2">Contact Number</label>
            
            <div className="flex border-b border-black/20 focus-within:border-black transition-colors relative">
              <div className="relative" ref={dropdownRef}>
                <button 
                  type="button"
                  onClick={() => setIsCountryOpen(!isCountryOpen)}
                  className="flex items-center gap-2 py-3 pr-4 border-r border-black/10 hover:opacity-70 transition-opacity"
                >
                  <span className="text-xl flex items-center justify-center">
                    <Icon icon={`flagpack:${selectedCountry.co}`} />
                  </span>
                  <span className="text-sm font-medium">{selectedCountry.code}</span>
                  <Icon icon="ph:caret-down-light" className={`text-xs transition-transform duration-300 ${isCountryOpen ? "rotate-180" : ""}`} />
                </button>

                <div className={`absolute top-full left-0 mt-2 w-[280px] bg-white border border-black/5 shadow-xl flex flex-col py-2 transition-all duration-300 origin-top-left z-50
                  ${isCountryOpen ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"}
                `}>
                  <div className="px-4 py-2 border-b border-black/5 mb-2 relative">
                    <Icon icon="ph:magnifying-glass-light" className="absolute left-6 top-1/2 -translate-y-1/2 text-black/40" />
                    <input 
                      type="text" 
                      placeholder="Search country..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-[#eeeeee] rounded-sm py-2 pl-9 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-black/20"
                    />
                  </div>
                  
                  <div 
                    className="max-h-[300px] overflow-y-auto overscroll-contain no-scrollbar flex flex-col"
                    data-lenis-prevent="true"
                  >
                    {filteredCountries.length === 0 && (
                      <p className="text-xs text-center py-6 opacity-50 font-light">No results found.</p>
                    )}
                    {filteredCountries.map((country) => (
                      <button
                        key={country.co}
                        type="button"
                        onClick={() => {
                          setSelectedCountry(country);
                          setIsCountryOpen(false);
                          setSearchTerm("");
                          clearErrors("phoneNumber"); // clear number errors if they change country
                        }}
                        className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-black/5 transition-colors text-left"
                      >
                        <span className="text-xl flex items-center justify-center">
                          <Icon icon={`flagpack:${country.co}`} />
                        </span>
                        <span className="font-medium w-12 shrink-0">{country.code}</span>
                        <span className="font-light opacity-70 truncate">{country.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <input 
                type="tel" 
                {...register("phoneNumber", { 
                  required: "Contact number is required.",
                  pattern: { value: /^\d{6,15}$/, message: "Provide a valid contact number (digits only)." }
                })}
                className="flex-1 bg-transparent py-3 pl-4 text-sm focus:outline-none" 
              />
            </div>
          </div>

          <div className="auth-anim relative flex flex-col z-10">
            <label className="text-[0.6rem] font-bold tracking-[0.2em] uppercase opacity-50 mb-2">Email Address</label>
            <input 
              type="email" 
              {...register("email", { 
                required: "Email is required.",
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Provide a valid email address." }
              })}
              className="w-full bg-transparent border-b border-black/20 py-3 text-sm focus:outline-none focus:border-black transition-colors" 
            />
          </div>

          <div className="auth-anim relative flex flex-col">
            <label className="text-[0.6rem] font-bold tracking-[0.2em] uppercase opacity-50 mb-2">Password</label>
            <div className="relative w-full">
              <input 
                type={showPassword ? "text" : "password"} 
                {...register("password", { 
                  required: "Password is required.",
                  pattern: { value: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/, message: "Password must be at least 8 chars, containing 1 letter and 1 number." }
                })}
                className="w-full bg-transparent border-b border-black/20 py-3 pr-12 text-sm focus:outline-none focus:border-black transition-colors"
              />
              
              <button 
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 text-black opacity-40 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
              >
                <span ref={eyeIconRef} className="flex items-center justify-center text-lg">
                  <Icon icon={showPassword ? "ph:eye-slash-light" : "ph:eye-light"} />
                </span>
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className={`auth-anim mt-4 w-full text-white py-4 text-[0.65rem] font-bold tracking-[0.2em] uppercase transition-colors
              ${isLoading ? 'bg-black/60 cursor-not-allowed' : 'bg-[#1a1a1a] hover:bg-black/80'}`}
          >
            {isLoading ? "Processing..." : "Register"}
          </button>
        </form>

        <div className="auth-anim mt-12 text-center border-t border-black/10 pt-8">
          <p className="text-[0.65rem] font-bold tracking-[0.1em] uppercase opacity-50 mb-4">
            Already have an account?
          </p>
          <Link to="/account/signin" className="inline-block border-b border-black text-[0.65rem] font-bold tracking-[0.2em] uppercase pb-1 hover:opacity-60 transition-opacity">
            Sign In
          </Link>
        </div>

      </div>
    </main>
  );
};

export default SignUp;