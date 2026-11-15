import { Blob } from 'buffer';
import fs from 'fs';
import path from 'path';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

// Polyfill FileReader for Node.js environment
globalThis.Blob = Blob;
class FileReaderMock {
  constructor() {
    this.onloadend = null;
    this.result = null;
  }
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = buf;
      if (this.onloadend) this.onloadend();
    });
  }
}
globalThis.FileReader = FileReaderMock;

const root = new THREE.Group();
root.name = 'CNC_Tool_Assembly';

// -------------------------------------------------------------
// 1. Tool_Holder Subassembly (BT40 Taper + V-Flange + Collet Chuck)
// -------------------------------------------------------------
const holderGroup = new THREE.Group();
holderGroup.name = 'Tool_Holder';

const holderMat = new THREE.MeshStandardMaterial({
  color: 0x9ba8b5,
  metalness: 0.85,
  roughness: 0.35,
  name: 'Brushed_Steel_BT40',
});

// Pull stud at top (z/y orientation, y is up)
const pullStudGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.45, 32);
const pullStud = new THREE.Mesh(pullStudGeo, holderMat);
pullStud.position.y = 2.4;
pullStud.name = 'Tool_Holder_Pull_Stud';
holderGroup.add(pullStud);

const pullStudKnobGeo = new THREE.SphereGeometry(0.24, 24, 24);
const pullStudKnob = new THREE.Mesh(pullStudKnobGeo, holderMat);
pullStudKnob.position.y = 2.65;
pullStudKnob.name = 'Tool_Holder_Knob';
holderGroup.add(pullStudKnob);

// BT40 7:24 Steep Taper
const bt40TaperGeo = new THREE.CylinderGeometry(0.55, 1.15, 2.0, 48);
const bt40Taper = new THREE.Mesh(bt40TaperGeo, holderMat);
bt40Taper.position.y = 1.25;
bt40Taper.name = 'Tool_Holder_Taper';
holderGroup.add(bt40Taper);

// V-Flange (Automatic tool changer gripper groove)
const vFlangeUpperGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.25, 48);
const vFlangeUpper = new THREE.Mesh(vFlangeUpperGeo, holderMat);
vFlangeUpper.position.y = 0.15;
vFlangeUpper.name = 'Tool_Holder_Flange_Top';
holderGroup.add(vFlangeUpper);

const vGrooveGeo = new THREE.CylinderGeometry(1.3, 1.3, 0.22, 48);
const vGroove = new THREE.Mesh(vGrooveGeo, holderMat);
vGroove.position.y = -0.08;
vGroove.name = 'Tool_Holder_Groove';
holderGroup.add(vGroove);

const vFlangeLowerGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.25, 48);
const vFlangeLower = new THREE.Mesh(vFlangeLowerGeo, holderMat);
vFlangeLower.position.y = -0.31;
vFlangeLower.name = 'Tool_Holder_Flange_Bottom';
holderGroup.add(vFlangeLower);

// ER32 / FMA Collet Extension Nose & Clamping Nut
const colletNoseGeo = new THREE.CylinderGeometry(1.0, 0.9, 0.9, 48);
const colletNose = new THREE.Mesh(colletNoseGeo, holderMat);
colletNose.position.y = -0.85;
colletNose.name = 'Tool_Holder_Collet_Nose';
holderGroup.add(colletNose);

const colletNutGeo = new THREE.CylinderGeometry(0.92, 0.82, 0.55, 8); // Hex nut profile
const colletNut = new THREE.Mesh(colletNutGeo, holderMat);
colletNut.position.y = -1.45;
colletNut.name = 'Tool_Holder'; // Direct named mesh as required
holderGroup.add(colletNut);

root.add(holderGroup);

// -------------------------------------------------------------
// 2. Tool_Shank & End_Mill_Body (Darkened Tungsten Carbide Steel)
// -------------------------------------------------------------
const carbideMat = new THREE.MeshStandardMaterial({
  color: 0x242a30,
  metalness: 0.88,
  roughness: 0.22,
  name: 'Tungsten_Carbide',
});

