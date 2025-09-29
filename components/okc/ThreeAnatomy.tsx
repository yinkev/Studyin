'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

export function ThreeAnatomy({ height = 256 }: { height?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [threeReady, setThreeReady] = useState(false);
  const [loaderReady, setLoaderReady] = useState(false);

  useEffect(() => {
    if (!threeReady || !loaderReady) return;
    const root = containerRef.current;
    if (!root) return;
    const THREE = (window as any).THREE as any;
    if (!THREE) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, root.clientWidth / height, 0.1, 1000);
    camera.position.set(0, 1, 3);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(root.clientWidth, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    root.innerHTML = '';
    root.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(3, 5, 2);
    scene.add(dir);

    const group = new THREE.Group();
    scene.add(group);

    const loader = new (THREE as any).GLTFLoader();
    const url = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF/Duck.gltf';
    loader.load(
      url,
      (gltf: any) => {
        const model = gltf.scene;
        model.scale.setScalar(1.2);
        group.add(model);
      },
      undefined,
      () => {
        // Fallback if load fails: show a simple geometry
        const geom = new THREE.TorusKnotGeometry(0.6, 0.2, 120, 16);
        const mat = new THREE.MeshStandardMaterial({ color: 0x58cc02, roughness: 0.4, metalness: 0.1 });
        const mesh = new THREE.Mesh(geom, mat);
        group.add(mesh);
      }
    );

    const rayOrigin = { x: 0, y: 0 };
    let isDown = false;
    let rotX = 0;
    let rotY = 0;
    const onDown = (e: MouseEvent) => { isDown = true; rayOrigin.x = e.clientX; rayOrigin.y = e.clientY; };
    const onMove = (e: MouseEvent) => {
      if (!isDown) return;
      const dx = (e.clientX - rayOrigin.x) / root.clientWidth;
      const dy = (e.clientY - rayOrigin.y) / height;
      rotY += dx * Math.PI;
      rotX += dy * Math.PI;
      group.rotation.y = rotY;
      group.rotation.x = rotX;
      rayOrigin.x = e.clientX; rayOrigin.y = e.clientY;
    };
    const onUp = () => { isDown = false; };
    const onWheel = (e: WheelEvent) => {
      camera.position.z = Math.max(1.2, Math.min(8, camera.position.z + e.deltaY * 0.002));
    };
    renderer.domElement.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: true });

    const onResize = () => {
      const w = root.clientWidth;
      renderer.setSize(w, height);
      camera.aspect = w / height;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);

    let raf = 0;
    const tick = () => {
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      renderer.domElement.removeEventListener('wheel', onWheel);
      renderer.dispose();
      root.innerHTML = '';
    };
  }, [threeReady, loaderReady, height]);

  return (
    <div>
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js" strategy="afterInteractive" onLoad={() => setThreeReady(true)} />
      <Script src="https://threejs.org/examples/js/loaders/GLTFLoader.js" strategy="afterInteractive" onLoad={() => setLoaderReady(true)} />
      <div ref={containerRef} style={{ height }} />
    </div>
  );
}

