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
    this.texture1.colorSpace = THREE.SRGBColorSpace; // Set color space
    this.texture1.needsUpdate = true;

    this.texture2 = new THREE.Texture(this.data.image2);
    this.texture2.colorSpace = THREE.SRGBColorSpace; // Set color space
    this.texture2.needsUpdate = true;

    // Set the initial material
    const material = new THREE.MeshBasicMaterial({
      map: this.texture1,
      transparent: true,
      flatShading: true,
    });
    this.el.getObject3D('mesh').material = material;

    this.swapTexture = this.swapTexture.bind(this);
    this.intervalId = setInterval(this.swapTexture, this.data.interval);
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
