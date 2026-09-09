/**
 * LEAN GATE v9-full-r4 — cockpit consumer.
 * NOT WEAR READY. 4K NOT VALIDATED.
 *
 * Render tick independently grants permission to retain correction.
 * Events help but are not the safety boundary.
 */
(function (root) {
  var EXPECTED = {
    sha256: "4507a5d5f9304b91c149200672c8a468f089a33bb96b10032a52346085483882",
    decodedFrameCount: 1514,
    fps: 24,
    durationSec: 63.083333,
  };

  var CONSUMER_ARRAYS = {
    decodedFrame: { allowNull: false, kind: "index" },
    videoTimestamp: { allowNull: false, kind: "timestamp" },
    heading: { allowNull: true, kind: "number" },
    yawRate: { allowNull: true, kind: "number" },
    yawRateDegS: { allowNull: true, kind: "number" },
    pitchRate: { allowNull: true, kind: "number" },
    rollRateDegS: { allowNull: true, kind: "number" },
    lkTxPx: { allowNull: true, kind: "number" },
    lkZoom: { allowNull: true, kind: "number" },
    measuredLeanDeg: { allowNull: true, kind: "number" },
    targetLeanDeg: { allowNull: true, kind: "number" },
    deficitLeanDeg: { allowNull: true, kind: "number" },
    deficitRollDeg: { allowNull: true, kind: "number" },
    cameraRollDial0: { allowNull: true, kind: "number" },
    cameraRollDial1: { allowNull: true, kind: "number" },
    appliedCorrectionDial1Deg: { allowNull: false, kind: "number" },
    correctionValid: { allowNull: false, kind: "boolean" },
    phrase: { allowNull: false, kind: "string" },
  };

  var forwarding = false;
  var lastI = -1;
  var lastIndexSource = "none";
  var lastIndexLimitation = null;
  var rvfcHandle = null;
  var boundVideo = null;
  var boundSrc = null;
  var videoListeners = [];
  var frameFresh = false;
  var staleReason = null;
  var lastPresentedMediaTime = null;
  var rvfcExpected = false;
  var rvfcLive = false;
  var FRAME_PERIOD = 1 / EXPECTED.fps;

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
    if (p.sampleRate !== EXPECTED.fps) err.push("wrong sampleRate");
    if (p.sourceVideoSha256 !== EXPECTED.sha256) err.push("wrong sourceVideoSha256");
    if (p.leadApplied) err.push("leadApplied must be false");
    if (p.appliedLeadSamples) err.push("appliedLeadSamples must be 0");
    var n = p.sampleCount;
    if (typeof n !== "number" || n !== EXPECTED.decodedFrameCount) return err.length ? err : ["wrong sampleCount"];

    Object.keys(CONSUMER_ARRAYS).forEach(function (k) {
      var spec = CONSUMER_ARRAYS[k];
      if (!Object.prototype.hasOwnProperty.call(p, k)) {
        err.push("missing " + k);
        return;
      }
      var arr = p[k];
      if (!Array.isArray(arr) || arr.length !== n) {
        err.push("malformed " + k);
        return;
      }
      for (var i = 0; i < n; i++) {
        var v = arr[i];
        if (v === null || v === undefined) {
          if (!spec.allowNull) {
            err.push("null in " + k);
            return;
          }
          continue;
        }
        if (spec.kind === "boolean") {
          if (v !== true && v !== false) {
            err.push("malformed correctionValid");
            return;
          }
          continue;
        }
        if (spec.kind === "string") {
          if (typeof v !== "string") {
            err.push("non-string phrase");
            return;
          }
          continue;
        }
        if (typeof v === "boolean") {
          err.push("boolean in " + k);
          return;
        }
        if (typeof v === "string") {
          err.push("string in " + k);
          return;
        }
        if (typeof v !== "number" || !isFinite(v)) {
          err.push("NaN/Infinity in " + k);
          return;
        }
        if (spec.kind === "index" && v !== i) {
          err.push("wrong decoded indices");
          return;
        }
      }
    });

    if (Array.isArray(p.videoTimestamp) && p.videoTimestamp.length === n) {
      var prev = -Infinity;
      for (var i = 0; i < n; i++) {
        var ts = p.videoTimestamp[i];
        if (!isFiniteNumber(ts)) {
          err.push("wrong timestamps");
          break;
        }
        if (ts <= prev) {
          err.push("non-monotonic timestamps");
          break;
        }
        if (Math.abs(ts - i / EXPECTED.fps) > 1e-4) {
          err.push("wrong timestamps");
          break;
        }
        prev = ts;
      }
    }

    if (
      Array.isArray(p.measuredLeanDeg) &&
      Array.isArray(p.targetLeanDeg) &&
      Array.isArray(p.deficitLeanDeg) &&
      p.measuredLeanDeg.length === n
    ) {
      for (var j = 0; j < n; j++) {
        var m = p.measuredLeanDeg[j];
        var t = p.targetLeanDeg[j];
        var d = p.deficitLeanDeg[j];
        if (isFiniteNumber(m) && isFiniteNumber(t)) {
          if (!isFiniteNumber(d) || Math.abs(d - (t - m)) > 1e-6) {
            err.push("deficit inequality");
            break;
          }
          if (Array.isArray(p.deficitRollDeg) && Math.abs(p.deficitRollDeg[j] - d) > 1e-6) {
            err.push("deficitRoll mismatch");
            break;
          }
        }
      }
    }
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
      apply: function (offset) {
        if (!offset || !offset.rotation) return;
        offset.rotation.z = cockpit.appliedCorrectionRad;
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
    cockpit.dial = M.dial;
    cockpit.swing = M.dial;
    cockpit.vehicle = M.vehicle;
    cockpit.view = M.view;
    cockpit.leadMs = null;
    cockpit.leadApplied = false;
    cockpit.indexSource = lastIndexSource;
    cockpit.indexLimitation = lastIndexLimitation;
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
  M.version = "v9-full-r4";
  M.frozen = false;
  M.wearReady = false;
  M.fourKValidated = false;
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
      ? "verified ride.mp4 metadata (not a digest of selected element bytes)"
      : "source identity mismatch — correction unapplied";
    M.sourceIdentity = sourceIdentity;
    if (!ok) neutralize(sourceIdentity.reason);
    return sourceIdentity;
  };

  M.revokeSourceIdentity = function (reason) {
    sourceIdentity.verified = false;
    sourceIdentity.reason = reason || "revoked";
    neutralize(sourceIdentity.reason);
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
    cockpit.dial = v;
    cockpit.swing = v;
    if (lastI >= 0 && frameFresh) M.sample(lastI);
    else {
      cockpit.dial = v;
      emit();
    }
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
    if (lastI >= 0 && frameFresh) M.sample(lastI);
    return M.vehicle;
  };
  M.setView = function (v) {
    M.view = v === "chase" ? "chase" : "cockpit";
    cockpit.view = M.view;
    if (lastI >= 0 && frameFresh) M.sample(lastI);
    return M.view;
  };

  function failFrame(i, reason) {
    lastI = typeof i === "number" ? i : -1;
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

  function sampleWith(payload, identity, decodedFrame, dial, vehicle, view) {
    var err = payloadErrors(payload);
    if (err.length) return { status: "FAIL_CLOSED", reason: "payload invalid: " + err.join("; "), appliedCorrectionDeg: 0, i: decodedFrame };
    if (!identity || !identity.verified) return { status: "FAIL_CLOSED", reason: "source identity not verified", appliedCorrectionDeg: 0, i: decodedFrame };
    if (!isFiniteNumber(decodedFrame) || decodedFrame !== Math.round(decodedFrame)) {
      return { status: "FAIL_CLOSED", reason: "decodedFrame not an integer", appliedCorrectionDeg: 0, i: decodedFrame };
    }
    var n = payload.sampleCount;
    if (decodedFrame < 0 || decodedFrame >= n) {
      return { status: "FAIL_CLOSED", reason: "out of range — no hold-last, no wrap", appliedCorrectionDeg: 0, i: decodedFrame };
    }
    var measured = payload.measuredLeanDeg[decodedFrame];
    var target = payload.targetLeanDeg[decodedFrame];
    var flagged = payload.correctionValid[decodedFrame];
    if (measured == null || target == null || flagged !== true) {
      return { status: "FAIL_CLOSED", reason: "unmeasurable sample", appliedCorrectionDeg: 0, i: decodedFrame, measuredLeanDeg: measured == null ? null : measured, targetLeanDeg: target == null ? null : target };
    }
    if (!isFiniteNumber(measured) || !isFiniteNumber(target)) {
      return { status: "FAIL_CLOSED", reason: "non-numeric measurement", appliedCorrectionDeg: 0, i: decodedFrame };
    }
    var deficit = target - measured;
    if (!isFiniteNumber(deficit)) return { status: "FAIL_CLOSED", reason: "non-numeric deficit", appliedCorrectionDeg: 0, i: decodedFrame };
    var corr = vehicle === "plant" || view === "chase" ? 0 : dial * deficit;
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
      appliedCorrectionDeg: corr,
      cameraRollDeg: corr,
      phrase: payload.phrase[decodedFrame],
    };
  }

  M.sample = function (decodedFrame) {
    var payload = getPayload();
    M.payload = payload;
    var f = sampleWith(payload, sourceIdentity, decodedFrame, M.dial, M.vehicle, M.view);
    if (f.status !== "OK") {
      lastI = typeof decodedFrame === "number" ? decodedFrame : -1;
      lastIndexSource = lastIndexSource || "decoded-frame-index";
      neutralize(f.reason);
      f.indexSource = lastIndexSource;
      f.indexLimitation = lastIndexLimitation;
      return f;
    }
    lastI = decodedFrame;
    frameFresh = true;
    staleReason = null;
    writeApplied(f.deficitLeanDeg, f.targetLeanDeg, f.phrase);
    f.appliedCorrectionDeg = cockpit.appliedCorrectionDeg;
    f.cameraRollDeg = cockpit.appliedCorrectionDeg;
    f.indexSource = lastIndexSource;
    f.indexLimitation = lastIndexLimitation;
    return f;
  };

  M.setDecodedFrame = function (i) {
    lastIndexSource = "decoded-frame-index";
    lastIndexLimitation = null;
    frameFresh = true;
    return M.sample(i);
  };

  function liveDisqualifiers(video) {
    if (!sourceIdentity.verified) {
      return { ok: false, reason: "source identity not verified" };
    }
    if (!video) return { ok: true, unbound: true, reason: "no-video explicit-index path" };
    if (video.ended === true) return { ok: false, reason: "ended" };
    if (video.seeking === true) return { ok: false, reason: "seeking" };
    var src = video.currentSrc || video.src || null;
    if (boundSrc != null && src !== boundSrc) {
      return { ok: false, reason: "source change" };
    }
    var payload = getPayload();
    if (payload && isFiniteNumber(video.currentTime)) {
      var i = Math.round(video.currentTime * payload.sampleRate);
      if (
        i < 0 ||
        i >= payload.sampleCount ||
        video.currentTime >= EXPECTED.durationSec - 1e-6 ||
        (isFiniteNumber(video.duration) && video.duration > 0 && video.currentTime >= video.duration - 1e-6)
      ) {
        return { ok: false, reason: "track exhaustion" };
      }
    }
    if (rvfcExpected && !rvfcLive) return { ok: false, reason: "RVFC cancelled" };
    return { ok: true, reason: "live" };
  }

  /**
   * Independent render-tick permission. Reads live properties NOW.
   * Does not require an event or another RVFC.
   *
   * Freshness: last presented mediaTime must still name the displayed frame.
   * Allowed skew = one decoded-frame period (1/24 s). That is the plate's
   * frame duration, not a wall-clock timeout. If currentTime has moved more
   * than one frame from the last presented mediaTime, the last evidence is
   * about a different displayed frame.
   */
  function readTickPermission(video) {
    var live = liveDisqualifiers(video);
    if (!live.ok) return live;
    if (!video) return live;
    if (rvfcExpected) {
      if (!isFiniteNumber(lastPresentedMediaTime)) {
        return { ok: false, reason: "no presented-frame evidence" };
      }
      if (
        isFiniteNumber(video.currentTime) &&
        Math.abs(video.currentTime - lastPresentedMediaTime) > FRAME_PERIOD + 1e-6
      ) {
        return { ok: false, reason: "stale presented-frame evidence" };
      }
    }
    return { ok: true, reason: "fresh" };
  }

  M.readTickPermission = readTickPermission;
  M.freshness = {
    framePeriodSec: FRAME_PERIOD,
    rule: "retain presented-frame evidence only while |currentTime - lastPresentedMediaTime| <= 1/24s (one decoded-frame period). Not a wall-clock timeout.",
  };

  function videoIsStale(video) {
    if (!video) return "no video";
    var p = liveDisqualifiers(video);
    return p.ok ? null : p.reason;
  }

  M.fromPresentedFrame = function (meta, video) {
    var payload = getPayload();
    if (!payload) return failFrame(null, "no payload");
    var stale = videoIsStale(video || boundVideo);
    if (stale) {
      frameFresh = false;
      staleReason = stale;
      lastI = -1;
      return failFrame(-1, stale);
    }
    if (!meta || !isFiniteNumber(meta.mediaTime)) {
      frameFresh = false;
      return failFrame(null, "rvfc metadata.mediaTime missing");
    }
    var i = Math.round(meta.mediaTime * payload.sampleRate);
    if (i < 0 || i >= payload.sampleCount) {
      frameFresh = false;
      staleReason = "track exhaustion";
      lastI = -1;
      return failFrame(i, "track exhaustion");
    }
    lastIndexSource = "rvfc-mediaTime";
    lastIndexLimitation = null;
    lastPresentedMediaTime = meta.mediaTime;
    frameFresh = true;
    staleReason = null;
    rvfcLive = true;
    return M.sample(i);
  };

  M.fromVideoElement = function (video) {
    if (!video) return failFrame(null, "no video");
    var stale = videoIsStale(video);
    if (stale) {
      frameFresh = false;
      staleReason = stale;
      lastI = -1;
      return failFrame(-1, stale);
    }
    if (!frameFresh && typeof video.requestVideoFrameCallback === "function") {
      lastI = -1;
      return failFrame(-1, staleReason || "stale RVFC — waiting for fresh presented frame");
    }
    var payload = getPayload();
    if (!payload) return failFrame(null, "no payload");
    lastIndexSource = "media-time-currentTime-fallback";
    lastIndexLimitation =
      "HTMLMediaElement.currentTime is the media clock, not a presented-frame id. Dropped frames, decoder delay, or seek can disagree with the displayed frame by 1+. Do not treat this as proof of displayed-frame alignment.";
    if (!isFiniteNumber(video.currentTime)) return failFrame(null, "currentTime not numeric");
    var i = Math.round(video.currentTime * payload.sampleRate);
    if (i < 0 || i >= payload.sampleCount) {
      lastI = -1;
      return failFrame(i, "track exhaustion");
    }
    lastPresentedMediaTime = video.currentTime;
    frameFresh = true;
    return M.sample(i);
  };

  function onVideoEvent(kind) {
    return function () {
      if (kind === "ended" || kind === "seeking" || kind === "emptied" || kind === "abort" || kind === "error" || kind === "loadstart") {
        frameFresh = false;
        staleReason = kind;
        lastI = -1;
        if (kind === "emptied" || kind === "loadstart" || kind === "abort") {
          var src = boundVideo && (boundVideo.currentSrc || boundVideo.src);
          if (src !== boundSrc) {
            boundSrc = src;
            M.revokeSourceIdentity("source change");
            return;
          }
        }
        neutralize(kind);
      }
      if (kind === "seeked") {
        frameFresh = false;
        staleReason = "seeked-until-fresh-frame";
        lastI = -1;
        neutralize("seeked-until-fresh-frame");
      }
    };
  }

  M.detachVideo = function () {
    if (boundVideo && rvfcHandle != null && boundVideo.cancelVideoFrameCallback) {
      try {
        boundVideo.cancelVideoFrameCallback(rvfcHandle);
      } catch (e) {}
    }
    for (var i = 0; i < videoListeners.length; i++) {
      var rec = videoListeners[i];
      try {
        rec.el.removeEventListener(rec.type, rec.fn);
      } catch (e) {}
    }
    videoListeners = [];
    if (boundVideo && boundVideo.__leangateOrigCancel) {
      try {
        boundVideo.cancelVideoFrameCallback = boundVideo.__leangateOrigCancel;
        delete boundVideo.__leangateOrigCancel;
      } catch (e) {}
    }
    boundVideo = null;
    M._boundVideo = null;
    boundSrc = null;
    rvfcHandle = null;
    rvfcExpected = false;
    rvfcLive = false;
    lastPresentedMediaTime = null;
    frameFresh = false;
    lastI = -1;
    neutralize("video detached");
    return M;
  };

  M.attachVideo = function (video) {
    M.detachVideo();
    boundVideo = video || null;
    M._boundVideo = boundVideo;
    rvfcHandle = null;
    frameFresh = false;
    if (!video) return M;
    boundSrc = video.currentSrc || video.src || null;
    lastPresentedMediaTime = null;
    rvfcExpected = false;
    rvfcLive = false;
    ["ended", "seeking", "seeked", "emptied", "abort", "error", "loadstart"].forEach(function (type) {
      var fn = onVideoEvent(type);
      video.addEventListener(type, fn);
      videoListeners.push({ el: video, type: type, fn: fn });
    });
    if (typeof video.cancelVideoFrameCallback === "function" && !video.__leangateOrigCancel) {
      video.__leangateOrigCancel = video.cancelVideoFrameCallback.bind(video);
      video.cancelVideoFrameCallback = function (h) {
        rvfcLive = false;
        rvfcHandle = null;
        frameFresh = false;
        staleReason = "RVFC cancelled";
        return video.__leangateOrigCancel(h);
      };
    }
    if (typeof video.requestVideoFrameCallback === "function") {
      rvfcExpected = true;
      var onFrame = function (_now, meta) {
        if (boundVideo !== video) return;
        rvfcLive = true;
        M.fromPresentedFrame(meta, video);
        if (boundVideo === video && rvfcLive) rvfcHandle = video.requestVideoFrameCallback(onFrame);
      };
      rvfcHandle = video.requestVideoFrameCallback(onFrame);
      rvfcLive = rvfcHandle != null;
    }
    var nowStale = videoIsStale(video);
    if (nowStale) neutralize(nowStale);
    return M;
  };

  function rz(obj, z) {
    if (!obj) return;
    if (obj.rotation) obj.rotation.z = z;
    else obj.rotation = { x: 0, y: 0, z: z };
  }

  function isDescendant(node, ancestor) {
    if (!node || !ancestor) return false;
    var n = node.parent;
    var guard = 0;
    while (n && guard++ < 64) {
      if (n === ancestor) return true;
      n = n.parent;
    }
    return false;
  }

  M.applyTransforms = function (nodes) {
    nodes = nodes || {};
    var offset = nodes.correctionOffset || null;
    var tracked = nodes.trackedCamera || null;
    var bike = nodes.bikeVisual || null;
    var hierarchyForbidden = false;
    if (bike && (isDescendant(offset, bike) || isDescendant(nodes.cockpitCam, bike) || isDescendant(tracked, bike))) {
      hierarchyForbidden = true;
    }

    var f;
    if (hierarchyForbidden) {
      f = failFrame(lastI, "HIERARCHY_FORBIDDEN: camera/offset under bikeVisual");
    } else {
      var video = nodes.video || boundVideo;
      var perm = readTickPermission(video);
      if (video && !perm.ok) {
        if (perm.reason === "source change") {
          M.revokeSourceIdentity("source change");
        }
        frameFresh = false;
        staleReason = perm.reason;
        lastI = -1;
        f = failFrame(-1, perm.reason);
      } else if (!video) {
        f = M.sample(nodes.decodedFrame != null ? nodes.decodedFrame : lastI);
      } else if (rvfcExpected) {
        f = M.sample(lastI);
      } else {
        f = M.fromVideoElement(video);
      }
    }

    var bodyLean = 0;
    var camCorr = 0;
    if (!hierarchyForbidden && M.vehicle !== "plant" && f.status === "OK") {
      bodyLean = (f.targetLeanDeg * Math.PI) / 180;
      camCorr = M.view === "chase" ? 0 : (f.appliedCorrectionDeg * Math.PI) / 180;
    }

    rz(nodes.vehicleRoot, 0);
    rz(bike, bodyLean);
    rz(offset, camCorr);
    rz(nodes.chaseCorrectionOffset, 0);
    if (nodes.chaseCam && nodes.chaseCam !== tracked) rz(nodes.chaseCam, 0);
    if (nodes.chaseCam && nodes.chaseCam.up && nodes.chaseCam.up.set) nodes.chaseCam.up.set(0, 1, 0);
    if (nodes.cowl) rz(nodes.cowl, 0);
    // Desktop sibling contract: cockpitCam is the correction node only when it is
    // NOT the tracked headset camera and writeTrackedPose is not requested.
    if (nodes.cockpitCam && nodes.cockpitCam !== tracked && nodes.writeTrackedPose !== true) {
      if (!offset) rz(nodes.cockpitCam, camCorr);
    }
    // Never write tracked headset pose.
    if (tracked && nodes.writeTrackedPose === true) {
      /* still refuse */
    }

    return {
      status: hierarchyForbidden ? "FAIL_CLOSED" : f.status,
      bodyLeanRad: bodyLean,
      cockpitCamRad: camCorr,
      chaseCamRad: 0,
      vehicleRootRad: 0,
      correctionOffsetRad: camCorr,
      trackedCameraWritten: false,
      hierarchyForbidden: hierarchyForbidden,
      worldCockpitIfSibling: camCorr,
      worldCockpitIfChildOfBike: bodyLean + camCorr,
      doubleRoll: bodyLean + camCorr,
      contract: "correctionOffset sibling of bikeVisual; tracked camera never written",
    };
  };

  M.applyObject3D = function (body, cam, opts) {
    return M.applyTransforms({
      vehicleRoot: null,
      bikeVisual: body,
      correctionOffset: cam,
      trackedCamera: null,
      decodedFrame: opts && opts.decodedFrame,
    });
  };

  M.worldRollYXZ = function (localZ, parentZ) {
    return (parentZ || 0) + (localZ || 0);
  };

  M.selfTest = function () {
    var snap = {
      verified: sourceIdentity.verified,
      sha256: sourceIdentity.sha256,
      frameCount: sourceIdentity.frameCount,
      fps: sourceIdentity.fps,
      durationSec: sourceIdentity.durationSec,
      reason: sourceIdentity.reason,
      lastI: lastI,
      dial: M.dial,
      vehicle: M.vehicle,
      view: M.view,
      frameFresh: frameFresh,
      staleReason: staleReason,
      lastPresentedMediaTime: lastPresentedMediaTime,
      rvfcExpected: rvfcExpected,
      rvfcLive: rvfcLive,
    };
    var fails = [];
    function eq(name, a, b) {
      if (Math.abs(a - b) > 1e-9) fails.push(name + " got " + a + " want " + b);
    }
    try {
      var body = 42.15 * Math.PI / 180;
      var deficit = 40.86 * Math.PI / 180;
      eq("sibling cockpit world roll", M.worldRollYXZ(deficit, 0), deficit);
      eq("WRONG child-of-bike world roll", M.worldRollYXZ(deficit, body), body + deficit);
      eq("chase world roll", M.worldRollYXZ(0, 0), 0);
      var payload = getPayload();
      var fixture = { verified: true, sha256: EXPECTED.sha256, frameCount: 1514, fps: 24, durationSec: 63.083333 };
      var prod = sampleWith(payload, sourceIdentity, 258, 1, "striker", "cockpit");
      if (snap.verified === false && prod.status === "OK") fails.push("production unverified sample leaked OK");
      var isolated = sampleWith(payload, fixture, 258, 1, "striker", "cockpit");
      if (isolated.status !== "OK") fails.push("fixture sample failed: " + isolated.reason);
      if (isolated.status === "OK" && Math.abs(isolated.targetLeanDeg - 40.459) > 0.02) fails.push("lookahead still in fixture sample");
      var oob = sampleWith(payload, fixture, 1514, 1, "striker", "cockpit");
      if (oob.appliedCorrectionDeg !== 0) fails.push("fixture oob not zero");
      var badId = sampleWith(payload, { verified: false }, 258, 1, "striker", "cockpit");
      if (badId.appliedCorrectionDeg !== 0) fails.push("unverified fixture applied correction");
      if (payload && payload.leadApplied) fails.push("lead still applied");
    } finally {
      sourceIdentity.verified = snap.verified;
      sourceIdentity.sha256 = snap.sha256;
      sourceIdentity.frameCount = snap.frameCount;
      sourceIdentity.fps = snap.fps;
      sourceIdentity.durationSec = snap.durationSec;
      sourceIdentity.reason = snap.reason;
      M.dial = snap.dial;
      M.vehicle = snap.vehicle;
      M.view = snap.view;
      lastI = snap.lastI;
      frameFresh = snap.frameFresh;
      staleReason = snap.staleReason;
      lastPresentedMediaTime = snap.lastPresentedMediaTime;
      rvfcExpected = snap.rvfcExpected;
      rvfcLive = snap.rvfcLive;
      cockpit.dial = snap.dial;
    }
    if (sourceIdentity.verified !== snap.verified) fails.push("selfTest mutated production verified");
    if (sourceIdentity.sha256 !== snap.sha256) fails.push("selfTest mutated production sha");
    if (M.dial !== snap.dial) fails.push("selfTest mutated dial");
    return {
      ok: fails.length === 0,
      fails: fails,
      productionVerifiedAfter: sourceIdentity.verified,
      productionVerifiedBefore: snap.verified,
      mutatedProduction: sourceIdentity.verified !== snap.verified,
    };
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
