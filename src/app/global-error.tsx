'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import errorGif from '../assets/error.gif'; 

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <>
      <style jsx global>{`
        html, body {
          margin: 0;
          padding: 0;
          height: 100%;
        }
      `}</style>
      <main
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(to bottom, #F9FAFB, #E5E7EB)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          margin: 0,
          padding: 0,
          boxSizing: 'border-box',
        }}
      >
        {/* Image */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <img
            src={errorGif.src}
            alt="Error Animation"
            style={{
              width: '600px',
              height: 'auto',
              objectFit: 'contain',
              maxWidth: '100%',
              borderRadius: '1rem',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            }}
          />
        </motion.div>

        {/* Message Text */}
        <motion.h1
          style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            color: 'oklch(0.54 0.1379 286.92)', 
            marginTop: '1.5rem',
            letterSpacing: '-0.025em',
            fontFamily: 'var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif',
          }}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          Oops! Something broke. We couldn’t load the necessary resources. Please try again later🐾.
        </motion.h1>

        {/* Try Again Button */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <button
            onClick={() => {
              reset(); 
            }}
            style={{
              marginTop: '2rem', 
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0.75rem 1.5rem',
              backgroundColor: 'oklch(0.54 0.1379 286.92)', 
              color: 'white', 
              fontSize: '1rem', 
              fontWeight: 500, 
              borderRadius: '0.75rem', 
              border: 'none', 
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', 
              transition: 'all 0.3s ease', 
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#452d7a'; 
              e.currentTarget.style.color = 'white'; 
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'oklch(0.54 0.1379 286.92)'; 
              e.currentTarget.style.color = 'white'; 
            }}
            onFocus={(e) => {
              e.currentTarget.style.outline = 'none'; 
              e.currentTarget.style.boxShadow = '0 0 0 2px #5C3B94, 0 0 0 4px rgba(255, 255, 255, 0.5)'; 
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'; 
            }}
            aria-label="Try again to recover from error"
          >
            <svg
              style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem' }} 
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9H9m-5 7v5h.582m15.356-2A8.001 8.001 0 014.582 17H9"
              />
            </svg>
            Try again
          </button>
        </motion.div>
      </main>
    </>
  );
}