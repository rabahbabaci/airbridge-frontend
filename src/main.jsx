import React from 'react'
import ReactDOM from 'react-dom/client'
import posthog from 'posthog-js'
import App from '@/App.jsx'
import '@/index.css'
import { POSTHOG_API_KEY } from '@/config'

if (POSTHOG_API_KEY) {
    posthog.init(POSTHOG_API_KEY, {
        api_host: 'https://us.i.posthog.com',
        autocapture: true,
        capture_pageview: true,
        capture_pageleave: true,
    });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
