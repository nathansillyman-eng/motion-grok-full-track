/**
 * A-Frame consumer for LEAN GATE v9-full-r2.
 *
 * Cameras MUST be siblings of the bike visual, never children of it.
 * This component rolls THIS entity at 0 (vehicle root).
 * Bike visual: [bike-visual] child, target lean only.
 * Camera: [camera] child, appliedCorrection only.
 * Invalid => camera.rotation.z = 0 immediately (neutral). Never skip the tick.
 *
 * <a-entity lean-gate="vehicle: striker; mode: cockpit">
 *   <a-entity bike-visual></a-entity>
 *   <a-camera></a-camera>
 * </a-entity>
 */
(function () {
  if (typeof AFRAME === "undefined") return;

  AFRAME.registerComponent("lean-gate", {
    schema: {
      dial: { type: "number", default: 0.7 },
      vehicle: { type: "string", default: "striker" },
      mode: { type: "string", default: "cockpit" },
      video: { type: "selector" },
      sourceSha256: { type: "string", default: "" },
      sourceFrames: { type: "number", default: 1514 },
      sourceFps: { type: "number", default: 24 },
      sourceDuration: { type: "number", default: 63.083333 },
    },
    init: function () {
      this.root = this.el.object3D;
      this.bikeEl = this.el.querySelector("[bike-visual]") || this.el.querySelector(".bike-visual");
      this.camEl = this.el.querySelector("[camera]") || this.el.querySelector("a-camera");
      if (this.el.sceneEl && this.el.sceneEl.renderer && this.el.sceneEl.renderer.xr) {
        var xr = this.el.sceneEl.renderer.xr;
        if (typeof xr.setFoveation === "function") xr.setFoveation(0);
      }
      var self = this;
      this._onDial = function (ev) {
        var d = ev.detail && ev.detail.dial;
        if (typeof d === "number" && isFinite(d) && window.MOTION) window.MOTION.forwardDial(d);
      };
      window.addEventListener("leangate:dial", this._onDial);
      if (window.MOTION && this.data.sourceSha256) {
        window.MOTION.setSourceIdentity({
          sha256: this.data.sourceSha256,
          frameCount: this.data.sourceFrames,
          fps: this.data.sourceFps,
          durationSec: this.data.sourceDuration,
        });
      }
      var video = this.data.video || document.querySelector("video");
      if (video && window.MOTION && typeof window.MOTION.attachVideo === "function") {
        window.MOTION.attachVideo(video);
      }
    },
    remove: function () {
      window.removeEventListener("leangate:dial", this._onDial);
    },
    tick: function () {
      var M = window.MOTION;
      var root = this.root;
      var bike = this.bikeEl ? this.bikeEl.object3D : null;
      var cam = this.camEl ? this.camEl.object3D : null;

      // Vehicle root never carries lean. Neutralize first so a fail cannot hold-last.
      if (root) root.rotation.z = 0;
      if (cam) cam.rotation.z = 0;
      if (bike) bike.rotation.z = 0;

      if (!M) return;
      if (M.attachPayload && window.MOTION_PAYLOAD && M.payload !== window.MOTION_PAYLOAD) {
        M.attachPayload(window.MOTION_PAYLOAD);
      }
      if (typeof this.data.dial === "number" && isFinite(this.data.dial) && this.data.dial !== M.dial) {
        M.forwardDial(this.data.dial);
      }
      M.setVehicle(this.data.vehicle);
      M.setView(this.data.mode);

      var video = this.data.video || document.querySelector("video");
      if (video && !video._leangateRvfc && typeof M.attachVideo === "function") {
        M.attachVideo(video);
        video._leangateRvfc = true;
      } else if (video && typeof M.fromVideoElement === "function" && typeof video.requestVideoFrameCallback !== "function") {
        M.fromVideoElement(video);
      }

      M.applyTransforms({
        vehicleRoot: root,
        bikeVisual: bike,
        cockpitCam: this.data.mode === "cockpit" ? cam : null,
        chaseCam: this.data.mode === "chase" ? cam : null,
      });
    },
  });

  AFRAME.registerComponent("bike-visual", {
    init: function () {},
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
