"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

type Props = {
  colour: string;
  fontFamily: string;
  fontSize: number;
  garmentType: string;
  numberText: string;
  teamName: string;
  customFontUrl?: string;
  decalUrl?: string;
};

const trimMaterial = new THREE.MeshStandardMaterial({
  color: "#f8faf7",
  roughness: 0.62,
  metalness: 0.02,
});

function makeTorsoShape(garmentType: string) {
  const bottom = garmentType === "hoodie" ? -1.45 : -1.35;
  const shoulder = garmentType === "polo" ? 0.95 : 1.02;
  const shape = new THREE.Shape();
  shape.moveTo(-0.78, bottom);
  shape.bezierCurveTo(-0.86, -0.7, -0.9, 0.2, -0.82, shoulder);
  shape.bezierCurveTo(-0.54, 1.1, -0.26, 1.18, -0.13, 1.02);
  shape.quadraticCurveTo(0, 0.9, 0.13, 1.02);
  shape.bezierCurveTo(0.26, 1.18, 0.54, 1.1, 0.82, shoulder);
  shape.bezierCurveTo(0.9, 0.2, 0.86, -0.7, 0.78, bottom);
  shape.bezierCurveTo(0.42, bottom - 0.06, -0.42, bottom - 0.06, -0.78, bottom);
  return shape;
}

function makeSleeveShape(side: -1 | 1) {
  const shape = new THREE.Shape();
  shape.moveTo(side * 0.76, 0.84);
  shape.lineTo(side * 1.25, 0.62);
  shape.lineTo(side * 1.54, -0.36);
  shape.lineTo(side * 1.15, -0.58);
  shape.lineTo(side * 0.84, -0.08);
  shape.quadraticCurveTo(side * 0.74, 0.34, side * 0.76, 0.84);
  return shape;
}

function createPanelTexture({
  colour,
  decalUrl,
  fontFamily,
  fontSize,
  numberText,
  teamName,
}: {
  colour: string;
  decalUrl?: string;
  fontFamily: string;
  fontSize: number;
  numberText: string;
  teamName: string;
}) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;

  const draw = (image?: HTMLImageElement) => {
    if (!ctx) return;
    const base = new THREE.Color(colour || "#18365f");
    const shade = `rgb(${Math.max(0, base.r * 255 - 28)}, ${Math.max(0, base.g * 255 - 28)}, ${Math.max(0, base.b * 255 - 28)})`;
    const light = `rgb(${Math.min(255, base.r * 255 + 24)}, ${Math.min(255, base.g * 255 + 24)}, ${Math.min(255, base.b * 255 + 24)})`;

    const gradient = ctx.createLinearGradient(0, 0, 1024, 1024);
    gradient.addColorStop(0, light);
    gradient.addColorStop(0.48, colour || "#18365f");
    gradient.addColorStop(1, shade);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1024, 1024);

    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    for (let y = 18; y < 1024; y += 13) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1024, y + Math.sin(y * 0.02) * 5);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.18;
    for (let x = 28; x < 1024; x += 38) {
      ctx.fillRect(x, 0, 1, 1024);
    }
    ctx.globalAlpha = 1;

    if (image) {
      ctx.save();
      ctx.globalAlpha = 0.94;
      ctx.shadowColor = "rgba(0,0,0,.2)";
      ctx.shadowBlur = 16;
      ctx.drawImage(image, 352, 180, 320, 205);
      ctx.restore();
    }

    const family = fontFamily || "Arial";
    const team = teamName.trim().slice(0, 24).toUpperCase();
    const number = (numberText || "10").trim().slice(0, 8);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "rgba(12,18,14,.85)";
    ctx.fillStyle = "#ffffff";

    if (team) {
      ctx.font = `800 ${Math.max(34, Math.round(fontSize * 0.42))}px "${family}", Arial, sans-serif`;
      ctx.lineWidth = 9;
      ctx.strokeText(team, 512, image ? 458 : 330);
      ctx.fillText(team, 512, image ? 458 : 330);
    }

    ctx.font = `900 ${Math.max(64, fontSize)}px "${family}", Arial Black, Arial, sans-serif`;
    ctx.lineWidth = 14;
    ctx.strokeText(number, 512, image ? 645 : 545);
    ctx.fillText(number, 512, image ? 645 : 545);
    texture.needsUpdate = true;
  };

  if (decalUrl) {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => draw(image);
    image.onerror = () => draw();
    image.src = decalUrl;
  } else {
    draw();
  }

  return texture;
}

