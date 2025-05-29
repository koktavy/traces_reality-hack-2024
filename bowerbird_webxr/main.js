/* jshint esversion: 9 */
/* global THREE, AFRAME */

AFRAME.registerComponent('scene-controller', {
  schema: {
    default: ''
  },
  init: function () {
    this.enterVR = document.getElementById('enterVR')
    this.uiIntro = document.getElementById('uiIntro')
    this.uiOutro = document.getElementById('uiOutro')
    this.ground = document.getElementById('ground')
    this.introParent = document.getElementById('introParent')
    this.suitcaseIntro = document.getElementById('suitcaseIntro')
    this.startBearParent = document.getElementById('startBearParent')
    this.startBear = document.getElementById('startBear')

    // Bindings
    this.startIntro = this.startIntro.bind(this)
    this.startCompleteIntroSequence = this.startCompleteIntroSequence.bind(this)
    this.handlestartBearGrab = this.handlestartBearGrab.bind(this)
    this.beginMain = this.beginMain.bind(this)
    this.teleportInsideSuitcase = this.teleportInsideSuitcase.bind(this)
    this.updateNavmesh = this.updateNavmesh.bind(this)
    this.endScene = this.endScene.bind(this)
    this.control = this.control.bind(this)
    this.resetExperience = this.resetExperience.bind(this)

    // Reset condition tracking
    this.leftJoystickPressed = false
    this.rightJoystickPressed = false
    this.resetCooldown = false

    // Timeout management - store all timeouts to clear on reset
    this.timeouts = {
      resetCooldown: null,
      userPositionSync: null,
      suitcaseMaterialReset: null,
      spotlightTransparency: null,
      resetToInitialState: null,
      introSequencePause: null,
      startIntro: null,
      beginMainDelay: null,
      beginMainIntroAudio: null,
      nextSceneDelay: null,
      nextSceneIntroAudio: null
    }

    // Store original transform data
    this.originalHeroData = {}
    this.originalEnvironmentData = {}
    this.originalSceneStates = {}
    this.originalAudioStates = {}

    this.scene1 = null
    this.scene2 = null
    this.scene3 = null
    this.scene4 = null
    this.scene5 = null
    this.scene6 = null
    this.scene7 = null
    this.scene8 = null
    this.scene9 = null
    this.scene10 = null
    this.scene11 = null
    this.scene12 = null

    this.hero1 = document.getElementById('1hero')
    this.hero2 = document.getElementById('2hero')
    this.hero3 = document.getElementById('3hero')
    this.hero4 = document.getElementById('4hero')
    this.hero5 = document.getElementById('5hero')
    this.hero6 = document.getElementById('6hero')
    this.hero7 = document.getElementById('7hero')
    this.hero8 = document.getElementById('8hero')
    this.hero9 = document.getElementById('9hero')
    this.hero10 = document.getElementById('10hero')
    this.hero11 = document.getElementById('11hero')
    this.hero12 = document.getElementById('12hero')

    const wholescene = document.getElementById('wholescene')
    const model = wholescene.getObject3D('mesh')
    if (model) {
      this.control(model)
    } else {
      wholescene.addEventListener('model-loaded', (e) => {
        this.control(e.detail.model)
      }, { once: true })
    }
  },

  control: function (model) {
    // const { data } = this
    if (!model) return
    model.traverse((node) => {
      // if the nodes that you wish to target are of the same material, uncomment below to target each individually
      // this.clonedMaterial = node.material.clone()
      // node.material = this.clonedMaterial
      if (node.isMesh) {
        node.visible = false
      }
      if (node.name.includes('1_scene')) {
        this.scene1 = node
        // node.visible = true
      }
      if (node.name.includes('2_scene')) this.scene2 = node
      if (node.name.includes('3_scene')) this.scene3 = node
      if (node.name.includes('4_scene')) {
        this.scene4 = node
        this.scene10 = node
        this.scene12 = node
      }
      if (node.name.includes('5_scene')) this.scene5 = node
      if (node.name.includes('6_scene')) {
        this.scene6 = node
        this.scene8 = node
        this.scene11 = node
      }
      if (node.name.includes('7_scene')) this.scene7 = node
      if (node.name.includes('9_scene')) this.scene9 = node
    })

    this.enterVR.innerHTML = 'Start VR'
    this.el.sceneEl.addEventListener('enter-vr', () => {
      this.startCompleteIntroSequence()
    })
    this.el.sceneEl.addEventListener('exit-vr', () => {
      document.getElementById('dom-overlay-message').style.display = 'flex'
    })

    // Set up controller input listeners for reset condition
    this.setupResetListeners()

    // Set up start bear grab listener
    this.setupstartBearListener()

    // Capture original transform data
    this.captureOriginalData()
  },

  captureOriginalData: function () {
    // Hero objects - capture ALL attributes that can change
    for (let i = 1; i <= 12; i++) {
      const hero = document.getElementById(`${i}hero`)
      if (hero) {
        this.originalHeroData[i] = {
          // Transform properties (change in endScene, attach-to-parent, putdown)
          // Create deep copies of objects
          position: Object.assign({}, hero.getAttribute('position')),
          rotation: Object.assign({}, hero.getAttribute('rotation')),
          scale: Object.assign({}, hero.getAttribute('scale')),
          visible: hero.getAttribute('visible'),
          // Interaction properties (removed in putdown event)
          classes: Array.from(hero.classList), // magnet-left, magnet-right removed in putdown
          togglePhysics: hero.getAttribute('toggle-physics'), // removed in putdown
          magnetRange: hero.getAttribute('data-magnet-range'), // removed in putdown
          pickUp: hero.hasAttribute('data-pick-up'), // removed in putdown
          physxBody: hero.getAttribute('physx-body'), // removed in putdown
          physxMaterial: hero.getAttribute('physx-material'), // removed in putdown
          // State tracking
          hasGrabbedState: hero.is('grabbed'), // added/removed during pickup/putdown
          // Parent tracking (objects can be reparented to body during attach-to-parent)
          parentId: hero.object3D.parent === this.el.sceneEl.object3D ? 'scene' : 'body'
        }
      }
    }

    // Environment - capture ALL elements that change
    this.originalEnvironmentData = {
      fog: {
        density: this.el.sceneEl.getAttribute('fog').density
      },
      ground: {
        material: Object.assign({}, this.ground.getAttribute('material')),
        transparent: this.ground.getAttribute('material').transparent || false
      },
      suitcase: {
        position: Object.assign({}, this.suitcaseIntro.getAttribute('position')),
        rotation: Object.assign({}, this.suitcaseIntro.getAttribute('rotation')),
        scale: Object.assign({}, this.suitcaseIntro.getAttribute('scale'))
      },
      startBearParent: {
        visible: this.startBearParent.getAttribute('visible'),
        position: Object.assign({}, this.startBearParent.getAttribute('position'))
      },
      startBear: {
        position: Object.assign({}, this.startBear.getAttribute('position')),
        rotation: Object.assign({}, this.startBear.getAttribute('rotation')),
        scale: Object.assign({}, this.startBear.getAttribute('scale')),
        modelOpacity: this.startBear.getAttribute('model-opacity') ? Object.assign({}, this.startBear.getAttribute('model-opacity')) : { number: 0 },
        classes: Array.from(this.startBear.classList),
        magnetRange: this.startBear.getAttribute('data-magnet-range'),
        pickUp: this.startBear.hasAttribute('data-pick-up')
      },
      startBearText: {
        color: this.startBearParent.querySelector('a-troika-text') ? this.startBearParent.querySelector('a-troika-text').getAttribute('color') : '#000000',
        visible: this.startBearParent.querySelector('a-troika-text') ? this.startBearParent.querySelector('a-troika-text').getAttribute('visible') : true
      },
      startInstructionPlaneLeft: {
        visible: document.getElementById('startInstructionPlaneLeft') ? document.getElementById('startInstructionPlaneLeft').getAttribute('visible') : true,
      },
      startInstructionTextLeft: {
        color: document.getElementById('startInstructionTextLeft') ? document.getElementById('startInstructionTextLeft').getAttribute('color') : '#000000',
        visible: document.getElementById('startInstructionTextLeft') ? document.getElementById('startInstructionTextLeft').getAttribute('visible') : true
      },
      suitcaseLight: {
        visible: document.getElementById('suitcaseLight').getAttribute('visible'),
        animation: document.getElementById('suitcaseLight').getAttribute('animation__intensity')
      },
      suitcaseUIPlane: {
        visible: document.getElementById('suitcaseUIPlane').getAttribute('visible'),
        scale: Object.assign({}, document.getElementById('suitcaseUIPlane').getAttribute('scale')),
        position: Object.assign({}, document.getElementById('suitcaseUIPlane').getAttribute('position')),
        rotation: Object.assign({}, document.getElementById('suitcaseUIPlane').getAttribute('rotation')),
        height: document.getElementById('suitcaseUIPlane').getAttribute('height'),
        width: document.getElementById('suitcaseUIPlane').getAttribute('width')
      },
      cameraRig: {
        position: Object.assign({}, document.getElementById('cameraRig').getAttribute('position')),
        rotation: Object.assign({}, document.getElementById('cameraRig').getAttribute('rotation')),
        navmeshConstraint: document.getElementById('cameraRig').getAttribute('simple-navmesh-constraint')
      },
      introParent: {
        visible: this.introParent.getAttribute('visible')
      },
      introSpotlight: {
        visible: document.getElementById('introSpotlight').getAttribute('visible'),
        position: Object.assign({}, document.getElementById('introSpotlight').getAttribute('position')),
        rotation: Object.assign({}, document.getElementById('introSpotlight').getAttribute('rotation')),
        light: Object.assign({}, document.getElementById('introSpotlight').getAttribute('light'))
      },
      introSpotlightCone: {
        material: Object.assign({}, document.getElementById('introSpotlightCone').getAttribute('material')),
        position: Object.assign({}, document.getElementById('introSpotlightCone').getAttribute('position')),
        rotation: Object.assign({}, document.getElementById('introSpotlightCone').getAttribute('rotation'))
      },
      introSpotlightConeChild: {
        material: Object.assign({}, document.getElementById('introSpotlightCone').firstElementChild.getAttribute('material')),
        position: Object.assign({}, document.getElementById('introSpotlightCone').firstElementChild.getAttribute('position'))
      },
      uiIntro: {
        visible: this.uiIntro.getAttribute('visible'),
        opacity: this.uiIntro.getAttribute('material').opacity || 0,
        material: Object.assign({}, this.uiIntro.getAttribute('material'))
      },
      uiOutro: {
        visible: this.uiOutro.getAttribute('visible'),
        opacity: this.uiOutro.getAttribute('material').opacity || 0,
        material: Object.assign({}, this.uiOutro.getAttribute('material'))
      },
      blinkControls: {
        rightFingertip: document.getElementById('rightFingertip') ?
          Object.assign({}, document.getElementById('rightFingertip').getAttribute('blink-controls')) : null,
        leftFingertip: document.getElementById('leftFingertip') ?
          Object.assign({}, document.getElementById('leftFingertip').getAttribute('blink-controls')) : null,
        rightRay: document.getElementById('rightRay') ?
          Object.assign({}, document.getElementById('rightRay').getAttribute('blink-controls')) : null,
        leftRay: document.getElementById('leftRay') ?
          Object.assign({}, document.getElementById('leftRay').getAttribute('blink-controls')) : null
      }
    }

    // Scene states - track all scene parent visibility and 3D model states
    this.originalSceneStates = {}
    for (let i = 1; i <= 12; i++) {
      const parent = document.getElementById(`${i}parent`)
      this.originalSceneStates[i] = {
        parentVisible: parent ? parent.getAttribute('visible') : 'false',
        sceneModelVisible: null // Will be set after 3D models load
      }
    }

    // Audio states - track which sounds are playing (all should be stopped initially)
    this.originalAudioStates = {
      piano: false, // Piano plays in startCompleteIntroSequence
      introSpotlightAudio: false,
      spotlightAudios: {}, // 1-12 spotlight audios
      introAudios: {}, // 1-12 intro audios
      outroAudios: {}, // 1-12 outro audios (play during pickup)
      ambAudios: {} // 1-12 ambient audios
    }

    // Initialize audio states
    for (let i = 1; i <= 12; i++) {
      this.originalAudioStates.spotlightAudios[i] = false
      this.originalAudioStates.introAudios[i] = false
      this.originalAudioStates.outroAudios[i] = false
      this.originalAudioStates.ambAudios[i] = false
    }
  },

  setupResetListeners: function () {
    // Find the specific controller elements that receive events
    const leftMagnet = document.getElementById('left-magnet')
    const rightMagnet = document.getElementById('right-magnet')

    // Now listen for thumbstick button events on the same elements
    const controllerElements = [
      { el: leftMagnet, name: 'left-magnet', handedness: 'left' },
      { el: rightMagnet, name: 'right-magnet', handedness: 'right' }
    ]

    // Listen to gamepad events
    controllerElements.forEach(({ el, name, handedness }) => {
      if (el) {
        el.addEventListener('gamepad', (evt) => {
          const eventName = evt.detail.event
          if (eventName.includes('button3down') || eventName.includes('thumbstickdown') || eventName.includes('joystickdown')) {
            if (handedness === 'left') {
              this.leftJoystickPressed = true
            } else {
              this.rightJoystickPressed = true
            }
            this.checkResetCondition()
          } else if (eventName.includes('button3up') || eventName.includes('thumbstickup') || eventName.includes('joystickup')) {
            if (handedness === 'left') {
              this.leftJoystickPressed = false
            } else {
              this.rightJoystickPressed = false
            }
          }
          // console.log(`Current state: Left=${this.leftJoystickPressed}, Right=${this.rightJoystickPressed}`)
        })
      }
    })
  },

  setupstartBearListener: function () {
    if (this.startBear) this.startBear.addEventListener('pickup', this.handlestartBearGrab)
  },

  clearAllTimeouts: function () {
    // Clear all stored timeouts to prevent timing conflicts during reset
    Object.keys(this.timeouts).forEach(key => {
      if (this.timeouts[key]) {
        clearTimeout(this.timeouts[key])
        this.timeouts[key] = null
      }
    })
  },

  checkResetCondition: function () {
    if (this.leftJoystickPressed && this.rightJoystickPressed && !this.resetCooldown) {
      this.resetExperience()
      // Set 2s reset cooldown to prevent multiple resets
      this.resetCooldown = true
      this.timeouts.resetCooldown = setTimeout(() => {
        this.resetCooldown = false
        this.timeouts.resetCooldown = null
      }, 2000)
    }
  },

  resetExperience: function () {
    console.log('🔄 Resetting experience to intro sequence...')
    // Clear all timeouts first to prevent timing conflicts
    this.clearAllTimeouts()
    // Remove all animations first to prevent component access errors
    this.removeAllAnimations()
    // Stop all audio to prevent conflicts
    this.resetAudio()
    // Reset all game objects and their states
    this.resetHeroObjects()
    // Reset all scene visibility and 3D models
    this.resetScenes()
    // Reset all environment elements
    this.resetEnvironment()
    // Small delay to ensure all resets are complete before starting intro
    this.timeouts.resetToInitialState = setTimeout(() => {
      // Force a render update to ensure all position/scale changes are applied
      this.el.sceneEl.renderer.render(this.el.sceneEl.object3D, this.el.sceneEl.camera)
      // Start the complete intro sequence using the same function as enter-vr
      this.startCompleteIntroSequence()
      this.timeouts.resetToInitialState = null
      console.log('✅ Reset complete!')
    }, 100)
  },

  resetHeroObjects: function () {
    for (let i = 1; i <= 12; i++) {
      const hero = document.getElementById(`${i}hero`)
      const originalData = this.originalHeroData[i]
      if (hero && originalData) {
        // Remove ALL possible animations that can be added during experience
        hero.removeAttribute('animation__position')
        hero.removeAttribute('animation__rotation')
        hero.removeAttribute('animation__scale')
        hero.removeAttribute('animation__bob')
        hero.removeAttribute('attach-to-parent')
        // Reset ALL transform properties to original values
        hero.setAttribute('position', originalData.position)
        hero.setAttribute('rotation', originalData.rotation)
        hero.setAttribute('scale', originalData.scale)
        hero.setAttribute('visible', originalData.visible)
        // Reset ALL interaction classes (magnet-left, magnet-right removed in putdown)
        hero.className = ''
        originalData.classes.forEach(className => {
          hero.classList.add(className)
        })
        // Restore ALL physics and interaction attributes (removed in putdown)
        if (originalData.togglePhysics) hero.setAttribute('toggle-physics', originalData.togglePhysics)
        if (originalData.magnetRange) hero.setAttribute('data-magnet-range', originalData.magnetRange)
        if (originalData.pickUp) hero.setAttribute('data-pick-up', '')
        if (originalData.physxBody) hero.setAttribute('physx-body', originalData.physxBody)
        if (originalData.physxMaterial) hero.setAttribute('physx-material', originalData.physxMaterial)
        if (hero.is('grabbed')) hero.removeState('grabbed')
        // Ensure proper parenting (objects can be reparented to body during attach-to-parent)
        if (originalData.parentId === 'scene' && hero.object3D.parent !== this.el.sceneEl.object3D) {
          this.el.sceneEl.object3D.add(hero.object3D)
        }
        // Remove any grab-disabled events that may have been emitted
        hero.removeEventListener('grab-disabled', () => {})
      }
    }
  },

  resetScenes: function () {
    // Reset ALL scene parent visibility to original state
    for (let i = 1; i <= 12; i++) {
      const parent = document.getElementById(`${i}parent`)
      const originalState = this.originalSceneStates[i]
      if (parent && originalState) {
        parent.setAttribute('visible', originalState.parentVisible)
      }
    }
    const scenes = [this.scene1, this.scene2, this.scene3, this.scene4, this.scene5, this.scene6, this.scene7, this.scene8, this.scene9, this.scene10, this.scene11, this.scene12]
    // Scenes that share models and need mesh-level visibility control
    const loopNums = [4, 6, 8, 10, 11, 12]
    scenes.forEach((scene, index) => {
      if (scene) {
        const sceneNum = index + 1
        if (loopNums.includes(sceneNum)) {
          // These scenes share models - hide all meshes (they become visible during progression)
          scene.traverse((node) => {
            if (node.isMesh) {
              node.visible = false
            }
          })
        } else {
          // Unique scenes - simple visibility toggle (they become visible during progression)
          scene.visible = false
        }
      }
    })
    // Reset intro parent to original state
    if (this.originalEnvironmentData.introParent) {
      this.introParent.setAttribute('visible', this.originalEnvironmentData.introParent.visible)
    }
  },

  resetSpotlightTransparency: function () {
    // Reset intro spotlight cone
    const introSpotlightCone = document.getElementById('introSpotlightCone')
    if (introSpotlightCone) {
      introSpotlightCone.setAttribute('material', 'src: #lightfadeSrc; side: back; transparent: true; opacity: 0.25')
      // Also reset the child cone in case of end scene animation
      const childCone = introSpotlightCone.firstElementChild
      if (childCone) {
        childCone.setAttribute('material', 'color: #454545; transparent: false')
      }
    }
    // Reset all scene spotlight cones (1-12)
    for (let i = 1; i <= 12; i++) {
      const spotlightCone = document.getElementById(`${i}spotlightCone`)
      if (spotlightCone) {
        spotlightCone.setAttribute('material', 'src: #lightfadeSrc; side: back; transparent: true; opacity: 0.25')
        // Also reset the child cone
        const childCone = spotlightCone.firstElementChild
        if (childCone) {
          childCone.setAttribute('material', 'color: #454545; transparent: false')
        }
      }
    }
  },

  // Ensure all UI elements remain transparent after reset
  resetUITransparency: function () {
    // Reset suitcase UI plane (teleport instructions)
    const suitcaseUIPlane = document.getElementById('suitcaseUIPlane')
    if (suitcaseUIPlane) {
      // Force Three.js material properties for ui-image-toggle component
      const mesh = suitcaseUIPlane.getObject3D('mesh')
      if (mesh && mesh.material) {
        mesh.material.transparent = true
        mesh.material.depthWrite = false
        mesh.material.needsUpdate = true
      }
    }
    // Reset main UI elements (intro/outro)
    const uiIntro = document.getElementById('uiIntro')
    const uiOutro = document.getElementById('uiOutro')
    uiIntro.setAttribute('material', 'src: #introImg; transparent: true; opacity: 0')
    uiOutro.setAttribute('material', 'src: #outroImg; transparent: true; opacity: 0')
  },

  resetEnvironment: function () {
    const envData = this.originalEnvironmentData
    // Reset scene fog
    this.el.sceneEl.removeAttribute('animation__fog')
    this.el.sceneEl.setAttribute('fog', `density: ${envData.fog.density}`)
    // Reset ground material
    this.ground.removeAttribute('animation')
    this.ground.setAttribute('material', envData.ground.material)
    this.ground.setAttribute('material', 'opacity', 0)
    // Reset navmesh to original state
    if (envData.blinkControls.rightFingertip) {
      document.getElementById('rightFingertip').setAttribute('blink-controls', envData.blinkControls.rightFingertip)
    }
    if (envData.blinkControls.leftFingertip) {
      document.getElementById('leftFingertip').setAttribute('blink-controls', envData.blinkControls.leftFingertip)
    }
    if (envData.blinkControls.rightRay && document.getElementById('rightRay')) {
      document.getElementById('rightRay').setAttribute('blink-controls', envData.blinkControls.rightRay)
    }
    if (envData.blinkControls.leftRay && document.getElementById('leftRay')) {
      document.getElementById('leftRay').setAttribute('blink-controls', envData.blinkControls.leftRay)
    }
    // Reset camera rig
    const cameraRig = document.getElementById('cameraRig')
    cameraRig.setAttribute('position', envData.cameraRig.position)
    cameraRig.setAttribute('rotation', envData.cameraRig.rotation)
    if (envData.cameraRig.navmeshConstraint) {
      cameraRig.setAttribute('simple-navmesh-constraint', envData.cameraRig.navmeshConstraint)
    }
    this.updateNavmesh('.ground')
    // Reset suitcase transform to original HTML values
    this.suitcaseIntro.setAttribute('position', '0 0 0')
    this.suitcaseIntro.setAttribute('rotation', '0 0 0')
    this.suitcaseIntro.setAttribute('scale', '0.0175 0.0175 0.0175')
    this.suitcaseIntro.setAttribute('model-opacity', 'number: 1')
    if (this.suitcaseFadeTimeout) {
      clearTimeout(this.suitcaseFadeTimeout)
      this.suitcaseFadeTimeout = null
    }
    this.suitcaseIntro.object3D.traverse((node) => {
      if (node.isMesh) node.material.depthWrite = true // Reset depthWrite to look normal before animating
    })
    if (this.suitcaseDistanceInterval) {
      clearInterval(this.suitcaseDistanceInterval)
      this.suitcaseDistanceInterval = null
    }
    // Reset start bear to original state
    const startBearData = envData.startBear
    const startBearParentData = envData.startBearParent
    this.startBearParent.setAttribute('visible', startBearParentData.visible)
    this.startBearParent.setAttribute('position', startBearParentData.position)
    this.startBear.setAttribute('position', startBearData.position)
    this.startBear.setAttribute('rotation', startBearData.rotation)
    this.startBear.setAttribute('scale', startBearData.scale)
    this.startBear.setAttribute('model-opacity', startBearData.modelOpacity)
    this.startBear.removeAttribute('animation__scale')
    this.startBear.removeAttribute('animation__opacity')
    this.startBear.removeAttribute('animation__fadein')
    this.startBear.removeAttribute('animation__bob')
    this.startBear.removeAttribute('animation__tilt')
    // Restore grab interaction attributes
    this.startBear.className = ''
    startBearData.classes.forEach(className => {
      this.startBear.classList.add(className)
    })
    if (startBearData.magnetRange) this.startBear.setAttribute('data-magnet-range', startBearData.magnetRange)
    if (startBearData.pickUp) this.startBear.setAttribute('data-pick-up', '')
    if (this.startBear.is('grabbed')) this.startBear.removeState('grabbed')

    // Reset troika text color and visibility
    const startBearText = document.getElementById('startBearText')
    if (startBearText) {
      startBearText.removeAttribute('animation')
      startBearText.removeAttribute('animation__fadein')
      startBearText.setAttribute('color', envData.startBearText.color)
      startBearText.setAttribute('visible', envData.startBearText.visible)
    }

    // Reset instruction plane
    const startInstructionPlaneLeft = document.getElementById('startInstructionPlaneLeft')
    if (startInstructionPlaneLeft) {
      startInstructionPlaneLeft.removeAttribute('animation')
      startInstructionPlaneLeft.removeAttribute('animation__fadein')
      startInstructionPlaneLeft.setAttribute('visible', envData.startInstructionPlaneLeft.visible)
      // Stop any running opacity animations
      this.startInstructionPlaneLeftAnimationActive = false
      if (this.startInstructionPlaneLeftOpacityInterval) {
        clearInterval(this.startInstructionPlaneLeftOpacityInterval)
        this.startInstructionPlaneLeftOpacityInterval = null
      }
      if (this.startInstructionPlaneLeftFadeOutInterval) {
        clearInterval(this.startInstructionPlaneLeftFadeOutInterval)
        this.startInstructionPlaneLeftFadeOutInterval = null
      }
      // Reset the THREE.js material opacity directly
      const mesh = startInstructionPlaneLeft.getObject3D('mesh')
      if (mesh && mesh.material) {
        mesh.material.opacity = 0
        mesh.material.needsUpdate = true
      }
    }

    // Reset instruction text
    const startInstructionTextLeft = document.getElementById('startInstructionTextLeft')
    if (startInstructionTextLeft) {
      startInstructionTextLeft.removeAttribute('animation__fadeout')
      startInstructionTextLeft.removeAttribute('animation__fadein')
      startInstructionTextLeft.setAttribute('color', envData.startInstructionTextLeft.color)
      startInstructionTextLeft.setAttribute('visible', envData.startInstructionTextLeft.visible)
    }
    // Reset suitcase UI elements (change visibility in teleportInsideSuitcase)
    const suitcaseLight = document.getElementById('suitcaseLight')
    suitcaseLight.setAttribute('visible', envData.suitcaseLight.visible)
    if (envData.suitcaseLight.animation) suitcaseLight.setAttribute('animation__intensity', envData.suitcaseLight.animation)
    const suitcaseUIPlane = document.getElementById('suitcaseUIPlane')
    suitcaseUIPlane.removeAttribute('animation')
    suitcaseUIPlane.setAttribute('visible', envData.suitcaseUIPlane.visible)
    suitcaseUIPlane.setAttribute('scale', envData.suitcaseUIPlane.scale)
    suitcaseUIPlane.setAttribute('position', envData.suitcaseUIPlane.position)
    suitcaseUIPlane.setAttribute('rotation', envData.suitcaseUIPlane.rotation)
    suitcaseUIPlane.setAttribute('height', envData.suitcaseUIPlane.height)
    suitcaseUIPlane.setAttribute('width', envData.suitcaseUIPlane.width)
    // Reset intro spotlight (changes in endScene)
    const introSpotlight = document.getElementById('introSpotlight')
    introSpotlight.removeAttribute('animation__position')
    introSpotlight.removeAttribute('animation__intensity')
    introSpotlight.removeAttribute('animation__angle')
    introSpotlight.setAttribute('visible', envData.introSpotlight.visible)
    introSpotlight.setAttribute('position', envData.introSpotlight.position)
    introSpotlight.setAttribute('rotation', envData.introSpotlight.rotation)
    introSpotlight.setAttribute('light', envData.introSpotlight.light)
    // Reset spotlight cones (materials change during animations)
    const introSpotlightCone = document.getElementById('introSpotlightCone')
    introSpotlightCone.removeAttribute('animation')
    introSpotlightCone.setAttribute('material', envData.introSpotlightCone.material)
    introSpotlightCone.setAttribute('position', envData.introSpotlightCone.position)
    introSpotlightCone.setAttribute('rotation', envData.introSpotlightCone.rotation)
    const childCone = introSpotlightCone.firstElementChild
    if (childCone) {
      childCone.removeAttribute('animation')
      childCone.setAttribute('material', envData.introSpotlightConeChild.material)
      childCone.setAttribute('position', envData.introSpotlightConeChild.position)
    }
    // Reset UI elements (change visibility and opacity throughout experience)
    this.uiIntro.setAttribute('visible', envData.uiIntro.visible)
    this.uiIntro.setAttribute('material', envData.uiIntro.material)
    this.uiIntro.removeAttribute('animation')
    this.uiOutro.setAttribute('visible', envData.uiOutro.visible)
    this.uiOutro.setAttribute('material', envData.uiOutro.material)
    this.uiOutro.removeAttribute('animation')
    // Ensure all spotlight cones maintain proper transparency
    this.resetSpotlightTransparency()
    // Ensure UI elements maintain proper transparency
    this.resetUITransparency()
  },

  // Stop any audio that may be playing during reset
  resetAudio: function () {
    // Stop piano (plays in startCompleteIntroSequence)
    const piano = document.getElementById('piano')
    if (piano && piano.components.sound && piano.components.sound.isPlaying) {
      piano.components.sound.stopSound()
    }
    // Stop intro spotlight audio
    const introSpotlightAudio = document.getElementById('introSpotlightAudio')
    if (introSpotlightAudio && introSpotlightAudio.components.sound && introSpotlightAudio.components.sound.isPlaying) {
      introSpotlightAudio.components.sound.stopSound()
    }
    // Stop all scene-specific audio (1-12)
    for (let i = 1; i <= 12; i++) {
      // Stop spotlight audio (plays when scenes become visible)
      const spotlightAudio = document.getElementById(`${i}spotlightAudio`)
      if (spotlightAudio && spotlightAudio.components.sound && spotlightAudio.components.sound.isPlaying) {
        spotlightAudio.components.sound.stopSound()
      }
      // Stop intro audio (plays 2.5s after scene becomes visible)
      const introAudio = document.getElementById(`${i}intro`)
      if (introAudio && introAudio.components.sound && introAudio.components.sound.isPlaying) {
        introAudio.components.sound.stopSound()
      }
      // Stop outro audio (plays during pickup events)
      const outroAudio = document.getElementById(`${i}outro`)
      if (outroAudio && outroAudio.components.sound && outroAudio.components.sound.isPlaying) {
        outroAudio.components.sound.stopSound()
      }
      // Stop ambient audio (plays with scene parents)
      const parentEl = document.getElementById(`${i}parent`)
      if (parentEl) {
        const ambAudio = parentEl.querySelector('[sound]')
        if (ambAudio && ambAudio.components.sound && ambAudio.components.sound.isPlaying) {
          ambAudio.components.sound.stopSound()
        }
      }
    }
  },

  // Remove all animations in the scene to prevent component access errors during reset
  removeAllAnimations: function () {
    const allElements = this.el.sceneEl.querySelectorAll('[animation], [animation__position], [animation__rotation], [animation__scale], [animation__opacity], [animation__bob], [animation__tilt], [animation__intensity], [animation__angle], [animation__fog], [animation__pos], [animation__fadein], [animation__fadeout]')
    allElements.forEach(el => {
      // Remove all possible animation attributes - the experience will add them back as needed
      el.removeAttribute('animation')
      el.removeAttribute('animation__position')
      el.removeAttribute('animation__rotation')
      el.removeAttribute('animation__scale')
      el.removeAttribute('animation__opacity')
      el.removeAttribute('animation__bob')
      el.removeAttribute('animation__tilt')
      el.removeAttribute('animation__intensity')
      el.removeAttribute('animation__angle')
      el.removeAttribute('animation__fog')
      el.removeAttribute('animation__pos')
      el.removeAttribute('animation__fadein')
      el.removeAttribute('animation__fadeout')
    })
  },

  startCompleteIntroSequence: function () {
    // Hide DOM overlay
    document.getElementById('dom-overlay-message').style.display = 'none'
    // Play piano audio
    const piano = document.getElementById('piano');
    if (piano && piano.components['sound']) {
      piano.components['sound'].playSound();
      // piano.setAttribute('sound', 'loop: true; volume: 0.2');
    }
    // A-Frame animate to fade in the Traces logo
    this.uiIntro.setAttribute('visible', true)
    this.uiIntro.setAttribute('animation', 'property: material.opacity; from: 0; to: 1; dur: 4500; delay: 1000; easing: linear')

    // Fade in start bear
    this.startBearParent.setAttribute('visible', true)
    this.startBear.setAttribute('model-opacity', 'number: 0')
    this.startBear.setAttribute('animation__fadein', 'property: model-opacity.number; from: 0; to: 1; dur: 2500; delay: 3500; easing: easeInOutQuad')
    this.startBear.setAttribute('animation__bob', 'property: position; to: 0 0.025 0; dur: 2250; dir: alternate; easing: easeInOutSine; loop: true')
    this.startBear.setAttribute('animation__tilt', 'property: rotation; from: 5 -90 0; to: -5 -90 0; dur: 4500; dir: alternate; easing: easeInOutSine; loop: true')
    // Fade in pick up instruction
    const startBearText = document.getElementById('startBearText')
    startBearText.setAttribute('color', '#000000')
    startBearText.setAttribute('animation__fadein', 'property: color; to: #888888; dur: 2000; delay: 5000; easing: easeOutQuad')
    startBearText.addEventListener('animationcomplete__fadein', () => {
      const startInstructionPlaneLeft = document.getElementById('startInstructionPlaneLeft')
      // Animate the image opacity from 0 to 1 over 1.75s at the three.js level
      const material = startInstructionPlaneLeft.getObject3D('mesh').material
      material.opacity = 0
      const fadeInDur = 1750
      const opacityIncrement = 1 / 100
      const interval = fadeInDur / 100
      this.startInstructionPlaneLeftAnimationActive = true
      this.startInstructionPlaneLeftOpacityInterval = setInterval(() => {
        // Check if animation was stopped (by scene reset)
        if (!this.startInstructionPlaneLeftAnimationActive) return
        // Always read current opacity from material (in case it was reset)
        const currentOpacity = material.opacity + opacityIncrement
        material.opacity = currentOpacity
        if (currentOpacity >= 1) {
          clearInterval(this.startInstructionPlaneLeftOpacityInterval)
          this.startInstructionPlaneLeftOpacityInterval = null
          this.startInstructionPlaneLeftAnimationActive = false
        }
      }, interval)

      // Fade in instruction text
      const startInstructionTextLeft = document.getElementById('startInstructionTextLeft')
      startInstructionTextLeft.setAttribute('color', '#000000')
      startInstructionTextLeft.setAttribute('animation__fadein', `property: color; to: #888888; dur: ${fadeInDur}; easing: easeOutQuad`)
    }, { once: true })
  },

  handlestartBearGrab: function () {
    // Scale the start bear to 0
    this.startBear.setAttribute('animation__scale', 'property: scale; to: 0 0 0; dur: 3000; easing: easeInSine')
    this.startBear.setAttribute('model-opacity', 'number: 1')
    this.startBear.setAttribute('animation__opacity', 'property: model-opacity.number; to: 0; dur: 2000; easing: easeInSine')
    // Fade out the logo
    this.uiIntro.removeAttribute('animation')
    this.uiIntro.setAttribute('animation', 'property: material.opacity; from: 1; to: 0; dur: 1500; easing: linear')
    // Set the uiIntro invisible once animation completes
    this.uiIntro.addEventListener('animationcomplete', () => {
      this.uiIntro.setAttribute('visible', false)
    }, { once: true })

    // Fade out the start screen UI
    const startBearText = document.getElementById('startBearText')
    startBearText.setAttribute('animation', 'property: color; to: #000000; dur: 500; easing: linear')
    startBearText.addEventListener('animationcomplete', () => {
      startBearText.setAttribute('visible', false)
    }, { once: true })

    // Fade out the instruction plane using THREE.js animation
    const startInstructionPlaneLeft = document.getElementById('startInstructionPlaneLeft')
    if (startInstructionPlaneLeft) {
      const material = startInstructionPlaneLeft.getObject3D('mesh').material
      const startOpacity = material.opacity
      const targetOpacity = 0
      const duration = 500 // 500ms
      const startTime = Date.now()
      this.startInstructionPlaneLeftFadeOutInterval = setInterval(() => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        material.opacity = startOpacity + (targetOpacity - startOpacity) * progress
        material.needsUpdate = true
        if (progress >= 1) {
          clearInterval(this.startInstructionPlaneLeftFadeOutInterval)
          this.startInstructionPlaneLeftFadeOutInterval = null
          startInstructionPlaneLeft.setAttribute('visible', false)
        }
      }, 16) // ~60fps
    }

    // Fade out the instruction text
    const startInstructionTextLeft = document.getElementById('startInstructionTextLeft')
    if (startInstructionTextLeft) {
      startInstructionTextLeft.setAttribute('animation', 'property: color; to: #000000; dur: 500; easing: linear')
      startInstructionTextLeft.addEventListener('animationcomplete', () => {
        startInstructionTextLeft.setAttribute('visible', false)
      }, { once: true })
    }
    // Fade in fog
    this.el.sceneEl.setAttribute('animation__fog', 'property: fog.density; from: 0; to: 0.017; dur: 3000; delay: 1000; easing: linear')
    // Fade in ground
    this.ground.setAttribute('animation', 'property: material.opacity; from: 0; to: 1; dur: 3000; delay: 1000; easing: linear')
    // Listen for the logo animation to complete
    this.startBear.addEventListener('animationcomplete__scale', () => {
      // Reset camera rig to original position to keep suitcase sequence
      const cameraRig = document.getElementById('cameraRig')
      const sceneController = this.el.sceneEl.components['scene-controller']
      if (cameraRig && sceneController) {
        const envData = sceneController.originalEnvironmentData
        cameraRig.setAttribute('position', envData.cameraRig.position)
        cameraRig.setAttribute('rotation', envData.cameraRig.rotation)
      }
      this.startBearParent.setAttribute('visible', false)
      // Move startBear out of reach so it can't be grabbed again even if dropped
      this.startBear.setAttribute('position', '0 -100 0')
      this.ground.addEventListener('animationcomplete', this.startIntro)
    }, { once: true })
  },

  startIntro: function () {
    this.timeouts.startIntro = setTimeout(() => {
      this.introParent.setAttribute('visible', true)
      document.getElementById('introSpotlightAudio').components['sound'].playSound()
      this.updateNavmesh('.suitcase')
      // Listen for the user to get close to the suitcase
      const suitcase = document.getElementById('suitcaseIntro');
      const user = document.getElementById('head');
      const userPos = new THREE.Vector3();
      const suitcasePos = new THREE.Vector3();
      const checkDistance = () => {
        user.object3D.getWorldPosition(userPos);
        suitcase.object3D.getWorldPosition(suitcasePos);
        const distance = Math.sqrt(Math.pow(userPos.x - suitcasePos.x, 2) + Math.pow(userPos.z - suitcasePos.z, 2));
        if (distance < 1) {
          clearInterval(this.suitcaseDistanceInterval);
          this.suitcaseDistanceInterval = null
          this.teleportInsideSuitcase();
        }
      };

      this.suitcaseDistanceInterval = setInterval(checkDistance, 100);
      // this.el.sceneEl.addEventListener('teleported', this.teleportInsideSuitcase, { once: true })
      this.timeouts.startIntro = null
    }, 1000)
  },

  teleportInsideSuitcase: function () {
    this.updateNavmesh('.navmesh')
    document.getElementById('suitcaseLight').setAttribute('visible', false)
    document.getElementById('suitcaseUIPlane').setAttribute('visible', false)
    this.suitcaseIntro.setAttribute('animation__scale', 'property: scale; to: 3 3 3; dur: 7000; easing: easeInOutQuad')
    this.suitcaseIntro.setAttribute('animation__pos', 'property: position; to: 0 2.1 0; dur: 7000; easing: easeInOutQuad')
    const suitcaseFadeDelay = 3500
    // Fade the suitcase to 0 opacity
    this.suitcaseFadeTimeout = setTimeout(() => {
      this.suitcaseIntro.object3D.traverse((node) => {
        if (node.isMesh) {
          node.material.transparent = true
          node.material.depthWrite = false // Prevent depth writing to avoid flickering
        }
      })
    }, suitcaseFadeDelay)
    this.suitcaseIntro.setAttribute('model-opacity', 'number: 1')
    this.suitcaseIntro.setAttribute('animation__opacity', `property: model-opacity.number; to: 0; delay: ${suitcaseFadeDelay}; dur: 3500; easing: easeInQuad`)
    const suitcaseUIPlane = document.getElementById('suitcaseUIPlane')
    suitcaseUIPlane.setAttribute('animation', 'property: scale; to: 0 0 0; dur: 700; easing: easeInQuad')
    document.getElementById('introSpotlightCone').setAttribute('animation', 'property: material.opacity; to: 0; dur: 7000; easing: easeInOutQuad')
    document.getElementById('introSpotlightCone').firstElementChild.setAttribute('animation', 'property: material.opacity; to: 0; dur: 7000; easing: easeInOutQuad')
    this.suitcaseIntro.addEventListener('animationcomplete__scale', () => {
      this.introParent.setAttribute('visible', false)
      this.beginMain()
    }, { once: true })
  },

  beginMain: function () {
    const nextScene = 1
    // Show first scene
    this.timeouts.beginMainDelay = setTimeout(() => {
      // Turn on spotlight
      const parent = document.getElementById(`${nextScene}parent`)
      parent.setAttribute('visible', true)
      document.getElementById(`${nextScene}spotlightAudio`).components['sound'].playSound()
      // get the next hero
      const nextHero = document.getElementById(`${nextScene}hero`)
      nextHero.setAttribute('visible', true)
      // turn on next scene
      const nextSceneModel = this.el.sceneEl.components['scene-controller'][`scene${nextScene}`]
      nextSceneModel.visible = true
      this.timeouts.beginMainIntroAudio = setTimeout(() => {
        document.getElementById(`${nextScene}intro`).components['sound'].playSound()
        this.timeouts.beginMainIntroAudio = null
      }, 2500)
      this.timeouts.beginMainDelay = null
    }, 2500)
  },

  updateNavmesh: function (newNavClass) {
    // Note, newNavClass should be of format '.classname'
    const rightFingertip = document.getElementById('rightFingertip')
    const leftFingertip = document.getElementById('leftFingertip')
    const rightRay = document.getElementById('rightRay')
    const leftRay = document.getElementById('leftRay')
    if (rightFingertip) rightFingertip.setAttribute('blink-controls', 'collisionEntities', newNavClass)
    if (leftFingertip) leftFingertip.setAttribute('blink-controls', 'collisionEntities', newNavClass)
    if (rightRay) rightRay.setAttribute('blink-controls', 'collisionEntities', newNavClass)
    if (leftRay) leftRay.setAttribute('blink-controls', 'collisionEntities', newNavClass)
  },

  endScene: function () {
    // Show suitcase
    this.introParent.setAttribute('visible', true)
    // Ensure model-opacity component exists before animating it
    this.suitcaseIntro.setAttribute('model-opacity', 'number: 0')
    this.suitcaseIntro.setAttribute('animation__opacity', `property: model-opacity.number; from: 0; to: 1; dur: 7000; easing: easeInQuad`)
    this.updateNavmesh('.suitcase')

    // 1hero
    this.hero1 = document.getElementById('1hero');
    this.hero1.setAttribute('visible', true);
    this.hero1.removeAttribute('animation__bob');
    this.hero1.removeAttribute('attach-to-parent');
    this.hero1.setAttribute('animation__position', 'property: position; to: -35.55 16.44 -32.65; dur: 12000; easing: easeInSine');
    this.hero1.setAttribute('animation__rotation', 'property: rotation; to: 0.29 -60.91 6.2; dur: 12000; easing: easeInOutBack');
    this.hero1.setAttribute('animation__scale', 'property: scale; to: 100 100 100; dur: 12000; easing: easeInSine');

    // 2hero
    this.hero2 = document.getElementById('2hero');
    this.hero2.setAttribute('visible', true);
    this.hero2.removeAttribute('animation__bob');
    this.hero2.removeAttribute('attach-to-parent');
    this.hero2.setAttribute('animation__position', 'property: position; to: -20.53093 8.94716 -34.0414; dur: 12000; easing: easeInSine');
    this.hero2.setAttribute('animation__rotation', 'property: rotation; to: -0.8359454230958713 -21.634886344139886 27.210911606353058; dur: 12000; easing: easeInOutBack');
    this.hero2.setAttribute('animation__scale', 'property: scale; to: 100 100 100; dur: 12000; easing: easeInSine');

    // 3hero
    this.hero3 = document.getElementById('3hero');
    this.hero3.setAttribute('visible', true);
    this.hero3.removeAttribute('animation__bob');
    this.hero3.removeAttribute('attach-to-parent');
    this.hero3.setAttribute('animation__position', 'property: position; to: 24.52088 1.40033 -16.01817; dur: 12000; easing: easeInSine');
    this.hero3.setAttribute('animation__rotation', 'property: rotation; to: -18.24 51.68 -15.09; dur: 12000; easing: easeInOutBack');
    this.hero3.setAttribute('animation__scale', 'property: scale; to: 120 120 120; dur: 12000; easing: easeInSine');

    // 4hero
    this.hero4 = document.getElementById('4hero');
    this.hero4.setAttribute('visible', true);
    this.hero4.removeAttribute('animation__bob');
    this.hero4.removeAttribute('attach-to-parent');
    this.hero4.setAttribute('animation__position', 'property: position; to: 53.19593 21.15411 -33.2396; dur: 12000; easing: easeInSine');
    this.hero4.setAttribute('animation__rotation', 'property: rotation; to: 5.81 55.83 80.7; dur: 12000; easing: easeInOutBack');
    this.hero4.setAttribute('animation__scale', 'property: scale; to: 80 80 80; dur: 12000; easing: easeInSine');

    // 5hero
    this.hero5 = document.getElementById('5hero');
    this.hero5.setAttribute('visible', true);
    this.hero5.removeAttribute('animation__bob');
    this.hero5.removeAttribute('attach-to-parent');
    this.hero5.setAttribute('animation__position', 'property: position; to: -50.09263 6.70529 -2.46135; dur: 12000; easing: easeInSine');
    this.hero5.setAttribute('animation__rotation', 'property: rotation; to: 0 0 -62.85060533687566; dur: 12000; easing: easeInOutBack');
    this.hero5.setAttribute('animation__scale', 'property: scale; to: 100 100 100; dur: 12000; easing: easeInSine');

    // 6hero
    this.hero6 = document.getElementById('6hero');
    this.hero6.setAttribute('visible', true);
    this.hero6.removeAttribute('animation__bob');
    this.hero6.removeAttribute('attach-to-parent');
    this.hero6.setAttribute('animation__position', 'property: position; to: 6.89092 4.81954 27.47854; dur: 12000; easing: easeInSine');
    this.hero6.setAttribute('animation__rotation', 'property: rotation; to: 77.99903648233949 151.1227750859108 -28.380891424010198; dur: 12000; easing: easeInOutBack');
    this.hero6.setAttribute('animation__scale', 'property: scale; to: 100 100 100; dur: 12000; easing: easeInSine');

    // 7hero
    this.hero7 = document.getElementById('7hero');
    this.hero7.setAttribute('visible', true);
    this.hero7.removeAttribute('animation__bob');
    this.hero7.removeAttribute('attach-to-parent');
    this.hero7.setAttribute('animation__position', 'property: position; to: 42.19498 19.44893 28.20015; dur: 12000; easing: easeInSine');
    this.hero7.setAttribute('animation__rotation', 'property: rotation; to: -0.02119943841984046 143.9361654615849 12.088263561670109; dur: 12000; easing: easeInOutBack');
    this.hero7.setAttribute('animation__scale', 'property: scale; to: 100 100 100; dur: 12000; easing: easeInSine');

    // 8hero
    this.hero8 = document.getElementById('8hero');
    this.hero8.setAttribute('visible', true);
    this.hero8.removeAttribute('animation__bob');
    this.hero8.removeAttribute('attach-to-parent');
    this.hero8.setAttribute('animation__position', 'property: position; to: -30.70502 5.03219 16.10448; dur: 12000; easing: easeInSine');
    this.hero8.setAttribute('animation__rotation', 'property: rotation; to: 0 -34.96818719462927 -72.41097910642857; dur: 12000; easing: easeInOutBack');
    this.hero8.setAttribute('animation__scale', 'property: scale; to: 100 100 100; dur: 12000; easing: easeInSine');

    // 9hero
    this.hero9 = document.getElementById('9hero');
    this.hero9.setAttribute('visible', true);
    this.hero9.removeAttribute('animation__bob');
    this.hero9.removeAttribute('attach-to-parent');
    this.hero9.setAttribute('animation__position', 'property: position; to: -40.26011 22.95145 27.10317; dur: 12000; easing: easeInSine');
    this.hero9.setAttribute('animation__rotation', 'property: rotation; to: 20.611583722036237 82.70989547390514 124.8383362342843; dur: 12000; easing: easeInOutBack');
    this.hero9.setAttribute('animation__scale', 'property: scale; to: 80 80 80; dur: 12000; easing: easeInSine');

    // 10hero
    this.hero10 = document.getElementById('10hero');
    this.hero10.setAttribute('visible', true);
    this.hero10.removeAttribute('animation__bob');
    this.hero10.removeAttribute('attach-to-parent');
    this.hero10.setAttribute('animation__position', 'property: position; to: -4.63639 0.95049 -26.01265; dur: 12000; easing: easeInSine');
    this.hero10.setAttribute('animation__rotation', 'property: rotation; to: 86.79107384862198 106.39196002004743 77.94918915416311; dur: 12000; easing: easeInOutBack');
    this.hero10.setAttribute('animation__scale', 'property: scale; to: 100 100 100; dur: 12000; easing: easeInSine');

    // 11hero
    this.hero11 = document.getElementById('11hero');
    this.hero11.setAttribute('visible', true);
    this.hero11.removeAttribute('animation__bob');
    this.hero11.removeAttribute('attach-to-parent');
    this.hero11.setAttribute('animation__position', 'property: position; to: 17.29753 3.39162 -33.86655; dur: 12000; easing: easeInSine');
    this.hero11.setAttribute('animation__rotation', 'property: rotation; to: -0.6462963929075686 112.17654191968823 169.8395873794494; dur: 12000; easing: easeInOutBack');
    this.hero11.setAttribute('animation__scale', 'property: scale; to: 100 100 100; dur: 12000; easing: easeInSine');

    // 12hero
    this.hero12 = document.getElementById('12hero');
    this.hero12.setAttribute('visible', true);
    this.hero12.removeAttribute('animation__bob');
    this.hero12.removeAttribute('attach-to-parent');
    this.hero12.setAttribute('animation__position', 'property: position; to: 30.75029 3.97012 2.52054; dur: 12000; easing: easeInSine');
    this.hero12.setAttribute('animation__rotation', 'property: rotation; to: 89.99963750135457 -53.98236458384077 0; dur: 12000; easing: easeInOutBack');
    this.hero12.setAttribute('animation__scale', 'property: scale; to: 100 100 100; dur: 12000; easing: easeInSine');

    // Animate the introSpotlight
    const introSpotlight = document.getElementById('introSpotlight')
    introSpotlight.setAttribute('visible', true)
    introSpotlight.setAttribute('animation__position', 'property: position; to: 0 62 0; dur: 12000; easing: linear')
    introSpotlight.setAttribute('animation__intensity', 'property: light.intensity; to: 40; dur: 12000; easing: linear')
    introSpotlight.setAttribute('animation__angle', 'property: light.angle; to: 65; dur: 12000; easing: linear')

    // last dialogue line?
    // fade to black
    this.hero12.addEventListener('animationcomplete__position', () => {
      this.uiOutro.setAttribute('visible', true)
      this.uiOutro.setAttribute('animation', 'property: opacity; from: 0; to: 1; dur: 4500; delay: 2500; easing: linear')
    }, { once: true })
  }
});

