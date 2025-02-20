const rgbaToHex = (rgba, includeAlpha = false) => {
  const rgbaRegex = /^rgba?\(\s*(-?\d+)(%?)\s*,\s*(-?\d+)(%?)\s*,\s*(-?\d+)(%?)\s*(?:,\s*([\d.]+))?\)$/
  let result; let r; let g; let b; let a; let hex = ''
  if ((result = rgbaRegex.exec(rgba))) {
    r = componentFromStr(result[1], result[2])
    g = componentFromStr(result[3], result[4])
    b = componentFromStr(result[5], result[6])
    a = Math.round((result[7] === undefined ? 1 : parseFloat(result[7])) * 255)
    hex = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
    if (includeAlpha) {
      hex += (a < 256 ? (a < 16 ? '0' : '') + a.toString(16) : '')
    }
  }
  return hex
}

const Colorize = {
  schema: {
    color: { type: 'string', default: '#2222ff' },
    nodeNames: { type: 'string', default: '' }, // Omit this param to occlude the entire mesh
    newMaterial: { type: 'boolean', default: false } // Use to avoid affecting other nodes
  },

  init () {
    this.originalColor = this.data.color // Store original color
    this.leftHandInRange = false
    this.rightHandInRange = false

    const updateColor = () => {
      if (this.leftHandInRange || this.rightHandInRange) {
        if (!this.isLighter) {
          const color = new THREE.Color(this.data.color)
          const lighterColor = color.clone().lerp(new THREE.Color(1, 1, 1), 0.3) // Make the color 30% lighter
          this.el.setAttribute('colorize', 'color', `#${lighterColor.getHexString()}`)
          this.isLighter = true
        }
      } else {
        if (this.isLighter) {
          this.el.setAttribute('colorize', 'color', this.originalColor)
          this.isLighter = false
        }
      }
    }

    const handleHandInRange = (hand) => {
      this[`${hand}HandInRange`] = true
      updateColor()
    }

    const handleHandOutOfRange = (hand) => {
      this[`${hand}HandInRange`] = false
      updateColor()
    }

    this.el.addEventListener('left-magnet-hand-in-range', () => handleHandInRange('left'))
    this.el.addEventListener('left-magnet-hand-out-of-range', () => handleHandOutOfRange('left'))
    this.el.addEventListener('right-magnet-hand-in-range', () => handleHandInRange('right'))
    this.el.addEventListener('right-magnet-hand-out-of-range', () => handleHandOutOfRange('right'))
  },

  update () {
    const model = this.el.getObject3D('mesh')

    if (model) {
      this.colorize(model)
    } else {
      this.el.addEventListener(
        'model-loaded',
        (e) => {
          this.colorize(e.detail.model)
        }
      )
    }
  },

  // ///////////////////////////////////
  // Usage Notes:
  // - The texture (if any) is multiplied by the set color
  // - If the scene renderer param `colorManagement` is true, use `.convertSRGBToLinear()`
  // - The same material of the GLTF may be shared across multiple objects, causing all to change
  //   - Use newMaterial to avoid this
  // ///////////////////////////////////

  colorize (model) {
    const { nodeNames, newMaterial } = this.data
    let { color } = this.data
    if (color.includes('rgba')) color = rgbaToHex(color)
    if (color.charAt(0) !== '#') color = `#${color}` // Add a # if the color doesn't have one

    model.traverse((node) => {
      if (!node.isMesh) return

      // Color the whole model
      if (!nodeNames) {
        // The texture is multiplied by the color here, then corrected for scene colorManagement
        node.material.color.set(color).convertSRGBToLinear()
        node.material.skinning = true
        node.material.morphTargets = true
        node.material.needsUpdate = true
      }

      // Target specific nodes
      if (nodeNames.includes(node.name)) {
        // console.log(node.name, nodeNames)
        if (newMaterial) node.material = new THREE.MeshBasicMaterial()
        node.material.color.set(color).convertSRGBToLinear()
        node.material.skinning = true
        node.material.morphTargets = true
        node.material.needsUpdate = true
      }
    })
  }
}

AFRAME.registerComponent('colorize', Colorize)
