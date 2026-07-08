"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

type Props = {
  colour: string;
  garmentType: string;
  numberText: string;
  decalUrl?: string;
};

export function GarmentPreview({ colour, garmentType, numberText, decalUrl }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#eef4f1");

    const camera = new THREE.PerspectiveCamera(38, host.clientWidth / 420, 0.1, 100);
    camera.position.set(0, 0.55, 5.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(host.clientWidth, 420);
    renderer.domElement.className = "preview-canvas";
    host.innerHTML = "";
    host.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight("#ffffff", 1.8));
    const key = new THREE.DirectionalLight("#ffffff", 2.6);
    key.position.set(3, 4, 6);
    scene.add(key);

    const group = new THREE.Group();
    scene.add(group);

    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colour || "#18365f"),
      roughness: 0.66,
      metalness: 0.02,
    });

    const torsoHeight = garmentType === "hoodie" ? 2.55 : garmentType === "polo" ? 2.3 : 2.35;
    const torso = new THREE.Mesh(new THREE.BoxGeometry(1.9, torsoHeight, 0.28, 8, 8, 2), material);
    torso.position.y = -0.15;
    group.add(torso);

    const sleeveGeo = new THREE.BoxGeometry(0.64, 1.18, 0.24);
    const leftSleeve = new THREE.Mesh(sleeveGeo, material);
    leftSleeve.rotation.z = -0.52;
    leftSleeve.position.set(-1.18, 0.42, 0);
    group.add(leftSleeve);

    const rightSleeve = new THREE.Mesh(sleeveGeo, material);
    rightSleeve.rotation.z = 0.52;
    rightSleeve.position.set(1.18, 0.42, 0);
    group.add(rightSleeve);

    const collar = new THREE.Mesh(
      new THREE.TorusGeometry(0.42, 0.045, 12, 48, Math.PI),
      new THREE.MeshStandardMaterial({ color: "#f8faf7", roughness: 0.7 }),
    );
    collar.rotation.x = Math.PI;
    collar.position.set(0, 1.13, 0.17);
    group.add(collar);

    if (garmentType === "hoodie") {
      const hood = new THREE.Mesh(
        new THREE.TorusGeometry(0.58, 0.11, 16, 48, Math.PI),
        material,
      );
      hood.rotation.x = Math.PI;
      hood.position.set(0, 1.38, -0.05);
      group.add(hood);
    }

    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    const texture = new THREE.CanvasTexture(canvas);
    const decal = new THREE.Mesh(
      new THREE.PlaneGeometry(1.08, 1.08),
      new THREE.MeshBasicMaterial({ map: texture, transparent: true }),
    );
    decal.position.set(0, 0.03, 0.151);
    group.add(decal);

    const drawTexture = (image?: HTMLImageElement) => {
      if (!ctx) return;
      ctx.clearRect(0, 0, 512, 512);
      if (image) {
        ctx.globalAlpha = 0.92;
        ctx.drawImage(image, 136, 62, 240, 160);
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#17211b";
      ctx.lineWidth = 8;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "bold 150px Arial";
      const text = numberText || "10";
      ctx.strokeText(text.slice(0, 8), 256, image ? 330 : 260);
      ctx.fillText(text.slice(0, 8), 256, image ? 330 : 260);
      texture.needsUpdate = true;
    };

    if (decalUrl) {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = () => drawTexture(image);
      image.onerror = () => drawTexture();
      image.src = decalUrl;
    } else {
      drawTexture();
    }

    let frame = 0;
    let disposed = false;
    const animate = () => {
      if (disposed) return;
      frame = requestAnimationFrame(animate);
      group.rotation.y += 0.01;
      renderer.render(scene, camera);
    };
    animate();

    const resize = () => {
      camera.aspect = host.clientWidth / 420;
      camera.updateProjectionMatrix();
      renderer.setSize(host.clientWidth, 420);
    };
    window.addEventListener("resize", resize);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      renderer.dispose();
      material.dispose();
      texture.dispose();
    };
  }, [colour, decalUrl, garmentType, numberText]);

  return (
    <div className="preview-wrap">
      <div ref={hostRef} />
      <noscript>
        <div className="empty-state">Static garment preview unavailable without JavaScript.</div>
      </noscript>
    </div>
  );
}
