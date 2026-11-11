import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import SmoothScroll from "./configs/SmoothScroll.jsx";
import { IntroProvider } from "./context/IntroContext.jsx";
import { Provider } from "react-redux";
import store from "./store/store.js";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <SmoothScroll>
      <IntroProvider>
        <Provider store={store}>
          <App />
        </Provider>
      </IntroProvider>
    </SmoothScroll>
  </BrowserRouter>,
);
