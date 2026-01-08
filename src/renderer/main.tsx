import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";
import "./i18n";

// Forward main process logs to renderer console
if (window.api && window.api.onMainLog) {
  window.api.onMainLog((data: { level: string; message: string }) => {
    const { level, message } = data;
    // Map electron-log levels to console methods
    switch (level) {
      case "error":
        console.error(`[Main] ${message}`);
        break;
      case "warn":
        console.warn(`[Main] ${message}`);
        break;
      case "info":
        console.info(`[Main] ${message}`);
        break;
      case "debug":
        console.debug(`[Main] ${message}`);
        break;
      default:
        console.log(`[Main] ${message}`);
    }
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
