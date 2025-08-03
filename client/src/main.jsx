import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './css-fixes.css'
import App from './App.jsx'
import { initResponsive } from './utils/responsive'

// Initialize responsive utilities
document.addEventListener('DOMContentLoaded', () => {
  initResponsive();
});

const ResponsiveApp = () => {
  useEffect(() => {
    // Handle window resize events for responsive adjustments
    const handleResize = () => {
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return <App />;
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ResponsiveApp />
  </StrictMode>,
)
