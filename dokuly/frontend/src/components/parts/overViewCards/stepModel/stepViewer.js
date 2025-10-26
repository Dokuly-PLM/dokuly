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
  try {
    if (!geometryMesh || !geometryMesh.attributes || !geometryMesh.attributes.position) {
      console.error("Invalid geometryMesh provided to BuildMesh");
      return null;
    }

    let geometry = new THREE.BufferGeometry();

    // Safely set position attribute
    if (geometryMesh.attributes.position && geometryMesh.attributes.position.array) {
      geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(geometryMesh.attributes.position.array, 3)
      );
    } else {
      console.error("Missing position attribute in geometryMesh");
      return null;
    }

    // Safely set normal attribute if it exists
    if (geometryMesh.attributes.normal && geometryMesh.attributes.normal.array) {
      geometry.setAttribute(
        "normal",
        new THREE.Float32BufferAttribute(geometryMesh.attributes.normal.array, 3)
      );
    }

    // Safely set index if it exists
    if (geometryMesh.index && geometryMesh.index.array) {
      geometry.setIndex(
        new THREE.BufferAttribute(new Uint32Array(geometryMesh.index.array), 1)
      );
    }

    const outlineMaterial = new THREE.LineBasicMaterial({ 
      color: 0x2c3e50,
      linewidth: 1.5,
      transparent: true,
      opacity: 0.3
    });
    const defaultMaterial = new THREE.MeshPhongMaterial({
      color: geometryMesh.color
        ? new THREE.Color(
            geometryMesh.color[0],
            geometryMesh.color[1],
            geometryMesh.color[2]
          )
        : 0xcccccc, // Much brighter gray for better visibility
      specular: 0x666666, // More visible specular highlights
      shininess: 30,
      transparent: false,
      side: THREE.DoubleSide
    });
    let materials = [defaultMaterial];
    const edges = showEdges ? new THREE.Group() : null;

    const mesh = new THREE.Mesh(
      geometry,
      materials.length > 1 ? materials : materials[0]
    );
    mesh.name = geometryMesh.name || 'unnamed_mesh';

    if (edges) {
      edges.renderOrder = mesh.renderOrder + 1;
    }

    // Safely calculate bounding box
    let sizeX = 0;
    let sizeY = 0;
    let sizeZ = 0;
    try {
      const boundingBox = new THREE.Box3().setFromObject(mesh);
      const size = boundingBox.getSize(new THREE.Vector3());
      sizeX = size.x;
      sizeY = size.y;
      sizeZ = size.z;
    } catch (bboxError) {
      console.warn("Error calculating bounding box:", bboxError);
      // Use default values
    }

    // Return mesh along with the bounding box size components
    return { mesh, geometry, edges, sizeX, sizeY, sizeZ };
  } catch (error) {
    console.error("Error in BuildMesh:", error);
    return null;
  }
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
  
  // Measurement tool state
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [measurementPoints, setMeasurementPoints] = useState([]);
  const [measurementDistance, setMeasurementDistance] = useState(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const measurementLineRef = useRef(null);
  const measurementTextRef = useRef(null);
  const isMeasuringRef = useRef(false); // Use ref to track measurement state
  const previewLineRef = useRef(null); // For real-time preview line
  const previewTextRef = useRef(null); // For real-time preview text
  const firstPointRef = useRef(null); // Track the first selected point

  const captureImage = () => {
    return rendererRef.current.domElement.toDataURL("image/png"); // Access renderer using rendererRef.current
  };

  const toggleMeasurement = () => {
    const newMeasuringState = !isMeasuring;
    console.log("Toggling measurement mode to:", newMeasuringState);
    setIsMeasuring(newMeasuringState);
    isMeasuringRef.current = newMeasuringState; // Update ref as well
    if (isMeasuring) {
      // Clear existing measurements
      console.log("Clearing existing measurements");
      setMeasurementPoints([]);
      setMeasurementDistance(null);
      if (measurementLineRef.current) {
        measurementLineRef.current.geometry.dispose();
        measurementLineRef.current.material.dispose();
      }
      if (measurementTextRef.current) {
        measurementTextRef.current.geometry.dispose();
        measurementTextRef.current.material.dispose();
      }
    }
  };

  const clearMeasurements = (scene = null) => {
    console.log("Clearing measurements");
    setMeasurementPoints([]);
    setMeasurementDistance(null);
    firstPointRef.current = null;
    
    if (scene) {
      if (measurementLineRef.current) {
        scene.remove(measurementLineRef.current);
        measurementLineRef.current.geometry.dispose();
        measurementLineRef.current.material.dispose();
        measurementLineRef.current = null;
      }
      if (measurementTextRef.current) {
        scene.remove(measurementTextRef.current);
        measurementTextRef.current.geometry.dispose();
        measurementTextRef.current.material.dispose();
        measurementTextRef.current = null;
      }
      if (previewLineRef.current) {
        scene.remove(previewLineRef.current);
        previewLineRef.current.geometry.dispose();
        previewLineRef.current.material.dispose();
        previewLineRef.current = null;
      }
      if (previewTextRef.current) {
        scene.remove(previewTextRef.current);
        previewTextRef.current.geometry.dispose();
        previewTextRef.current.material.dispose();
        previewTextRef.current = null;
      }
    }
  };

  const createPreviewLine = (point1, point2, distance, scene) => {
    try {
      // Remove existing preview line
      if (previewLineRef.current) {
        scene.remove(previewLineRef.current);
        previewLineRef.current.geometry.dispose();
        previewLineRef.current.material.dispose();
      }
      if (previewTextRef.current) {
        scene.remove(previewTextRef.current);
        previewTextRef.current.geometry.dispose();
        previewTextRef.current.material.dispose();
      }

    // Create preview line geometry
    const geometry = new THREE.BufferGeometry().setFromPoints([point1, point2]);
    const material = new THREE.LineBasicMaterial({ 
      color: 0x00ff00, // Green for preview
      linewidth: 2,
      transparent: true,
      opacity: 0.7
    });
    
    const line = new THREE.Line(geometry, material);
    line.name = 'previewLine';
    scene.add(line);
    previewLineRef.current = line;

    // Create preview text
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 400;
    canvas.height = 100;
    
    context.fillStyle = 'rgba(0, 255, 0, 0.9)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    context.fillStyle = 'white';
    context.font = 'bold 32px Arial';
    context.textAlign = 'center';
    context.fillText(`${distance.toFixed(2)} mm`, canvas.width / 2, canvas.height / 2 + 12);
    
    const texture = new THREE.CanvasTexture(canvas);
    const textMaterial = new THREE.SpriteMaterial({ map: texture });
    const textSprite = new THREE.Sprite(textMaterial);
    
    // Position text at midpoint
    const midpoint = new THREE.Vector3().addVectors(point1, point2).multiplyScalar(0.5);
    textSprite.position.copy(midpoint);
    textSprite.scale.set(3, 0.8, 1);
    textSprite.name = 'previewText';
    
    scene.add(textSprite);
    previewTextRef.current = textSprite;
    } catch (error) {
      console.error("Error in createPreviewLine:", error);
    }
  };

  const createMeasurementLine = (point1, point2, distance, scene) => {
    try {
      console.log("Creating measurement line between:", point1, point2, "distance:", distance);
      
      // Remove existing measurement line
      if (measurementLineRef.current) {
        scene.remove(measurementLineRef.current);
        measurementLineRef.current.geometry.dispose();
        measurementLineRef.current.material.dispose();
      }
      if (measurementTextRef.current) {
        scene.remove(measurementTextRef.current);
        measurementTextRef.current.geometry.dispose();
        measurementTextRef.current.material.dispose();
      }

    // Create line geometry
    const geometry = new THREE.BufferGeometry().setFromPoints([point1, point2]);
    const material = new THREE.LineBasicMaterial({ 
      color: 0xff0000, 
      linewidth: 3,
      transparent: true,
      opacity: 0.8
    });
    
    const line = new THREE.Line(geometry, material);
    line.name = 'measurementLine';
    scene.add(line);
    measurementLineRef.current = line;

    // Create measurement text
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 400;
    canvas.height = 100;
    
    context.fillStyle = 'rgba(255, 0, 0, 0.9)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    context.fillStyle = 'white';
    context.font = 'bold 36px Arial';
    context.textAlign = 'center';
    context.fillText(`${distance.toFixed(2)} mm`, canvas.width / 2, canvas.height / 2 + 14);
    
    const texture = new THREE.CanvasTexture(canvas);
    const textMaterial = new THREE.SpriteMaterial({ map: texture });
    const textSprite = new THREE.Sprite(textMaterial);
    
    // Position text at midpoint
    const midpoint = new THREE.Vector3().addVectors(point1, point2).multiplyScalar(0.5);
    textSprite.position.copy(midpoint);
    textSprite.scale.set(3.5, 0.9, 1);
    textSprite.name = 'measurementText';
    
    scene.add(textSprite);
    measurementTextRef.current = textSprite;
    } catch (error) {
      console.error("Error in createMeasurementLine:", error);
    }
  };

  const handleMouseMove = (event, scene, camera) => {
    try {
      if (!isMeasuringRef.current || !firstPointRef.current) return;

      if (!containerRef.current || !event) {
        return;
      }

      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      
      // Get all meshes in the scene
      const meshes = [];
      scene.traverse((child) => {
        if (child.isMesh && child.name !== 'measurementLine' && child.name !== 'measurementText' && child.name !== 'previewLine' && child.name !== 'previewText') {
          meshes.push(child);
        }
      });

      const intersects = raycasterRef.current.intersectObjects(meshes);
      
      if (intersects.length > 0) {
        const point = intersects[0].point;
        const distance = firstPointRef.current.distanceTo(point);
        
        // Create preview line
        createPreviewLine(firstPointRef.current, point, distance, scene);
      }
    } catch (error) {
      console.error("Error in handleMouseMove:", error);
    }
  };

  const handleMouseClick = (event, scene, camera) => {
    try {
      console.log("handleMouseClick called, isMeasuring:", isMeasuringRef.current);
      if (!isMeasuringRef.current) {
        console.log("Not in measuring mode, ignoring click");
        return;
      }

      if (!containerRef.current || !event) {
        console.log("Missing container or event");
        return;
      }

      console.log("Mouse click detected in measurement mode");

      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      console.log("Mouse coordinates:", mouseRef.current);

      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      
      // Get all meshes in the scene
      const meshes = [];
      scene.traverse((child) => {
        if (child.isMesh && child.name !== 'measurementLine' && child.name !== 'measurementText' && child.name !== 'previewLine' && child.name !== 'previewText') {
          meshes.push(child);
        }
      });

      console.log("Found meshes for intersection:", meshes.length);

      const intersects = raycasterRef.current.intersectObjects(meshes);
      
      console.log("Intersections found:", intersects.length);
      
      if (intersects.length > 0) {
        const point = intersects[0].point;
        console.log("Intersection point:", point);
        
        if (!firstPointRef.current) {
          // First point selected
          firstPointRef.current = point;
          setMeasurementPoints([point]);
          console.log("First point set:", point);
        } else {
          // Second point selected - create final measurement
          const distance = firstPointRef.current.distanceTo(point);
          console.log("Distance calculated:", distance);
          setMeasurementDistance(distance);
          setMeasurementPoints([firstPointRef.current, point]);
          
          // Create final measurement line (red)
          createMeasurementLine(firstPointRef.current, point, distance, scene);
          
          // Clear preview elements
          if (previewLineRef.current) {
            scene.remove(previewLineRef.current);
            previewLineRef.current.geometry.dispose();
            previewLineRef.current.material.dispose();
          }
          if (previewTextRef.current) {
            scene.remove(previewTextRef.current);
            previewTextRef.current.geometry.dispose();
            previewTextRef.current.material.dispose();
          }
          
          // Reset for next measurement
          firstPointRef.current = null;
        }
      } else {
        console.log("No intersections found - clicking on empty space");
      }
    } catch (error) {
      console.error("Error in handleMouseClick:", error);
    }
  };

  // Create a wrapper for clearMeasurements that can access the scene
  const clearMeasurementsWrapper = () => {
    try {
      // We need to find the scene from the renderer
      const renderer = rendererRef.current;
      if (!renderer || !renderer.userData) {
        console.log("Renderer or userData not available for clearing measurements");
        return;
      }
      
      const scene = renderer.userData.scene;
      if (scene) {
        clearMeasurements(scene);
      } else {
        console.log("Scene not found for clearing measurements");
      }
    } catch (error) {
      console.error("Error in clearMeasurementsWrapper:", error);
    }
  };

  useImperativeHandle(ref, () => ({
    captureImage,
    resetCamera: handleResetCamera,
    toggleMeasurement,
    clearMeasurements: clearMeasurementsWrapper,
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
    
    if (!renderer) {
      console.error("Renderer not available");
      return;
    }

    renderer.setClearColor(0xffffff); // Clean white background
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(windowWidth, windowHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.antialias = true;
    
    // Initialize userData if it doesn't exist
    if (!renderer.userData) {
      renderer.userData = {};
    }
    renderer.userData.scene = scene; // Store scene reference for clearing
    containerRef.current.appendChild(renderer.domElement);

    // Add click event listener for measurements
    const handleClick = (event) => {
      console.log("Click event fired on renderer");
      handleMouseClick(event, scene, camera);
    };
    
    // Add mouse move event listener for preview
    const handleMove = (event) => {
      handleMouseMove(event, scene, camera);
    };
    
    renderer.domElement.addEventListener('click', handleClick);
    renderer.domElement.addEventListener('mousemove', handleMove);
    console.log("Click and mousemove event listeners added to renderer");

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
    // Add an ambient light for overall soft lighting - much brighter for visibility
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0); // Very bright white ambient light
    scene.add(ambientLight);

    // Load the STEP file and add to the scene
    async function loadStepFile() {
      try {
        if (!stepFileUrl) {
          console.error("No stepFileUrl provided");
          return;
        }

        const response = await fetch(stepFileUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const buffer = await response.arrayBuffer();
        const fileBuffer = new Uint8Array(buffer);

        const occt = await occtimportjs();
        if (!occt || !occt.ReadStepFile) {
          throw new Error("OCCT library not properly loaded");
        }

        const result = occt.ReadStepFile(fileBuffer, null);
        if (!result || !result.meshes) {
          throw new Error("Failed to read STEP file or no meshes found");
        }

      const sceneBounds = new THREE.Box3();

      // Iterate through all the parts in the result and add them to the scene
      result.meshes.forEach((geometryMesh) => {
        const buildResult = BuildMesh(geometryMesh, true);
        if (buildResult && buildResult.mesh) {
          const { mesh } = buildResult;

          // Update the overall scene bounds
          sceneBounds.expandByObject(mesh);

          scene.add(mesh);
        } else {
          console.warn("Failed to build mesh for geometry:", geometryMesh);
        }
      });

      // After all meshes are added, calculate scene size
      const size = sceneBounds.getSize(new THREE.Vector3());
      const maxDimension = Math.max(size.x, size.y, size.z);

      // Calculate the center of the model
      const center = sceneBounds.getCenter(new THREE.Vector3());

      // Set the controls target to the center of the model
      controls.target.copy(center);

      // Improved lighting setup with better distance and positioning
      const lightOffset = maxDimension * 3.0; // Much further away
      
      // Key light - main directional light (bright white)
      const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
      keyLight.position.set(lightOffset * 0.5, lightOffset * 0.5, lightOffset * 0.5);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 2048;
      keyLight.shadow.mapSize.height = 2048;
      lightsRef.current.push(keyLight);
      scene.add(keyLight);

      // Fill light - softer secondary light (bright white)
      const fillLight = new THREE.DirectionalLight(0xffffff, 1.0);
      fillLight.position.set(-lightOffset * 0.3, lightOffset * 0.3, lightOffset * 0.3);
      lightsRef.current.push(fillLight);
      scene.add(fillLight);

      // Rim light - edge lighting for definition (bright white)
      const rimLight = new THREE.DirectionalLight(0xffffff, 0.8);
      rimLight.position.set(lightOffset * 0.3, -lightOffset * 0.3, lightOffset * 0.3);
      lightsRef.current.push(rimLight);
      scene.add(rimLight);

      // Top light - overhead illumination (bright white)
      const topLight = new THREE.DirectionalLight(0xffffff, 1.2);
      topLight.position.set(0, lightOffset, 0);
      lightsRef.current.push(topLight);
      scene.add(topLight);

      // Additional side light for better coverage
      const sideLight = new THREE.DirectionalLight(0xffffff, 0.7);
      sideLight.position.set(lightOffset, 0, 0);
      lightsRef.current.push(sideLight);
      scene.add(sideLight);

      // Adjust light intensity based on scene size
      const newIntensity = 0.6;
      setLightIntensity(newIntensity);

      // Update lights intensity
      lightsRef.current.forEach((light) => {
        light.intensity = newIntensity;
      });

      // Position the camera based on the scene size - modern isometric view
      const cameraDistance = maxDimension * 2.2;

      // Position the camera for a modern isometric view
      camera.position.set(
        center.x + cameraDistance * 0.6,
        center.y + cameraDistance * 0.8,
        center.z + cameraDistance * 0.6
      );

      camera.lookAt(center);
      // Inside useEffect, after setting up the camera
      setInitialCameraState({
        position: camera.position.clone(),
        rotation: camera.quaternion.clone(),
      });
      } catch (error) {
        console.error("Error loading STEP file:", error);
      }
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
      renderer.domElement.removeEventListener('click', handleClick);
      renderer.domElement.removeEventListener('mousemove', handleMove);
      renderer.dispose(); // Use renderer directly in the cleanup function
      controls.dispose();
    };
  }, [stepFileUrl]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      {/* Measurement Toolbar */}
      <div
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          zIndex: 1000,
          display: "flex",
          gap: "10px",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          padding: "10px",
          borderRadius: "5px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        }}
      >
        <button
          type="button"
          onClick={toggleMeasurement}
          style={{
            padding: "8px 16px",
            backgroundColor: isMeasuring ? "#ff4444" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "bold",
          }}
        >
          {isMeasuring ? "Exit Measure" : "Measure"}
        </button>
        <button
          type="button"
          onClick={clearMeasurements}
          style={{
            padding: "8px 16px",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "bold",
          }}
        >
          Clear
        </button>
        {measurementDistance && (
          <div
            style={{
              padding: "8px 12px",
              backgroundColor: "#28a745",
              color: "white",
              borderRadius: "4px",
              fontSize: "14px",
              fontWeight: "bold",
            }}
          >
            {measurementDistance.toFixed(2)} mm
          </div>
        )}
      </div>

      {/* Instructions */}
      {isMeasuring && (
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            zIndex: 1000,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            color: "white",
            padding: "10px",
            borderRadius: "5px",
            fontSize: "14px",
            maxWidth: "300px",
          }}
        >
          <strong>Measurement Mode:</strong><br />
          Click on two points on the model to measure the distance between them.
        </div>
      )}

      {/* 3D Viewer Container */}
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
    </div>
  );
}

export default forwardRef(StepViewer);
