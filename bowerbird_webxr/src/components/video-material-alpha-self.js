const VideoMaterialAlphaSelf = {
  schema: {
    videoSrc: { type: 'string' },
    autoPlay: { default: false },
    colorHex: { type: 'string' }
  },
  init () {
    const { videoSrc, colorHex } = this.data
    this.model = null
    this.mixer = null

    const model = this.el.getObject3D('mesh')

    if (model) {
      this.load(model, videoSrc, colorHex)
    } else {
      this.el.addEventListener(
          'model-loaded',
          (e) => {
            this.load(e.detail.model, videoSrc, colorHex)
          }
      )
    }
  },

  load (model, videoSrc, color) {
    this.model = model

    const alphaVideo = document.getElementById(videoSrc)
    const videoTexture = new THREE.VideoTexture(alphaVideo)
    videoTexture.minFilter = THREE.LinearMipmapNearestFilter    
    videoTexture.magFilter = THREE.NearestFilter // THREE.NearestFilter
    videoTexture.wrapS = THREE.ClampToEdgeWrapping // ClampToEdgeWrapping
    videoTexture.wrapT = THREE.ClampToEdgeWrapping
    videoTexture.generateMipmaps = true
    videoTexture.flipY = true

    alphaVideo.play()
    if (!this.data.autoPlay) alphaVideo.pause()

    const shaderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        map: { value: videoTexture },
        color: { value: new THREE.Color(color) }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D map;
        uniform vec3 color;
        varying vec2 vUv;
        void main() {
          vec4 texel = texture2D(map, vUv);
          if (length(texel.rgb) < 0.2) discard; // Discard near-black pixels
          gl_FragColor = vec4(texel.rgb * color, 1.0);
        }
      `,
      transparent: true
    });

    this.model.traverse((node) => {
      if (node.isMesh) {
        node.material = shaderMaterial
        node.material.side = THREE.FrontSide
        node.material.flatShading = true
        node.material.needsUpdate = true
      }
    })
  }
}

AFRAME.registerComponent('video-material-alpha-self', VideoMaterialAlphaSelf)