import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { verifyOtp, resendAdminOtp, clearError } from "../../store/slices/authSlice";
import { Icon } from "@iconify/react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const Verification = () => {
  const containerRef = useRef(null);
  const particleContainerRef = useRef(null);
  const btnRef = useRef(null);
  const particlesRef = useRef([]);

  const { register, handleSubmit, formState: { errors } } = useForm();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { admin, isLoading, error } = useSelector((state) => state.auth);
  
  // Timer State for Resend logic
  const [timeLeft, setTimeLeft] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  // Countdown Timer Logic
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timerId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, [timeLeft]);

  useEffect(() => {
    dispatch(clearError());
    return () => {
      particlesRef.current.forEach(p => p.remove());
    };
  }, [dispatch]);

  const { contextSafe } = useGSAP(() => {
    const tl = gsap.timeline();
    tl.fromTo(".brand-mark", { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 1, ease: "power2.out", delay: 0.2 })
      .fromTo(".form-block", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: "power3.out" }, "-=0.5");
  }, { scope: containerRef });

  const handleOtpType = contextSafe((e) => {
    if (e.key.length > 1) return; 

    const rect = e.target.getBoundingClientRect();
    const dot = document.createElement("div");
    // Updated to use your design system
    dot.className = "absolute left-0 top-0 w-2 h-2 bg-dark rounded-full z-50 pointer-events-none";
    particleContainerRef.current.appendChild(dot);
    particlesRef.current.push(dot);

    const startX = rect.left + rect.width / 2; 
    const startY = rect.top + rect.height / 2;

    gsap.fromTo(dot,
      { x: startX, y: startY, scale: 0 },
      {
        x: startX + gsap.utils.random(-100, 100), 
        y: window.innerHeight - 20, 
        scale: 1,
        duration: 1.5,
        ease: "bounce.out"
      }
    );
  });

  const onSubmit = contextSafe(async (data) => {
    setResendMessage(""); // Clear any resend success messages
    if (particlesRef.current.length > 0 && btnRef.current) {
      const btnRect = btnRef.current.getBoundingClientRect();
      const targetX = btnRect.left + btnRect.width / 2;
      const targetY = btnRect.top + btnRect.height / 2;

      gsap.to(particlesRef.current, {
        x: targetX,
        y: targetY,
        scale: 0,
        duration: 0.6,
        stagger: 0.01, 
        ease: "back.in(1.5)",
        onComplete: () => {
          particlesRef.current.forEach(p => p.remove());
          particlesRef.current = [];
          executeVerification(data);
        }
      });
    } else {
      executeVerification(data);
    }
  });

  const executeVerification = async (data) => {
    try {
      await dispatch(verifyOtp({ email: admin?.email, otp: data.otp })).unwrap();
      navigate("/");
    } catch (err) {
      console.error("Verification failed:", err);
    }
  };

  // Resend OTP Action
  const handleResend = async () => {
    setIsResending(true);
    setResendMessage("");
    dispatch(clearError());
    
    try {
      await dispatch(resendAdminOtp({ email: admin?.email })).unwrap();
      setResendMessage("A new code has been dispatched.");
      setTimeLeft(60); // Reset the timer back to 60 seconds
    } catch (err) {
      console.error("Resend failed:", err);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <main ref={containerRef} className="w-full h-[100dvh] bg-light flex items-center justify-center px-6 relative overflow-hidden">
      <div ref={particleContainerRef} className="fixed inset-0 pointer-events-none z-50"></div>

      <div className="brand-mark absolute top-10 left-10 z-20 opacity-0 pointer-events-none txt-dark">
        <h2 className="head-font text-2xl tracking-[0.2em] uppercase">
          Mritsna<span className="opacity-30">.</span>
        </h2>
      </div>

      <div className="form-block w-full max-w-[400px] flex flex-col z-10 opacity-0">
        <div className="mb-14 text-center">
          <Icon icon="iconamoon:lock-light" className="text-3xl txt-dark mx-auto mb-6 opacity-80" />
          <h1 className="head-font text-5xl txt-dark mb-3 tracking-tight">Verification</h1>
          <p className="text-[0.65rem] font-bold tracking-[0.3em] uppercase opacity-40 txt-dark">
            Code sent to {admin?.email || "your email"}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 border border-red-500/20 bg-red-500/5 text-red-600 text-[0.7rem] font-bold tracking-wide uppercase text-center backdrop-blur-sm">
            {error}
          </div>
        )}
        
        {resendMessage && !error && (
          <div className="mb-6 p-4 border border-green-500/20 bg-green-500/5 text-green-700 text-[0.7rem] font-bold tracking-wide uppercase text-center backdrop-blur-sm">
            {resendMessage}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          <div className="relative group bg-transparent z-10">
            <input 
              {...register("otp", { 
                required: "Verification code is required",
                minLength: { value: 6, message: "Code must be 6 digits" }
              })}
              onKeyDown={handleOtpType}
              type="text" 
              maxLength="6"
              autoComplete="off"
              placeholder="000000"
              className="w-full bg-transparent border-b border-[var(--dark)]/20 py-3 text-center tracking-[1em] text-2xl focus:outline-none focus:border-[var(--dark)] transition-colors placeholder:opacity-20 txt-dark"
            />
            {errors.otp && <span className="absolute -bottom-5 left-0 w-full text-center text-red-500 text-[0.65rem] uppercase tracking-wide">{errors.otp.message}</span>}
          </div>

          <button 
            type="submit" 
            ref={btnRef}
            disabled={isLoading}
            className={`group relative w-full h-16 mt-6 border border-[var(--dark)] bg-transparent txt-dark text-[0.65rem] font-bold tracking-[0.2em] uppercase overflow-hidden transition-all duration-500 z-10 ${isLoading ? 'opacity-50 cursor-wait' : 'hover:border-transparent'}`}
          >
            <div className="absolute inset-0 bg-dark translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.7,0,0.3,1)] z-0"></div>
            <span className={`relative z-10 flex items-center justify-center gap-3 transition-colors duration-500 ${isLoading ? '' : 'group-hover:txt-light'}`}>
              {isLoading ? "Verifying..." : "Secure Session"}
              {!isLoading && <Icon icon="iconamoon:check-circle-1-light" className="text-sm transition-transform duration-500 group-hover:scale-110" />}
            </span>
          </button>
        </form>

        {/* Resend Logic */}
        <div className="mt-8 flex justify-center items-center h-8">
          {timeLeft > 0 ? (
            <p className="text-[0.65rem] font-bold tracking-[0.2em] uppercase opacity-40 txt-dark">
              Resend available in <span className="tabular-nums font-mono">00:{timeLeft.toString().padStart(2, '0')}</span>
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending || isLoading}
              className="text-[0.65rem] font-bold tracking-[0.2em] uppercase txt-dark border-b border-[var(--dark)]/30 pb-1 hover:border-[var(--dark)] transition-colors flex items-center gap-2"
            >
              {isResending ? "Dispatching..." : "Resend Code"}
              {!isResending && <Icon icon="iconamoon:reload-light" className="text-sm" />}
            </button>
          )}
        </div>

      </div>
    </main>
  );
};

export default Verification;