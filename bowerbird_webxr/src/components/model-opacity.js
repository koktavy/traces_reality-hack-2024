const ModelOpacity = {
  schema: {
    number: { type: 'number', default: 1.0 }, // opacity number
    nodeNames: { type: 'array' } // Omit this param to affect the entire mesh
  },
  update () {
    const model = this.el.getObject3D('mesh')
    console.log(model)
    if (model) {
      this.fade(model)
    } else {
      this.el.addEventListener('model-loaded', (e) => {
        this.fade(e.detail.model)
      }, { once: true })
    }
  },

  fade (model) {
    // const { data } = this
    if (!model) return
    model.traverse((node) => {
      // if the nodes that you wish to target are of the same material, uncomment below to target each individually
      // this.clonedMaterial = node.material.clone()
      // node.material = this.clonedMaterial
      if (this.data.nodeNames.length) {
        for (let i = 0; i < this.data.nodeNames.length; i++) {
          if (node.isMesh && node.name.includes(this.data.nodeNames[i])) {
            node.material.opacity = this.data.number
            node.material.transparent = true // Previously : data < 1.0
            node.material.alphaTest = 0.25
            node.material.skinning = true
            node.material.morphTargets = true
            node.material.needsUpdate = true
          }
        }
      } else if (node.isMesh) {
        node.material.opacity = this.data.number
        node.material.transparent = true // Previously : data < 1.0
        node.material.alphaTest = 0.25
        node.material.skinning = true
        node.material.morphTargets = true
        node.material.needsUpdate = true
      }
    })
  }
}

AFRAME.registerComponent('model-opacity', ModelOpacity)