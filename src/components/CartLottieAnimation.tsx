'use client';

import React, { useEffect, useRef } from 'react';
import { cartAnimationData } from '@/data/cartAnimation';

interface CartLottieAnimationProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function CartLottieAnimation({ className, style }: CartLottieAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let anim: any = null;
    let isMounted = true;

    // Load lottie-web dynamically inside useEffect to ensure SSR-safety
    import('lottie-web').then((lottieModule) => {
      if (!isMounted || !containerRef.current) return;
      const lottie = lottieModule.default || lottieModule;
      try {
        anim = lottie.loadAnimation({
          container: containerRef.current,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          animationData: cartAnimationData,
          rendererSettings: {
            preserveAspectRatio: 'xMidYMid meet',
            progressiveLoad: true,
          },
        });
      } catch (err) {
        console.error('Failed to load Cart Lottie animation:', err);
      }
    });

    return () => {
      isMounted = false;
      if (anim) {
        try {
          anim.destroy();
        } catch {
          // clean ignore
        }
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`hero-3d-cart-lottie ${className || ''}`}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '170px',
        maxHeight: '210px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        ...style,
      }}
      aria-label="3D Animated Purchasing Cart"
    />
  );
}
