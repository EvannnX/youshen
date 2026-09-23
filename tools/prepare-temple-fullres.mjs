// Preserve all source geometry and embedded images. Only rig metadata is changed.
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {repairTempleSkin} from './repair-temple-skin.mjs';
const require=createRequire(resolve(process.argv[2],'package.json'));
const {NodeIO}=require('@gltf-transform/core');
const {ALL_EXTENSIONS}=require('@gltf-transform/extensions');
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS);
await mkdir('assets/temple-fullres',{recursive:true});
for(const name of ['华光大世子','金龙太子','长郡主','哪吒','小太子']) {
  const doc=await io.read(`assets/神殿模型/${name}.glb`);
  if(name==='小太子') {
    // Restore the supplied T-pose silhouette without the synthetic arm weights.
    for(const node of doc.getRoot().listNodes())if(node.getMesh())node.setSkin(null);
  } else repairTempleSkin(doc,name);
  await io.write(`assets/temple-fullres/${name}.glb`,doc);
  console.log('Full resolution',name);
}
