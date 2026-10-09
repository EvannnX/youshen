import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { deityRows, columnRows, originalColumnRows, spacingScale, columnDiameter, hall } from '../temple-layout.js';
import { deities } from '../temple-space-data.js';

// Conservative front-view clearance, including the broadest supported figure.
for (let i=0;i<deityRows.length;i++) {
  assert(Math.abs(deityRows[i]-(columnRows[i]+columnRows[i+1])/2)<1e-9,'Deity is not centered');
  assert(Math.abs((columnRows[i]-columnRows[i+1]-columnDiameter)/(originalColumnRows[i]-originalColumnRows[i+1]-columnDiameter)-spacingScale)<1e-9,'Column interval is not 1.8x');
}
assert(Math.abs((hall.columnX * 2 - columnDiameter) / ((13 - columnDiameter) * spacingScale) - .5) < 1e-9);
for (const z of deityRows) {
  for (const pillarZ of columnRows) {
    for (const viewerX of [0, 1, 3, hall.walkLimit]) {
      const ratio = (hall.columnX - viewerX) / (hall.statueX - viewerX);
      const silhouetteHalfWidth = 4.725 / 2 * ratio;
      assert(Math.abs(pillarZ-z) > silhouetteHalfWidth + .4, `Column blocks bay ${z}`);
    }
    // Furniture and the larger stone column feet must not intersect.
    const dx = Math.max(0, hall.statueX - 2.15 - hall.columnX);
    const dz = Math.max(0, Math.abs(pillarZ-z) - 2.85);
    assert(Math.hypot(dx,dz) > .68, `Column crowds plinth at ${z}`);
  }
}
for(let i=1;i<deityRows.length;i++) assert(deityRows[i-1]-deityRows[i]>5.7,'Pedestals overlap');
assert(deityRows.at(-1)>hall.altar+6,'Last bay overlaps altar');
assert(hall.altar-3>hall.back,'Altar intersects back wall');
let bytes=0;
for(const deity of deities) {
  const path = `assets/temple-models/${deity.model.split('/').pop()}`;
  const data = await readFile(path); bytes+=(await stat(path)).size;
  assert.equal(data.toString('utf8',0,4),'glTF');
  assert.equal(data.readUInt32LE(8),data.length);
  const jsonLength=data.readUInt32LE(12);
  const doc=JSON.parse(data.toString('utf8',20,20+jsonLength));
  assert(doc.scenes?.length && doc.meshes?.length, `${deity.name} has no renderable scene`);
}
console.log(`PASS: 20 side viewing axes clear, pedestals separated, all ${deities.length} GLBs valid (${(bytes/1048576).toFixed(1)} MB combined).`);
