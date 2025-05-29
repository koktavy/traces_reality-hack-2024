const UIImageToggle = {
  schema: {
    image1: { type: 'selector' }, // First image source (e.g., #image1)
    image2: { type: 'selector' }, // Second image source (e.g., #image2)
    interval: { type: 'number', default: 1000 } // Interval in milliseconds
  },

  init() {
    this.currentImage = 1;

    // Create textures from the image elements
    this.texture1 = new THREE.Texture(this.data.image1);
    this.texture1.colorSpace = THREE.SRGBColorSpace;
    this.texture1.needsUpdate = true;

    this.texture2 = new THREE.Texture(this.data.image2);
    this.texture2.colorSpace = THREE.SRGBColorSpace;
    this.texture2.needsUpdate = true;

    // Apply high-quality texture optimizations
    this.optimizeTexture(this.texture1);
    this.optimizeTexture(this.texture2);

    // Set the initial material
    const material = new THREE.MeshBasicMaterial({
      map: this.texture1,
      transparent: true,
      opacity: 0,
      alphaTest: 0.01,
      side: THREE.FrontSide
    });
    this.el.getObject3D('mesh').material = material;

    this.swapTexture = this.swapTexture.bind(this);
    this.intervalId = setInterval(this.swapTexture, this.data.interval);
  },

  optimizeTexture(texture) {
    if (!texture) return;
    const renderer = this.el.sceneEl.renderer;
    // Set anisotropic filtering to maximum supported
    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    texture.anisotropy = Math.min(16, maxAnisotropy);
    // Set filtering modes for crisp rendering
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    // Generate mipmaps for better distance rendering
    texture.generateMipmaps = true;
    // Additional quality settings
    texture.flipY = true;
    texture.premultiplyAlpha = false;
    // Force texture update
    texture.needsUpdate = true;
  },

  swapTexture() {
    const mesh = this.el.getObject3D('mesh');
    if (!mesh) return;

    const material = mesh.material;
    material.map = this.currentImage === 1 ? this.texture2 : this.texture1;
    material.needsUpdate = true;

    this.currentImage = this.currentImage === 1 ? 2 : 1;
  },

  remove() {
    clearInterval(this.intervalId);
  }
};

AFRAME.registerComponent('ui-image-toggle', UIImageToggle);
