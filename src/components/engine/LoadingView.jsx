import React from 'react';
import { motion } from 'framer-motion';

const pageTransition = {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
    exit: { opacity: 0, y: -16, transition: { duration: 0.25, ease: [0.4, 0, 1, 1] } },
};

export default function LoadingView({ currentTripId, title, description }) {
    const resolvedTitle = title ?? (currentTripId ? 'Updating your journey' : 'Calculating your journey');
    const resolvedDescription = description ?? 'Analyzing traffic, TSA wait times,\nand airport conditions…';
    return (
        <motion.div key="loading" {...pageTransition}
            className="min-h-[calc(100vh-57px)] flex flex-col items-center justify-center text-center gap-6 px-4">
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                className="w-14 h-14 rounded-full border-[3px] border-border border-t-primary"
            />
            <div>
                <h2 className="text-xl font-bold text-foreground mb-2">
                    {resolvedTitle}
                </h2>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto whitespace-pre-line">
                    {resolvedDescription}
                </p>
            </div>
            <div className="flex gap-2">
                {[0, 1, 2].map(i => (
                    <motion.div key={i}
                        animate={{ opacity: [0.2, 0.8, 0.2] }}
                        transition={{ repeat: Infinity, duration: 1.4, delay: i * 0.25 }}
                        className="w-2 h-2 rounded-full bg-primary/60"
                    />
                ))}
            </div>
        </motion.div>
    );
}
