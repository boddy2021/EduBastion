import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './components/Navbar/Navbar.module.css'
import App from './App.jsx'

const API_URL = "http://127.0.0.1:8000";
const originalFetch = window.fetch;
window.fetch = (input, init = {}) => {
    const url = typeof input === "string" ? input : input?.url || "";
    if (url.startsWith(API_URL)) {
        const token = localStorage.getItem("accessToken");
        if (token) {
            init.headers = { ...(init.headers || {}), Authorization: `Bearer ${token}` };
        }
    }
    return originalFetch(input, init);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