AFRAME.registerComponent('follow-along', {
  schema: {
    target: {type: 'selector'},
    offset: {type: 'vec3', default: {x: 0, y: 0, z: 0}},
    rotOnlyY: {type: 'boolean', default: false}
  },
  init: function () {
    this.targetPos = new THREE.Vector3();
    this.targetRot = new THREE.Quaternion();
    this.targetEul = new THREE.Euler();
  },
  tick: function () {
    // Pos

    this.data.target.object3D.updateMatrixWorld();
    this.data.target.object3D.getWorldPosition(this.targetPos);
    this.targetPos.add(this.data.offset);
    this.el.object3D.position.copy(this.targetPos);
    // Rot
    this.data.target.object3D.getWorldQuaternion(this.targetRot);
    if (this.data.rotOnlyY) {
      this.targetEul.setFromQuaternion(this.targetRot, 'YXZ');
      this.el.object3D.rotation.y = this.targetEul.y;
    } else {
      // set full quaternion
      this.el.object3D.quaternion.copy(this.targetRot);
    }
  }
});

AFRAME.registerComponent('attach-to-parent', {
  schema: {
    target: { type: 'selector' },
    offset: { type: 'vec3', default: { x: 0, y: 0, z: 0 } }
  },

  init: function () {
    this.lockPosition = this.lockPosition.bind(this)
    this.isMoving = false
    this.newPos = new THREE.Vector3()
    this.threshold = 0.02; // Set your desired threshold
    this.lerpFactor = 0.05; // Set your desired lerp factor (0-1)
    this.isPositive = this.el.classList.contains('positive')

    // Bindings
    this.lockPosition = this.lockPosition.bind(this)
  },

  update: function () {
    if (this.data.target) {
      this.newPos = new THREE.Vector3()
      this.isMoving = true
    } else {
      console.warn('No target entity provided for attach-to-parent component.');
    }
  },

  tick: function () {
    if (this.isMoving) {
      // Compute the latest world position of the offset relative to the target's local space (since the user may move)
      this.el.object3D.parent.updateMatrixWorld();
      this.newPos.copy(this.data.offset);
      this.data.target.object3D.localToWorld(this.newPos);
      // Smoothly move this element to the new position
      this.el.object3D.position.lerp(this.newPos, this.lerpFactor)
      const newDistance = this.el.object3D.position.distanceTo(this.newPos)
      // Consider it done if close enough
      if (newDistance < this.threshold) {
        this.isMoving = false
        this.lockPosition()
      }
    }
  },

  lockPosition() {
    // 4 10 12 6 8 11
    const loopNums = [4, 10, 12, 6, 8, 11]
    const sceneNum = parseInt(this.el.id, 10);
    const nextScene = sceneNum + 1
    const sceneNeedsLoop = loopNums.includes(sceneNum)
    const nextNeedsLoop = loopNums.includes(nextScene)
    // console.log(nextScene)
    // Turn off spotlight
    const parent = document.getElementById(`${sceneNum}parent`)
    parent.setAttribute('visible', false)
    // Turn off this scene
    const thisScene = this.el.sceneEl.components['scene-controller'][`scene${sceneNum}`]
    if (sceneNeedsLoop) {
      thisScene.traverse((node) => {
        if (node.isMesh) {
          node.visible = false
        }
      })
    } else {
      thisScene.visible = false
    }

    // World rotation before parenting
    const worldQuaternion = new THREE.Quaternion();
    this.el.object3D.getWorldQuaternion(worldQuaternion);

    // Add as nested object of the parent
    this.data.target.object3D.add(this.el.object3D);

    // Compute local rotation in the context of the new parent
    const inverseParentQuaternion = new THREE.Quaternion().copy(this.data.target.object3D.quaternion).invert();
    const localQuaternion = inverseParentQuaternion.multiply(worldQuaternion);

    // Apply the local rotation and position
    this.el.object3D.quaternion.copy(localQuaternion);
    this.el.object3D.position.copy(this.data.offset);

    // Add a bob animation to this object if positive
    if (this.isPositive) {
      const pos = this.el.object3D.position;
      this.el.setAttribute('animation__bob', `
        property: position;
        from: ${pos.x} ${pos.y} ${pos.z};
        to: ${pos.x} ${pos.y + 0.075} ${pos.z};
        dur: 5000;
        dir: alternate;
        easing: easeInOutSine;
        loop: true
      `);
    }

    if (nextScene === 13) {
      this.el.sceneEl.components['scene-controller'].endScene()
      // Show end scene
    } else {
      // Show next scene
      const sceneController = this.el.sceneEl.components['scene-controller']
      sceneController.timeouts.nextSceneDelay = setTimeout(() => {
        // Turn on spotlight
        const parent = document.getElementById(`${nextScene}parent`)
        parent.setAttribute('visible', true)
        document.getElementById(`${nextScene}spotlightAudio`).components['sound'].playSound()
        // get the next hero
        const nextHero = document.getElementById(`${nextScene}hero`)
        nextHero.setAttribute('visible', true)
        // turn on next scene
        const nextSceneModel = this.el.sceneEl.components['scene-controller'][`scene${nextScene}`]
        if (nextNeedsLoop) {
          nextSceneModel.traverse((node) => {
            if (node.isMesh) {
              node.visible = true
            }
          })
        } else {
          nextSceneModel.visible = true
        }
        sceneController.timeouts.nextSceneIntroAudio = setTimeout(() => {
          document.getElementById(`${nextScene}intro`).components['sound'].playSound()
          sceneController.timeouts.nextSceneIntroAudio = null
        }, 2500)
        sceneController.timeouts.nextSceneDelay = null
      }, 1000)
    }
  },

  remove: function () {
    // Save world position, rotation, and scale
    const worldPosition = new THREE.Vector3();
    const worldQuaternion = new THREE.Quaternion();
    const worldScale = new THREE.Vector3();
    this.el.object3D.getWorldPosition(worldPosition);
    this.el.object3D.getWorldQuaternion(worldQuaternion);
    this.el.object3D.getWorldScale(worldScale);

    // Reparent the object to the scene
    this.el.sceneEl.object3D.add(this.el.object3D);

    // Restore world position, rotation, and scale
    this.el.object3D.parent.updateMatrixWorld();
    this.el.object3D.position.copy(worldPosition);
    this.el.object3D.quaternion.copy(worldQuaternion);
    this.el.object3D.scale.copy(worldScale);
  }
});

