/**
 * Hand Grip Switcher Component
 * 
 * This component switches between normal and grip hand models when grab events are triggered.
 * It listens for squeezestart/squeezeend and selectstart/selectend events on the magnet target
 * and toggles the visibility of normal vs grip hand models accordingly.
 */

AFRAME.registerComponent('hand-grip-switcher', {
  schema: {
    handedness: { type: 'string', default: 'right' }, // 'left' or 'right'
    magnetTarget: { type: 'selector' } // The magnet element to listen to
  },

  init: function () {
    this.normalHand = null;
    this.gripHand = null;
    this.magnetTarget = null;
    this.isGripping = false;

    // Bind event handlers
    this.onGrabStart = this.onGrabStart.bind(this);
    this.onGrabEnd = this.onGrabEnd.bind(this);

    // Wait for the scene to be ready
    if (this.el.sceneEl.hasLoaded) {
      this.setupComponent();
    } else {
      this.el.sceneEl.addEventListener('loaded', () => {
        this.setupComponent();
      });
    }
  },

  setupComponent: function () {
    // Get hand model references
    const handedness = this.data.handedness;
    this.normalHand = this.el.querySelector(`#${handedness}Hand`);
    this.gripHand = this.el.querySelector(`#${handedness}HandGrip`);
    // Get magnet target
    this.magnetTarget = this.data.magnetTarget;
    if (!this.normalHand || !this.gripHand) {
      console.warn(`hand-grip-switcher: Could not find hand models for ${handedness} hand`);
      return;
    }
    if (!this.magnetTarget) {
      console.warn(`hand-grip-switcher: Could not find magnet target for ${handedness} hand`);
      return;
    }
    // Add event listeners to the magnet target
    this.magnetTarget.addEventListener('squeezestart', this.onGrabStart);
    this.magnetTarget.addEventListener('squeezeend', this.onGrabEnd);
    this.magnetTarget.addEventListener('selectstart', this.onGrabStart);
    this.magnetTarget.addEventListener('selectend', this.onGrabEnd);
  },

  onGrabStart: function () {
    if (this.isGripping) return; // Already gripping
    this.isGripping = true;
    // Hide normal hand, show grip hand
    if (this.normalHand) this.normalHand.setAttribute('visible', false);
    if (this.gripHand) this.gripHand.setAttribute('visible', true);
  },

  onGrabEnd: function () {
    if (!this.isGripping) return; // Not gripping
    this.isGripping = false;
    // Show normal hand, hide grip hand
    if (this.normalHand) this.normalHand.setAttribute('visible', true);    
    if (this.gripHand) this.gripHand.setAttribute('visible', false);
  },

  remove: function () {
    // Clean up event listeners
    if (this.magnetTarget) {
      this.magnetTarget.removeEventListener('squeezestart', this.onGrabStart);
      this.magnetTarget.removeEventListener('squeezeend', this.onGrabEnd);
      this.magnetTarget.removeEventListener('selectstart', this.onGrabStart);
      this.magnetTarget.removeEventListener('selectend', this.onGrabEnd);
    }
  }
});
