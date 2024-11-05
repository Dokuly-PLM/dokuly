import React, {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import * as THREE from "three";
import occtimportjs from "occt-import-js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

function BuildMesh(geometryMesh, showEdges) {
  let geometry = new THREE.BufferGeometry();

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(geometryMesh.attributes.position.array, 3)
  );
  if (geometryMesh.attributes.normal) {
    geometry.setAttribute(
      "normal",
      new THREE.Float32BufferAttribute(geometryMesh.attributes.normal.array, 3)
    );
  }
  geometry.setIndex(
    new THREE.BufferAttribute(new Uint32Array(geometryMesh.index.array), 1)
  );

  const outlineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
  const defaultMaterial = new THREE.MeshPhongMaterial({
    color: geometryMesh.color
      ? new THREE.Color(
          geometryMesh.color[0],
          geometryMesh.color[1],
          geometryMesh.color[2]
        )
      : 0xcccccc,
    specular: 0,
  });
  let materials = [defaultMaterial];
  const edges = showEdges ? new THREE.Group() : null;

  const mesh = new THREE.Mesh(
    geometry,
    materials.length > 1 ? materials : materials[0]
  );
  mesh.name = geometryMesh.name;

  if (edges) {
    edges.renderOrder = mesh.renderOrder + 1;
  }

  const boundingBox = new THREE.Box3().setFromObject(mesh);
  const size = boundingBox.getSize(new THREE.Vector3());
  const sizeX = size.x;
  const sizeY = size.y;
  const sizeZ = size.z;

  // Return mesh along with the bounding box size components
  return { mesh, geometry, edges, sizeX, sizeY, sizeZ };
}

function StepViewer({ stepFileUrl, windowWidth, windowHeight }, ref) {
  const containerRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(new THREE.WebGLRenderer()); // Define renderer using useRef
  const [lightIntensity, setLightIntensity] = useState(1); // state for dynamic light intensity
  const lightsRef = useRef([]); // useRef to keep track of lights
  const [initialCameraState, setInitialCameraState] = useState({
    position: null,
    rotation: null,
  });

  const captureImage = () => {
    return rendererRef.current.domElement.toDataURL("image/png"); // Access renderer using rendererRef.current
  };

  useImperativeHandle(ref, () => ({
    captureImage,
    resetCamera: handleResetCamera,
  }));

  const handleResetCamera = () => {
    const camera = cameraRef.current;
    if (!camera || !initialCameraState.position || !initialCameraState.rotation)
      return;

    camera.position.copy(initialCameraState.position);
    camera.quaternion.copy(initialCameraState.rotation);

    const controls = new OrbitControls(camera, rendererRef.current.domElement);
    controls.update();
  };

  useEffect(() => {
    const scene = new THREE.Scene();
    const aspectRatio = windowWidth / windowHeight;

    const camera = new THREE.PerspectiveCamera(45, aspectRatio, 1, 50000);
    cameraRef.current = camera;

    const renderer = rendererRef.current; // Access renderer using rendererRef.current

    renderer.setClearColor(0xf1f1f1);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(windowWidth, windowHeight);
    containerRef.current.appendChild(renderer.domElement);

    // Add OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.update();

    // Define a function to create and add a directional light
    const addDirectionalLight = (x, y, z) => {
      const light = new THREE.DirectionalLight(0xffffff, lightIntensity);
      light.position.set(x, y, z);
      lightsRef.current.push(light); // add light to lightsRef
      scene.add(light);
    };
    // Add an ambient light for overall soft lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2); // Lower intensity
    scene.add(ambientLight);

    // Load the STEP file and add to the scene
    async function loadStepFile() {
      const response = await fetch(stepFileUrl);
      const buffer = await response.arrayBuffer();
      const fileBuffer = new Uint8Array(buffer);

      const occt = await occtimportjs();
      const result = occt.ReadStepFile(fileBuffer, null);

      let sceneBounds = new THREE.Box3();

      // Iterate through all the parts in the result and add them to the scene
      result.meshes.forEach((geometryMesh) => {
        const { mesh } = BuildMesh(geometryMesh, true);

        // Update the overall scene bounds
        sceneBounds.expandByObject(mesh);

        scene.add(mesh);
      });

      // After all meshes are added, calculate scene size
      const size = sceneBounds.getSize(new THREE.Vector3());
      const maxDimension = Math.max(size.x, size.y, size.z);

      // Calculate the center of the model
      const center = sceneBounds.getCenter(new THREE.Vector3());

      // Set the controls target to the center of the model
      controls.target.copy(center);

      // Position lights at isometric positions relative to the scene
      const lightOffset = maxDimension * 1.2;
      const isometricAngle = 0.707; // Cosine and sine of 45 degrees

      // Isometric light positions
      addDirectionalLight(
        lightOffset * isometricAngle,
        lightOffset * isometricAngle,
        lightOffset * isometricAngle
      ); // Top-right-front

      // addDirectionalLight(
      //   -lightOffset * isometricAngle,
      //   lightOffset * isometricAngle,
      //   lightOffset * isometricAngle,
      // ); // Top-left-front
      // addDirectionalLight(
      //   lightOffset * isometricAngle,
      //   -lightOffset * isometricAngle,
      //   lightOffset * isometricAngle,
      // ); // Bottom-right-front
      addDirectionalLight(
        -lightOffset * isometricAngle,
        -lightOffset * isometricAngle,
        lightOffset * isometricAngle
      ); // Bottom-left-front
      addDirectionalLight(
        lightOffset * isometricAngle,
        lightOffset * isometricAngle,
        -lightOffset * isometricAngle
      ); // Top-right-back
      // addDirectionalLight(
      //   -lightOffset * isometricAngle,
      //   lightOffset * isometricAngle,
      //   -lightOffset * isometricAngle,
      // ); // Top-left-back
      // addDirectionalLight(
      //   lightOffset * isometricAngle,
      //   -lightOffset * isometricAngle,
      //   -lightOffset * isometricAngle,
      // ); // Bottom-right-back
      addDirectionalLight(
        -lightOffset * isometricAngle,
        -lightOffset * isometricAngle,
        -lightOffset * isometricAngle
      ); // Bottom-left-back

      // Adjust light intensity based on scene size
      const newIntensity = 0.6;
      setLightIntensity(newIntensity);

      // Update lights intensity
      lightsRef.current.forEach((light) => {
        light.intensity = newIntensity;
      });

      // Position the camera based on the scene size
      const cameraDistance = maxDimension * 1.5;

      // Position the camera to look at the center of the model
      // Adjust the multipliers for x and y to change the angle
      camera.position.set(
        center.x + cameraDistance * 0.707,
        center.y + cameraDistance * 0.707,
        center.z + cameraDistance * 0.707
      );

      camera.lookAt(center);
      // Inside useEffect, after setting up the camera
      setInitialCameraState({
        position: camera.position.clone(),
        rotation: camera.quaternion.clone(),
      });
    }

    loadStepFile();

    // place the camera so that the model is visible based ont he model size

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update(); // Update the controls in the animation loop
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      renderer.dispose(); // Use renderer directly in the cleanup function
      controls.dispose();
    };
  }, [stepFileUrl]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    />
  );
}

export default forwardRef(StepViewer);
