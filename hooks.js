/**
 * LEAN GATE v9-full — cockpit consumer.
 * cameraRollDeg = dial * (targetLeanDeg - measuredLeanDeg)
 * Dial 0 = plate as-is (level-horizon defect). Dial 1 = full physical.
 * Plant roll = 0. No modulo. No loop. No hold-last after end.
 * Missing measuredLean or out-of-range decoded frame => FAIL_CLOSED (null, not 0).
 * Coral settle = 0. World-locked.
 *
 * Script order: v9-inline.js (or MOTION_PAYLOAD) THEN this file.
 * sample() re-reads window.MOTION_PAYLOAD so a late inline still binds.
 */
(function (root) {
  var forwarding = false;
  var lastDeficit = null;
  var lastPhysical = 0;
  var lastI = 0;
  var lastSource = "none";

  function getPayload() {
    return (
      root.MOTION_PAYLOAD ||
      root.__GROK_MOTION_PAYLOAD ||
      (root.MOTION && root.MOTION.payload) ||
      null
    );
  }

  function failClosedPayload() {
    var payload = getPayload();
    return !payload || payload.status === "FAIL_CLOSED" || !payload.sampleCount;
  }

  function cockpitState() {
    var payload = getPayload();
    return {
      dial: 0.7,
      swing: 0.7,
      leadMs: payload && payload.leadMs != null ? payload.leadMs : 127,
      vehicle: "striker",
      view: "cockpit",
      rollDeg: null,
      rollRad: null,
      deficitDeg: null,
      physicalLeanDeg: 0,
      physicalLeanRad: 0,
      phrase: "straight",
      status: failClosedPayload() ? "FAIL_CLOSED" : "OK",
      apply: function (cam) {
        if (cockpit.rollRad == null) return;
        if (cockpit.vehicle === "plant") {
          cam.rotation.z = 0;
          return;
        }
        cam.rotation.z = cockpit.rollRad;
      },
    };
  }

  var cockpit = cockpitState();
  var listeners = [];

  function emit() {
    root.COCKPIT_MOTION = cockpit;
    if (typeof CustomEvent === "function") {
      root.dispatchEvent(
        new CustomEvent("leangate:dial", {
          detail: { dial: cockpit.dial, cockpit: cockpit, status: cockpit.status, i: lastI },
        }),
      );
    }
    for (var k = 0; k < listeners.length; k++) listeners[k](cockpit);
  }

  function writeRoll() {
    cockpit.dial = M.dial;
    cockpit.swing = M.dial;
    cockpit.vehicle = M.vehicle;
    cockpit.view = M.view;
    if (M.vehicle === "plant") {
      cockpit.rollDeg = 0;
      cockpit.rollRad = 0;
      cockpit.deficitDeg = 0;
      cockpit.physicalLeanDeg = 0;
      cockpit.physicalLeanRad = 0;
      cockpit.status = "OK";
      emit();
      return;
    }
    if (lastDeficit == null || lastSource === "fail") {
      cockpit.rollDeg = null;
      cockpit.rollRad = null;
      cockpit.deficitDeg = null;
      cockpit.status = "FAIL_CLOSED";
      emit();
      return;
    }
    cockpit.deficitDeg = lastDeficit;
    cockpit.physicalLeanDeg = lastPhysical;
    cockpit.physicalLeanRad = (lastPhysical * Math.PI) / 180;
    cockpit.rollDeg = M.dial * lastDeficit;
    cockpit.rollRad = (cockpit.rollDeg * Math.PI) / 180;
    cockpit.status = "OK";
    emit();
  }

  var M = root.MOTION || {};
  M.version = "v9-full";
  M.frozen = true;
  M.payload = getPayload();
  M.dial = 0.7;
  M.vehicle = "striker";
  M.view = "cockpit";
  M.cockpit = cockpit;
  M.G = 9.81;
  M.leadMs = (M.payload && M.payload.leadMs != null) ? M.payload.leadMs : 127;
  M.leadBandMs = (M.payload && M.payload.leadBandMs) || [118, 136];
  M.corr = M.payload && M.payload.correlation;
  M.resample = "decoded-frame-index. no modulo. no loop. no hold-last.";
  M.sampleCount = M.payload ? M.payload.sampleCount : 0;
  root.COCKPIT_MOTION = cockpit;

  M.attachPayload = function (p) {
    if (!p) return M;
    root.MOTION_PAYLOAD = p;
    root.__GROK_MOTION_PAYLOAD = p;
    M.payload = p;
    M.leadMs = p.leadMs != null ? p.leadMs : 127;
    M.leadBandMs = p.leadBandMs || [118, 136];
    M.corr = p.correlation;
    M.sampleCount = p.sampleCount || 0;
    cockpit.leadMs = M.leadMs;
    return M;
  };

  M.setDial = function (v) {
    return M.forwardDial(v);
  };
  M.forwardDial = function (v) {
    if (forwarding) return M.dial;
    forwarding = true;
    v = v < 0 ? 0 : v > 1 ? 1 : v;
    M.dial = v;
    writeRoll();
    if (root.__leanGate && typeof root.__leanGate.setDial === "function") {
      try {
        root.__leanGate.setDial(v);
      } catch (e) {}
    }
    forwarding = false;
    return M.dial;
  };
  M.getDial = function () {
    return M.dial;
  };
  M.setVehicle = function (id) {
    M.vehicle = id === "plant" ? "plant" : "striker";
    cockpit.vehicle = M.vehicle;
    writeRoll();
    return M.vehicle;
  };
  M.setView = function (v) {
    M.view = v === "chase" ? "chase" : "cockpit";
    cockpit.view = M.view;
    writeRoll();
    return M.view;
  };

  M.sample = function (decodedFrame) {
    var payload = getPayload();
    M.payload = payload;
    if (failClosedPayload()) {
      lastSource = "fail";
      lastDeficit = null;
      writeRoll();
      return { status: "FAIL_CLOSED", i: decodedFrame, measuredLeanDeg: null, targetLeanDeg: null, deficitLeanDeg: null, deficitRollDeg: null };
    }
    var n = payload.sampleCount;
    if (decodedFrame == null || decodedFrame < 0 || decodedFrame >= n) {
      lastSource = "fail";
      lastDeficit = null;
      lastI = decodedFrame;
      writeRoll();
      return { status: "FAIL_CLOSED", i: decodedFrame, reason: "out of range — no hold-last, no wrap" };
    }
    var measured = payload.measuredLeanDeg[decodedFrame];
    var target = payload.targetLeanDeg[decodedFrame];
    if (measured == null || target == null) {
      lastSource = "fail";
      lastDeficit = null;
      lastI = decodedFrame;
      writeRoll();
      return {
        status: "FAIL_CLOSED",
        i: decodedFrame,
        t: payload.videoTimestamp[decodedFrame],
        measuredLeanDeg: measured,
        targetLeanDeg: target,
        deficitLeanDeg: null,
        deficitRollDeg: null,
      };
    }
    var deficit = target - measured;
    lastDeficit = deficit;
    lastPhysical = target;
    lastI = decodedFrame;
    lastSource = "plate";
    cockpit.phrase = payload.phrase ? payload.phrase[decodedFrame] : cockpit.phrase;
    var frame = {
      status: "OK",
      i: decodedFrame,
      t: payload.videoTimestamp[decodedFrame],
      heading: payload.heading[decodedFrame],
      yawRate: payload.yawRate[decodedFrame],
      measuredLeanDeg: measured,
      targetLeanDeg: target,
      deficitLeanDeg: deficit,
      deficitRollDeg: deficit,
      cameraRollDeg: M.vehicle === "plant" ? 0 : M.dial * deficit,
      phrase: cockpit.phrase,
    };
    writeRoll();
    return frame;
  };

  M.setDecodedFrame = function (i) {
    return M.sample(i);
  };

  M.frameAtTime = function (t) {
    var payload = getPayload();
    M.payload = payload;
    if (failClosedPayload()) return { status: "FAIL_CLOSED" };
    var hz = payload.sampleRate;
    var i = Math.floor(t * hz + 1e-9);
    return M.sample(i);
  };

  M.fromVideoElement = function (video) {
    if (!video) return { status: "FAIL_CLOSED", reason: "no video" };
    return M.frameAtTime(video.currentTime);
  };

  M.applyObject3D = function (body, cam, opts) {
    var i = opts && opts.decodedFrame;
    var f = M.sample(i);
    if (M.vehicle === "plant") {
      if (body) body.rotation.z = 0;
      if (cam) cam.rotation.z = 0;
      return f;
    }
    if (f.status !== "OK") {
      return f;
    }
    if (body) body.rotation.z = (f.targetLeanDeg * Math.PI) / 180;
    if (cam) {
      var mode = (opts && opts.mode) || M.view;
      cam.rotation.z = mode === "chase" ? 0 : (f.cameraRollDeg * Math.PI) / 180;
    }
    return f;
  };

  M.pushFrame = function (f) {
    M.vehicle = f.vehicle === "plant" ? "plant" : "striker";
    M.view = f.view === "chase" ? "chase" : "cockpit";
    cockpit.vehicle = M.vehicle;
    cockpit.view = M.view;
    cockpit.leadMs = f.leadMs != null ? f.leadMs : M.leadMs;
    cockpit.phrase = f.phrase || cockpit.phrase;
    if (M.vehicle === "plant") {
      lastDeficit = 0;
      lastPhysical = 0;
      lastSource = "live";
    } else if (f.deficitDeg == null && f.deficitLeanDeg == null && f.deficitRollDeg == null) {
      lastDeficit = null;
      lastSource = "fail";
    } else {
      lastDeficit = f.deficitDeg != null ? f.deficitDeg : (f.deficitRollDeg != null ? f.deficitRollDeg : f.deficitLeanDeg);
      lastPhysical = f.physicalLeanDeg || f.targetLeanDeg || 0;
      lastSource = "live";
    }
    writeRoll();
    return cockpit;
  };

  M.subscribe = function (fn) {
    listeners.push(fn);
    fn(cockpit);
    return function () {
      listeners = listeners.filter(function (x) { return x !== fn; });
    };
  };

  M.bind = function (b) {
    M._bind = b;
    if (b && typeof b.getDial === "function") {
      var d = b.getDial();
      if (typeof d === "number") M.forwardDial(d);
    }
  };

  M.coral = {
    settle: 0,
    worldLocked: true,
    inheritDial: false,
    inheritCamLean: false,
    apply: function (obj, pos) {
      if (!obj || !pos) return;
      obj.position.set(pos.x, pos.y, pos.z);
      obj.rotation.set(0, 0, 0);
      if (obj.updateMatrix) obj.updateMatrix();
      if (obj.updateMatrixWorld) obj.updateMatrixWorld(true);
    },
  };

  writeRoll();
  root.MOTION = M;
})(typeof window !== "undefined" ? window : globalThis);
