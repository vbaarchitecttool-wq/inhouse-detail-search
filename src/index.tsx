import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";

const container = document.getElementById("root");
if (!container) throw new Error("#root not found");

const root = ReactDOM.createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

serviceWorkerRegistration.register({
  onUpdate: (registration) => {
    window.dispatchEvent(
      new CustomEvent("sw-update-available", { detail: registration })
    );
  },
  onReady: () => {
    window.dispatchEvent(new CustomEvent("sw-ready"));
  },
});
