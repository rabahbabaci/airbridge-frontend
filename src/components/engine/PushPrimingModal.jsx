import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import { requestPermission, registerTokenWithBackend } from '@/utils/pushNotifications';

const STORAGE_KEY = 'airbridge_push_primed';

/**
 * Check whether the push priming screen should be shown.
 * Show once on first trip. If user tapped "Not now", show again on trip 2+.
 */
export function shouldShowPushPriming(tripCount) {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'granted') return false; // Already enabled — never show again
  if (stored === 'dismissed') {
    // Show again on trip 2+
    return tripCount != null && tripCount >= 2;
  }
  return true; // Never shown
}

export function markPushPrimed(outcome) {
  localStorage.setItem(STORAGE_KEY, outcome); // 'granted' or 'dismissed'
}

export default function PushPrimingModal({ open, onClose, authToken }) {
  const [loading, setLoading] = useState(false);

  const handleEnable = async () => {
    setLoading(true);
    try {
      const token = await requestPermission();
      if (token) {
        await registerTokenWithBackend(token, authToken);
        markPushPrimed('granted');
      } else {
        // Permission denied by system or failed
        markPushPrimed('dismissed');
      }
    } catch (err) {
      console.error('Push priming failed:', err);
      markPushPrimed('dismissed');
    } finally {
      setLoading(false);
      onClose();
    }
  };

  const handleDismiss = () => {
    markPushPrimed('dismissed');
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="relative w-full max-w-[360px] bg-card rounded-3xl border border-border shadow-2xl p-8 text-center"
          >
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
              <Bell className="w-7 h-7 text-primary" />
            </div>

            <h2 className="text-xl font-bold text-foreground mb-2">
              Stay ahead of changes
            </h2>

            <p className="text-sm text-muted-foreground leading-relaxed mb-8">
              AirBridge will only notify you when your leave-by time changes or it's time to head out. No spam, ever.
            </p>

            <button
              onClick={handleEnable}
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {loading ? 'Setting up...' : 'Turn on notifications'}
            </button>

            <button
              onClick={handleDismiss}
              className="w-full mt-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Not now
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
