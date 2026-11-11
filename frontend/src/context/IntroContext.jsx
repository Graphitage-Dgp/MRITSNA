// frontend/src/context/IntroContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";

const IntroContext = createContext({
  introComplete: true,
  setIntroComplete: () => {},
  isIntroComplete: true,
  setIsIntroComplete: () => {},
});

export const IntroProvider = ({ children }) => {
  const [introComplete, setIntroComplete] = useState(false);

  useEffect(() => {
    // Trigger immediately on first paint so Meta Ad visitors never wait on a blank screen
    const timer = requestAnimationFrame(() => {
      setIntroComplete(true);
    });
    return () => cancelAnimationFrame(timer);
  }, []);

  return (
    <IntroContext.Provider
      value={{
        introComplete,
        setIntroComplete,
        isIntroComplete: introComplete,
        setIsIntroComplete: setIntroComplete,
      }}
    >
      {children}
    </IntroContext.Provider>
  );
};

export const useIntro = () => useContext(IntroContext);
export default IntroContext;