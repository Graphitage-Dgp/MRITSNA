import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loginAdmin, clearError } from "../../store/slices/authSlice";
import { Icon } from "@iconify/react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const SignIn = () => {
  const containerRef = useRef(null);
  const particleContainerRef = useRef(null);
  const btnRef = useRef(null);
  const particlesRef = useRef([]); 
  
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { isLoading, error } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(clearError());
    return () => {
      particlesRef.current.forEach(p => p.remove());
    };
  }, [dispatch]);

  const { contextSafe } = useGSAP(() => {
    const tl = gsap.timeline();
    
    tl.fromTo(
      ".brand-mark",
      { opacity: 0, x: -20 },
      { opacity: 1, x: 0, duration: 1, ease: "power2.out", delay: 0.2 }
    )
    .fromTo(
      ".form-block",
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: "power3.out" },
      "-=0.5"
    );
  }, { scope: containerRef });

  const handlePasswordType = contextSafe((e) => {
    if (e.key.length > 1) return; 

    const rect = e.target.getBoundingClientRect();
    const dot = document.createElement("div");
    // Using your design system classes for the physics particles
    dot.className = "absolute left-0 top-0 w-2 h-2 bg-dark rounded-full z-50 pointer-events-none";
    particleContainerRef.current.appendChild(dot);
    particlesRef.current.push(dot);

    const startX = rect.left + 15 + (e.target.value.length * 7); 
    const startY = rect.top + rect.height / 2;

    gsap.fromTo(dot,
      { x: startX, y: startY, scale: 0 },
      {
        x: startX + gsap.utils.random(-60, 60), 
        y: window.innerHeight - 20, 
        scale: 1,
        duration: 1.5,
        ease: "bounce.out"
      }
    );
  });

  const onSubmit = contextSafe(async (data) => {
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
          executeLogin(data);
        }
      });
    } else {
      executeLogin(data);
    }
  });

  const executeLogin = async (data) => {
    try {
      await dispatch(loginAdmin(data)).unwrap();
      navigate("/verify");
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  return (
    <main 
      ref={containerRef}
      className="w-full h-[100dvh] bg-light flex items-center justify-center px-6 relative overflow-hidden"
    >
      <div ref={particleContainerRef} className="fixed inset-0 pointer-events-none z-50"></div>

      <div className="brand-mark absolute top-10 left-10 z-20 opacity-0 pointer-events-none txt-dark">
        <h2 className="head-font text-2xl tracking-[0.2em] uppercase">
          Mritsna<span className="opacity-30">.</span>
        </h2>
      </div>

      <div className="form-block w-full max-w-[400px] flex flex-col z-10 opacity-0">
        
        <div className="mb-14 text-center">
          <Icon icon="iconamoon:shield-light" className="text-3xl txt-dark mx-auto mb-6 opacity-80" />
          <h1 className="head-font text-5xl txt-dark mb-3 tracking-tight">
            Admin Portal
          </h1>
          <p className="text-[0.65rem] font-bold tracking-[0.3em] uppercase opacity-40 txt-dark">Identity Required</p>
        </div>

        {error && (
          <div className="mb-6 p-4 border border-red-500/20 bg-red-500/5 text-red-600 text-[0.7rem] font-bold tracking-wide uppercase text-center backdrop-blur-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8">
          
          <div className="relative group bg-transparent z-10">
            <input 
              {...register("email", { required: "Email is required" })}
              type="email" 
              id="email"
              placeholder=" " 
              className="peer relative z-10 w-full bg-transparent border-b border-[var(--dark)]/20 py-3 text-sm focus:outline-none focus:border-[var(--dark)] transition-colors rounded-none txt-dark"
            />
            <label 
              htmlFor="email" 
              className="absolute left-0 top-3 text-sm txt-dark opacity-50 transition-all duration-300 pointer-events-none z-0 w-3/4
                         peer-focus:-top-4 peer-focus:text-[0.6rem] peer-focus:font-bold peer-focus:tracking-[0.2em] peer-focus:uppercase peer-focus:opacity-100 
                         peer-[:not(:placeholder-shown)]:-top-4 peer-[:not(:placeholder-shown)]:text-[0.6rem] peer-[:not(:placeholder-shown)]:font-bold peer-[:not(:placeholder-shown)]:tracking-[0.2em] peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:opacity-100"
            >
              Email Address
            </label>
            {errors.email && <span className="absolute -bottom-5 left-0 text-red-500 text-[0.65rem] uppercase tracking-wide">{errors.email.message}</span>}
          </div>

          <div className="relative group mt-2 bg-transparent z-10">
            <input 
              {...register("password", { required: "Password is required" })}
              onKeyDown={handlePasswordType} 
              type={showPassword ? "text" : "password"} 
              id="password"
              placeholder=" "
              autoComplete="off"
              className="peer relative z-10 w-full bg-transparent border-b border-[var(--dark)]/20 py-3 pr-10 text-sm focus:outline-none focus:border-[var(--dark)] transition-colors rounded-none txt-dark"
            />
            
            {/* The fixed toggle icon: Increased z-index, exact positioning, and independent opacity */}
            <div 
              className="absolute right-0 bottom-2 z-50 cursor-pointer p-1 txt-dark opacity-40 hover:opacity-100 transition-opacity flex items-center justify-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              <Icon 
                icon={showPassword ? "iconamoon:eye-off-light" : "iconamoon:eye-light"} 
                className="text-xl" 
              />
            </div>

            <label 
              htmlFor="password" 
              className="absolute left-0 top-3 text-sm txt-dark opacity-50 transition-all duration-300 pointer-events-none z-0 w-3/4
                         peer-focus:-top-4 peer-focus:text-[0.6rem] peer-focus:font-bold peer-focus:tracking-[0.2em] peer-focus:uppercase peer-focus:opacity-100 
                         peer-[:not(:placeholder-shown)]:-top-4 peer-[:not(:placeholder-shown)]:text-[0.6rem] peer-[:not(:placeholder-shown)]:font-bold peer-[:not(:placeholder-shown)]:tracking-[0.2em] peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:opacity-100"
            >
              Password
            </label>
            {errors.password && <span className="absolute -bottom-5 left-0 text-red-500 text-[0.65rem] uppercase tracking-wide">{errors.password.message}</span>}
          </div>

          <button 
            type="submit" 
            ref={btnRef}
            disabled={isLoading}
            className={`group relative w-full h-16 mt-6 border border-[var(--dark)] bg-transparent txt-dark text-[0.65rem] font-bold tracking-[0.2em] uppercase overflow-hidden transition-all duration-500 z-10 ${isLoading ? 'opacity-50 cursor-wait' : 'hover:border-transparent'}`}
          >
            <div className="absolute inset-0 bg-dark translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.7,0,0.3,1)] z-0"></div>
            
            <span className={`relative z-10 flex items-center justify-center gap-3 transition-colors duration-500 ${isLoading ? '' : 'group-hover:txt-light'}`}>
              {isLoading ? "Authenticating..." : "Continue"}
              {!isLoading && <Icon icon="iconamoon:arrow-right-1" className="text-sm transition-transform duration-500 group-hover:translate-x-2" />}
            </span>
          </button>

        </form>
      </div>

      <div className="form-block absolute bottom-8 text-center w-full opacity-0 z-10">
        <p className="text-[0.55rem] font-bold tracking-[0.3em] uppercase opacity-40 txt-dark">
          Secure Connection Established
        </p>
      </div>

    </main>
  );
};

export default SignIn;