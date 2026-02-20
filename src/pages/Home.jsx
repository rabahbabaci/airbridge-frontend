import React from 'react';
import Header from '@/components/landing/Header';
import Hero from '@/components/landing/Hero';
import Problem from '@/components/landing/Problem';
import Solution from '@/components/landing/Solution';
import HowItWorks from '@/components/landing/HowItWorks';
import JourneyFlow from '@/components/landing/JourneyFlow';
import Comparison from '@/components/landing/Comparison';
import Trust from '@/components/landing/Trust';
import CTA from '@/components/landing/CTA';
import Footer from '@/components/landing/Footer';

export default function Home() {
    return (
        <div className="min-h-screen bg-white font-sans antialiased">
            <Header />
            <main>
                <Hero />
                <Problem />
                <Solution />
                <HowItWorks />
                <JourneyFlow />
                <Comparison />
                <Trust />
                <CTA />
            </main>
            <Footer />
        </div>
    );
}