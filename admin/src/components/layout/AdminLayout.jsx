import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logoutAdmin } from "../../store/slices/authSlice";
import { Icon } from "@iconify/react";
import SmoothScroll from "./SmoothScroll";

const navItems = [
  { id: "dashboard", label: "Overview", path: "/admin/dashboard", icon: "solar:widget-5-linear" },
  { id: "users", label: "Users", path: "/admin/users", icon: "ph:users-three-light" },
  { id: "products", label: "Products", path: "/admin/products", icon: "lucide:package" },
  { id: "inventory", label: "Inventory", path: "/admin/inventory", icon: "lucide:archive" },
  { id: "collections", label: "Collections", path: "/admin/collections", icon: "lucide:grid" },
  { id: "orders", label: "Orders", path: "/admin/orders", icon: "ph:truck-light" },
  { id: "carts", label: "Carts", path: "/admin/carts", icon: "carbon:shopping-cart" },
  { id: "wishlists", label: "Wishlists", path: "/admin/wishlists", icon: "mingcute:heart-line" },
  { id: "reviews", label: "Reviews", path: "/admin/reviews", icon: "heroicons:star" },
  { id: "coupons", label: "Coupons", path: "/admin/coupons", icon: "solar:ticket-linear" },
];

const AdminLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { admin } = useSelector((state) => state.auth);
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await dispatch(logoutAdmin());
    navigate("/signin");
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full bg-light overflow-hidden">
      
      {/* --- MOBILE TOP NAVBAR --- */}
      <header className="lg:hidden shrink-0 h-16 bg-dark flex items-center justify-between px-4 sm:px-6 border-b border-[var(--dark)]/10 z-30 shadow-md">
        <img
          src="/logo_white.svg"
          alt="Mritsna Logo"
          className="w-24 opacity-90"
        />
        <button 
          onClick={() => setIsMobileMenuOpen(true)} 
          className="txt-light p-2 hover:bg-[var(--light)]/10 rounded-md transition-colors"
        >
          <Icon icon="solar:hamburger-menu-linear" className="text-2xl" />
        </button>
      </header>

      {/* --- MOBILE BACKDROP --- */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={closeMobileMenu}
        />
      )}

      {/* --- SIDEBAR (Mobile Overlay & Desktop Static) --- */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 h-full shrink-0 bg-dark flex flex-col border-r border-[var(--dark)]/10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]
        transition-transform duration-300 ease-in-out
        lg:static lg:translate-x-0
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        
        {/* Logo Area */}
        <div className="h-16 lg:h-24 shrink-0 flex items-center justify-between lg:justify-start px-6 lg:px-10 border-b border-[var(--light)]/10">
          <img
            src="/logo_white.svg"
            alt="Mritsna Logo"
            className="w-24 lg:w-28 opacity-90 hover:opacity-100 transition-opacity"
          />
          <button 
            className="lg:hidden txt-light p-2 opacity-50 hover:opacity-100 transition-opacity" 
            onClick={closeMobileMenu}
          >
            <Icon icon="lucide:x" className="text-2xl" />
          </button>
        </div>

        {/* Navigation Area */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar mt-6 px-6 pb-6">
          <nav className="flex flex-col gap-2">
            <p className="text-[0.55rem] font-bold tracking-[0.3em] uppercase txt-light opacity-30 px-4 mb-3">
              Workspace
            </p>

            {navItems.map((item) => (
              <NavLink
                key={item.id}
                to={item.path}
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  `group flex items-center gap-4 px-4 py-3 rounded-md transition-all duration-300 relative overflow-hidden ${isActive ? "txt-light bg-[var(--light)]/10 shadow-inner" : "txt-light opacity-50 hover:opacity-100 hover:bg-[var(--light)]/5 hover:translate-x-1"}`
                }
              >
                <Icon
                  icon={item.icon}
                  className="text-lg transition-transform duration-300 group-hover:scale-110"
                />
                <span className="text-[0.7rem] font-bold tracking-[0.15em] uppercase">
                  {item.label}
                </span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Bottom Profile Area */}
        <div className="shrink-0 p-6 border-t border-[var(--light)]/10">
          <div className="flex items-center justify-between px-4 py-3 bg-[var(--light)]/5 rounded-md hover:bg-[var(--light)]/10 transition-colors cursor-default">
            <div className="flex flex-col overflow-hidden">
              <span className="text-[0.65rem] font-bold tracking-[0.15em] uppercase txt-light truncate">
                {admin?.name || "Admin"}
              </span>
              <span className="text-[0.55rem] tracking-wider txt-light opacity-40 truncate">
                Authorized Session
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="txt-light opacity-50 hover:opacity-100 hover:text-red-400 transition-all hover:scale-110 p-2 cursor-pointer"
              title="Secure Logout"
            >
              <Icon icon="solar:logout-2-outline" className="text-xl cursor-pointer" />
            </button>
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 h-full min-h-0 bg-light overflow-y-auto overflow-x-hidden relative z-10 custom-scrollbar">
        <SmoothScroll wrapperId="admin-scroll-wrapper" contentId="admin-scroll-content">
          <div id="admin-scroll-content" className="w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-10 pb-24 lg:pb-20">
            <Outlet />
          </div>
        </SmoothScroll>
      </main>
    </div>
  );
};

export default AdminLayout;
