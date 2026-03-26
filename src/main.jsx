import React from 'react'
import ReactDOM from 'react-dom/client'
import posthog from 'posthog-js'
import App from '@/App.jsx'
import '@/index.css'

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_API_KEY;
if (POSTHOG_KEY) {
    posthog.init(POSTHOG_KEY, {
        api_host: 'https://us.i.posthog.com',
        autocapture: true,
        capture_pageview: true,
        capture_pageleave: true,
    });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
