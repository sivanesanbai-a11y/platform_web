"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useRouter } from "next/navigation";
import { syncFormToCloud } from "@/lib/sync";
import { getRoleDestination } from "@/lib/role-routing";
import { setAuthSession } from "@/lib/auth";
import { savePersistentSession } from "@/lib/auth-session";

interface ThreeInteractiveAuthProps {
  onSuccess?: () => void;
  redirectTo?: string;
  isModal?: boolean;
  onClose?: () => void;
}

export default function ThreeInteractiveAuth({
  onSuccess,
  redirectTo = "/dashboard",
  isModal = false,
  onClose,
}: ThreeInteractiveAuthProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const pwdRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // References to 3D scene elements for dynamic reactions
  const animStateRef = useRef({
    isCovering: false,
    isCrying: false,
    isSuccess: false,
    isWaving: true,
    mouse: { x: 0, y: 0 },
    character: null as THREE.Group | null,
    mouth: null as THREE.Mesh | null,
    pupilL: null as THREE.Mesh | null,
    pupilR: null as THREE.Mesh | null,
    tearMat: null as THREE.MeshStandardMaterial | null,
    tearL: null as THREE.Mesh | null,
    tearR: null as THREE.Mesh | null,
    handL: null as THREE.Mesh | null,
    handR: null as THREE.Mesh | null,
    thumbsUpGroup: null as THREE.Group | null,
  });

  // Stop waving on interaction
  const stopWaving = () => {
    animStateRef.current.isWaving = false;
  };

  const resetStates = () => {
    const s = animStateRef.current;
    s.isCovering = false;
    s.isCrying = false;
    s.isSuccess = false;
    if (s.character) s.character.position.set(0, 0, 0);
    if (s.tearL) s.tearL.position.y = 0.2;
    if (s.tearR) s.tearR.position.y = 0.2;
    if (s.mouth) {
      s.mouth.rotation.set(0, 0, Math.PI);
      s.mouth.position.set(0, -0.42, 1.56);
    }
    if (cardRef.current) {
      cardRef.current.style.boxShadow =
        "0 25px 60px -15px rgba(15, 23, 42, 0.4), 0 0 35px rgba(99, 102, 241, 0.25)";
    }
    setErrorMessage("");
  };

  const coverEyes3D = () => {
    stopWaving();
    resetStates();
    animStateRef.current.isCovering = true;
  };

  const uncoverEyes3D = () => {
    animStateRef.current.isCovering = false;
  };

  const triggerWrong3D = (msg: string) => {
    stopWaving();
    resetStates();
    const s = animStateRef.current;
    s.isCrying = true;
    setErrorMessage(msg);

    // Flip mouth to sad frown
    if (s.mouth) {
      s.mouth.rotation.set(0, 0, 0);
      s.mouth.position.set(0, -0.55, 1.56);
    }

    // Red glow & shake
    if (pwdRef.current) {
      pwdRef.current.classList.add("input-error");
      setTimeout(() => pwdRef.current?.classList.remove("input-error"), 500);
    }
    if (cardRef.current) {
      cardRef.current.style.boxShadow =
        "0 30px 90px -20px rgba(0, 0, 0, 0.9), 0 0 35px rgba(239, 68, 68, 0.6)";
    }
  };

  const triggerCorrect3D = () => {
    stopWaving();
    resetStates();
    const s = animStateRef.current;
    s.isSuccess = true;

    // Happy smile
    if (s.mouth) {
      s.mouth.rotation.set(0, 0, Math.PI);
      s.mouth.position.set(0, -0.42, 1.56);
    }
    if (cardRef.current) {
      cardRef.current.style.boxShadow =
        "0 30px 90px -20px rgba(0, 0, 0, 0.9), 0 0 35px rgba(34, 197, 94, 0.6)";
    }
  };

  // Initialize Three.js Engine
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animId: number;
    const width = container.clientWidth || 320;
    const height = 230;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.5);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.85));

    const keyLight = new THREE.DirectionalLight(0xfff5ea, 1.2);
    keyLight.position.set(4, 8, 6);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0xa855f7, 3.5, 12);
    rimLight.position.set(-5, -2, -1);
    scene.add(rimLight);

    const character = new THREE.Group();
    scene.add(character);
    animStateRef.current.character = character;

    // Materials
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35, metalness: 0.05 });
    const earInnerMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.4 });
    const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 });
    const darkMat = new THREE.MeshBasicMaterial({ color: 0x090d16 });
    const tearMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.05, transparent: true, opacity: 0 });
    animStateRef.current.tearMat = tearMat;

    // 1. Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(1.5, 48, 48), skinMat);
    character.add(head);

    // 2. Ears
    const earL = new THREE.Mesh(new THREE.SphereGeometry(0.48, 24, 24), skinMat);
    earL.position.set(-1.3, 1.3, -0.2);
    const innerEarL = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 20), earInnerMat);
    innerEarL.position.set(-1.3, 1.3, 0.05);

    const earR = earL.clone();
    earR.position.set(1.3, 1.3, -0.2);
    const innerEarR = innerEarL.clone();
    innerEarR.position.set(1.3, 1.3, 0.05);
    character.add(earL, innerEarL, earR, innerEarR);

    // 3. Snout & Nose
    const snout = new THREE.Mesh(
      new THREE.SphereGeometry(0.48, 24, 24),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4 })
    );
    snout.position.set(0, -0.25, 1.25);
    snout.scale.set(1.2, 0.8, 0.8);
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), darkMat);
    nose.position.set(0, -0.12, 1.62);
    character.add(snout, nose);

    // 4. Eyes (Track mouse)
    const eyeWhiteL = new THREE.Mesh(new THREE.SphereGeometry(0.32, 24, 24), eyeWhiteMat);
    eyeWhiteL.position.set(-0.52, 0.35, 1.32);
    const eyeWhiteR = eyeWhiteL.clone();
    eyeWhiteR.position.set(0.52, 0.35, 1.32);

    const pupilL = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 16), darkMat);
    pupilL.position.set(-0.52, 0.35, 1.58);
    const pupilR = pupilL.clone();
    pupilR.position.set(0.52, 0.35, 1.58);
    character.add(eyeWhiteL, eyeWhiteR, pupilL, pupilR);
    animStateRef.current.pupilL = pupilL;
    animStateRef.current.pupilR = pupilR;

    // 5. Dynamic Mouth
    const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.04, 16, 32, Math.PI), darkMat);
    mouth.position.set(0, -0.42, 1.56);
    mouth.rotation.set(0, 0, Math.PI); // smiling
    character.add(mouth);
    animStateRef.current.mouth = mouth;

    // 6. Left & Right 3D Hands
    const handL = new THREE.Mesh(new THREE.SphereGeometry(0.48, 24, 24), skinMat);
    handL.position.set(-1.8, -2.0, 0.6);
    const handR = handL.clone();
    handR.position.set(1.8, -2.0, 0.6);
    scene.add(handL, handR);
    animStateRef.current.handL = handL;
    animStateRef.current.handR = handR;

    // 7. 3D Teardrops (😭)
    const tearGeo = new THREE.SphereGeometry(0.16, 16, 16);
    tearGeo.scale(1, 1.8, 1);
    const tearL = new THREE.Mesh(tearGeo, tearMat);
    tearL.position.set(-0.52, 0.1, 1.6);
    const tearR = new THREE.Mesh(tearGeo, tearMat);
    tearR.position.set(0.52, 0.1, 1.6);
    character.add(tearL, tearR);
    animStateRef.current.tearL = tearL;
    animStateRef.current.tearR = tearR;

    // 8. Sculpted 3D Thumbs-Up Hand (👍)
    const thumbsUpGroup = new THREE.Group();
    const palm = new THREE.Mesh(new THREE.SphereGeometry(0.45, 20, 20), skinMat);
    const thumb = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.65, 16), skinMat);
    thumb.position.set(0.12, 0.45, 0);
    thumb.rotation.z = -0.15;
    const fingers = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.3), skinMat);
    fingers.position.set(-0.15, 0.05, 0.2);
    thumbsUpGroup.add(palm, thumb, fingers);
    thumbsUpGroup.position.set(2.0, 0.4, 1.5);
    thumbsUpGroup.scale.set(0, 0, 0); // Hidden until success
    scene.add(thumbsUpGroup);
    animStateRef.current.thumbsUpGroup = thumbsUpGroup;

    // Mouse Tracking Event
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      animStateRef.current.mouse.x = Math.max(
        -1,
        Math.min(1, ((e.clientX - rect.left) / rect.width) * 2 - 1)
      );
      animStateRef.current.mouse.y = Math.max(
        -1,
        Math.min(1, -(((e.clientY - rect.top) / rect.height) * 2 - 1))
      );
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Animation Loop
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (document.hidden) return;
      const time = performance.now() * 0.003;
      const s = animStateRef.current;

      // --- STATE 3: 😭 WRONG PASSWORD (CRYING) ---
      if (s.isCrying && s.character && s.tearL && s.tearR && s.tearMat) {
        s.character.rotation.y = Math.sin(time * 26) * 0.32;
        s.character.rotation.x = 0.12;
        s.tearMat.opacity = 0.9;
        s.tearL.position.y -= 0.045;
        s.tearR.position.y -= 0.045;
        if (s.tearL.position.y < -0.8) {
          s.tearL.position.y = 0.2;
          s.tearR.position.y = 0.2;
        }
      } else if (s.tearMat) {
        s.tearMat.opacity = 0;
      }

      // --- STATE 4: 👍 CORRECT PASSWORD (THUMBS UP + BOUNCE) ---
      if (s.isSuccess && s.character && s.thumbsUpGroup) {
        s.character.position.y = Math.sin(time * 14) * 0.16;
        s.character.rotation.y = Math.sin(time * 8) * 0.2;
        s.thumbsUpGroup.rotation.z = Math.sin(time * 12) * 0.15;
      }

      // --- STATE 2: 🙈 TYPING PASSWORD (COVER EYES) ---
      if (s.isCovering && s.character) {
        s.character.rotation.x += (0.15 - s.character.rotation.x) * 0.1;
        s.character.rotation.y += (0 - s.character.rotation.y) * 0.1;
      } else if (!s.isCrying && !s.isSuccess && s.character && s.pupilL && s.pupilR) {
        // Natural mouse tracking when idle
        s.character.rotation.y += (s.mouse.x * 0.4 - s.character.rotation.y) * 0.08;
        s.character.rotation.x += (-s.mouse.y * 0.3 - s.character.rotation.x) * 0.08;

        s.pupilL.position.x = -0.52 + s.mouse.x * 0.08;
        s.pupilL.position.y = 0.35 + s.mouse.y * 0.08;
        s.pupilR.position.x = 0.52 + s.mouse.x * 0.08;
        s.pupilR.position.y = 0.35 + s.mouse.y * 0.08;
      }

      // --- STATE 1: 👋 START (3D HAND WAVE) ---
      let targetHandR = { x: 2.0, y: -2.0, z: 0.6 };
      let targetHandL = { x: -2.0, y: -2.0, z: 0.6 };

      if (s.isCovering) {
        // Hands up over eyes (🙈)
        targetHandL = { x: -0.52, y: 0.35, z: 2.25 };
        targetHandR = { x: 0.52, y: 0.35, z: 2.25 };
      } else if (s.isWaving && !s.isCrying && !s.isSuccess && s.handR) {
        // Right hand waves side-to-side in 3D (👋)
        targetHandR = {
          x: 1.4 + Math.sin(time * 8) * 0.15,
          y: 0.6,
          z: 1.2,
        };
        s.handR.rotation.z = Math.sin(time * 8) * 0.35;
      }

      if (s.handL) s.handL.position.lerp(new THREE.Vector3(targetHandL.x, targetHandL.y, targetHandL.z), 0.18);
      if (s.handR) s.handR.position.lerp(new THREE.Vector3(targetHandR.x, targetHandR.y, targetHandR.z), 0.18);

      // Thumbs-up reveal transition
      if (s.thumbsUpGroup) {
        const targetScale = s.isSuccess ? 1.0 : 0.0;
        s.thumbsUpGroup.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.18);
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", handleMouseMove);
      renderer.dispose();
      if (container) container.innerHTML = "";
    };
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const rawInput = email.trim();
    const cleanId = rawInput.toLowerCase().replace(/\s+/g, "");
    const cleanPassword = password.trim();

    if (!cleanId || !cleanPassword) {
      triggerWrong3D("Please provide both username/email and password.");
      return;
    }

    setIsSubmitting(true);

    // Official company staff accounts with multi-password tolerance
    const STAFF_REGISTRY: Record<
      string,
      { email: string; displayName: string; allowed: string[] }
    > = {
      suganya: {
        email: "suganya@nunesinstruments.com",
        displayName: "Suganya (Branch Office Intake)",
        allowed: ["suganya@2026", "suganya", "suganya123", "123456", "nunes2026", "nunes", "admin123"],
      },
      "suganya@nunesinstruments.com": {
        email: "suganya@nunesinstruments.com",
        displayName: "Suganya (Branch Office Intake)",
        allowed: ["suganya@2026", "suganya", "suganya123", "123456", "nunes2026", "nunes", "admin123"],
      },
      radha: {
        email: "radha@nunesinstruments.com",
        displayName: "Radha (Branch Office Intake)",
        allowed: ["radha@2026", "radha", "radha123", "branch", "123456", "nunes2026", "nunes", "admin123"],
      },
      "radha@nunesinstruments.com": {
        email: "radha@nunesinstruments.com",
        displayName: "Radha (Branch Office Intake)",
        allowed: ["radha@2026", "radha", "radha123", "branch", "123456", "nunes2026", "nunes", "admin123"],
      },
      rekha: {
        email: "rekha@nunesinstruments.com",
        displayName: "Rekha",
        allowed: ["rekha@2026", "rekha", "rekha123", "123456", "nunes2026", "nunes", "admin123"],
      },
      "rekha@nunesinstruments.com": {
        email: "rekha@nunesinstruments.com",
        displayName: "Rekha",
        allowed: ["rekha@2026", "rekha", "rekha123", "123456", "nunes2026", "nunes", "admin123"],
      },
      sabitha: {
        email: "sabitha@nunesinstruments.com",
        displayName: "Sabitha",
        allowed: ["sabitha@2026", "sabitha", "sabitha123", "123456", "nunes2026", "nunes", "admin123"],
      },
      "sabitha@nunesinstruments.com": {
        email: "sabitha@nunesinstruments.com",
        displayName: "Sabitha",
        allowed: ["sabitha@2026", "sabitha", "sabitha123", "123456", "nunes2026", "nunes", "admin123"],
      },
      azhalakupriya: {
        email: "azhalakupriya@nunesinstruments.com",
        displayName: "Azhalaku Priya",
        allowed: ["priya@2026", "priya", "azhalaku", "azhalakupriya", "azhalakupriya@2026", "123456", "nunes2026", "nunes", "admin123"],
      },
      priya: {
        email: "azhalakupriya@nunesinstruments.com",
        displayName: "Azhalaku Priya",
        allowed: ["priya@2026", "priya", "azhalaku", "azhalakupriya", "azhalakupriya@2026", "123456", "nunes2026", "nunes", "admin123"],
      },
      azhalaku: {
        email: "azhalakupriya@nunesinstruments.com",
        displayName: "Azhalaku Priya",
        allowed: ["priya@2026", "priya", "azhalaku", "azhalakupriya", "azhalakupriya@2026", "123456", "nunes2026", "nunes", "admin123"],
      },
      "azhalakupriya@nunesinstruments.com": {
        email: "azhalakupriya@nunesinstruments.com",
        displayName: "Azhalaku Priya",
        allowed: ["priya@2026", "priya", "azhalaku", "azhalakupriya", "azhalakupriya@2026", "123456", "nunes2026", "nunes", "admin123"],
      },
      aravindh: {
        email: "aravindh@nunesinstruments.com",
        displayName: "Aravindh",
        allowed: ["aravindh@2026", "aravindh", "aravind", "aravind@2026", "aravindh123", "123456", "nunes2026", "nunes", "admin123"],
      },
      aravind: {
        email: "aravindh@nunesinstruments.com",
        displayName: "Aravindh",
        allowed: ["aravindh@2026", "aravindh", "aravind", "aravind@2026", "aravindh123", "123456", "nunes2026", "nunes", "admin123"],
      },
      "aravindh@nunesinstruments.com": {
        email: "aravindh@nunesinstruments.com",
        displayName: "Aravindh",
        allowed: ["aravindh@2026", "aravindh", "aravind", "aravind@2026", "aravindh123", "123456", "nunes2026", "nunes", "admin123"],
      },
      senthil: {
        email: "senthil@nunesinstruments.com",
        displayName: "Senthil Kumar (Service Mechanic)",
        allowed: ["senthil@2026", "senthil", "senthil123", "mechanic", "123456", "nunes2026", "nunes", "admin123"],
      },
      "senthil@nunesinstruments.com": {
        email: "senthil@nunesinstruments.com",
        displayName: "Senthil Kumar (Service Mechanic)",
        allowed: ["senthil@2026", "senthil", "senthil123", "mechanic", "123456", "nunes2026", "nunes", "admin123"],
      },
      md: {
        email: "md@nunesinstruments.com",
        displayName: "MD (Management)",
        allowed: ["md@nunes2026", "md", "md2026", "md123", "nunes", "nunes2026", "123456", "admin123"],
      },
      director: {
        email: "md@nunesinstruments.com",
        displayName: "MD (Management)",
        allowed: ["md@nunes2026", "md", "md2026", "md123", "nunes", "nunes2026", "123456", "admin123"],
      },
      "md@nunesinstruments.com": {
        email: "md@nunesinstruments.com",
        displayName: "MD (Management)",
        allowed: ["md@nunes2026", "md", "md2026", "md123", "nunes", "nunes2026", "123456", "admin123"],
      },
      admin: {
        email: "admin@nunes.com",
        displayName: "Administrator",
        allowed: ["admin123", "admin", "nunes2026", "123456"],
      },
      "admin@nunes.com": {
        email: "admin@nunes.com",
        displayName: "Administrator",
        allowed: ["admin123", "admin", "nunes2026", "123456"],
      },
      "nunes@operations.com": {
        email: "nunes@operations.com",
        displayName: "Administrator",
        allowed: ["admin123", "admin", "nunes2026", "123456"],
      },
    };

    let users: { email: string; password: string }[] = [];
    try {
      users = JSON.parse(localStorage.getItem("3d_auth_users") || "[]");
    } catch {}

    if (mode === "signup") {
      // If user is registering or updating password
      const updatedUsers = users.filter((u) => u.email.toLowerCase().replace(/\s+/g, "") !== cleanId);
      const newUser = { email: cleanId, password: cleanPassword };
      updatedUsers.push(newUser);
      try {
        localStorage.setItem("3d_auth_users", JSON.stringify(updatedUsers));
        void syncFormToCloud("auth_user", cleanId, cleanId, newUser);
      } catch {}

      triggerCorrect3D();

      setTimeout(() => {
        const canonical = STAFF_REGISTRY[cleanId]?.email || cleanId;
        const session = { email: canonical, loggedInAt: new Date().toISOString() };
        savePersistentSession(session);
        localStorage.setItem("nunes_active_staff_id", cleanId);
        window.dispatchEvent(new CustomEvent("nunes:records-synced"));
        const targetRoute = (!redirectTo || redirectTo === "/dashboard" || redirectTo === "/login") ? getRoleDestination(canonical) : redirectTo;
        if (onSuccess) {
          try {
            onSuccess();
          } catch {}
        }
        window.location.href = targetRoute;
      }, 600);
    } else {
      // Sign In
      let authenticatedEmail = "";

      // Check user-modified passwords from Settings first
      let customPasswords: Record<string, string> = {};
      try {
        customPasswords = JSON.parse(localStorage.getItem("nunes_custom_passwords") || "{}");
      } catch {}

      const customPass = customPasswords[cleanId] || customPasswords[cleanId.split('@')[0]];
      if (customPass) {
        if (cleanPassword === customPass) {
          authenticatedEmail = STAFF_REGISTRY[cleanId]?.email || (cleanId.includes('@') ? cleanId : `${cleanId}@nunesinstruments.com`);
        }
      }

      if (!authenticatedEmail) {
        const staff = STAFF_REGISTRY[cleanId];
        if (staff) {
          if (staff.allowed.includes(cleanPassword)) {
            authenticatedEmail = staff.email;
          }
        }
      }

      if (!authenticatedEmail) {
        const found = users.find(
          (u) =>
            u.email.toLowerCase().replace(/\s+/g, "") === cleanId &&
            u.password === cleanPassword
        );
        if (found) {
          authenticatedEmail = found.email;
        }
      }

      if (!authenticatedEmail) {
        triggerWrong3D("Invalid username or password. Check staff list below or click a chip.");
        setIsSubmitting(false);
        return;
      }

      triggerCorrect3D();

      setTimeout(() => {
        const session = { email: authenticatedEmail, loggedInAt: new Date().toISOString() };
        savePersistentSession(session);
        localStorage.setItem("nunes_active_staff_id", cleanId);
        window.dispatchEvent(new CustomEvent("nunes:records-synced"));
        const targetRoute = (!redirectTo || redirectTo === "/dashboard" || redirectTo === "/login") ? getRoleDestination(authenticatedEmail) : redirectTo;
        if (onSuccess) {
          try {
            onSuccess();
          } catch {}
        }
        window.location.href = targetRoute;
      }, 600);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: isModal ? "auto" : "100vh",
        background: isModal
          ? "transparent"
          : "linear-gradient(rgba(8, 12, 22, 0.45), rgba(8, 12, 22, 0.72)), url('/login-bg.png') center/cover no-repeat, #090d16",
        padding: "1.5rem",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}
    >
      <div
        ref={cardRef}
        style={{
          background: "rgba(15, 23, 42, 0.95)",
          border: "1.5px solid rgba(255, 255, 255, 0.18)",
          backdropFilter: "blur(25px)",
          WebkitBackdropFilter: "blur(25px)",
          borderRadius: "28px",
          padding: "1.5rem 1.8rem 2rem",
          width: "100%",
          maxWidth: "430px",
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.1)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          transition: "box-shadow 0.4s ease",
          position: "relative",
        }}
      >
        {isModal && onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              background: "rgba(255, 255, 255, 0.12)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              color: "#ffffff",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              cursor: "pointer",
              display: "grid",
              placeItems: "center",
              fontSize: "14px",
              fontWeight: 700,
            }}
          >
            ✕
          </button>
        )}

        {/* Company Branding Badge */}
        <div style={{ textAlign: "center", marginBottom: "4px", width: "100%" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(99, 102, 241, 0.2)",
              border: "1px solid rgba(129, 140, 248, 0.4)",
              padding: "4px 12px",
              borderRadius: "999px",
              fontSize: "11px",
              fontWeight: 800,
              letterSpacing: "0.08em",
              color: "#e0e7ff",
              textTransform: "uppercase",
            }}
          >
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px #22c55e" }} />
            <span>NUNES INSTRUMENTS</span>
          </div>
          <div style={{ fontSize: "12px", fontWeight: 600, color: "#94a3b8", marginTop: "3px" }}>
            Coimbatore Operations Gateway
          </div>
        </div>

        {/* Pure 3D Canvas Box */}
        <div
          ref={containerRef}
          style={{
            width: "100%",
            height: "210px",
            cursor: "grab",
            marginBottom: "0.5rem",
          }}
        />

        {/* Minimal Switcher */}
        <div
          style={{
            display: "flex",
            background: "#1e293b",
            border: "1.5px solid #334155",
            borderRadius: "14px",
            padding: "4px",
            width: "100%",
            marginBottom: "1.1rem",
          }}
        >
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              resetStates();
            }}
            style={{
              flex: 1,
              padding: "10px",
              background: mode === "signin" ? "#4f46e5" : "transparent",
              border: "none",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "0.85rem",
              borderRadius: "10px",
              cursor: "pointer",
              transition: "all 0.25s",
              boxShadow: mode === "signin" ? "0 4px 15px rgba(79, 70, 229, 0.5)" : "none",
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              resetStates();
            }}
            style={{
              flex: 1,
              padding: "10px",
              background: mode === "signup" ? "#4f46e5" : "transparent",
              border: "none",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "0.85rem",
              borderRadius: "10px",
              cursor: "pointer",
              transition: "all 0.25s",
              boxShadow: mode === "signup" ? "0 4px 15px rgba(79, 70, 229, 0.5)" : "none",
            }}
          >
            Register / Reset
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleAuth}
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label
              htmlFor="auth-email-input"
              style={{
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.04em",
                color: "#f8fafc",
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>👤 Username, Email, or Staff ID</span>
              <span style={{ fontSize: "11px", color: "#38bdf8", fontWeight: 600, textTransform: "none" }}>Required</span>
            </label>
            <input
              id="auth-email-input"
              className="nunes-auth-input"
              type="text"
              placeholder="e.g. radha, senthil, suganya, md, admin"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => {
                stopWaving();
                resetStates();
              }}
              style={{
                width: "100%",
                background: "#0f172a",
                border: "1.5px solid #475569",
                padding: "13px 16px",
                borderRadius: "12px",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: 600,
                outline: "none",
                boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.4)",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label
              htmlFor="auth-password-input"
              style={{
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.04em",
                color: "#f8fafc",
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>🔒 Password</span>
              <span style={{ fontSize: "11px", color: "#cbd5e1", fontWeight: 500, textTransform: "none" }}>[name]@2026 or admin123</span>
            </label>
            <input
              id="auth-password-input"
              ref={pwdRef}
              className="nunes-auth-input"
              type="password"
              placeholder="Enter your security password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={coverEyes3D}
              onBlur={uncoverEyes3D}
              style={{
                width: "100%",
                background: "#0f172a",
                border: "1.5px solid #475569",
                padding: "13px 16px",
                borderRadius: "12px",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: 600,
                outline: "none",
                boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.4)",
              }}
            />
          </div>

          {errorMessage && (
            <div
              style={{
                color: "#fca5a5",
                background: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                padding: "8px 12px",
                borderRadius: "8px",
                fontSize: "12px",
                textAlign: "center",
                fontWeight: 600,
              }}
            >
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              marginTop: "0.4rem",
              padding: "14px",
              background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
              color: "#ffffff",
              border: "none",
              borderRadius: "14px",
              fontSize: "1.05rem",
              fontWeight: 700,
              letterSpacing: "0.02em",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              boxShadow: "0 8px 25px rgba(79, 70, 229, 0.45)",
              transition: "all 0.3s ease",
            }}
          >
            {isSubmitting ? "Authenticating..." : mode === "signup" ? "Create / Update Account →" : "Sign In to Operations →"}
          </button>
        </form>

        {/* Staff 1-Click Quick Select */}
        <div style={{ width: "100%", marginTop: "1.2rem", paddingTop: "1rem", borderTop: "1px solid rgba(255, 255, 255, 0.15)" }}>
          <div
            style={{
              fontSize: "12px",
              color: "#f8fafc",
              textAlign: "center",
              marginBottom: "10px",
              fontWeight: 800,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            <span>⚡ 1-Click Staff Fill:</span>
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "6px",
              justifyContent: "center",
            }}
          >
            {[
              { label: "Suganya", role: "Branch", color: "#22c55e", id: "suganya", pass: "suganya@2026" },
              { label: "Radha", role: "Branch", color: "#22c55e", id: "radha", pass: "radha@2026" },
              { label: "Rekha", role: "Billing", color: "#06b6d4", id: "rekha", pass: "rekha@2026" },
              { label: "Sabitha", role: "Accounts", color: "#06b6d4", id: "sabitha", pass: "sabitha@2026" },
              { label: "Priya", role: "Desk", color: "#06b6d4", id: "priya", pass: "priya@2026" },
              { label: "Senthil", role: "Repair", color: "#f59e0b", id: "senthil", pass: "senthil@2026" },
              { label: "Aravindh", role: "Lead", color: "#38bdf8", id: "aravindh", pass: "aravindh@2026" },
              { label: "MD", role: "Mgmt", color: "#a855f7", id: "md", pass: "md@nunes2026" },
              { label: "Admin", role: "Admin", color: "#ec4899", id: "admin", pass: "admin123" },
            ].map((staff) => {
              let cp: Record<string, string> = {};
              try {
                cp = JSON.parse(localStorage.getItem("nunes_custom_passwords") || "{}");
              } catch {}
              const currentPass = cp[staff.id] || cp[staff.id + "@nunesinstruments.com"] || staff.pass;
              return (
                <button
                  key={staff.id}
                  type="button"
                  className="nunes-chip-btn"
                  onClick={() => {
                    setMode("signin");
                    setEmail(staff.id);
                    setPassword(currentPass);
                    stopWaving();
                    resetStates();
                  }}
                  style={{
                    padding: "6px 11px",
                    borderRadius: "10px",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: staff.color }} />
                  <span>{staff.label}</span>
                  <span style={{ fontSize: "10px", color: "#cbd5e1", fontWeight: 500 }}>({staff.role})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .nunes-auth-input {
          background-color: #0f172a !important;
          color: #ffffff !important;
          border: 1.5px solid #475569 !important;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .nunes-auth-input:focus {
          border-color: #818cf8 !important;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.35), inset 0 2px 4px rgba(0, 0, 0, 0.4) !important;
        }
        .nunes-auth-input::placeholder {
          color: #94a3b8 !important;
          opacity: 1 !important;
          font-weight: 500 !important;
        }
        .nunes-auth-input:-webkit-autofill,
        .nunes-auth-input:-webkit-autofill:hover,
        .nunes-auth-input:-webkit-autofill:focus {
          -webkit-text-fill-color: #ffffff !important;
          -webkit-box-shadow: 0 0 0px 1000px #0f172a inset !important;
          box-shadow: 0 0 0px 1000px #0f172a inset !important;
          transition: background-color 5000s ease-in-out 0s;
        }
        .nunes-chip-btn {
          background: #1e293b !important;
          color: #ffffff !important;
          border: 1.5px solid #475569 !important;
          transition: all 0.15s ease !important;
        }
        .nunes-chip-btn:hover {
          background: #334155 !important;
          border-color: #818cf8 !important;
          transform: translateY(-1px);
        }
        .input-error {
          animation: shake 0.4s ease-in-out;
          border-color: #ef4444 !important;
          box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.6) !important;
        }
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          20%,
          60% {
            transform: translateX(-8px);
          }
          40%,
          80% {
            transform: translateX(8px);
          }
        }
      `}</style>
    </div>
  );
}
