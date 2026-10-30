'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import gazeFrames from './gaze-frames.json';
import { getRoleDestination } from '@/lib/role-routing';

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
  const [destHref, setDestHref] = useState<string>('/login');
  const [btnText, setBtnText] = useState<string>('Login');

  // Check auth session to route directly to active user station if logged in
  useEffect(() => {
    try {
      const s = localStorage.getItem('nunes_auth_session');
      if (s) {
        const parsed = JSON.parse(s);
        if (parsed?.email) {
          setDestHref(getRoleDestination(parsed.email));
          setBtnText('Open Portal');
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let frame = 0;
    let desiredTime = 0;
    let pointer: { x: number; y: number } | null = null;
    let disposed = false;
    let idleTimer: any = null;
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

    const resumeContinuousMotion = () => {
      if (disposed || reducedMotion.matches) return;
      if (video && video.paused) {
        void video.play().catch(() => {});
      }
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

      // Pause continuous motion to scrub gaze-tracking with cursor
      if (video && !video.paused) {
        video.pause();
      }
      updateTarget();

      // Resume smooth continuous animated motion after cursor stops moving
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        resumeContinuousMotion();
      }, 1200);
    };

    const ready = () => {
      updateHeart();
      video.loop = true;
      if (!reducedMotion.matches) {
        void video.play().catch(() => {});
      }
    };

    video.addEventListener('seeked', schedule);
    video.addEventListener('loadeddata', ready);
    video.addEventListener('canplay', ready);
    mobile.addEventListener('change', ready);
    reducedMotion.addEventListener('change', ready);
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('resize', updateTarget);
    window.addEventListener('scroll', updateTarget, { passive: true });

    // Initial kickstart to ensure immediate animated motion on load
    video.loop = true;
    void video.play().catch(() => {});
    if (video.readyState >= 2) ready();
    updateHeart();

    return () => {
      disposed = true;
      clearTimeout(idleTimer);
      cancelAnimationFrame(frame);
      video.removeEventListener('seeked', schedule);
      video.removeEventListener('loadeddata', ready);
      video.removeEventListener('canplay', ready);
      mobile.removeEventListener('change', ready);
      reducedMotion.removeEventListener('change', ready);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('resize', updateTarget);
      window.removeEventListener('scroll', updateTarget);
    };
  }, []);

  return (
    <div className="footer-background" aria-hidden="false">
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        src="/footer-scrub.mp4"
        aria-hidden="true"
      />
      <div
        className="heart-login-container"
        style={heartPos ? { left: `${heartPos.x}px`, top: `${heartPos.y}px` } : undefined}
      >
        <Link href={destHref} className="heart-login-btn" aria-label="Login or Enter Operations Station">
          <span>{btnText}</span>
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
