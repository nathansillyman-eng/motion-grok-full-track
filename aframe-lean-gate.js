/**
 * A-Frame consumer for LEAN GATE v9-full-r6.
 * NOT WEAR READY. 4K NOT VALIDATED.
 *
 * NEVER writes [camera].object3D.rotation (tracked pose stays authoritative).
 * Writes [lean-correction] only.
 * Tick consumes MOTION.dial; does not push schema default back into MOTION.
 * remove() detaches RVFC.
 *
 * <a-entity lean-gate>
 *   <a-entity bike-visual></a-entity>
 *   <a-entity lean-correction>
 *     <a-camera></a-camera>
 *   </a-entity>
 * </a-entity>
 */
(function () {
  if (typeof AFRAME === "undefined") return;

  function isUnder(el, ancestor) {
    if (!el || !ancestor) return false;
    var n = el.parentElement || el.parentEl;
    var guard = 0;
    while (n && guard++ < 64) {
      if (n === ancestor) return true;
      n = n.parentElement || n.parentEl;
    }
    return false;
  }

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
      this.corrEl = this.el.querySelector("[lean-correction]") || this.el.querySelector(".lean-correction");
      this.camEl = this.el.querySelector("[camera]") || this.el.querySelector("a-camera");
      if (!this.corrEl) {
        this.corrEl = document.createElement("a-entity");
        this.corrEl.setAttribute("lean-correction", "");
        this.el.appendChild(this.corrEl);
      }
      if (this.el.sceneEl && this.el.sceneEl.renderer && this.el.sceneEl.renderer.xr) {
        var xr = this.el.sceneEl.renderer.xr;
        if (typeof xr.setFoveation === "function") xr.setFoveation(0);
      }
      var self = this;
      this._onDial = function (ev) {
        var d = ev.detail && ev.detail.dial;
        if (typeof d === "number" && isFinite(d)) self.data.dial = d;
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
      if (window.MOTION && typeof window.MOTION.detachVideo === "function") {
        window.MOTION.detachVideo();
      }
    },
    tick: function () {
      var M = window.MOTION;
      var root = this.root;
      var bike = this.bikeEl ? this.bikeEl.object3D : null;
      var offset = this.corrEl ? this.corrEl.object3D : null;
      var cam = this.camEl ? this.camEl.object3D : null;

      if (root) root.rotation.z = 0;
      if (offset) offset.rotation.z = 0;
      if (bike) bike.rotation.z = 0;
      // Do not write cam.rotation.z — tracked pose is authoritative.

      if (!M) return;
      if (M.attachPayload && window.MOTION_PAYLOAD && M.payload !== window.MOTION_PAYLOAD) {
        M.attachPayload(window.MOTION_PAYLOAD);
      }

      this.data.dial = M.dial;
      M.setVehicle(this.data.vehicle);
      M.setView(this.data.mode);

      var video = this.data.video || document.querySelector("video");
      if (video && typeof M.attachVideo === "function" && M._boundVideo !== video) {
        M.attachVideo(video);
      } else if (video && typeof video.requestVideoFrameCallback !== "function" && typeof M.fromVideoElement === "function") {
        M.fromVideoElement(video);
      }

      var forbidden = this.camEl && this.bikeEl && isUnder(this.camEl, this.bikeEl);
      if (forbidden && typeof M.revokeSourceIdentity !== "function") {
        /* still applyTransforms will catch object3D parent */
      }

      M.applyTransforms({
        vehicleRoot: root,
        bikeVisual: bike,
        correctionOffset: offset,
        trackedCamera: cam,
        chaseCorrectionOffset: this.data.mode === "chase" ? offset : null,
        writeTrackedPose: false,
        video: video || undefined,
      });
    },
  });

  AFRAME.registerComponent("bike-visual", { init: function () {} });
  AFRAME.registerComponent("lean-correction", { init: function () {} });

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
