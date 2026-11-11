import React, { useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { loginUser, clearError } from "../store/features/authSlice";

// --- Imports for Syncing Guest Data ---
import { syncGuestCartToDB } from "../store/features/cartSlice";
import { syncGuestWishlistToDB } from "../store/features/wishlistSlice";

const SignIn = () => {
  const containerRef = useRef(null);
  const iconRef = useRef(null); 
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error: reduxError } = useSelector((state) => state.auth);

  // React Hook Form initialization
  const { register, handleSubmit, formState: { errors } } = useForm();

  const [showPassword, setShowPassword] = useState(false);

  useGSAP(() => {
    gsap.fromTo(
      ".auth-anim",
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1, stagger: 0.1, ease: "power3.out", delay: 0.2 }
    );
  }, { scope: containerRef });

  // Clear Redux error on unmount or retry
  useEffect(() => {
    if (reduxError) {
      const timer = setTimeout(() => dispatch(clearError()), 5000);
      return () => clearTimeout(timer);
    }
  }, [reduxError, dispatch]);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
    
    gsap.fromTo(iconRef.current, 
      { rotationY: 0 }, 
      { rotationY: 180, duration: 0.4, ease: "power2.inOut", clearProps: "all" }
    );
  };

  // Extract the first form error to display
  const hookFormError = Object.values(errors)[0]?.message;
  const displayError = hookFormError || reduxError;

  // --- Sequential Login, Sync, and Redirect ---
  const onSubmitForm = async (data) => {
    try {
      // Wait for the login to succeed
      await dispatch(loginUser(data)).unwrap();
      
      // The exact moment they are authenticated, merge the guest cart and wishlist!
      await dispatch(syncGuestCartToDB()).unwrap();
      await dispatch(syncGuestWishlistToDB()).unwrap();
      
      // Redirect to the homepage (or '/cart')
      navigate("/");
    } catch (error) {
      console.error("Authentication or Sync sequence failed.", error);
    }
  };

  return (
    <main ref={containerRef} className="w-full min-h-screen bg-[#f8f8f8] text-[#1a1a1a] flex items-center justify-center pt-[100px] pb-20 px-6">
      <div className="w-full max-w-[400px] flex flex-col">
        
        <div className="mb-12 text-center">
          <h1 className="auth-anim head-font text-4xl lg:text-5xl tracking-wide mb-4">Sign In</h1>
          <p className="auth-anim text-sm font-light opacity-60 tracking-widest uppercase">
            Access your curated selection
          </p>
        </div>

        {/* Error Display */}
        {displayError && (
          <div className="auth-anim bg-red-50 text-red-600 text-xs text-center tracking-wide font-medium py-3 px-4 mb-6 border border-red-100">
            {displayError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmitForm)} className="flex flex-col gap-8 w-full">
          <div className="auth-anim relative flex flex-col">
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
            <div className="flex justify-between items-end mb-2">
              <label className="text-[0.6rem] font-bold tracking-[0.2em] uppercase opacity-50">Password</label>
              <Link to="/account/recover" className="text-[0.55rem] tracking-[0.1em] uppercase opacity-40 hover:opacity-100 transition-opacity">
                Forgot?
              </Link>
            </div>
            
            <div className="relative w-full">
              <input 
                type={showPassword ? "text" : "password"} 
                {...register("password", { 
                  required: "Password is required."
                })}
                className="w-full bg-transparent border-b border-black/20 py-3 pr-12 text-sm focus:outline-none focus:border-black transition-colors"
              />
              
              <button 
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 text-black opacity-40 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
              >
                <span ref={iconRef} className="flex items-center justify-center text-lg">
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
            {isLoading ? "Authenticating..." : "Sign In"}
          </button>
        </form>

        <div className="auth-anim mt-12 text-center border-t border-black/10 pt-8">
          <p className="text-[0.65rem] font-bold tracking-[0.1em] uppercase opacity-50 mb-4">
            Don't have an account?
          </p>
          <Link 
            to="/account/signup" 
            className="inline-block border-b border-black text-[0.65rem] font-bold tracking-[0.2em] uppercase pb-1 hover:opacity-60 transition-opacity"
          >
            Create Account
          </Link>
        </div>

      </div>
    </main>
  );
};

export default SignIn;