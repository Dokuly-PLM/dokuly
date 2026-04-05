#!/usr/bin/env node
/**
 * Convert a STEP/STP file to GLB (binary glTF).
 *
 * Usage:
 *   node convert_step_to_glb.mjs <input.step> <output.glb>
 *
 * Uses occt-import-js to parse the STEP file and constructs
 * a valid GLB binary with meshes, materials, and colors.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function loadOcct() {
  // Try to load from the project's node_modules
  const possiblePaths = [
    path.resolve(__dirname, "../node_modules/occt-import-js/dist/occt-import-js.js"),
    path.resolve("/dokuly_image/node_modules/occt-import-js/dist/occt-import-js.js"),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      const mod = await import(p);
      return mod.default || mod;
    }
  }
  throw new Error("occt-import-js not found. Run npm install.");
}

/**
 * Build a GLB (binary glTF 2.0) from occt-import-js mesh results.
 */
function buildGlb(occtResult) {
  const meshes = occtResult.meshes || [];
  if (meshes.length === 0) {
    throw new Error("No meshes found in STEP file");
  }

  // Collect all buffer data
  const bufferParts = [];
  let byteOffset = 0;
  const accessors = [];
  const bufferViews = [];
  const gltfMeshes = [];
  const nodes = [];
  const materials = [];
  const materialMap = new Map();

  for (let i = 0; i < meshes.length; i++) {
    const mesh = meshes[i];
    if (!mesh.attributes?.position?.array || mesh.attributes.position.array.length === 0) {
      continue;
    }

    const positions = new Float32Array(mesh.attributes.position.array);
    const hasNormals = mesh.attributes.normal?.array?.length > 0;
    const normals = hasNormals ? new Float32Array(mesh.attributes.normal.array) : null;
    const hasIndices = mesh.index?.array?.length > 0;
    const indices = hasIndices ? new Uint32Array(mesh.index.array) : null;

    // Get or create material based on color
    let materialIndex;
    const color = mesh.color || [0.8, 0.8, 0.8];
    const colorKey = `${color[0].toFixed(3)}_${color[1].toFixed(3)}_${color[2].toFixed(3)}`;
    if (materialMap.has(colorKey)) {
      materialIndex = materialMap.get(colorKey);
    } else {
      materialIndex = materials.length;
      materialMap.set(colorKey, materialIndex);
      materials.push({
        pbrMetallicRoughness: {
          baseColorFactor: [color[0], color[1], color[2], 1.0],
          metallicFactor: 0.1,
          roughnessFactor: 0.7,
        },
        name: `material_${materialIndex}`,
      });
    }

    const primitiveAttributes = {};

    // Positions buffer view + accessor
    const posData = Buffer.from(positions.buffer, positions.byteOffset, positions.byteLength);
    const posViewIndex = bufferViews.length;
    bufferViews.push({
      buffer: 0,
      byteOffset,
      byteLength: posData.length,
      target: 34962, // ARRAY_BUFFER
    });
    bufferParts.push(posData);
    byteOffset += posData.length;
    // Pad to 4-byte boundary
    const posPad = (4 - (posData.length % 4)) % 4;
    if (posPad > 0) {
      bufferParts.push(Buffer.alloc(posPad));
      byteOffset += posPad;
    }

    const posAccessorIndex = accessors.length;
    // Compute min/max for positions
    let minPos = [Infinity, Infinity, Infinity];
    let maxPos = [-Infinity, -Infinity, -Infinity];
    for (let j = 0; j < positions.length; j += 3) {
      for (let k = 0; k < 3; k++) {
        minPos[k] = Math.min(minPos[k], positions[j + k]);
        maxPos[k] = Math.max(maxPos[k], positions[j + k]);
      }
    }
    accessors.push({
      bufferView: posViewIndex,
      componentType: 5126, // FLOAT
      count: positions.length / 3,
      type: "VEC3",
      min: minPos,
      max: maxPos,
    });
    primitiveAttributes.POSITION = posAccessorIndex;

    // Normals buffer view + accessor
    if (normals) {
      const normData = Buffer.from(normals.buffer, normals.byteOffset, normals.byteLength);
      const normViewIndex = bufferViews.length;
      bufferViews.push({
        buffer: 0,
        byteOffset,
        byteLength: normData.length,
        target: 34962,
      });
      bufferParts.push(normData);
      byteOffset += normData.length;
      const normPad = (4 - (normData.length % 4)) % 4;
      if (normPad > 0) {
        bufferParts.push(Buffer.alloc(normPad));
        byteOffset += normPad;
      }

      const normAccessorIndex = accessors.length;
      accessors.push({
        bufferView: normViewIndex,
        componentType: 5126,
        count: normals.length / 3,
        type: "VEC3",
      });
      primitiveAttributes.NORMAL = normAccessorIndex;
    }

    // Indices buffer view + accessor
    let indicesAccessorIndex = undefined;
    if (indices) {
      const idxData = Buffer.from(indices.buffer, indices.byteOffset, indices.byteLength);
      const idxViewIndex = bufferViews.length;
      bufferViews.push({
        buffer: 0,
        byteOffset,
        byteLength: idxData.length,
        target: 34963, // ELEMENT_ARRAY_BUFFER
      });
      bufferParts.push(idxData);
      byteOffset += idxData.length;
      const idxPad = (4 - (idxData.length % 4)) % 4;
      if (idxPad > 0) {
        bufferParts.push(Buffer.alloc(idxPad));
        byteOffset += idxPad;
      }

      indicesAccessorIndex = accessors.length;
      accessors.push({
        bufferView: idxViewIndex,
        componentType: 5125, // UNSIGNED_INT
        count: indices.length,
        type: "SCALAR",
      });
    }

    // Mesh primitive
    const primitive = {
      attributes: primitiveAttributes,
      material: materialIndex,
    };
    if (indicesAccessorIndex !== undefined) {
      primitive.indices = indicesAccessorIndex;
    }

    const meshIndex = gltfMeshes.length;
    gltfMeshes.push({
      name: mesh.name || `mesh_${i}`,
      primitives: [primitive],
    });

    nodes.push({
      mesh: meshIndex,
      name: mesh.name || `part_${i}`,
    });
  }

  if (gltfMeshes.length === 0) {
    throw new Error("No valid meshes could be built from STEP file");
  }

  // Build glTF JSON
  const gltf = {
    asset: { version: "2.0", generator: "dokuly-step-converter" },
    scene: 0,
    scenes: [{ nodes: nodes.map((_, i) => i) }],
    nodes,
    meshes: gltfMeshes,
    accessors,
    bufferViews,
    materials,
    buffers: [{ byteLength: byteOffset }],
  };

  const jsonStr = JSON.stringify(gltf);
  const jsonBuffer = Buffer.from(jsonStr);
  // Pad JSON to 4-byte boundary
  const jsonPad = (4 - (jsonBuffer.length % 4)) % 4;
  const jsonChunkLength = jsonBuffer.length + jsonPad;

  const binBuffer = Buffer.concat(bufferParts);
  const binPad = (4 - (binBuffer.length % 4)) % 4;
  const binChunkLength = binBuffer.length + binPad;

  // GLB header: magic(4) + version(4) + length(4) = 12 bytes
  // JSON chunk: length(4) + type(4) + data
  // BIN chunk: length(4) + type(4) + data
  const totalLength = 12 + 8 + jsonChunkLength + 8 + binChunkLength;

  const glb = Buffer.alloc(totalLength);
  let offset = 0;

  // GLB header
  glb.writeUInt32LE(0x46546C67, offset); offset += 4; // magic: "glTF"
  glb.writeUInt32LE(2, offset); offset += 4;           // version: 2
  glb.writeUInt32LE(totalLength, offset); offset += 4;  // total length

  // JSON chunk
  glb.writeUInt32LE(jsonChunkLength, offset); offset += 4;
  glb.writeUInt32LE(0x4E4F534A, offset); offset += 4; // type: "JSON"
  jsonBuffer.copy(glb, offset); offset += jsonBuffer.length;
  // Pad with spaces (0x20) per spec
  for (let i = 0; i < jsonPad; i++) { glb[offset++] = 0x20; }

  // BIN chunk
  glb.writeUInt32LE(binChunkLength, offset); offset += 4;
  glb.writeUInt32LE(0x004E4942, offset); offset += 4; // type: "BIN\0"
  binBuffer.copy(glb, offset); offset += binBuffer.length;
  // Pad with zeros per spec
  for (let i = 0; i < binPad; i++) { glb[offset++] = 0x00; }

  return glb;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error("Usage: node convert_step_to_glb.mjs <input.step> <output.glb>");
    process.exit(1);
  }

  const [inputPath, outputPath] = args;

  if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    process.exit(1);
  }

  const fileBuffer = new Uint8Array(fs.readFileSync(inputPath));

  console.log(`Loading OCCT library...`);
  const occtInit = await loadOcct();
  const occt = await occtInit();

  console.log(`Parsing STEP file: ${inputPath} (${(fileBuffer.length / 1024 / 1024).toFixed(1)} MB)`);
  const result = occt.ReadStepFile(fileBuffer, null);

  if (!result || !result.meshes || result.meshes.length === 0) {
    console.error("Failed to parse STEP file or no geometry found");
    process.exit(1);
  }

  console.log(`Found ${result.meshes.length} mesh(es). Building GLB...`);
  const glb = buildGlb(result);

  fs.writeFileSync(outputPath, glb);
  console.log(`GLB written: ${outputPath} (${(glb.length / 1024 / 1024).toFixed(1)} MB)`);

  // Output JSON summary for Django to parse
  const summary = {
    meshCount: result.meshes.length,
    fileSize: glb.length,
    success: true,
  };
  console.log(`RESULT:${JSON.stringify(summary)}`);
}

main().catch((err) => {
  console.error(`Conversion error: ${err.message}`);
  process.exit(1);
});
