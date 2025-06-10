/**
 * Hand Grip Animator Component
 *
 * This component animates the "grip" shape key/morph target in VR hand models
 * based on controller grip and trigger input values (0-1 range).
 * It provides real-time hand animation feedback during grabbing actions by
 * directly mapping controller input to morph target values for realistic
 * hand deformation.
 */

AFRAME.registerComponent('hand-grip-animator', {
  schema: {
    handedness: { type: 'string', default: 'right' }, // 'left' or 'right'
    magnetTarget: { type: 'selector' }, // The magnet element to listen to for input
    morphTargetName: { type: 'string', default: 'grip' }, // Name of the morph target/shape key
    smoothing: { type: 'number', default: 0.1 }, // Smoothing factor for animation (0-1)
    maxMorphValue: { type: 'number', default: 0.6 } // Maximum morph target value (0-1)
  },

  init: function () {
    this.handMesh = null;
    this.morphTargetIndex = -1;
    this.currentGripValue = 0;
    this.targetGripValue = 0;
    this.magnetTarget = null;
    this.inputSource = null;

    // Wait for the model to load
    if (this.el.hasLoaded) {
      this.setupComponent();
    } else {
      this.el.addEventListener('loaded', () => {
        this.setupComponent();
      });
    }
  },

  setupComponent: function () {
    // Get the magnet target for input events
    this.magnetTarget = this.data.magnetTarget;

    if (!this.magnetTarget) {
      console.warn(`hand-grip-animator: Could not find magnet target for ${this.data.handedness} hand`);
      return;
    }

    // Set up the hand mesh and morph targets
    this.setupMorphTargets();
  },

  setupMorphTargets: function () {
    // Get the mesh from the GLTF model
    const model = this.el.getObject3D('mesh');
    
    if (model) {
      this.findMorphTargets(model);
    } else {
      // Wait for model to load
      this.el.addEventListener('model-loaded', (event) => {
        this.findMorphTargets(event.detail.model);
      });
    }
  },

  findMorphTargets: function (model) {
    // Traverse the model to find the mesh with morph targets
    let foundMeshes = [];

    model.traverse((child) => {
      if (child.isMesh && child.morphTargetDictionary && child.morphTargetInfluences) {
        foundMeshes.push({
          name: child.name,
          morphTargets: Object.keys(child.morphTargetDictionary)
        });

        // Check if this mesh has the grip morph target
        const morphTargetName = this.data.morphTargetName;
        if (morphTargetName in child.morphTargetDictionary) {
          this.handMesh = child;
          this.morphTargetIndex = child.morphTargetDictionary[morphTargetName];

          // Ensure the material supports morph targets
          if (child.material) {
            child.material.morphTargets = true;
            child.material.needsUpdate = true;
          }

          // console.log(`hand-grip-animator: Found "${morphTargetName}" morph target at index ${this.morphTargetIndex} for ${this.data.handedness} hand`);
          return;
        }
      }
    });

    if (this.morphTargetIndex === -1) {
      console.warn(`hand-grip-animator: Could not find "${this.data.morphTargetName}" morph target in ${this.data.handedness} hand model`);
      console.log(`hand-grip-animator: Available meshes with morph targets:`, foundMeshes);
    }
  },

  getControllerInputSource: function () {
    // Get the current XR session and input sources
    const session = this.el.sceneEl.xrSession;
    if (!session) return null;

    // Find the input source that matches our handedness
    for (const inputSource of session.inputSources) {
      if (inputSource.handedness === this.data.handedness && inputSource.gamepad) {
        return inputSource;
      }
    }
    return null;
  },

  updateGripValue: function () {
    const inputSource = this.getControllerInputSource();
    if (!inputSource || !inputSource.gamepad) {
      this.targetGripValue = 0;
      return;
    }

    // Get grip and trigger values
    let gripValue = 0;
    let triggerValue = 0;
    let actualGripValue = 0;

    // Check for trigger button (usually button 0)
    if (inputSource.gamepad.buttons.length > 0) {
      triggerValue = inputSource.gamepad.buttons[0].value;
      gripValue = Math.max(gripValue, triggerValue);
    }

    // Check for grip button (usually button 1)
    if (inputSource.gamepad.buttons.length > 1) {
      actualGripValue = inputSource.gamepad.buttons[1].value;
      gripValue = Math.max(gripValue, actualGripValue);
    }

    // Update target grip value
    this.targetGripValue = Math.min(1, Math.max(0, gripValue));

    // Debug logging (only when values change significantly)
    if (Math.abs(gripValue - (this.lastLoggedGripValue || 0)) > 0.05) {
      // const mappedValue = this.currentGripValue * this.data.maxMorphValue;
      // console.log(`hand-grip-animator ${this.data.handedness}: trigger=${triggerValue.toFixed(2)}, grip=${actualGripValue.toFixed(2)}, combined=${gripValue.toFixed(2)}, morph=${mappedValue.toFixed(2)}`);
      this.lastLoggedGripValue = gripValue;
    }
  },

  tick: function () {
    if (!this.handMesh || this.morphTargetIndex === -1) return;

    // Update grip value from controller input
    this.updateGripValue();

    // Smooth the grip value change
    const smoothing = this.data.smoothing;
    this.currentGripValue += (this.targetGripValue - this.currentGripValue) * smoothing;

    // Map controller input (0-1) to morph target range (0-maxMorphValue)
    const mappedMorphValue = this.currentGripValue * this.data.maxMorphValue;

    // Apply the mapped grip value to the morph target
    this.handMesh.morphTargetInfluences[this.morphTargetIndex] = mappedMorphValue;
  },

  remove: function () {
    // Clean up (no event listeners to remove in this version)
  }
});