// Cylindrical shank held within the collet
const shankGeo = new THREE.CylinderGeometry(0.48, 0.48, 1.4, 36);
const shank = new THREE.Mesh(shankGeo, carbideMat);
shank.position.y = -2.1;
shank.name = 'Tool_Shank';
root.add(shank);

// Cutter body with neck clearance and flute channels
const bodyGroup = new THREE.Group();
bodyGroup.name = 'End_Mill_Body';

const cutterBodyCoreGeo = new THREE.CylinderGeometry(0.48, 0.46, 1.5, 36);
const cutterBodyCore = new THREE.Mesh(cutterBodyCoreGeo, carbideMat);
cutterBodyCore.position.y = -3.2;
cutterBodyCore.name = 'End_Mill_Body'; // Mesh named End_Mill_Body
bodyGroup.add(cutterBodyCore);

// Add flute relief spirals to give high-precision industrial look
const fluteCount = 4;
for (let i = 0; i < fluteCount; i++) {
  const angle = (i * Math.PI * 2) / fluteCount;
  const fluteGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.4, 16);
  const flute = new THREE.Mesh(fluteGeo, carbideMat);
  flute.position.set(Math.cos(angle) * 0.42, -3.2, Math.sin(angle) * 0.42);
  flute.rotation.y = angle;
  flute.rotation.z = 0.18 * (i % 2 === 0 ? 1 : -1);
  flute.name = `Flute_${i + 1}`;
  bodyGroup.add(flute);
}

root.add(bodyGroup);

// -------------------------------------------------------------
// 3. Insert_Cutting_Edge (Active Wear Zone with Dynamic PBR Material)
// -------------------------------------------------------------
const insertGroup = new THREE.Group();
insertGroup.name = 'Insert_Cutting_Edge_Group';

// Emerald green PBR material for normal condition (>70% life, VB < 150 µm)
const insertMat = new THREE.MeshStandardMaterial({
  color: 0x10b981,
  metalness: 0.65,
  roughness: 0.25,
  emissive: 0x064e3b,
  emissiveIntensity: 0.2,
  name: 'Insert_Cutting_Edge_Material',
});

// 4 APKT 1604 indexable carbide inserts mounted on cutter tip pockets
for (let i = 0; i < fluteCount; i++) {
  const angle = (i * Math.PI * 2) / fluteCount;
  
  // Rhombic indexable insert geometry
  const insertGeo = new THREE.BoxGeometry(0.24, 0.42, 0.12);
  const insertMesh = new THREE.Mesh(insertGeo, insertMat);
  
  // Position at the active cutting edge tip
  const r = 0.46;
  insertMesh.position.set(
    Math.cos(angle) * r,
    -3.85,
    Math.sin(angle) * r
  );
  insertMesh.rotation.y = -angle + Math.PI / 6;
  insertMesh.rotation.z = 0.08;
  insertMesh.name = 'Insert_Cutting_Edge'; // Named sub-mesh for dynamic wear coloring
  
  insertGroup.add(insertMesh);

  // High precision cutting flank land (wear band)
  const flankGeo = new THREE.BoxGeometry(0.08, 0.38, 0.04);
  const flankMesh = new THREE.Mesh(flankGeo, insertMat);
  flankMesh.position.set(
    Math.cos(angle) * (r + 0.06),
    -3.85,
    Math.sin(angle) * (r + 0.06)
  );
  flankMesh.rotation.y = -angle;
  flankMesh.name = 'Insert_Cutting_Edge'; // Also tagged with cutting edge wear name
  insertGroup.add(flankMesh);
}

root.add(insertGroup);

// Center the assembly around origin (Y: 0)
root.position.y = 0.8;

const outDir = path.resolve('./public/models');
fs.mkdirSync(outDir, { recursive: true });
const targetPath = path.join(outDir, 'cnc_tool_assembly.glb');

const exporter = new GLTFExporter();
exporter.parse(
  root,
  (glb) => {
    fs.writeFileSync(targetPath, Buffer.from(glb));
    console.log(`Successfully generated GLB at ${targetPath} (${Buffer.from(glb).length} bytes)`);
  },
  (err) => {
    console.error('Failed to export GLB:', err);
    process.exit(1);
  },
  { binary: true }
);
