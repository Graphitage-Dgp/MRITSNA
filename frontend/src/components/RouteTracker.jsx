import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "../utils/metaPixel";

const RouteTracker = () => {
  const location = useLocation();

  useEffect(() => {
    trackPageView();
  }, [location.pathname]);

  // This component renders nothing to the DOM
  return null;
};

export default RouteTracker;