AFRAME.registerComponent("hide-on-hit-test-start", {
  init: function() {
    var self = this;
    this.el.sceneEl.addEventListener("ar-hit-test-start", function() {
      self.el.object3D.visible = false;
    });
    this.el.sceneEl.addEventListener("exit-vr", function() {
      self.el.object3D.visible = true;
    });
  }
});

// AFRAME.registerComponent("origin-on-ar-start", {
//   init: function() {
//     var self = this.el;

//     this.el.sceneEl.addEventListener("enter-vr", function() {
//       if (this.is("ar-mode")) {
//         self.setAttribute('position', {x:0,y:0,z:0});
//         self.setAttribute('rotation', {x:0,y:0,z:0});
//       }
//     });
//   }
// });


// AFRAME.registerComponent("match-position-by-id", {
//   schema: {
//     default: ''
//   },
//   tick() {
//     let obj;

//     if (this.data === 'xr-camera') {
//       const xrCamera = this.el.sceneEl.renderer.xr.getCameraPose();
//       if (xrCamera) {
//         this.el.object3D.position.copy(xrCamera.transform.position);
//         this.el.object3D.quaternion.copy(xrCamera.transform.orientation);
//         return;
//       }
//       obj = this.el.sceneEl.camera;
//     } else {
//       obj = document.getElementById(this.data).object3D;
//     }
//     if (obj) {
//       this.el.object3D.position.copy(obj.position);
//       this.el.object3D.quaternion.copy(obj.quaternion);
//     }

