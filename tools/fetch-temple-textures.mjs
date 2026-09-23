import { mkdir, writeFile } from 'node:fs/promises';
const directory = 'assets/temple-textures';
await mkdir(directory,{recursive:true});
const assets=['slate_floor_03','plastered_wall','dark_wood'];
const records=[];
for(const id of assets) {
  const response=await fetch(`https://api.polyhaven.com/files/${id}`);
  if(!response.ok)throw Error(`${id}: ${response.status}`);
  const files=await response.json();
  for(const [key,suffix] of [['Diffuse','color'],['nor_gl','normal'],['Rough','roughness']]) {
    const file=files[key]['1k'].jpg;
    const r=await fetch(file.url);if(!r.ok)throw Error(file.url);
    await writeFile(`${directory}/${id}-${suffix}.jpg`,Buffer.from(await r.arrayBuffer()));
    records.push({asset:id,map:suffix,url:file.url,license:'CC0',source:`https://polyhaven.com/a/${id}`});
    console.log(id,suffix);
  }
}
await writeFile(`${directory}/sources.json`,JSON.stringify(records,null,2)+'\n');
