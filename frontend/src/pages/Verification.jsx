import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useDispatch, useSelector } from "react-redux";
import { verifyOtp, sendVerificationOtp, changeEmail, clearError } from "../store/features/authSlice";

// --- Imports for Syncing Guest Data ---
import { syncGuestCartToDB } from "../store/features/cartSlice";
import { syncGuestWishlistToDB } from "../store/features/wishlistSlice";

const Verification = () => {
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Pull global state
  const { user, isLoading, error: reduxError } = useSelector((state) => state.auth);
  
  // ==========================================
  // STATES
  // ==========================================
  // OTP State
  const [code, setCode] = useState(new Array(6).fill(""));
  const inputRefs = useRef([]);
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Email Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState("");

  // ==========================================
  // ANIMATIONS & TIMERS
  // ==========================================
  useGSAP(() => {
    gsap.fromTo(
      ".auth-anim",
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1, stagger: 0.1, ease: "power3.out", delay: 0.2 }
    );
  }, { scope: containerRef });

  useEffect(() => {
    if (timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  // Clear Redux error after 5 seconds to keep UI clean
  useEffect(() => {
    if (reduxError) {
      const timer = setTimeout(() => dispatch(clearError()), 5000);
      return () => clearTimeout(timer);
    }
  }, [reduxError, dispatch]);

  // ==========================================
  // OTP LOGIC
  // ==========================================
  const handleChange = (element, index) => {
    if (isNaN(element.value)) return;
    if (reduxError) dispatch(clearError()); // Clear errors on typing

    const newCode = [...code];
    newCode[index] = element.value;
    setCode(newCode);

    // Auto-advance
    if (element.value !== "" && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    // Auto-revert on backspace
    if (e.key === "Backspace") {
      if (code[index] === "" && index > 0) {
        inputRefs.current[index - 1].focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6).split("");
    if (pastedData.some(char => isNaN(char))) return;

    const newCode = [...code];
    pastedData.forEach((char, i) => {
      newCode[i] = char;
      if (inputRefs.current[i]) {
        inputRefs.current[i].value = char;
      }
    });
    setCode(newCode);
    
    const focusIndex = pastedData.length < 6 ? pastedData.length : 5;
    inputRefs.current[focusIndex]?.focus();
  };

  // ==========================================
  // SUBMIT & UPDATE LOGIC
  // ==========================================
  const handleResend = async () => {
    dispatch(clearError());
    const resultAction = await dispatch(sendVerificationOtp());
    
    if (sendVerificationOtp.fulfilled.match(resultAction)) {
      setTimeLeft(60);
      setCanResend(false);
    }
  };

  // --- Sequential Verification, Sync, and Redirect ---
  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    const verificationCode = code.join("");
    
    if (verificationCode.length === 6) {
      try {
        // 1. Wait for OTP Verification to completely succeed
        await dispatch(verifyOtp(verificationCode)).unwrap();
        
        // 2. The exact moment they are fully verified and authenticated, merge the cart and wishlist!
        await dispatch(syncGuestCartToDB()).unwrap();
        await dispatch(syncGuestWishlistToDB()).unwrap();
        
        // 3. Navigate safely to the homepage
        navigate("/"); 
      } catch (error) {
        console.error("Verification or Sync sequence failed.", error);
      }
    }
  };

  const handleNewEmailSubmit = async (e) => {
    e.preventDefault();
    if (!newEmailInput || newEmailInput === user?.email) return;

    const resultAction = await dispatch(changeEmail(newEmailInput));
    
    if (changeEmail.fulfilled.match(resultAction)) {
      // Reset the verification environment
      setCode(new Array(6).fill(""));
      setTimeLeft(60);
      setCanResend(false);
      setNewEmailInput("");
      setIsModalOpen(false);
      
      // Auto-focus the first OTP input
      if (inputRefs.current[0]) inputRefs.current[0].focus();
    }
  };

  // Format timer as 0:00
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <>
      <main ref={containerRef} className="w-full min-h-screen bg-[#f8f8f8] text-[#1a1a1a] flex items-center justify-center pt-[100px] pb-20 px-6 relative">
        <div className="w-full max-w-[400px] flex flex-col">
          
          <div className="mb-12 text-center">
            <h1 className="auth-anim head-font text-4xl lg:text-5xl tracking-wide mb-4">Verify</h1>
            <p className="auth-anim text-sm font-light opacity-60 tracking-widest uppercase leading-relaxed">
              Enter the 6-digit code sent to<br />
              <span className="font-bold opacity-100 text-[#1a1a1a] tracking-normal lowercase">
                {user?.email || "your email address"}
              </span>
            </p>
          </div>

          {/* Error Display for Main Verification */}
          {reduxError && !isModalOpen && (
            <div className="auth-anim bg-red-50 text-red-600 text-xs text-center tracking-wide font-medium py-3 px-4 mb-6 border border-red-100">
              {reduxError}
            </div>
          )}

          <form onSubmit={handleVerificationSubmit} className="flex flex-col gap-10 w-full">
            
            <div className="auth-anim flex justify-between gap-2 sm:gap-4" onPaste={handlePaste}>
              {code.map((data, index) => (
                <input
                  key={index}
                  type="text"
                  name="otp"
                  maxLength="1"
                  ref={(el) => (inputRefs.current[index] = el)}
                  value={data}
                  onChange={(e) => handleChange(e.target, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className="w-12 h-14 sm:w-14 sm:h-16 bg-transparent border-b border-black/20 text-center text-2xl font-light focus:outline-none focus:border-black transition-colors"
                  autoComplete="off"
                />
              ))}
            </div>

            <button 
              type="submit" 
              disabled={code.join("").length !== 6 || isLoading}
              className={`auth-anim mt-2 w-full text-white py-4 text-[0.65rem] font-bold tracking-[0.2em] uppercase transition-colors disabled:opacity-30 disabled:cursor-not-allowed
                ${isLoading ? 'bg-black/60' : 'bg-[#1a1a1a] hover:bg-black/80'}`}
            >
              {isLoading && !isModalOpen ? "Verifying..." : "Confirm"}
            </button>
          </form>

          <div className="auth-anim mt-12 text-center border-t border-black/10 pt-8">
            {canResend ? (
              <button 
                onClick={handleResend}
                disabled={isLoading}
                className="inline-block border-b border-black text-[0.65rem] font-bold tracking-[0.2em] uppercase pb-1 hover:opacity-60 transition-opacity disabled:opacity-30"
              >
                {isLoading && !isModalOpen ? "Sending..." : "Resend Code"}
              </button>
            ) : (
              <p className="text-[0.65rem] font-bold tracking-[0.1em] uppercase opacity-50">
                Resend code in <span className="opacity-100 text-black ml-1">{formatTime(timeLeft)}</span>
              </p>
            )}
            
            <div className="mt-8">
              <button 
                type="button"
                onClick={() => {
                  dispatch(clearError());
                  setIsModalOpen(true);
                }}
                className="text-[0.55rem] tracking-[0.1em] uppercase opacity-40 hover:opacity-100 transition-opacity"
              >
                Change Email Address
              </button>
            </div>
          </div>

        </div>
      </main>

      {/* ========================================= */}
      {/* UPDATE EMAIL MODAL OVERLAY */}
      {/* ========================================= */}
      <div 
        className={`fixed inset-0 z-[999999] flex items-center justify-center p-4 transition-all duration-300
          ${isModalOpen ? "opacity-100 pointer-events-auto backdrop-blur-sm bg-black/40" : "opacity-0 pointer-events-none bg-black/0"}
        `}
      >
        <div 
          className={`bg-white w-full max-w-[400px] p-8 lg:p-10 shadow-2xl relative transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
            ${isModalOpen ? "translate-y-0 scale-100" : "translate-y-8 scale-95"}
          `}
        >
          {/* Close Button */}
          <button 
            onClick={() => setIsModalOpen(false)}
            className="absolute top-6 right-6 text-xl opacity-40 hover:opacity-100 transition-opacity"
          >
            <Icon icon="ph:x-light" />
          </button>

          <h2 className="head-font text-3xl mb-2">Update Email</h2>
          <p className="text-xs font-light opacity-60 uppercase tracking-widest mb-6">
            We will send a new code to this address.
          </p>

          {/* Error Display for Modal */}
          {reduxError && isModalOpen && (
            <div className="bg-red-50 text-red-600 text-xs text-center tracking-wide font-medium py-3 px-4 mb-6 border border-red-100">
              {reduxError}
            </div>
          )}

          <form onSubmit={handleNewEmailSubmit} className="flex flex-col gap-8 w-full">
            <div className="relative flex flex-col">
              <label className="text-[0.6rem] font-bold tracking-[0.2em] uppercase opacity-50 mb-2">New Email Address</label>
              <input 
                type="email" 
                required
                value={newEmailInput}
                onChange={(e) => {
                  setNewEmailInput(e.target.value);
                  if (reduxError) dispatch(clearError());
                }}
                className="w-full bg-transparent border-b border-black/20 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                placeholder={user?.email || "Enter new email..."}
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className={`mt-2 w-full text-white py-4 text-[0.65rem] font-bold tracking-[0.2em] uppercase transition-colors
                ${isLoading ? 'bg-black/60 cursor-not-allowed' : 'bg-[#1a1a1a] hover:bg-black/80'}`}
            >
              {isLoading && isModalOpen ? "Processing..." : "Request New Code"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default Verification;