import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ShieldCheck } from 'lucide-react';
import { pushToDataLayer } from '@/lib/analytics/gtm';

const ConsentBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Helper to safely update consent via gtag
  const updateGtagConsent = (status: 'granted' | 'denied') => {
    if (typeof window !== 'undefined') {
      // Ensure gtag is defined (standard GTM/GA4 pattern)
      window.gtag = window.gtag || function(){ (window.dataLayer = window.dataLayer || []).push(arguments); };
      
      const consentSettings = {
        'ad_storage': status,
        'ad_user_data': status,
        'ad_personalization': status,
        'analytics_storage': status,
        'functionality_storage': status,
        'personalization_storage': status
      };

      window.gtag('consent', 'update', consentSettings);
    }
  };

  useEffect(() => {
    const savedConsent = localStorage.getItem('wg_consent_mode');
    
    if (savedConsent === 'granted') {
      // Restore granted consent and push event on every page load
      updateGtagConsent('granted');
      pushToDataLayer({
        event: 'consent_update',
        consent_choice: 'accepted',
        consent_type: 'all'
      });
    } else if (savedConsent === 'denied') {
      // Restore denied consent and push event on every page load
      updateGtagConsent('denied');
      pushToDataLayer({
        event: 'consent_update',
        consent_choice: 'rejected',
        consent_type: 'all'
      });
    } else {
      // No choice made yet, show banner after a short delay
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    updateGtagConsent('granted');
    localStorage.setItem('wg_consent_mode', 'granted');
    setIsVisible(false);
    
    // This event is now also fired on page load, but we keep it here
    // for immediate tracking upon interaction.
    pushToDataLayer({
      event: 'consent_update',
      consent_choice: 'accepted',
      consent_type: 'all'
    });
  };

  const handleReject = () => {
    updateGtagConsent('denied');
    localStorage.setItem('wg_consent_mode', 'denied');
    setIsVisible(false);

    // This event is now also fired on page load, but we keep it here
    // for immediate tracking upon interaction.
    pushToDataLayer({
      event: 'consent_update',
      consent_choice: 'rejected',
      consent_type: 'all'
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-[9999] p-4 md:p-6 bg-black/95 border-t border-white/10 backdrop-blur-md shadow-[0_-10px_40px_rgba(0,0,0,0.8)]"
        >
          <div className="container mx-auto max-w-5xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-[#56d4ff]/10 rounded-full border border-[#56d4ff]/20">
                <ShieldCheck className="w-6 h-6 text-[#56d4ff]" />
              </div>
              <div className="text-sm text-slate-300 max-w-2xl">
                <h4 className="text-white font-bold mb-1 text-base">Your Data. Your Choice.</h4>
                <p className="leading-relaxed opacity-80">
                  We use cookies to improve your experience, analyze traffic, and prevent fraud.
                  Your privacy is our priority.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto min-w-fit">
              <Button 
                variant="ghost" 
                onClick={handleReject}
                className="flex-1 md:flex-none text-slate-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10"
              >
                Reject All
              </Button>
              <Button 
                onClick={handleAccept}
                className="flex-1 md:flex-none bg-[#56d4ff] text-black hover:bg-[#4cc2eb] font-bold px-8 shadow-[0_0_20px_rgba(86,212,255,0.3)] hover:shadow-[0_0_30px_rgba(86,212,255,0.5)] transition-all"
              >
                Accept All
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConsentBanner;
