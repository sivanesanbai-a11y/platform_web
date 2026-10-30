'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import gazeFrames from './gaze-frames.json';

const TAU = Math.PI * 2;
const wrappedAngle = (angle: number) => (angle % TAU + TAU) % TAU;

function timeForAngle(angle: number) {
  const target = wrappedAngle(angle);
  let nearestTime = gazeFrames[0][1];
  let nearestDistance = Infinity;
  for (const [sampleAngle, time] of gazeFrames) {
    const difference = Math.abs(target - sampleAngle);
    const distance = Math.min(difference, TAU - difference);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestTime = time;
    }
  }
  return nearestTime + 1 / 240;
}

export default function FooterBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [heartPos, setHeartPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let frame = 0;
    let desiredTime = 0;
    let pointer: { x: number; y: number } | null = null;
    let disposed = false;
    const mobile = window.matchMedia('(max-width: 700px)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const updateHeart = () => {
      if (!video) return;
      const rect = video.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const scale = Math.max(rect.width / 1920, rect.height / 1080);
      const hX = rect.width / 2;
      // In 1920x1080 coordinates, center is 540. The heart held on the chest is at y = 665 (540 + 125).
      const hY = rect.height / 2 + 125 * scale;
      setHeartPos({ x: hX, y: hY });
    };

    const seek = () => {
      frame = 0;
      if (disposed || mobile.matches || video.readyState < 2 || video.seeking) return;
      if (Math.abs(video.currentTime - desiredTime) > 1 / 48) {
        video.currentTime = Math.min(desiredTime, video.duration - 1 / 24);
      }
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(seek);
    };

    const updateTarget = () => {
      updateHeart();
      if (mobile.matches || !pointer) return;
      const rect = video.getBoundingClientRect();
      const scale = Math.max(rect.width / 1920, rect.height / 1080);
      const eyeX = rect.left + rect.width / 2 + (948 - 960) * scale;
      const eyeY = rect.top + rect.height / 2 + (418 - 540) * scale;
      const dx = pointer.x - eyeX;
      const dy = pointer.y - eyeY;
      if (Math.hypot(dx, dy) > 8) {
        desiredTime = timeForAngle(Math.atan2(dy, dx));
        schedule();
      }
    };

    const move = (event: PointerEvent) => {
      pointer = { x: event.clientX, y: event.clientY };
      updateTarget();
    };

    const ready = () => {
      updateHeart();
      video.loop = mobile.matches;
      if (mobile.matches && !reducedMotion.matches) {
        void video.play().catch(() => {});
      } else {
        video.pause();
        if (!mobile.matches) {
          updateTarget();
          schedule();
        }
      }
    };

    video.addEventListener('seeked', schedule);
    video.addEventListener('loadeddata', ready);
    mobile.addEventListener('change', ready);
    reducedMotion.addEventListener('change', ready);
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('resize', updateTarget);
    window.addEventListener('scroll', updateTarget, { passive: true });

    if (video.readyState >= 2) ready();
    updateHeart();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      video.removeEventListener('seeked', schedule);
      video.removeEventListener('loadeddata', ready);
      mobile.removeEventListener('change', ready);
      reducedMotion.removeEventListener('change', ready);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('resize', updateTarget);
      window.removeEventListener('scroll', updateTarget);
    };
  }, []);

  return (
    <div className="footer-background" aria-hidden="false">
      <video ref={videoRef} muted playsInline preload="auto" src="/footer-scrub.mp4" aria-hidden="true" />
      <div
        className="heart-login-container"
        style={heartPos ? { left: `${heartPos.x}px`, top: `${heartPos.y}px` } : undefined}
      >
        <Link href="/login" className="heart-login-btn" aria-label="Login to Operations Dashboard">
          <span>Login</span>
          <svg
            className="heart-login-arrow"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
