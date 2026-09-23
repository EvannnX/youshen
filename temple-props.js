// Set model to the exported GLB path to replace every instance of a placeholder.
// Height is in scene metres. Models are centred and grounded automatically.
export const templeProps = {
  lantern: { name: '六角宫灯', model: 'assets/temple-props/lantern.glb', height: 1.3, rotationY: 0, reference: 'assets/temple-props/01-lantern.png' },
  banner: { name: '垂挂绣幡', model: 'assets/temple-props/banner.glb', height: 3.2, rotationY: 0, reference: 'assets/temple-props/02-banner.png' },
  curtain: { name: '主坛帷幔', model: 'assets/temple-props/curtain.glb', height: 3.3, width: 10.3, rotationY: 0, reference: 'assets/temple-props/03-curtain.png' },
  plinth: { name: '神像雕花底座', model: 'assets/temple-props/plinth.glb', height: 0.7, width: 2.85, depth: 2.15, rotationY: 0, reference: 'assets/temple-props/04-plinth.png' },
  lattice: { name: '木雕花格屏', model: 'assets/temple-props/lattice.glb', height: 3.8, width: 2.8, rotationY: 0, reference: 'assets/temple-props/05-lattice.png' }
};