//   }
// });

AFRAME.registerComponent("xr-follow", {
  schema: {},
  init() {
  },
  tick() {
    const scene = this.el.sceneEl;
    const camera = scene.camera;
    const object3D = this.el.object3D;
    camera.getWorldPosition(object3D.position);
    object3D.parent.worldToLocal(object3D.position);
  }
});

AFRAME.registerComponent("exit-on", {
  schema: {
    default: 'click'
  },
  update(oldEvent) {
    const newEvent = this.data;
    this.el.removeEventListener(oldEvent, this.exitVR);
    this.el.addEventListener(newEvent, this.exitVR);
  },
  exitVR() {
    this.sceneEl.exitVR();
  }
});

AFRAME.registerComponent("physx-body-from-model", {
  schema: {
    type: 'string',
    default: ''
  },
  init () {
    const details = this.data;
    this.onLoad = function () {
      this.setAttribute('physx-body', details);
      this.removeAttribute('physx-body-from-model');
    }
    this.el.addEventListener('object3dset', this.onLoad);
  },
  remove () {
    this.el.removeEventListener('object3dset', this.onLoad);
  }
});

const quaternion = new THREE.Quaternion();
const xyz = new THREE.Vector3();

AFRAME.registerComponent("toggle-physics", {
  schema: {
    bodyAttachOffset: {type: 'vec3', default: {x: 0, y: 0, z: 0}},
  },
  init() {

  },
  tick() {

  },
  events: {
    pickup: function() {
      this.el.addState('grabbed');
      // play audio - skip for startBear as it doesn't need audio
      if (this.el.id !== 'startBear') {
        // get the 1st char of this.el.id for numbered heroes
        const sceneNum = parseInt(this.el.id, 10);
        // console.log(sceneNum) // 1hero
        const outroAudio = document.getElementById(`${sceneNum}outro`);
        if (outroAudio && outroAudio.components['sound']) {
          outroAudio.components['sound'].playSound();
        }
      }
    },
    putdown: function(e) {
      this.el.removeState('grabbed');
      const bodyEl = document.querySelector('#body'); // We use #body to find the position relative to the GLB
      const targetPosition = new THREE.Vector3();
      bodyEl.object3D.getWorldPosition(targetPosition);
      // console.log(targetPosition)

      // Calculate the size of the object based on the bounding box
      const boundingBox = new THREE.Box3().setFromObject(this.el.object3D);
      const size = new THREE.Vector3();
      boundingBox.getSize(size);
      const largestSide = Math.max(size.x, size.y, size.z);
      const minDimension = 0.15;
      const maxDimensionVal = 0.7;
      const clampedDimension = Math.min(Math.max(largestSide, minDimension), maxDimensionVal);
      const normalizedDimension = (clampedDimension - minDimension) / (maxDimensionVal - minDimension);
      const minOffsetX = 0.01;
      const maxOffsetX = 0.22;
      const minClampY = -0.7;
      const maxClampY = -0.33;
      const minOffsetZ = -0.05;
      const maxOffsetZ = 0.08;
      const minRadius = 0.25;
      const maxRadius = 0.375;
      const lateralOffset = THREE.MathUtils.lerp(minOffsetX, maxOffsetX, normalizedDimension);
      const depthOffset = THREE.MathUtils.lerp(minOffsetZ, maxOffsetZ, normalizedDimension);
      const radiusScalar = THREE.MathUtils.lerp(minRadius, maxRadius, normalizedDimension);

      // Calculate the nearest point on the surface of the body
      const objectPosition = new THREE.Vector3();
      this.el.object3D.getWorldPosition(objectPosition);
      const direction = new THREE.Vector3().subVectors(objectPosition, targetPosition).normalize();
      const nearestPoint = new THREE.Vector3().copy(targetPosition).add(direction.multiplyScalar(radiusScalar)); // Assuming 0.19 is the radius of the body after scale adjustments

      // Clear all interactions and physics from this el
      this.el.removeAttribute('toggle-physics');
      this.el.classList.remove('magnet-left', 'magnet-right');
      this.el.removeAttribute('data-pick-up');
      this.el.removeAttribute('data-magnet-range');
      this.el.removeAttribute('physx-body');
      this.el.removeAttribute('physx-material');
      this.el.emit('grab-disabled');

      // Convert nearestPoint to local coordinates relative to bodyParent
      const bodyParentEl = document.querySelector('#bodyParent'); // We convert to local space of the bodyParent so that the object is not affected by scale or position offsets for the #body GLB
      const localNearestPoint = nearestPoint.clone();
      bodyParentEl.object3D.worldToLocal(localNearestPoint);
      // Incorporate the bodyAttachOffset (assumed to be in bodyParent's local space)
      localNearestPoint.add(new THREE.Vector3(this.data.bodyAttachOffset.x, this.data.bodyAttachOffset.y, this.data.bodyAttachOffset.z));

      // Compute release local position from objectPosition
      const releaseLocalPosition = objectPosition.clone();
      bodyParentEl.object3D.worldToLocal(releaseLocalPosition);
      // Clamp releaseLocalPosition.y between minClampY and maxClampY
      const clampedY = Math.min(Math.max(releaseLocalPosition.y, minClampY), maxClampY);
      // Increase offsets based on a higher drop height: objects dropped higher (closer to maxClampY) get larger X/Z offsets
      const normalizedY = (clampedY - minClampY) / (maxClampY - minClampY);
      const extraFactor = THREE.MathUtils.lerp(1, 1.3, normalizedY);
      const adjustedLateralOffset = lateralOffset * extraFactor;
      const adjustedDepthOffset = depthOffset * extraFactor;

      // Adjust object's lateral position with the extra factor
      if (localNearestPoint.x === 0) {
        localNearestPoint.x = adjustedLateralOffset; // default to right if centered
      } else if (localNearestPoint.x > 0) {
        localNearestPoint.x += adjustedLateralOffset;
      } else {
        localNearestPoint.x -= adjustedLateralOffset;
      }
      localNearestPoint.z += adjustedDepthOffset; // Adjust depth offset accordingly
      localNearestPoint.y = clampedY;

      this.el.setAttribute('attach-to-parent', `target: #bodyParent; offset: ${localNearestPoint.x} ${localNearestPoint.y} ${localNearestPoint.z}`);
    }
  }
});

