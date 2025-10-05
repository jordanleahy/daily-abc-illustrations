/**
 * @fileoverview Application entry point - initializes React app
 * 
 * This file serves as the main entry point for the ABC Cards application.
 * It creates the React root and renders the main App component.
 * 
 * @version 1.0.0
 * @author ABC Cards Team
 */

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

/**
 * Initialize and render the React application
 * 
 * Creates the React root DOM node and renders the main App component.
 * The root element must exist in the HTML document with id="root".
 * 
 * @throws {Error} If the root DOM element is not found
 */
createRoot(document.getElementById("root")!).render(<App />);

/**
 * Register Service Worker for image caching
 * 
 * Caches Supabase storage images for 30 days to improve performance
 * and reduce network requests on subsequent visits
 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[App] Service Worker registered:', registration.scope);
      })
      .catch((error) => {
        console.error('[App] Service Worker registration failed:', error);
      });
  });
}
