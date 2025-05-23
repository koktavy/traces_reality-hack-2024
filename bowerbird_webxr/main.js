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

    // Bindings
    this.startIntro = this.startIntro.bind(this)
    this.beginMain = this.beginMain.bind(this)
    this.teleportInsideSuitcase = this.teleportInsideSuitcase.bind(this)
    this.updateNavmesh = this.updateNavmesh.bind(this)
    this.endScene = this.endScene.bind(this)
    this.control = this.control.bind(this)

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
      document.getElementById('dom-overlay-message').style.display = 'none'
      // play piano audio
      const piano = document.getElementById('piano');
      if (piano && piano.components['sound']) {
        piano.components['sound'].playSound();
        // piano.setAttribute('sound', 'loop: true; volume: 0.2');
      }
      // a-frame animate to fade in
      this.uiIntro.setAttribute('visible', true)
      this.uiIntro.setAttribute('animation', 'property: opacity; from: 0; to: 1; dur: 4500; delay: 1000; easing: linear')
      this.uiIntro.addEventListener('animationcomplete', () => {
        // Moment's pause
        setTimeout(() => {
          // animate out the uiIntro
          this.uiIntro.removeAttribute('animation')
          this.uiIntro.setAttribute('animation', 'property: opacity; from: 1; to: 0; dur: 1500; easing: linear')
          // Listen for the animation to complete
          this.uiIntro.addEventListener('animationcomplete', () => {
            this.uiIntro.setAttribute('visible', false)
          }, { once: true })
          // Fade in fog
          this.el.sceneEl.setAttribute('animation__fog', 'property: fog.density; from: 0; to: 0.017; dur: 3500; easing: linear')
          // Fade in ground
          this.ground.setAttribute('animation', 'property: material.opacity; from: 0; to: 1; dur: 3500; easing: linear')
          this.ground.addEventListener('animationcomplete', this.startIntro)
        }, 1000)
      }, { once: true })
    })
    this.el.sceneEl.addEventListener('exit-vr', () => {
      document.getElementById('dom-overlay-message').style.display = 'flex'
    })
  },

  startIntro: function () {
    setTimeout(() => {
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
          clearInterval(interval);
          this.teleportInsideSuitcase();
        }
      };

      const interval = setInterval(checkDistance, 100);
      // this.el.sceneEl.addEventListener('teleported', this.teleportInsideSuitcase, { once: true })
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
    setTimeout(() => {
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
    setTimeout(() => {
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
      setTimeout(() => {
        document.getElementById(`${nextScene}intro`).components['sound'].playSound()
      }, 2500)
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
    console.log(nextScene)
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
      setTimeout(() => {
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
        setTimeout(() => {
          document.getElementById(`${nextScene}intro`).components['sound'].playSound()
        }, 2500)
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
      // play audio
      // get the 1st char of this.el.id
      const sceneNum = parseInt(this.el.id, 10);
      console.log(sceneNum) // 1hero
      document.getElementById(`${sceneNum}outro`).components['sound'].playSound()
    },
    putdown: function(e) {
      this.el.removeState('grabbed');
      const bodyEl = document.querySelector('#body'); // We use #body to find the position relative to the GLB
      const targetPosition = new THREE.Vector3();
      bodyEl.object3D.getWorldPosition(targetPosition);
      console.log(targetPosition)

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