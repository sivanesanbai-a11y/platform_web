'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, Sparkles, ArrowRight, X } from 'lucide-react';
import { FireworksBackground } from '@/components/animate-ui/backgrounds/fireworks';

export interface FormCompletionCelebrationProps {
  isOpen: boolean;
  title?: string;
  subtitle?: string;
  recordNumber?: string;
  durationSeconds?: number;
  onRedirectNow: () => void;
  onCancel?: () => void;
}

export default function FormCompletionCelebration({
  isOpen,
  title = "Form Successfully Completed & Sent!",
  subtitle = "All records have been saved to the database and operations reports.",
  recordNumber,
  durationSeconds = 4,
  onRedirectNow,
  onCancel,
}: FormCompletionCelebrationProps) {
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(durationSeconds);
      setProgress(100);
      return;
    }

    setTimeLeft(durationSeconds);
    setProgress(100);

    const startTime = Date.now();
    const totalMs = durationSeconds * 1000;

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remainingMs = Math.max(0, totalMs - elapsed);
      const remainingSec = Math.ceil(remainingMs / 1000);
      const pct = (remainingMs / totalMs) * 100;

      setTimeLeft(remainingSec);
      setProgress(pct);

      if (remainingMs <= 0) {
        clearInterval(timer);
        onRedirectNow();
      }
    }, 50);

    return () => clearInterval(timer);
  }, [isOpen, durationSeconds, onRedirectNow]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 select-none"
      style={{
        background: 'rgba(5, 10, 24, 0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        animation: 'fadeIn 0.25s ease-out',
      }}
    >
      {/* 4-Second Animated Fireworks Background */}
      <FireworksBackground
        className="absolute inset-0 pointer-events-none"
        population={2.5}
        fireworkSpeed={{ min: 5, max: 9 }}
        fireworkSize={{ min: 2, max: 5 }}
        particleSpeed={{ min: 3, max: 8 }}
      />

      {/* Celebratory Dialog Card */}
      <div
        className="relative z-10 w-full max-w-md rounded-3xl p-7 text-center shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.94) 0%, rgba(30, 41, 59, 0.92) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 40px rgba(16, 185, 129, 0.25)',
          color: '#ffffff',
        }}
      >
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Cancel auto-redirect"
          >
            <X size={18} />
          </button>
        )}

        {/* Celebratory Icon with Glow */}
        <div className="mx-auto mb-4 flex items-center justify-center relative">
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center relative z-10"
            style={{
              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              boxShadow: '0 0 35px rgba(16, 185, 129, 0.6), inset 0 2px 4px rgba(255,255,255,0.4)',
            }}
          >
            <CheckCircle2 size={42} className="text-white drop-shadow-md" strokeWidth={2.5} />
          </div>
          <div 
            className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center text-slate-900 shadow-lg animate-bounce"
            style={{ animationDuration: '1.5s' }}
          >
            <Sparkles size={16} />
          </div>
        </div>

        {/* Title & Reference Badge */}
        <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
          {title}
        </h2>

        {recordNumber && (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-3">
            <span>Ref:</span>
            <span className="font-mono text-white tracking-wide">{recordNumber}</span>
          </div>
        )}

        <p className="text-sm text-slate-300 mb-6 leading-relaxed">
          {subtitle}
        </p>

        {/* 4-Second Countdown Visual Bar */}
        <div className="mb-6 rounded-2xl bg-slate-950/60 p-4 border border-white/10">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
            <span>Starting fresh new form</span>
            <span className="text-emerald-400 font-mono text-sm font-bold">
              {timeLeft}s
            </span>
          </div>

          {/* Progress track */}
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden relative">
            <div 
              className="h-full rounded-full transition-all duration-75"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #10b981, #06b6d4, #3b82f6)',
                boxShadow: '0 0 10px rgba(16, 185, 129, 0.7)',
              }}
            />
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={onRedirectNow}
          className="w-full py-3 px-5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          style={{
            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            boxShadow: '0 6px 20px rgba(5, 150, 105, 0.4), inset 0 1px 1px rgba(255,255,255,0.2)',
          }}
        >
          <span>Start New Form Now</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
