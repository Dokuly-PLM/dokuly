import axios from "axios";
import { tokenConfig } from "../../configs/auth";
import { toast } from "react-toastify";

/**
 * Opens the professional 3D STEP viewer in a new browser tab.
 * Fetches the viewer config from the backend, then opens a standalone
 * HTML page with Three.js and professional CAD viewing tools.
 */
export async function openStepViewer(fileId) {
  try {
    const response = await axios.get(
      `api/files/step/viewer-config/${fileId}/`,
      tokenConfig()
    );
    const config = response.data;
    const viewerHtml = buildViewerHtml(config);

    const viewerWindow = window.open("", "_blank");
    if (viewerWindow) {
      viewerWindow.document.write(viewerHtml);
      viewerWindow.document.close();
    } else {
      toast.error("Pop-up blocked. Please allow pop-ups for this site.");
    }
  } catch (err) {
    console.error("Error opening STEP viewer:", err);
    toast.error("Failed to open 3D viewer.");
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildViewerHtml(config) {
  const { filename, has_glb, glb_url, step_url, token, parent_app, parent_id } = config;
  const title = escapeHtml(filename || "3D Viewer");
  // The download URL to fetch model data — GLB preferred, STEP as fallback
  const modelUrl = has_glb ? glb_url : step_url;
  const modelType = has_glb ? "glb" : "step";
  const authToken = localStorage.getItem("token") || "";
  const canSetThumbnail = !!(parent_app && parent_id);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Dokuly 3D Viewer</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { height: 100%; overflow: hidden; font-family: Inter, -apple-system, sans-serif; }
    body { display: flex; flex-direction: column; background: #f5f5f5; }

    /* Toolbar */
    .toolbar {
      display: flex; align-items: center; gap: 2px;
      padding: 6px 12px;
      background: #fff; border-bottom: 1px solid #E5E5E5;
      z-index: 100;
    }
    .toolbar-title {
      font-size: 0.85rem; font-weight: 600; color: #333;
      margin-right: auto; padding: 0 8px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      max-width: 300px;
    }
    .toolbar-separator {
      width: 1px; height: 24px; background: #E5E5E5; margin: 0 4px;
    }
    .tool-btn {
      display: flex; align-items: center; justify-content: center;
      gap: 4px; padding: 6px 10px;
      border: none; border-radius: 4px; background: transparent;
      cursor: pointer; font-size: 0.78rem; font-weight: 600;
      color: #555; white-space: nowrap; transition: background 0.15s;
    }
    .tool-btn:hover { background: #f0f0f0; }
    .tool-btn:active { transform: scale(0.98); }
    .tool-btn.active { background: #e8f5e9; color: #165216; }
    .tool-btn svg { width: 16px; height: 16px; flex-shrink: 0; }

    /* Canvas area */
    .viewer-area { flex: 1; display: flex; position: relative; }
    #canvas3d { width: 100%; height: 100%; display: block; }

    /* Part tree sidebar */
    .part-tree {
      position: absolute; top: 0; left: 0; bottom: 0;
      width: 240px; background: rgba(255,255,255,0.95);
      border-right: 1px solid #E5E5E5; overflow-y: auto;
      font-size: 0.78rem; padding: 8px 0;
      transform: translateX(-100%); transition: transform 0.2s;
      z-index: 50;
    }
    .part-tree.open { transform: translateX(0); }
    .part-tree-item {
      padding: 4px 12px; cursor: pointer;
      display: flex; align-items: center; gap: 6px;
      color: #333; border-left: 3px solid transparent;
    }
    .part-tree-item:hover { background: #f0f0f0; }
    .part-tree-item.selected { background: #e8f5e9; border-left-color: #165216; color: #165216; }
    .part-tree-item .dot {
      width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
    }
    .part-tree-header {
      padding: 8px 12px; font-weight: 600; font-size: 0.7rem;
      text-transform: uppercase; color: #888; letter-spacing: 0.5px;
    }

    /* Status bar */
    .status-bar {
      display: flex; align-items: center; gap: 12px;
      padding: 4px 12px; background: #fff; border-top: 1px solid #E5E5E5;
      font-size: 0.72rem; color: #888;
    }

    /* Measurement overlay */
    .measurement-overlay {
      position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%);
      background: rgba(0,0,0,0.85); color: #fff; padding: 8px 16px;
      border-radius: 6px; font-size: 0.85rem; font-weight: 600;
      pointer-events: none; display: none; z-index: 60;
    }
    .measurement-overlay.visible { display: block; }

    /* Loading overlay */
    .loading-overlay {
      position: absolute; inset: 0; display: flex;
      flex-direction: column; align-items: center; justify-content: center;
      background: rgba(255,255,255,0.95); z-index: 200;
    }
    .loading-overlay.hidden { display: none; }
    .spinner {
      width: 40px; height: 40px; border: 3px solid #E5E5E5;
      border-top-color: #165216; border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    .loading-text { margin-top: 12px; font-size: 0.85rem; color: #666; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Nav cube */
    #navCube {
      position: absolute; bottom: 12px; right: 12px;
      width: 100px; height: 100px; z-index: 50;
    }

    /* Section plane indicator */
    .section-info {
      position: absolute; top: 8px; left: 50%; transform: translateX(-50%);
      background: rgba(22,82,22,0.9); color: #fff; padding: 4px 12px;
      border-radius: 4px; font-size: 0.75rem; font-weight: 600;
      display: none; z-index: 60;
    }
    .section-info.visible { display: block; }
  </style>
</head>
<body>
  <!-- Toolbar -->
  <div class="toolbar">
    <div class="toolbar-title" title="${title}">${title}</div>

    <button class="tool-btn" id="btnTree" onclick="toggleTree()" title="Assembly tree">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3h7v7H3zM14 3h7v4H14zM14 10h7v4H14zM14 17h7v4H14z"/><path d="M10 6h4M10 12h4M10 19h4"/></svg>
      Tree
    </button>

    <div class="toolbar-separator"></div>

    <button class="tool-btn" id="btnMeasurePoint" onclick="setMeasureMode('point')" title="Point-to-point distance (snaps to vertices)">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 20L20 2M6 20l-2-2M10 20l-2-2M14 20l-2-2M18 20l-2-2M20 18l-2-2M20 14l-2-2M20 10l-2-2M20 6l-2-2"/></svg>
      Point
    </button>

    <button class="tool-btn" id="btnMeasureFace" onclick="setMeasureMode('face')" title="Face-to-face distance (click two planar faces)">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="8" height="12" rx="1"/><rect x="14" y="6" width="8" height="12" rx="1"/><line x1="10" y1="12" x2="14" y2="12" stroke-dasharray="2 2"/></svg>
      Face
    </button>

    <button class="tool-btn" id="btnSection" onclick="toggleSection()" title="Add a section cutting plane">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="12" x2="21" y2="12"/></svg>
      Section
    </button>

    <button class="tool-btn" id="btnXray" onclick="toggleXray()" title="Toggle X-ray transparency mode">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 010 20" fill="currentColor" opacity="0.15"/></svg>
      X-Ray
    </button>

    <div class="toolbar-separator"></div>

    <button class="tool-btn" id="btnFit" onclick="fitToView()" title="Fit model to view">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
      Fit
    </button>

    <button class="tool-btn" id="btnReset" onclick="resetView()" title="Reset camera to initial view">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 105.64-11.36L1 10"/></svg>
      Reset
    </button>

    <button class="tool-btn" id="btnSnapshot" onclick="takeSnapshot()" title="Capture current view as PNG">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
      Snapshot
    </button>

    ${canSetThumbnail ? `
    <button class="tool-btn" id="btnThumbnail" onclick="setThumbnail()" title="Set current view as part/assembly thumbnail">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
      Set Thumbnail
    </button>
    ` : ''}

    <div class="toolbar-separator"></div>

    <button class="tool-btn" id="btnBg" onclick="toggleBackground()" title="Toggle dark/light background">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
    </button>
  </div>

  <!-- Viewer area -->
  <div class="viewer-area">
    <div class="loading-overlay" id="loading">
      <div class="spinner"></div>
      <div class="loading-text" id="loadingText">Loading 3D model...</div>
    </div>

    <div class="part-tree" id="partTree">
      <div class="part-tree-header">Assembly</div>
      <div id="partTreeList"></div>
    </div>

    <canvas id="canvas3d"></canvas>
    <canvas id="navCube"></canvas>

    <div class="measurement-overlay" id="measureOverlay"></div>
    <div class="section-info" id="sectionInfo">Section plane active - drag arrows to move</div>
  </div>

  <!-- Status bar -->
  <div class="status-bar">
    <span id="statusFile">${title}</span>
    <span id="statusTriangles"></span>
    <span id="statusDimensions"></span>
    <span style="margin-left:auto" id="statusFps"></span>
  </div>

  <!-- occt-import-js for client-side STEP parsing (UMD global) -->
  <script src="https://cdn.jsdelivr.net/npm/occt-import-js@0.0.21/dist/occt-import-js.js"></script>

  <!-- Import maps for Three.js from CDN -->
  <script type="importmap">
  {
    "imports": {
      "three": "https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js",
      "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.162.0/examples/jsm/"
    }
  }
  </script>

  <script type="module">
    import * as THREE from 'three';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
    import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

    // ── State ──
    const state = {
      scene: null,
      camera: null,
      renderer: null,
      controls: null,
      meshes: [],
      partNames: [],
      sceneBounds: new THREE.Box3(),
      initialCamPos: null,
      initialCamTarget: null,
      darkBg: false,
      measureMode: null,  // null, 'point', 'face'
      measureFirstPoint: null,
      measureFirstFace: null,  // { plane, normal, center, meshIndex }
      measurePoints: [],
      faceHighlightMesh: null,
      sectionActive: false,
      sectionPlane: null,
      sectionHelper: null,
      xrayActive: false,
      treeOpen: false,
      selectedPartIndex: -1,
      triangleCount: 0,
      lastFrameTime: performance.now(),
      frameCount: 0,
    };

    window._state = state; // expose for toolbar handlers

    // ── Init ──
    function init() {
      const canvas = document.getElementById('canvas3d');
      state.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
      state.renderer.setPixelRatio(window.devicePixelRatio);
      state.renderer.setSize(canvas.parentElement.clientWidth, canvas.parentElement.clientHeight);
      state.renderer.setClearColor(0xfafafa);
      state.renderer.shadowMap.enabled = true;
      state.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      state.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      state.renderer.toneMappingExposure = 1.0;
      state.renderer.localClippingEnabled = true;

      state.scene = new THREE.Scene();

      state.camera = new THREE.PerspectiveCamera(
        45, canvas.clientWidth / canvas.clientHeight, 0.1, 100000
      );

      state.controls = new OrbitControls(state.camera, canvas);
      state.controls.enableDamping = true;
      state.controls.dampingFactor = 0.1;
      state.controls.rotateSpeed = 0.8;

      // Lighting — studio-style setup
      const ambient = new THREE.AmbientLight(0xffffff, 0.6);
      state.scene.add(ambient);

      const hemi = new THREE.HemisphereLight(0xffffff, 0xb0b0b0, 0.5);
      state.scene.add(hemi);

      const key = new THREE.DirectionalLight(0xffffff, 1.2);
      key.position.set(1, 2, 1.5);
      key.castShadow = true;
      state.scene.add(key);

      const fill = new THREE.DirectionalLight(0xffffff, 0.6);
      fill.position.set(-1, 0.5, -0.5);
      state.scene.add(fill);

      const rim = new THREE.DirectionalLight(0xffffff, 0.4);
      rim.position.set(0, -1, 1);
      state.scene.add(rim);


      // Resize handler
      window.addEventListener('resize', onResize);

      // Mouse handlers for measurement
      canvas.addEventListener('click', onCanvasClick);
      canvas.addEventListener('mousemove', onCanvasMouseMove);

      // Nav cube
      initNavCube();

      animate();
      loadModel();
    }

    function onResize() {
      const area = document.querySelector('.viewer-area');
      const w = area.clientWidth;
      const h = area.clientHeight;
      state.camera.aspect = w / h;
      state.camera.updateProjectionMatrix();
      state.renderer.setSize(w, h);
    }

    // ── Model Loading ──
    async function loadModel() {
      const modelType = "${modelType}";
      const modelUrl = "${modelUrl}";
      const loadingText = document.getElementById('loadingText');

      try {
        if (modelType === 'glb') {
          loadingText.textContent = 'Loading 3D model...';
          await loadGlb(modelUrl);
        } else {
          loadingText.textContent = 'Parsing STEP file (this may take a moment)...';
          await loadStep(modelUrl);
        }

        finalizeScene();
        document.getElementById('loading').classList.add('hidden');
      } catch (err) {
        console.error('Failed to load model:', err);
        loadingText.textContent = 'Failed to load model: ' + err.message;
      }
    }

    async function loadGlb(url) {
      return new Promise((resolve, reject) => {
        const loader = new GLTFLoader();
        loader.load(url,
          (gltf) => {
            gltf.scene.traverse((child) => {
              if (child.isMesh) {
                state.meshes.push(child);
                state.partNames.push(child.name || 'Part ' + state.meshes.length);
                state.triangleCount += child.geometry.index
                  ? child.geometry.index.count / 3
                  : child.geometry.attributes.position.count / 3;
              }
            });
            state.scene.add(gltf.scene);
            resolve();
          },
          undefined,
          (err) => reject(err)
        );
      });
    }

    async function loadStep(url) {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const buffer = await resp.arrayBuffer();
      const fileBuffer = new Uint8Array(buffer);

      // occt-import-js is loaded via script tag as a global
      if (typeof occtimportjs === 'undefined') {
        throw new Error('occt-import-js library failed to load');
      }
      const occt = await occtimportjs();

      const result = occt.ReadStepFile(fileBuffer, null);
      if (!result || !result.meshes || result.meshes.length === 0) {
        throw new Error('No geometry found in STEP file');
      }

      for (let i = 0; i < result.meshes.length; i++) {
        const gm = result.meshes[i];
        if (!gm.attributes?.position?.array?.length) continue;

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position',
          new THREE.Float32BufferAttribute(gm.attributes.position.array, 3));
        if (gm.attributes.normal?.array?.length) {
          geometry.setAttribute('normal',
            new THREE.Float32BufferAttribute(gm.attributes.normal.array, 3));
        }
        if (gm.index?.array?.length) {
          geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(gm.index.array), 1));
        }

        const color = gm.color
          ? new THREE.Color(gm.color[0], gm.color[1], gm.color[2])
          : new THREE.Color(0.8, 0.8, 0.8);

        const material = new THREE.MeshPhysicalMaterial({
          color,
          metalness: 0.1,
          roughness: 0.6,
          clearcoat: 0.1,
          clearcoatRoughness: 0.4,
          side: THREE.DoubleSide,
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = gm.name || 'Part ' + (i + 1);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        state.scene.add(mesh);
        state.meshes.push(mesh);
        state.partNames.push(mesh.name);

        state.triangleCount += gm.index?.array?.length
          ? gm.index.array.length / 3
          : gm.attributes.position.array.length / 9;
      }
    }

    function finalizeScene() {
      // Compute bounds
      state.sceneBounds = new THREE.Box3();
      state.meshes.forEach(m => state.sceneBounds.expandByObject(m));

      const center = state.sceneBounds.getCenter(new THREE.Vector3());
      const size = state.sceneBounds.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);

      // Position camera
      const dist = maxDim * 2.2;
      state.camera.position.set(
        center.x + dist * 0.6,
        center.y + dist * 0.8,
        center.z + dist * 0.6
      );
      state.camera.near = maxDim * 0.001;
      state.camera.far = maxDim * 100;
      state.camera.updateProjectionMatrix();
      state.controls.target.copy(center);
      state.controls.update();

      state.initialCamPos = state.camera.position.clone();
      state.initialCamTarget = center.clone();


      // Reposition lights based on scene scale
      state.scene.traverse(child => {
        if (child.isDirectionalLight) {
          child.position.multiplyScalar(maxDim);
        }
      });

      // Build part tree
      buildPartTree();

      // Update status bar
      document.getElementById('statusTriangles').textContent =
        Math.round(state.triangleCount).toLocaleString() + ' triangles';
      document.getElementById('statusDimensions').textContent =
        size.x.toFixed(1) + ' x ' + size.y.toFixed(1) + ' x ' + size.z.toFixed(1) + ' mm';
    }

    // ── Part Tree ──
    function buildPartTree() {
      const list = document.getElementById('partTreeList');
      list.innerHTML = '';
      state.partNames.forEach((name, i) => {
        const el = document.createElement('div');
        el.className = 'part-tree-item';
        el.dataset.index = i;

        // Color dot
        const dot = document.createElement('span');
        dot.className = 'dot';
        const mesh = state.meshes[i];
        const mat = mesh.material;
        const c = mat.color || new THREE.Color(0.8, 0.8, 0.8);
        dot.style.background = '#' + c.getHexString();
        el.appendChild(dot);

        const label = document.createElement('span');
        label.textContent = name;
        label.style.overflow = 'hidden';
        label.style.textOverflow = 'ellipsis';
        label.style.whiteSpace = 'nowrap';
        el.appendChild(label);

        el.addEventListener('click', () => selectPart(i));
        list.appendChild(el);
      });
    }

    // ── Part Selection ──
    window.selectPart = function(index) {
      // Deselect previous
      if (state.selectedPartIndex >= 0) {
        const prev = state.meshes[state.selectedPartIndex];
        if (prev && prev.userData.originalMaterial) {
          prev.material = prev.userData.originalMaterial;
        }
      }

      if (index === state.selectedPartIndex) {
        // Toggle off
        state.selectedPartIndex = -1;
        updateTreeSelection(-1);
        return;
      }

      state.selectedPartIndex = index;
      const mesh = state.meshes[index];
      if (mesh) {
        if (!mesh.userData.originalMaterial) {
          mesh.userData.originalMaterial = mesh.material;
        }
        mesh.material = new THREE.MeshPhysicalMaterial({
          color: 0x165216,
          metalness: 0.1,
          roughness: 0.5,
          emissive: 0x0a2e0a,
          emissiveIntensity: 0.2,
          side: THREE.DoubleSide,
        });

        // Fit camera to selected part
        const box = new THREE.Box3().setFromObject(mesh);
        const center = box.getCenter(new THREE.Vector3());
        state.controls.target.copy(center);
        state.controls.update();
      }
      updateTreeSelection(index);
    };

    function updateTreeSelection(index) {
      document.querySelectorAll('.part-tree-item').forEach((el, i) => {
        el.classList.toggle('selected', i === index);
      });
    }

    // ── Measurement ──
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    function getIntersection(event) {
      const canvas = state.renderer.domElement;
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, state.camera);
      const targets = state.meshes.filter(m =>
        m.name !== '__measure' && m.name !== '__preview' && m.name !== '__faceHighlight');
      return raycaster.intersectObjects(targets);
    }

    // ── Vertex snapping: find closest vertex of the hit triangle ──
    function snapToVertex(hit) {
      const geo = hit.object.geometry;
      const pos = geo.attributes.position;
      const idx = geo.index;
      const faceIdx = hit.faceIndex;
      const worldMatrix = hit.object.matrixWorld;
      const hitPoint = hit.point;

      // Get the 3 vertex indices of the hit triangle
      let i0, i1, i2;
      if (idx) {
        i0 = idx.getX(faceIdx * 3);
        i1 = idx.getX(faceIdx * 3 + 1);
        i2 = idx.getX(faceIdx * 3 + 2);
      } else {
        i0 = faceIdx * 3;
        i1 = faceIdx * 3 + 1;
        i2 = faceIdx * 3 + 2;
      }

      let bestDist = Infinity;
      let bestVert = hitPoint.clone();
      for (const vi of [i0, i1, i2]) {
        const v = new THREE.Vector3(pos.getX(vi), pos.getY(vi), pos.getZ(vi));
        v.applyMatrix4(worldMatrix);
        const d = v.distanceTo(hitPoint);
        if (d < bestDist) { bestDist = d; bestVert = v; }
      }

      // Snap threshold: 15% of the triangle size or a sensible screen-space threshold
      const sceneSize = state.sceneBounds.getSize(new THREE.Vector3()).length();
      const snapThreshold = sceneSize * 0.01;
      return bestDist < snapThreshold ? bestVert : hitPoint.clone();
    }

    // ── Face detection: flood-fill connected coplanar triangles ──
    function detectFace(hit) {
      const mesh = hit.object;
      const geo = mesh.geometry;
      const pos = geo.attributes.position;
      const idx = geo.index;
      const faceIdx = hit.faceIndex;
      const normalMatrix = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld);

      // Get the normal of the hit triangle
      function getTriNormal(fi) {
        let i0, i1, i2;
        if (idx) {
          i0 = idx.getX(fi * 3); i1 = idx.getX(fi * 3 + 1); i2 = idx.getX(fi * 3 + 2);
        } else {
          i0 = fi * 3; i1 = fi * 3 + 1; i2 = fi * 3 + 2;
        }
        const a = new THREE.Vector3(pos.getX(i0), pos.getY(i0), pos.getZ(i0));
        const b = new THREE.Vector3(pos.getX(i1), pos.getY(i1), pos.getZ(i1));
        const c = new THREE.Vector3(pos.getX(i2), pos.getY(i2), pos.getZ(i2));
        const n = new THREE.Vector3().crossVectors(
          new THREE.Vector3().subVectors(b, a),
          new THREE.Vector3().subVectors(c, a)
        ).normalize();
        return n;
      }

      function getTriVertices(fi) {
        let i0, i1, i2;
        if (idx) {
          i0 = idx.getX(fi * 3); i1 = idx.getX(fi * 3 + 1); i2 = idx.getX(fi * 3 + 2);
        } else {
          i0 = fi * 3; i1 = fi * 3 + 1; i2 = fi * 3 + 2;
        }
        return [i0, i1, i2];
      }

      const seedNormal = getTriNormal(faceIdx);
      const totalTris = idx ? idx.count / 3 : pos.count / 3;

      // Build edge→triangle adjacency (vertex-pair keyed)
      // For performance, only do this for meshes up to ~100k triangles
      if (totalTris > 100000) {
        // Fallback: just use the single triangle's normal/center
        const verts = getTriVertices(faceIdx);
        const center = new THREE.Vector3();
        for (const vi of verts) {
          center.add(new THREE.Vector3(pos.getX(vi), pos.getY(vi), pos.getZ(vi)));
        }
        center.divideScalar(3).applyMatrix4(mesh.matrixWorld);
        const worldNormal = seedNormal.clone().applyMatrix3(normalMatrix).normalize();
        return { normal: worldNormal, center, faceIndices: [faceIdx], mesh };
      }

      // Build adjacency
      const edgeToTris = new Map();
      function edgeKey(a, b) { return a < b ? a + '_' + b : b + '_' + a; }
      for (let fi = 0; fi < totalTris; fi++) {
        const [v0, v1, v2] = getTriVertices(fi);
        for (const [ea, eb] of [[v0,v1],[v1,v2],[v2,v0]]) {
          const key = edgeKey(ea, eb);
          if (!edgeToTris.has(key)) edgeToTris.set(key, []);
          edgeToTris.get(key).push(fi);
        }
      }

      // BFS flood fill from hit triangle, collecting coplanar triangles
      const coplanarThreshold = 0.95; // dot product threshold (~18 degrees)
      const visited = new Set();
      const queue = [faceIdx];
      visited.add(faceIdx);
      const faceIndices = [];

      while (queue.length > 0) {
        const fi = queue.shift();
        const n = getTriNormal(fi);
        if (Math.abs(n.dot(seedNormal)) < coplanarThreshold) continue;
        faceIndices.push(fi);

        // Find neighbors via shared edges
        const [v0, v1, v2] = getTriVertices(fi);
        for (const [ea, eb] of [[v0,v1],[v1,v2],[v2,v0]]) {
          const key = edgeKey(ea, eb);
          const neighbors = edgeToTris.get(key);
          if (!neighbors) continue;
          for (const ni of neighbors) {
            if (!visited.has(ni)) {
              visited.add(ni);
              queue.push(ni);
            }
          }
        }
      }

      // Compute average world-space normal and center of the face
      const avgNormal = new THREE.Vector3();
      const avgCenter = new THREE.Vector3();
      for (const fi of faceIndices) {
        avgNormal.add(getTriNormal(fi));
        const verts = getTriVertices(fi);
        for (const vi of verts) {
          avgCenter.add(new THREE.Vector3(pos.getX(vi), pos.getY(vi), pos.getZ(vi)));
        }
      }
      avgNormal.divideScalar(faceIndices.length).applyMatrix3(normalMatrix).normalize();
      avgCenter.divideScalar(faceIndices.length * 3).applyMatrix4(mesh.matrixWorld);

      return { normal: avgNormal, center: avgCenter, faceIndices, mesh };
    }

    // ── Highlight a detected face ──
    function highlightFace(faceData, color) {
      clearFaceHighlight();
      const { faceIndices, mesh } = faceData;
      const geo = mesh.geometry;
      const pos = geo.attributes.position;
      const idx = geo.index;

      // Build geometry from face triangles
      const vertices = [];
      for (const fi of faceIndices) {
        let i0, i1, i2;
        if (idx) {
          i0 = idx.getX(fi * 3); i1 = idx.getX(fi * 3 + 1); i2 = idx.getX(fi * 3 + 2);
        } else {
          i0 = fi * 3; i1 = fi * 3 + 1; i2 = fi * 3 + 2;
        }
        for (const vi of [i0, i1, i2]) {
          vertices.push(pos.getX(vi), pos.getY(vi), pos.getZ(vi));
        }
      }

      const hlGeo = new THREE.BufferGeometry();
      hlGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      const hlMat = new THREE.MeshBasicMaterial({
        color, transparent: true, opacity: 0.4,
        side: THREE.DoubleSide, depthTest: false
      });
      const hlMesh = new THREE.Mesh(hlGeo, hlMat);
      hlMesh.applyMatrix4(mesh.matrixWorld);
      hlMesh.name = '__faceHighlight';
      hlMesh.renderOrder = 998;
      state.scene.add(hlMesh);
      state.faceHighlightMesh = hlMesh;
    }

    function clearFaceHighlight() {
      if (state.faceHighlightMesh) {
        state.scene.remove(state.faceHighlightMesh);
        state.faceHighlightMesh.geometry.dispose();
        state.faceHighlightMesh.material.dispose();
        state.faceHighlightMesh = null;
      }
    }

    // ── Distance between two planes ──
    function planeToPlaneDist(face1, face2) {
      const n1 = face1.normal;
      const n2 = face2.normal;
      // Check if faces are roughly parallel (dot > 0.9)
      const dot = Math.abs(n1.dot(n2));
      if (dot < 0.85) {
        // Not parallel — measure center-to-center as fallback
        return { dist: face1.center.distanceTo(face2.center), parallel: false };
      }
      // Project center2 onto plane1's normal direction
      const diff = new THREE.Vector3().subVectors(face2.center, face1.center);
      const dist = Math.abs(diff.dot(n1));
      return { dist, parallel: true };
    }

    // ── Click handler ──
    function onCanvasClick(event) {
      if (!state.measureMode) return;
      const hits = getIntersection(event);
      if (hits.length === 0) return;
      const hit = hits[0];

      if (state.measureMode === 'point') {
        const point = snapToVertex(hit);

        if (!state.measureFirstPoint) {
          state.measureFirstPoint = point;
          addPointMarker(point, 0xff4444);
        } else {
          const dist = state.measureFirstPoint.distanceTo(point);
          addPointMarker(point, 0xff4444);
          addMeasurementLine(state.measureFirstPoint, point, dist, false);
          showOverlay(dist.toFixed(2) + ' mm');
          state.measureFirstPoint = null;
          clearPreview();
        }
      } else if (state.measureMode === 'face') {
        const face = detectFace(hit);
        if (!state.measureFirstFace) {
          state.measureFirstFace = face;
          highlightFace(face, 0x2266ff);
          showOverlay('Select second face...');
        } else {
          const { dist, parallel } = planeToPlaneDist(state.measureFirstFace, face);
          highlightFace(face, 0xff6622);

          // Draw line between face centers
          const p1 = state.measureFirstFace.center;
          const p2 = parallel
            ? p1.clone().addScaledVector(state.measureFirstFace.normal,
                dist * (new THREE.Vector3().subVectors(face.center, p1).dot(state.measureFirstFace.normal) > 0 ? 1 : -1))
            : face.center;
          addMeasurementLine(p1, parallel ? p2 : face.center, dist, false);
          showOverlay(dist.toFixed(2) + ' mm' + (parallel ? '' : ' (not parallel)'));

          state.measureFirstFace = null;
        }
      }
    }

    // ── Mouse move handler ──
    function onCanvasMouseMove(event) {
      if (!state.measureMode) return;
      const hits = getIntersection(event);

      if (state.measureMode === 'point' && state.measureFirstPoint) {
        if (hits.length === 0) return;
        const point = snapToVertex(hits[0]);
        const dist = state.measureFirstPoint.distanceTo(point);
        clearPreview();
        addMeasurementLine(state.measureFirstPoint, point, dist, true);
        showOverlay(dist.toFixed(2) + ' mm');
      }

      if (state.measureMode === 'face' && !state.measureFirstFace) {
        // Highlight face under cursor
        if (hits.length > 0) {
          const face = detectFace(hits[0]);
          highlightFace(face, 0x2266ff);
        } else {
          clearFaceHighlight();
        }
      }
    }

    function showOverlay(text) {
      const overlay = document.getElementById('measureOverlay');
      overlay.textContent = text;
      overlay.classList.add('visible');
    }

    function addPointMarker(point, color) {
      const geo = new THREE.SphereGeometry(
        state.sceneBounds.getSize(new THREE.Vector3()).length() * 0.004, 12, 12
      );
      const mat = new THREE.MeshBasicMaterial({ color, depthTest: false });
      const sphere = new THREE.Mesh(geo, mat);
      sphere.position.copy(point);
      sphere.name = '__measure';
      sphere.renderOrder = 999;
      state.scene.add(sphere);
    }

    function addMeasurementLine(p1, p2, dist, isPreview) {
      const color = isPreview ? 0x44bb44 : 0xff4444;
      const geo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
      const mat = new THREE.LineBasicMaterial({
        color, linewidth: 2, depthTest: false
      });
      const line = new THREE.Line(geo, mat);
      line.name = isPreview ? '__preview' : '__measure';
      line.renderOrder = 999;
      state.scene.add(line);

      // Distance label sprite
      const canvas2d = document.createElement('canvas');
      const ctx = canvas2d.getContext('2d');
      canvas2d.width = 256; canvas2d.height = 64;
      ctx.fillStyle = isPreview ? 'rgba(34,120,34,0.85)' : 'rgba(200,30,30,0.9)';
      ctx.roundRect(0, 0, 256, 64, 8);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 28px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(dist.toFixed(2) + ' mm', 128, 32);

      const texture = new THREE.CanvasTexture(canvas2d);
      const spriteMat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
      const sprite = new THREE.Sprite(spriteMat);
      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      sprite.position.copy(mid);
      const sceneSize = state.sceneBounds.getSize(new THREE.Vector3()).length();
      sprite.scale.set(sceneSize * 0.08, sceneSize * 0.02, 1);
      sprite.name = isPreview ? '__preview' : '__measure';
      sprite.renderOrder = 1000;
      state.scene.add(sprite);
    }

    function clearPreview() {
      const toRemove = [];
      state.scene.traverse(c => { if (c.name === '__preview') toRemove.push(c); });
      toRemove.forEach(c => {
        state.scene.remove(c);
        if (c.geometry) c.geometry.dispose();
        if (c.material) {
          if (c.material.map) c.material.map.dispose();
          c.material.dispose();
        }
      });
    }

    function clearAllMeasurements() {
      const toRemove = [];
      state.scene.traverse(c => {
        if (c.name === '__measure' || c.name === '__preview' || c.name === '__faceHighlight') toRemove.push(c);
      });
      toRemove.forEach(c => {
        state.scene.remove(c);
        if (c.geometry) c.geometry.dispose();
        if (c.material) {
          if (c.material.map) c.material.map.dispose();
          c.material.dispose();
        }
      });
      state.measureFirstPoint = null;
      state.measureFirstFace = null;
      state.faceHighlightMesh = null;
      state.measurePoints = [];
      document.getElementById('measureOverlay').classList.remove('visible');
    }

    // ── Section Plane ──
    window.toggleSection = function() {
      state.sectionActive = !state.sectionActive;
      document.getElementById('btnSection').classList.toggle('active', state.sectionActive);
      document.getElementById('sectionInfo').classList.toggle('visible', state.sectionActive);

      if (state.sectionActive) {
        const center = state.sceneBounds.getCenter(new THREE.Vector3());
        state.sectionPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), center.y);
        state.renderer.clippingPlanes = [state.sectionPlane];

        // Visual helper
        const size = state.sceneBounds.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) * 1.5;
        state.sectionHelper = new THREE.PlaneHelper(state.sectionPlane, maxDim, 0x165216);
        state.sectionHelper.name = '__sectionHelper';
        state.scene.add(state.sectionHelper);

        // Scroll to move section plane
        state.renderer.domElement.addEventListener('wheel', onSectionWheel, { passive: false });
      } else {
        state.renderer.clippingPlanes = [];
        state.scene.traverse(c => {
          if (c.name === '__sectionHelper') state.scene.remove(c);
        });
        if (state.sectionHelper) {
          state.scene.remove(state.sectionHelper);
          state.sectionHelper = null;
        }
        state.sectionPlane = null;
        state.renderer.domElement.removeEventListener('wheel', onSectionWheel);
      }
    };

    function onSectionWheel(event) {
      if (!state.sectionActive || !state.sectionPlane) return;
      if (!event.shiftKey) return; // Only move section with Shift+scroll

      event.preventDefault();
      const size = state.sceneBounds.getSize(new THREE.Vector3());
      const step = Math.max(size.x, size.y, size.z) * 0.01;
      state.sectionPlane.constant += event.deltaY > 0 ? step : -step;
    }

    // ── X-Ray ──
    window.toggleXray = function() {
      state.xrayActive = !state.xrayActive;
      document.getElementById('btnXray').classList.toggle('active', state.xrayActive);

      state.meshes.forEach(mesh => {
        if (state.xrayActive) {
          if (!mesh.userData.originalMaterial) {
            mesh.userData.originalMaterial = mesh.material;
          }
          mesh.material = mesh.material.clone();
          mesh.material.transparent = true;
          mesh.material.opacity = 0.25;
          mesh.material.depthWrite = false;
        } else {
          if (mesh.userData.originalMaterial) {
            mesh.material = mesh.userData.originalMaterial;
          }
        }
      });
    };

    // ── Toolbar Actions ──
    window.toggleTree = function() {
      state.treeOpen = !state.treeOpen;
      document.getElementById('partTree').classList.toggle('open', state.treeOpen);
      document.getElementById('btnTree').classList.toggle('active', state.treeOpen);
    };

    window.setMeasureMode = function(mode) {
      if (state.measureMode === mode) {
        // Toggle off
        state.measureMode = null;
        clearAllMeasurements();
        clearFaceHighlight();
      } else {
        state.measureMode = mode;
        clearAllMeasurements();
        clearFaceHighlight();
      }
      document.getElementById('btnMeasurePoint').classList.toggle('active', state.measureMode === 'point');
      document.getElementById('btnMeasureFace').classList.toggle('active', state.measureMode === 'face');
      state.renderer.domElement.style.cursor = state.measureMode ? 'crosshair' : '';
    };

    window.fitToView = function() {
      if (state.meshes.length === 0) return;
      const box = state.selectedPartIndex >= 0
        ? new THREE.Box3().setFromObject(state.meshes[state.selectedPartIndex])
        : state.sceneBounds;
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const dist = maxDim * 2.0;

      const dir = state.camera.position.clone().sub(state.controls.target).normalize();
      state.camera.position.copy(center).addScaledVector(dir, dist);
      state.controls.target.copy(center);
      state.controls.update();
    };

    window.resetView = function() {
      if (state.initialCamPos) {
        state.camera.position.copy(state.initialCamPos);
        state.controls.target.copy(state.initialCamTarget);
        state.controls.update();
      }
      // Deselect part
      if (state.selectedPartIndex >= 0) {
        selectPart(state.selectedPartIndex); // toggle off
      }
    };

    window.takeSnapshot = function() {
      state.renderer.render(state.scene, state.camera);
      const dataUrl = state.renderer.domElement.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = '${title.replace(/'/g, "")}_snapshot.png';
      a.click();
    };

    window.setThumbnail = async function() {
      const parentApp = '${parent_app || ""}';
      const parentId = '${parent_id || ""}';
      const token = '${authToken}';
      if (!parentApp || !parentId || !token) return;

      const btn = document.getElementById('btnThumbnail');
      if (btn) { btn.disabled = true; btn.style.opacity = '0.5'; }

      try {
        // Render current frame and capture as blob
        state.renderer.render(state.scene, state.camera);
        const canvas = state.renderer.domElement;
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));

        const formData = new FormData();
        formData.append('file', blob, 'thumbnail.png');
        formData.append('app', parentApp);
        formData.append('item_id', parentId);
        formData.append('display_name', 'thumbnail.png');

        const resp = await fetch('/api/files/post/thumbnail/', {
          method: 'POST',
          headers: { 'Authorization': 'Token ' + token },
          body: formData,
        });

        if (resp.ok) {
          // Notify the main app to refresh
          try {
            const channel = new BroadcastChannel('dokuly_file_updates');
            channel.postMessage({ type: 'thumbnail_updated', app: parentApp, id: parseInt(parentId) });
            channel.close();
          } catch(e) {}
          alert('Thumbnail updated successfully.');
        } else {
          const data = await resp.json().catch(() => ({}));
          alert('Failed to set thumbnail: ' + (data.detail || resp.statusText));
        }
      } catch (err) {
        console.error('Thumbnail upload error:', err);
        alert('Failed to set thumbnail.');
      } finally {
        if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
      }
    };

    window.toggleBackground = function() {
      state.darkBg = !state.darkBg;
      state.renderer.setClearColor(state.darkBg ? 0x1a1a2e : 0xfafafa);
      document.getElementById('btnBg').classList.toggle('active', state.darkBg);

    };

    // ── Nav Cube ──
    let navCubeRenderer, navCubeScene, navCubeCamera;

    function initNavCube() {
      const navCanvas = document.getElementById('navCube');
      navCubeRenderer = new THREE.WebGLRenderer({ canvas: navCanvas, alpha: true, antialias: true });
      navCubeRenderer.setPixelRatio(window.devicePixelRatio);
      navCubeRenderer.setSize(100, 100);

      navCubeScene = new THREE.Scene();
      navCubeCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 10);
      navCubeCamera.position.set(0, 0, 2.5);

      // Cube faces
      const labels = ['Right', 'Left', 'Top', 'Bottom', 'Front', 'Back'];
      const colors = [0xee5555, 0xee5555, 0x55aa55, 0x55aa55, 0x5577ee, 0x5577ee];
      const materials = labels.map((label, i) => {
        const canvas2d = document.createElement('canvas');
        canvas2d.width = 128; canvas2d.height = 128;
        const ctx = canvas2d.getContext('2d');
        ctx.fillStyle = '#' + colors[i].toString(16).padStart(6, '0');
        ctx.fillRect(0, 0, 128, 128);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.strokeRect(2, 2, 124, 124);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 24px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, 64, 64);
        const tex = new THREE.CanvasTexture(canvas2d);
        return new THREE.MeshBasicMaterial({ map: tex });
      });
      const cube = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), materials);
      navCubeScene.add(cube);

      // Axes
      const axesLen = 0.8;
      const axesMat = [
        new THREE.LineBasicMaterial({ color: 0xff0000 }),
        new THREE.LineBasicMaterial({ color: 0x00cc00 }),
        new THREE.LineBasicMaterial({ color: 0x0066ff }),
      ];
      const dirs = [new THREE.Vector3(1,0,0), new THREE.Vector3(0,1,0), new THREE.Vector3(0,0,1)];
      dirs.forEach((d, i) => {
        const geo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(), d.clone().multiplyScalar(axesLen)
        ]);
        navCubeScene.add(new THREE.Line(geo, axesMat[i]));
      });

      // Click to set view
      navCanvas.addEventListener('click', (e) => {
        const rect = navCanvas.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        const rc = new THREE.Raycaster();
        rc.setFromCamera(new THREE.Vector2(x, y), navCubeCamera);
        const hits = rc.intersectObject(cube);
        if (hits.length > 0) {
          const faceIndex = hits[0].faceIndex;
          const viewDirs = [
            [1,0,0], [-1,0,0], [0,1,0], [0,-1,0], [0,0,1], [0,0,-1]
          ];
          const side = Math.floor(faceIndex / 2);
          const dir = viewDirs[side];
          const center = state.sceneBounds.getCenter(new THREE.Vector3());
          const size = state.sceneBounds.getSize(new THREE.Vector3());
          const dist = Math.max(size.x, size.y, size.z) * 2.0;
          state.camera.position.set(
            center.x + dir[0] * dist,
            center.y + dir[1] * dist,
            center.z + dir[2] * dist
          );
          state.controls.target.copy(center);
          state.controls.update();
        }
      });
    }

    function renderNavCube() {
      if (!navCubeRenderer) return;
      // Mirror main camera orientation
      const q = state.camera.quaternion.clone();
      navCubeScene.children.forEach(c => {
        if (c.isMesh || c.isLine) {
          c.quaternion.copy(q).invert();
        }
      });
      navCubeRenderer.render(navCubeScene, navCubeCamera);
    }

    // ── Animation Loop ──
    function animate() {
      requestAnimationFrame(animate);
      state.controls.update();
      state.renderer.render(state.scene, state.camera);
      renderNavCube();

      // FPS counter
      state.frameCount++;
      const now = performance.now();
      if (now - state.lastFrameTime > 1000) {
        const fps = Math.round(state.frameCount * 1000 / (now - state.lastFrameTime));
        document.getElementById('statusFps').textContent = fps + ' FPS';
        state.frameCount = 0;
        state.lastFrameTime = now;
      }
    }

    // ── Start ──
    init();
  </script>
</body>
</html>`;
}
