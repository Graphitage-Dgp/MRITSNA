import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast'; // <-- Added import
import PageRouter from './routes/PageRouter';
import { validateAdminSession } from './store/slices/authSlice';

const App = () => {
  const dispatch = useDispatch();
  
  // Pull the loading state directly from our Redux store
  const { isInitializing } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(validateAdminSession());
  }, [dispatch]);

  // Premium, Mritsna-branded initial loading screen
  if (isInitializing) {
    return (
      <main className="w-full h-[100dvh] bg-[#f8f8f8] flex items-center justify-center relative overflow-hidden">
        <div className="flex flex-col items-center gap-6">
          {/* Elegant minimalist spinner */}
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border border-[#1a1a1a]/10 rounded-full" />
            <div className="absolute inset-0 border border-[#1a1a1a] border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-[0.55rem] font-bold tracking-[0.4em] uppercase text-[#1a1a1a] opacity-60">
            Initializing Workspace
          </p>
        </div>
      </main>
    );
  }

  // Once Redux confirms the session check is complete (pass or fail), render the router
  return (
    <>
      {/* Global Toaster Instance */}
      <Toaster 
        position="top-center" 
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1a1a1a',
            color: '#fff',
            fontSize: '13px',
            fontWeight: '500',
            letterSpacing: '0.02em',
            borderRadius: '8px',
            padding: '12px 20px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            zIndex: 9999999,
          },
          success: {
            style: { 
              background: '#059669', // Emerald green for success
              color: 'white' 
            },
            iconTheme: {
              primary: 'white',
              secondary: '#059669',
            },
          },
          error: {
            style: { 
              background: '#dc2626', // Red for errors
              color: 'white' 
            },
            iconTheme: {
              primary: 'white',
              secondary: '#dc2626',
            },
          },
        }} 
      />
      
      <PageRouter />
    </>
  );
};

export default App;