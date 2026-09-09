/**
 * A-Frame cockpit consumer for LEAN GATE v9-full.
 * Samples MOTION by decoded-frame index from the plate video clock.
 * Reads MOTION.cockpit.rollRad every tick.
 * FAIL CLOSED: if rollRad is null, do not apply roll. Never zero-fill.
 * Listens leangate:dial so the swing dial forwards into this consumer.
 * Plant vehicle: roll = 0. Chase: camera roll = 0, body still leans.
 * Coral settle = 0.
 *
 * <a-entity lean-gate="dial: 0.7; vehicle: striker; mode: cockpit">
 */
(function () {
  if (typeof AFRAME === "undefined") return;

  AFRAME.registerComponent("lean-gate", {
    schema: {
      dial: { type: "number", default: 0.7 },
      vehicle: { type: "string", default: "striker" },
      mode: { type: "string", default: "cockpit" },
      video: { type: "selector" },
    },
    init: function () {
      this.body = this.el.object3D;
      this.camEl = this.el.querySelector("[camera]") || this.el.querySelector("a-camera");
      if (this.el.sceneEl && this.el.sceneEl.renderer && this.el.sceneEl.renderer.xr) {
        var xr = this.el.sceneEl.renderer.xr;
        if (typeof xr.setFoveation === "function") xr.setFoveation(0);
      }
      var self = this;
      this._onDial = function (ev) {
        var d = ev.detail && ev.detail.dial;
        if (typeof d === "number") {
          self.data.dial = d;
          if (window.MOTION) window.MOTION.forwardDial(d);
        }
      };
      window.addEventListener("leangate:dial", this._onDial);
    },
    remove: function () {
      window.removeEventListener("leangate:dial", this._onDial);
    },
    tick: function () {
      var M = window.MOTION;
      if (!M) return;
      if (M.attachPayload && window.MOTION_PAYLOAD && M.payload !== window.MOTION_PAYLOAD) {
        M.attachPayload(window.MOTION_PAYLOAD);
      }
      if (M.payload && M.payload.status === "FAIL_CLOSED") return;
      if (this.data.dial !== M.dial) M.forwardDial(this.data.dial);
      M.setVehicle(this.data.vehicle);
      M.setView(this.data.mode);

      var video = this.data.video || document.querySelector("video");
      if (video && typeof M.fromVideoElement === "function") {
        M.fromVideoElement(video);
      }

      var cockpit = M.cockpit;
      var cam = this.camEl ? this.camEl.object3D : null;

      if (M.vehicle === "plant") {
        this.body.rotation.z = 0;
        if (cam) cam.rotation.z = 0;
        return;
      }

      if (!cockpit || cockpit.status !== "OK" || cockpit.rollRad == null) {
        return;
      }

      if (this.body) this.body.rotation.z = cockpit.physicalLeanRad || 0;
      if (this.data.mode === "chase") {
        if (cam) cam.rotation.z = 0;
      } else if (cam) {
        cockpit.apply(cam);
      }
    },
  });

  AFRAME.registerComponent("coral-qubit", {
    schema: {
      x: { type: "number", default: 0 },
      y: { type: "number", default: 1.35 },
      z: { type: "number", default: 0 },
    },
    tick: function () {
      var M = window.MOTION;
      if (!M || !M.coral) return;
      M.coral.apply(this.el.object3D, { x: this.data.x, y: this.data.y, z: this.data.z });
    },
  });
})();