export function GarmentPreview({
  colour,
  customFontUrl,
  decalUrl,
  fontFamily,
  fontSize,
  garmentType,
  numberText,
  teamName,
}: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let uploadedFont: FontFace | null = null;

    async function buildScene() {
      const activeFontFamily = customFontUrl ? "Uploaded Jersey Font" : fontFamily;
      if (customFontUrl) {
        try {
          uploadedFont = new FontFace(activeFontFamily, `url(${customFontUrl})`);
          await uploadedFont.load();
          if (!disposed) document.fonts.add(uploadedFont);
        } catch {
          uploadedFont = null;
        }
      }

      if (disposed || !hostRef.current) return;
      const target = hostRef.current;
      const scene = new THREE.Scene();
      scene.background = new THREE.Color("#eef4f1");

      const camera = new THREE.PerspectiveCamera(32, target.clientWidth / 460, 0.1, 100);
      camera.position.set(0, 0.18, 5.4);

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(target.clientWidth, 460);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.domElement.className = "preview-canvas";
      target.innerHTML = "";
      target.appendChild(renderer.domElement);

      scene.add(new THREE.HemisphereLight("#ffffff", "#b9c7c1", 1.7));
      const key = new THREE.DirectionalLight("#ffffff", 3.1);
      key.position.set(3.8, 4.2, 5.2);
      key.castShadow = true;
      scene.add(key);
      const rim = new THREE.DirectionalLight("#cfe8ff", 1.3);
      rim.position.set(-3.5, 2.5, -3);
      scene.add(rim);

      const group = new THREE.Group();
      group.rotation.x = -0.04;
      scene.add(group);

      const panelTexture = createPanelTexture({
        colour,
        decalUrl,
        fontFamily: activeFontFamily,
        fontSize,
        numberText,
        teamName,
      });

      const torsoMaterial = new THREE.MeshStandardMaterial({
        map: panelTexture,
        roughness: 0.78,
        metalness: 0.02,
        side: THREE.DoubleSide,
      });
      const sideMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(colour || "#18365f").multiplyScalar(0.82),
        roughness: 0.82,
        metalness: 0.01,
        side: THREE.DoubleSide,
      });

      const torso = new THREE.Mesh(makeTorsoShape(garmentType), torsoMaterial);
      torso.castShadow = true;
      group.add(torso);

      const backPanel = new THREE.Mesh(makeTorsoShape(garmentType), sideMaterial);
      backPanel.position.z = -0.11;
      backPanel.scale.set(0.98, 0.98, 0.98);
      group.add(backPanel);

      for (const side of [-1, 1] as const) {
        const sleeve = new THREE.Mesh(makeSleeveShape(side), sideMaterial);
        sleeve.position.z = -0.02;
        sleeve.castShadow = true;
        group.add(sleeve);

        const cuff = new THREE.Mesh(
          new THREE.PlaneGeometry(0.48, 0.08),
          trimMaterial,
        );
        cuff.position.set(side * 1.33, -0.48, 0.02);
        cuff.rotation.z = side * -0.45;
        group.add(cuff);
      }

      const collar = new THREE.Mesh(
        new THREE.TorusGeometry(0.32, 0.035, 16, 64, Math.PI * 1.05),
        trimMaterial,
      );
      collar.rotation.set(Math.PI, 0, 0);
      collar.position.set(0, 0.93, 0.05);
      group.add(collar);

      if (garmentType === "polo") {
        const placket = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.38), trimMaterial);
        placket.position.set(0, 0.7, 0.055);
        group.add(placket);
      }

      if (garmentType === "hoodie") {
        const hood = new THREE.Mesh(
          new THREE.TorusGeometry(0.48, 0.095, 18, 64, Math.PI),
          sideMaterial,
        );
        hood.rotation.x = Math.PI;
        hood.position.set(0, 1.12, -0.04);
        group.add(hood);

        const pocket = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.28), trimMaterial.clone());
        pocket.material.opacity = 0.2;
        pocket.material.transparent = true;
        pocket.position.set(0, -0.58, 0.06);
        group.add(pocket);
      }

      const seamMaterial = new THREE.LineBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.42 });
      for (const x of [-0.63, 0.63]) {
        const points = [
          new THREE.Vector3(x, 0.74, 0.07),
          new THREE.Vector3(x * 0.96, 0.1, 0.07),
          new THREE.Vector3(x * 0.9, -1.23, 0.07),
        ];
        group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), seamMaterial));
      }

      const floor = new THREE.Mesh(
        new THREE.CircleGeometry(1.9, 64),
        new THREE.MeshBasicMaterial({ color: "#cbd8d2", transparent: true, opacity: 0.32 }),
      );
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(0, -1.62, -0.32);
      scene.add(floor);

      let frame = 0;
      const clock = new THREE.Clock();
      const animate = () => {
        if (disposed) return;
        frame = requestAnimationFrame(animate);
        const t = clock.getElapsedTime();
        group.rotation.y = Math.sin(t * 0.7) * 0.36;
        group.position.y = Math.sin(t * 1.5) * 0.025;
        renderer.render(scene, camera);
      };
      animate();

      const resize = () => {
        if (!hostRef.current) return;
        camera.aspect = hostRef.current.clientWidth / 460;
        camera.updateProjectionMatrix();
        renderer.setSize(hostRef.current.clientWidth, 460);
      };
      window.addEventListener("resize", resize);

      return () => {
        cancelAnimationFrame(frame);
        window.removeEventListener("resize", resize);
        panelTexture.dispose();
        torsoMaterial.dispose();
        sideMaterial.dispose();
        seamMaterial.dispose();
        renderer.dispose();
      };
    }

    let cleanup: (() => void) | undefined;
    buildScene().then((sceneCleanup) => {
      cleanup = sceneCleanup;
    });

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [colour, customFontUrl, decalUrl, fontFamily, fontSize, garmentType, numberText, teamName]);

  return (
    <div className="preview-wrap">
      <div ref={hostRef} />
      <noscript>
        <div className="empty-state">Static garment preview unavailable without JavaScript.</div>
      </noscript>
    </div>
  );
}
