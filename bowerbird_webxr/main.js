/* jshint esversion: 9 */
/* global THREE, AFRAME */

AFRAME.registerComponent('scene-controller', {
  schema: {
    default: ''
  },
  init: function () {
    this.enterVR = document.getElementById('enterVR')
    this.uiIntro = document.getElementById('uiIntro')
    this.ground = document.getElementById('ground')
    this.introParent = document.getElementById('introParent')

    // Bindings
    this.startIntro = this.startIntro.bind(this)
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
    // Build onboarding slideshow

    // Show Title card

    // Show suitcase

    // Fade to black on enter suitcase

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
      // a-frame animate to fade in
      this.uiIntro.setAttribute('animation', 'property: opacity; from: 0; to: 1; dur: 4500; delay: 1000; easing: linear')
      this.uiIntro.addEventListener('animationcomplete', () => {
        // Moment's pause
        setTimeout(() => {
          // animate out the uiIntro
          this.uiIntro.removeAttribute('animation')
          this.uiIntro.setAttribute('animation', 'property: opacity; from: 1; to: 0; dur: 1500; easing: linear')
          // Fade in fog
          this.el.sceneEl.setAttribute('animation__fog', 'property: fog.density; from: 0; to: 0.025; dur: 3500; easing: linear')
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
    }, 1000)
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
    // parent all objects to scene
    // animate them off the body
    // float with random sway
    // animate scale larger
    // animate gently off into the spotlight of each scene (no scene model visible)
    // last dialogue line?
    // fade to black
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

    if (nextScene === 13) {
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
    // Append the entity to the scene instead of removing it
    if (this.el.parentNode) {
      this.el.sceneEl.object3D.add(this.el.object3D);
    }
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
    // putdown: function(e) {
    //   this.el.removeState('grabbed');
    //   if (e.detail.frame && e.detail.inputSource) {
    //     const referenceSpace = this.el.sceneEl.renderer.xr.getReferenceSpace();
    //     const pose = e.detail.frame.getPose(e.detail.inputSource.gripSpace, referenceSpace);
    //     if (pose && pose.angularVelocity) {
    //       // Ex: {x: -0.21239659190177917, y: -0.27352192997932434, z: 0.286095529794693, w: 1}
    //       // convert {x y z w} to {x y z}
    //       quaternion.set(pose.angularVelocity.x, pose.angularVelocity.y, pose.angularVelocity.z, pose.angularVelocity.w);
    //       quaternion.normalize();
    //       xyz.set(quaternion.x, quaternion.y, quaternion.z);
    //       this.el.components['physx-body'].rigidBody.setAngularVelocity(xyz);
    //     }
    //     if (pose && pose.linearVelocity) {
    //       this.el.components['physx-body'].rigidBody.setLinearVelocity(pose.linearVelocity);
    //     }
    //   }
    // },
    putdown: function(e) {
      this.el.removeState('grabbed');
      const bodyEl = document.querySelector('#body');
      const targetPosition = new THREE.Vector3();
      bodyEl.object3D.getWorldPosition(targetPosition);

      // Keep original angular velocity if pose has it
      // if (e.detail.frame && e.detail.inputSource && e.detail.inputSource.gripSpace) {
      //   const referenceSpace = this.el.sceneEl.renderer.xr.getReferenceSpace();
      //   const pose = e.detail.frame.getPose(e.detail.inputSource.gripSpace, referenceSpace);
      //   if (pose && pose.angularVelocity) {
      //     quaternion.set(pose.angularVelocity.x, pose.angularVelocity.y, pose.angularVelocity.z, pose.angularVelocity.w);
      //     quaternion.normalize();
      //     xyz.set(quaternion.x, quaternion.y, quaternion.z);
      //     // this.el.components['physx-body'].rigidBody.setAngularVelocity(xyz);
      //   }
      // }

      // Clear all interactions and physics from this el
      this.el.removeAttribute('toggle-physics');
      this.el.removeAttribute('class');
      this.el.removeAttribute('data-pick-up');
      this.el.removeAttribute('data-magnet-range');
      this.el.removeAttribute('physx-body');
      this.el.removeAttribute('physx-material');

      this.el.setAttribute('attach-to-parent', `target: #bodyParent; offset: ${this.data.bodyAttachOffset.x} ${this.data.bodyAttachOffset.y} ${this.data.bodyAttachOffset.z}`);
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

// Make the cheap windows look okay 
// AFRAME.registerComponent('window-replace', {
//   schema: {
//     default: ''
//   },
//   init() {
//     this.el.addEventListener('object3dset', this.update.bind(this));
//     this.materials = new Map();
//   },
//   update() {
//     const filters = this.data.trim().split(',');
//     this.el.object3D.traverse(function (o) {
//       if (o.material) {
//         if (filters.some(filter => o.material.name.includes(filter))) {
//           o.renderOrder = 1;
//           const m = o.material;
//           const sceneEl = this.el.sceneEl;
//           o.material = this.materials.has(m) ?
//             this.materials.get(m) :
//             new THREE.MeshPhongMaterial({
//               name: 'window_' + m.name,
//               lightMap: m.lightmap || null,
//               lightMapIntensity: m.lightMapIntensity,
//               shininess: 90,
//               color: '#ffffff',
//               emissive: '#999999',
//               emissiveMap: m.map,
//               transparent: true,
//               depthWrite: false,
//               map: m.map,
//               transparent: true,
//               side: THREE.DoubleSide,
//               get envMap() {return sceneEl.object3D.environment},
//               combine: THREE.MixOperation,
//               reflectivity: 0.6,
//               blending: THREE.CustomBlending,
//               blendEquation: THREE.MaxEquation,
//               toneMapped: m.toneMapped
//             });
//           ;
//           window.mat = o.material;
//           this.materials.set(m, o.material);
//         }
//       }
//     }.bind(this));
//   }
// });