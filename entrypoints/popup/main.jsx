import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './style.css';

console.log('[DEBUG] main.jsx loaded, initializing React');

try {
  const rootElement = document.getElementById('root');
  console.log('[DEBUG] Root element found:', !!rootElement);

  if (!rootElement) {
    console.error('[DEBUG] Root element not found!');
    document.body.innerHTML = '<div style="color: red; padding: 20px;">ERROR: Root element not found</div>';
  } else {
    console.log('[DEBUG] Creating React root and rendering App');
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log('[DEBUG] React app rendered successfully');
  }
} catch (error) {
  console.error('[DEBUG] Error in main.jsx:', error);
  document.body.innerHTML = `<div style="color: red; padding: 20px;">ERROR: ${error.message}</div>`;
}