// AFRAME.registerComponent("ladder", {
//   schema: {
//     cameraRig: {
//       default: ''
//     },
//     grabbables: {
//       default: ''
//     }
//   },
//   init () {
//     this.ladderGrab = this.ladderGrab.bind(this);
//     this.ladderRelease = this.ladderRelease.bind(this);
//     this.startingRigPosition = new THREE.Vector3();
//     this.startingHandPosition = new THREE.Vector3();
//     this.ladderHands = [];
//     this.grabbables = [];
//     this.cameraRig = document.querySelector(this.data.cameraRig);
//     if (this.data.grabbables) for (const el of this.el.querySelectorAll(this.data.grabbables)) {
//       this.grabbables.push(el);
//       el.addEventListener('grabbed', this.ladderGrab);
//       el.addEventListener('released', this.ladderRelease);
//     }
//   },
//   ladderRelease(e) {
//     const oldActiveHand = e.detail.byNoMagnet;
//     let index;
//     while ((index=this.ladderHands.indexOf(oldActiveHand))!==-1) this.ladderHands.splice(index,1);

//     const activeHand = this.ladderHands[0];
//     if (activeHand) {
//       this.startingHandPosition.copy(activeHand.object3D.position);
//       this.startingRigPosition.copy(this.cameraRig.object3D.position);
//     } else {
//       // Turn on the navmesh if no hands on the ladder
//       this.cameraRig.setAttribute('simple-navmesh-constraint', 'enabled', true);
//     }
//   },
//   ladderGrab(e) {
//     const activeHand = e.detail.byNoMagnet;
//     this.startingHandPosition.copy(activeHand.object3D.position);
//     this.startingRigPosition.copy(this.cameraRig.object3D.position);
//     this.ladderHands.unshift(activeHand);
//     this.holdingLadder = true;
//     // Turn off the navmesh if holding the ladder
//     this.cameraRig.setAttribute('simple-navmesh-constraint', 'enabled', false);
//   },
//   tick () {
//     const activeHand = this.ladderHands[0];
//     if (activeHand) {
//       this.cameraRig.object3D.position.subVectors(this.startingHandPosition, activeHand.object3D.position);
//       this.cameraRig.object3D.position.applyQuaternion(this.cameraRig.object3D.quaternion);
//       this.cameraRig.object3D.position.add(this.startingRigPosition);
//     }
//   },
//   remove () {
//     this.grabbables.forEach(el => {
//       el.removeEventListener('grabbed', this.ladderGrab);
//       el.removeEventListener('released', this.ladderRelease);
//     });
//   }
// });

