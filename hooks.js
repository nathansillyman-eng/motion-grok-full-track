/**
 * LEAN GATE v9-full-r2 — cockpit consumer.
 *
 * RETIRED: frozen 127 ms, 3-frame lookahead, hold-last, double roll.
 *
 * appliedCorrection = sourceVerified && sampleValid ? dial * (target - measured) : 0
 * Invalid/null/out-of-range/wrong-source => applied correction 0 immediately.
 * measuredLean stays null. Never coerce. Never hold-last.
 *
 * Hierarchy: vehicleRoot (no roll) -> bikeVisual (target lean) AND cameras as siblings.
 * Cockpit camera MUST NOT be a child of the leaning body.
 *
 * Script order: v9-inline.js THEN this file.
 */
(function (root) {
  var EXPECTED = {
    sha256: "4507a5d5f9304b91c149200672c8a468f089a33bb96b10032a52346085483882",
    decodedFrameCount: 1514,
    fps: 24,
    durationSec: 63.083333,
  };

  var REQUIRED_ARRAYS = [
    "decodedFrame",
    "videoTimestamp",
    "yawRate",
    "measuredLeanDeg",
    "targetLeanDeg",
    "deficitLeanDeg",
    "deficitRollDeg",
    "correctionValid",
    "appliedCorrectionDial1Deg",
    "phrase",
  ];

  var forwarding = false;
  var lastI = 0;
  var lastIndexSource = "none";
  var lastIndexLimitation = null;
  var rvfcHandle = null;
  var boundVideo = null;

  function isFiniteNumber(x) {
    return typeof x === "number" && isFinite(x);
  }

  function getPayload() {
    return (
      root.MOTION_PAYLOAD ||
      root.__GROK_MOTION_PAYLOAD ||
      (root.MOTION && root.MOTION.payload) ||
      null
    );
  }

  function payloadErrors(p) {
    var err = [];
    if (!p || typeof p !== "object") return ["missing payload"];
    if (p.sampleCount !== EXPECTED.decodedFrameCount) err.push("wrong sampleCount");
    if (p.sampleRate !== EXPECTED.fps && p.sampleRate !== 24) err.push("wrong sampleRate");
    if (p.sourceVideoSha256 !== EXPECTED.sha256) err.push("wrong sourceVideoSha256");
    if (p.leadApplied) err.push("leadApplied must be false");
    if (p.appliedLeadSamples) err.push("appliedLeadSamples must be 0");
    var n = p.sampleCount;
    for (var a = 0; a < REQUIRED_ARRAYS.length; a++) {
      var k = REQUIRED_ARRAYS[a];
      if (!Array.isArray(p[k]) || p[k].length !== n) err.push("malformed " + k);
    }
    if (Array.isArray(p.videoTimestamp) && p.videoTimestamp.length === n) {
      for (var i = 0; i < n; i++) {
        var expect = i / EXPECTED.fps;
        var got = p.videoTimestamp[i];
        if (!isFiniteNumber(got) || Math.abs(got - expect) > 1e-4) {
          err.push("wrong timestamps");
          break;
        }
      }
    }
    function scan(arr, allowNull) {
      if (!Array.isArray(arr)) return;
      for (var i = 0; i < arr.length; i++) {
        var v = arr[i];
        if (v == null) {
          if (!allowNull) {
            err.push("null in required numeric");
            return;
          }
          continue;
        }
        if (typeof v === "string") {
          err.push("string in numeric field");
          return;
        }
        if (typeof v === "number" && !isFinite(v)) {
          err.push("NaN/Infinity");
          return;
        }
      }
    }
    scan(p.videoTimestamp, false);
    scan(p.decodedFrame, false);
    scan(p.yawRate, true);
    scan(p.measuredLeanDeg, true);
    scan(p.targetLeanDeg, true);
    scan(p.deficitLeanDeg, true);
    return err;
  }

  function cockpitState() {
    return {
      dial: 0.7,
      swing: 0.7,
      leadMs: null,
      leadApplied: false,
      vehicle: "striker",
      view: "cockpit",
      rollDeg: 0,
      rollRad: 0,
      deficitDeg: null,
      physicalLeanDeg: null,
      physicalLeanRad: 0,
      appliedCorrectionDeg: 0,
      appliedCorrectionRad: 0,
      applied: false,
      phrase: "fail_closed",
      status: "FAIL_CLOSED",
      indexSource: "none",
      indexLimitation: null,
      apply: function (cam) {
        if (!cam || !cam.rotation) return;
        cam.rotation.z = cockpit.appliedCorrectionRad;
      },
    };
  }

  var cockpit = cockpitState();
  var listeners = [];
  var sourceIdentity = {
    verified: false,
    sha256: null,
    frameCount: null,
    fps: null,
    durationSec: null,
    reason: "not bound — no correction until source identity is verified",
  };

  function emit() {
    root.COCKPIT_MOTION = cockpit;
    if (typeof CustomEvent === "function" && typeof root.dispatchEvent === "function") {
      root.dispatchEvent(
        new CustomEvent("leangate:dial", {
          detail: { dial: cockpit.dial, cockpit: cockpit, status: cockpit.status, i: lastI },
        }),
      );
    }
    for (var k = 0; k < listeners.length; k++) listeners[k](cockpit);
  }

  function neutralize(reason) {
    cockpit.rollDeg = 0;
    cockpit.rollRad = 0;
    cockpit.appliedCorrectionDeg = 0;
    cockpit.appliedCorrectionRad = 0;
    cockpit.applied = false;
    cockpit.deficitDeg = null;
    cockpit.physicalLeanDeg = null;
    cockpit.physicalLeanRad = 0;
    cockpit.status = "FAIL_CLOSED";
    cockpit.phrase = "fail_closed";
    cockpit.reason = reason || "fail_closed";
    emit();
  }

  function writeApplied(deficit, target, phrase) {
    cockpit.dial = M.dial;
    cockpit.swing = M.dial;
    cockpit.vehicle = M.vehicle;
    cockpit.view = M.view;
    cockpit.leadMs = null;
    cockpit.leadApplied = false;
    cockpit.indexSource = lastIndexSource;
    cockpit.indexLimitation = lastIndexLimitation;

    if (M.vehicle === "plant") {
      cockpit.rollDeg = 0;
      cockpit.rollRad = 0;
      cockpit.appliedCorrectionDeg = 0;
      cockpit.appliedCorrectionRad = 0;
      cockpit.applied = true;
      cockpit.deficitDeg = 0;
      cockpit.physicalLeanDeg = 0;
      cockpit.physicalLeanRad = 0;
      cockpit.status = "OK";
      cockpit.phrase = phrase || "straight";
      cockpit.reason = "plant";
      emit();
      return;
    }

    if (!sourceIdentity.verified) {
      neutralize("source identity not verified");
      return;
    }
    if (!isFiniteNumber(deficit) || !isFiniteNumber(target)) {
      neutralize("invalid sample");
      return;
    }

    var corr = M.view === "chase" ? 0 : M.dial * deficit;
    cockpit.deficitDeg = deficit;
    cockpit.physicalLeanDeg = target;
    cockpit.physicalLeanRad = (target * Math.PI) / 180;
    cockpit.appliedCorrectionDeg = corr;
    cockpit.appliedCorrectionRad = (corr * Math.PI) / 180;
    cockpit.rollDeg = corr;
    cockpit.rollRad = cockpit.appliedCorrectionRad;
    cockpit.applied = true;
    cockpit.status = "OK";
    cockpit.phrase = phrase || "straight";
    cockpit.reason = "ok";
    emit();
  }

  var M = root.MOTION || {};
  M.version = "v9-full-r2";
  M.frozen = false;
  M.wearReady = false;
  M.payload = getPayload();
  M.dial = 0.7;
  M.vehicle = "striker";
  M.view = "cockpit";
  M.cockpit = cockpit;
  M.G = 9.81;
  M.leadMs = null;
  M.leadApplied = false;
  M.leadBandMs = null;
  M.corr = null;
  M.resample = "decoded-frame-index. no modulo. no loop. no hold-last. no 127ms lookahead.";
  M.sampleCount = M.payload ? M.payload.sampleCount : 0;
  M.expectedSource = EXPECTED;
  M.sourceIdentity = sourceIdentity;
  root.COCKPIT_MOTION = cockpit;

  M.attachPayload = function (p) {
    var err = payloadErrors(p);
    if (err.length) {
      M.payload = null;
      neutralize("payload invalid: " + err.join("; "));
      return M;
    }
    root.MOTION_PAYLOAD = p;
    root.__GROK_MOTION_PAYLOAD = p;
    M.payload = p;
    M.leadMs = null;
    M.leadApplied = false;
    M.sampleCount = p.sampleCount;
    return M;
  };

  M.setSourceIdentity = function (id) {
    sourceIdentity.sha256 = id && id.sha256 != null ? String(id.sha256) : null;
    sourceIdentity.frameCount = id && id.frameCount;
    sourceIdentity.fps = id && id.fps;
    sourceIdentity.durationSec = id && id.durationSec;
    var ok =
      sourceIdentity.sha256 === EXPECTED.sha256 &&
      sourceIdentity.frameCount === EXPECTED.decodedFrameCount &&
      Number(sourceIdentity.fps) === EXPECTED.fps &&
      Math.abs(Number(sourceIdentity.durationSec) - EXPECTED.durationSec) < 1e-3;
    sourceIdentity.verified = !!ok;
    sourceIdentity.reason = ok
      ? "verified ride.mp4"
      : "source identity mismatch — correction unapplied";
    M.sourceIdentity = sourceIdentity;
    if (!ok) neutralize(sourceIdentity.reason);
    return sourceIdentity;
  };

  M.setDial = function (v) {
    return M.forwardDial(v);
  };
  M.forwardDial = function (v) {
    if (forwarding) return M.dial;
    forwarding = true;
    if (!isFiniteNumber(v)) {
      forwarding = false;
      neutralize("dial not numeric");
      return M.dial;
    }
    v = v < 0 ? 0 : v > 1 ? 1 : v;
    M.dial = v;
    M.sample(lastI);
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
    M.sample(lastI);
    return M.vehicle;
  };
  M.setView = function (v) {
    M.view = v === "chase" ? "chase" : "cockpit";
    cockpit.view = M.view;
    M.sample(lastI);
    return M.view;
  };

  function failFrame(i, reason) {
    lastI = i;
    neutralize(reason);
    return {
      status: "FAIL_CLOSED",
      i: i,
      measuredLeanDeg: null,
      targetLeanDeg: null,
      deficitLeanDeg: null,
      deficitRollDeg: null,
      appliedCorrectionDeg: 0,
      cameraRollDeg: 0,
      reason: reason,
      indexSource: lastIndexSource,
      indexLimitation: lastIndexLimitation,
    };
  }

  M.sample = function (decodedFrame) {
    var payload = getPayload();
    M.payload = payload;
    var err = payloadErrors(payload);
    if (err.length) return failFrame(decodedFrame, "payload invalid: " + err.join("; "));
    if (!sourceIdentity.verified) return failFrame(decodedFrame, "source identity not verified");
    if (!isFiniteNumber(decodedFrame) || decodedFrame !== Math.round(decodedFrame)) {
      return failFrame(decodedFrame, "decodedFrame not an integer");
    }
    var n = payload.sampleCount;
    if (decodedFrame < 0 || decodedFrame >= n) {
      return failFrame(decodedFrame, "out of range — no hold-last, no wrap");
    }
    lastI = decodedFrame;
    var measured = payload.measuredLeanDeg[decodedFrame];
    var target = payload.targetLeanDeg[decodedFrame];
    var flagged = payload.correctionValid ? payload.correctionValid[decodedFrame] : null;
    if (measured == null || target == null || flagged === false) {
      return failFrame(decodedFrame, "unmeasurable sample");
    }
    if (!isFiniteNumber(measured) || !isFiniteNumber(target)) {
      return failFrame(decodedFrame, "non-numeric measurement");
    }
    var deficit = target - measured;
    if (!isFiniteNumber(deficit)) return failFrame(decodedFrame, "non-numeric deficit");
    writeApplied(deficit, target, payload.phrase ? payload.phrase[decodedFrame] : "straight");
    return {
      status: "OK",
      i: decodedFrame,
      t: payload.videoTimestamp[decodedFrame],
      heading: payload.heading[decodedFrame],
      yawRate: payload.yawRate[decodedFrame],
      measuredLeanDeg: measured,
      targetLeanDeg: target,
      deficitLeanDeg: deficit,
      deficitRollDeg: deficit,
      appliedCorrectionDeg: cockpit.appliedCorrectionDeg,
      cameraRollDeg: cockpit.appliedCorrectionDeg,
      phrase: cockpit.phrase,
      indexSource: lastIndexSource,
      indexLimitation: lastIndexLimitation,
    };
  };

  M.setDecodedFrame = function (i) {
    lastIndexSource = "decoded-frame-index";
    lastIndexLimitation = null;
    return M.sample(i);
  };

  M.fromPresentedFrame = function (meta) {
    var payload = getPayload();
    if (!payload) return failFrame(null, "no payload");
    if (!meta || !isFiniteNumber(meta.mediaTime)) {
      return failFrame(null, "rvfc metadata.mediaTime missing");
    }
    lastIndexSource = "rvfc-mediaTime";
    lastIndexLimitation = null;
    var i = Math.round(meta.mediaTime * payload.sampleRate);
    return M.sample(i);
  };

  M.fromVideoElement = function (video) {
    if (!video) return failFrame(null, "no video");
    var payload = getPayload();
    if (!payload) return failFrame(null, "no payload");
    lastIndexSource = "media-time-currentTime-fallback";
    lastIndexLimitation =
      "HTMLMediaElement.currentTime is the media clock, not a presented-frame id. Dropped frames, decoder delay, or seek can disagree with the displayed frame by 1+. Do not treat this as proof of displayed-frame alignment.";
    if (!isFiniteNumber(video.currentTime)) return failFrame(null, "currentTime not numeric");
    var i = Math.round(video.currentTime * payload.sampleRate);
    return M.sample(i);
  };

  M.attachVideo = function (video) {
    if (boundVideo && rvfcHandle != null && boundVideo.cancelVideoFrameCallback) {
      try {
        boundVideo.cancelVideoFrameCallback(rvfcHandle);
      } catch (e) {}
    }
    boundVideo = video || null;
    rvfcHandle = null;
    if (!video) return M;
    if (typeof video.requestVideoFrameCallback === "function") {
      var onFrame = function (_now, meta) {
        M.fromPresentedFrame(meta);
        if (boundVideo === video) rvfcHandle = video.requestVideoFrameCallback(onFrame);
      };
      rvfcHandle = video.requestVideoFrameCallback(onFrame);
    }
    return M;
  };

  function rz(obj, z) {
    if (!obj) return;
    if (obj.rotation) obj.rotation.z = z;
    else obj.rotation = { x: 0, y: 0, z: z };
  }

  M.applyTransforms = function (nodes) {
    nodes = nodes || {};
    var f = M.sample(nodes.decodedFrame != null ? nodes.decodedFrame : lastI);
    var bodyLean = 0;
    var camCorr = 0;
    if (M.vehicle !== "plant" && f.status === "OK") {
      bodyLean = (f.targetLeanDeg * Math.PI) / 180;
      camCorr = M.view === "chase" ? 0 : (f.appliedCorrectionDeg * Math.PI) / 180;
    }
    rz(nodes.vehicleRoot, 0);
    rz(nodes.bikeVisual, bodyLean);
    rz(nodes.cockpitCam, camCorr);
    rz(nodes.chaseCam, 0);
    if (nodes.chaseCam && nodes.chaseCam.up && nodes.chaseCam.up.set) {
      nodes.chaseCam.up.set(0, 1, 0);
    }
    if (nodes.cowl) {
      rz(nodes.cowl, 0);
    }
    return {
      status: f.status,
      bodyLeanRad: bodyLean,
      cockpitCamRad: camCorr,
      chaseCamRad: 0,
      vehicleRootRad: 0,
      worldCockpitIfSibling: camCorr,
      worldCockpitIfChildOfBike: bodyLean + camCorr,
      doubleRoll: bodyLean + camCorr,
      contract: "cameras are siblings of bikeVisual under vehicleRoot",
    };
  };

  M.applyObject3D = function (body, cam, opts) {
    return M.applyTransforms({
      vehicleRoot: null,
      bikeVisual: body,
      cockpitCam: (opts && opts.mode) === "chase" ? null : cam,
      chaseCam: (opts && opts.mode) === "chase" ? cam : null,
      decodedFrame: opts && opts.decodedFrame,
    });
  };

  M.worldRollYXZ = function (localZ, parentZ) {
    return (parentZ || 0) + (localZ || 0);
  };

  M.selfTest = function () {
    var fails = [];
    function eq(name, a, b) {
      if (Math.abs(a - b) > 1e-9) fails.push(name + " got " + a + " want " + b);
    }
    var body = 42.15 * Math.PI / 180;
    var deficit = 40.86 * Math.PI / 180;
    eq("sibling cockpit world roll", M.worldRollYXZ(deficit, 0), deficit);
    eq("WRONG child-of-bike world roll", M.worldRollYXZ(deficit, body), body + deficit);
    eq("chase world roll", M.worldRollYXZ(0, 0), 0);
    eq("plant", M.worldRollYXZ(0, 0), 0);
    if (body + deficit < 1.4) fails.push("expected ~83deg demonstration value missing");
    var eightyThree = (body + deficit) * 180 / Math.PI;
    if (Math.abs(eightyThree - 83.01) > 0.1) fails.push("frame258 double-roll demo " + eightyThree);
    var payload = getPayload();
    if (payload) {
      if (payload.leadApplied) fails.push("lead still applied");
      if (payload.appliedLeadSamples) fails.push("lookahead still present");
      if (payload.targetLeanDeg && payload.yawRate) {
        var i = 258;
        var yr = payload.yawRate[i];
        var tgt = payload.targetLeanDeg[i];
        if (isFiniteNumber(yr) && isFiniteNumber(tgt)) {
          var expect = (Math.atan((24 * yr) / 9.81) * 180) / Math.PI;
          if (expect > 48) expect = 48;
          if (expect < -48) expect = -48;
          if (Math.abs(expect - tgt) > 0.05) fails.push("target still lookahead at 258: " + tgt + " vs " + expect);
        }
      }
    }
    var saved = {
      verified: sourceIdentity.verified,
      sha256: sourceIdentity.sha256,
      frameCount: sourceIdentity.frameCount,
      fps: sourceIdentity.fps,
      durationSec: sourceIdentity.durationSec,
    };
    M.setSourceIdentity({ sha256: "deadbeef", frameCount: 1514, fps: 24, durationSec: 63.083333 });
    var bad = M.sample(258);
    if (bad.appliedCorrectionDeg !== 0) fails.push("wrong source still applies correction");
    M.setSourceIdentity(saved.verified ? saved : { sha256: EXPECTED.sha256, frameCount: 1514, fps: 24, durationSec: 63.083333 });
    var oob = M.sample(1514);
    if (oob.appliedCorrectionDeg !== 0) fails.push("out of range hold-last");
    var neg = M.sample(-1);
    if (neg.appliedCorrectionDeg !== 0) fails.push("negative index hold-last");
    return { ok: fails.length === 0, fails: fails, doubleRollDegAt258Demo: eightyThree };
  };

  M.pushFrame = function (f) {
    M.vehicle = f.vehicle === "plant" ? "plant" : "striker";
    M.view = f.view === "chase" ? "chase" : "cockpit";
    if (M.vehicle === "plant") {
      writeApplied(0, 0, f.phrase);
      return cockpit;
    }
    var d = f.deficitDeg != null ? f.deficitDeg : f.deficitLeanDeg != null ? f.deficitLeanDeg : f.deficitRollDeg;
    var t = f.physicalLeanDeg != null ? f.physicalLeanDeg : f.targetLeanDeg;
    if (!isFiniteNumber(d) || !isFiniteNumber(t)) {
      neutralize("live frame invalid");
      return cockpit;
    }
    writeApplied(d, t, f.phrase);
    return cockpit;
  };

  M.subscribe = function (fn) {
    listeners.push(fn);
    fn(cockpit);
    return function () {
      listeners = listeners.filter(function (x) {
        return x !== fn;
      });
    };
  };

  M.bind = function (b) {
    M._bind = b;
    if (b && typeof b.getDial === "function") {
      var d = b.getDial();
      if (isFiniteNumber(d)) M.forwardDial(d);
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

  var bootErr = payloadErrors(getPayload());
  if (bootErr.length) neutralize("payload invalid: " + bootErr.join("; "));
  else neutralize("source identity not verified");
  M.attachPayload(getPayload());
  root.MOTION = M;
})(typeof window !== "undefined" ? window : globalThis);