window.addEventListener("DOMContentLoaded", function() {
  const sceneEl = document.querySelector("a-scene");
  const message = document.getElementById("dom-overlay-message");
  const arContainerEl = document.getElementById("my-ar-objects");
  const cameraRig = document.getElementById("cameraRig");
  // const building = document.getElementById("building");

  // Once the building has loaded update the relfections
  // building.addEventListener('object3dset', function () {
    // if (this.components && this.components.reflection) this.components.reflection.needsVREnvironmentUpdate = true;
  // }, {once: true});

  const labels = Array.from(document.querySelectorAll('.pose-label'));
  for (const el of labels) {
    el.parentNode.addEventListener('pose', function (event) {
      el.setAttribute('text', 'value', event.detail.pose);
    });
    el.parentNode.addEventListener('gamepad', function (event) {
      el.setAttribute('text', 'value', event.detail.event);
    });
  }

  // watergun: {
  //   const watergun = document.getElementById("watergun");
  //   const watergunSlider = watergun.firstElementChild;
  //   watergun.addEventListener('grabbed', function (e) {
  //     const by = e.detail.by;
  //     if (e.target === watergun) {
  //       watergun.className = '';
  //       if (by.dataset.right) watergunSlider.className = 'magnet-left';
  //       if (by.dataset.left) watergunSlider.className = 'magnet-right';
  //     }
  //     if (e.target === watergunSlider) {
  //       watergun.setAttribute('linear-constraint', 'target', '#' + e.detail.byNoMagnet.id);
  //     }
  //   });
  //   watergun.addEventListener('released', function (e) {
  //     const by = e.detail.by;
  //     watergun.setAttribute('linear-constraint', 'target', '');
  //     if (e.target === watergun) {
  //       watergun.className = 'magnet-right magnet-left';
  //       watergunSlider.className = '';
  //     }
  //   });
  // }

  // If the user taps on any buttons or interactive elements we may add then prevent
  // Any WebXR select events from firing
  // message.addEventListener("beforexrselect", e => {
  //   e.preventDefault();
  // });

  sceneEl.addEventListener("enter-vr", function() {
    if (this.is("ar-mode")) {
      // Entered AR
      // message.textContent = "";

      // Hit testing is available
      // this.addEventListener(
      //   "ar-hit-test-start",
      //   function() {
      //     message.innerHTML = `Scanning environment, finding surface.`;
      //   },
      //   { once: true }
      // );

      // Has managed to start doing hit testing
      // this.addEventListener(
      //   "ar-hit-test-achieved",
      //   function() {
      //     message.innerHTML = `Select the location to place<br />By tapping on the screen or selecting with your controller.`;
      //   },
      //   { once: true }
      // );

      // User has placed an object
      // this.addEventListener(
      //   "ar-hit-test-select",
      //   function() {
      //     // Object placed for the first time
      //     message.textContent = "Well done!";
      //   },
      //   { once: true }
      // );
    }
  });

  sceneEl.addEventListener("exit-vr", function() {
    // message.textContent = "Exited Immersive Mode";
  });
});