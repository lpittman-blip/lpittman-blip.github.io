/* Pluggable read-aloud.
   provider "browser" uses speechSynthesis and is the default and the fallback.
   provider "elevenlabs" is used only when a proxy endpoint is configured
   (window.ARTEMIS_TTS_ENDPOINT or <meta name="artemis-tts-endpoint">).
   The browser sends {text, voice_id} to that proxy and plays the audio.
   No API key is read, stored, or sent from this file. */
(function (root) {
  'use strict';
  var provider = 'browser';
  var endpoint = '';
  var speaking = false;
  var paused = false;
  var audioCtx = null;
  var source = null;
  var analyser = null;
  var element = null;
  var objectUrl = '';
  var ampFrame = 0;
  var pulseTimer = 0;
  var generation = 0;
  var current = null;

  function configuredEndpoint() {
    var fromWindow = typeof root.ARTEMIS_TTS_ENDPOINT === 'string' ? root.ARTEMIS_TTS_ENDPOINT.trim() : '';
    if (fromWindow) return fromWindow.replace(/\/$/, '');
    var meta = document.querySelector('meta[name="artemis-tts-endpoint"]');
    var fromMeta = meta && meta.getAttribute('content') ? meta.getAttribute('content').trim() : '';
    return fromMeta ? fromMeta.replace(/\/$/, '') : '';
  }

  function setAmp(level) {
    var n = Math.max(0, Math.min(1, level || 0));
    document.body.dataset.amp = n.toFixed(2);
    if (root.ArtemisFX) root.ArtemisFX.setAgent(speaking ? (paused ? 'speak' : 'speak') : 'idle', n);
  }

  function stopPulse() { clearInterval(pulseTimer); pulseTimer = 0; }

  function stopAudio() {
    generation += 1;
    stopPulse();
    if (ampFrame) cancelAnimationFrame(ampFrame);
    ampFrame = 0;
    try { if (source) source.stop(); } catch (e) {}
    try { if (source) source.disconnect(); } catch (e) {}
    source = null;
    analyser = null;
    if (element) { element.pause(); element.src = ''; element = null; }
    if (objectUrl) { URL.revokeObjectURL(objectUrl); objectUrl = ''; }
    if (audioCtx) { var ctx = audioCtx; audioCtx = null; ctx.close().catch(function () {}); }
    if ('speechSynthesis' in root) root.speechSynthesis.cancel();
  }

  function watchAnalyser() {
    if (!analyser || !speaking || paused) return;
    var data = new Uint8Array(analyser.fftSize);
    var tick = function () {
      if (!analyser || !speaking) return;
      analyser.getByteTimeDomainData(data);
      var sum = 0;
      for (var i = 0; i < data.length; i++) { var v = (data[i] - 128) / 128; sum += v * v; }
      setAmp(Math.min(1, Math.sqrt(sum / data.length) * 3.2));
      ampFrame = requestAnimationFrame(tick);
    };
    ampFrame = requestAnimationFrame(tick);
  }

  function browserList() {
    return new Promise(function (resolve) {
      if (!('speechSynthesis' in root)) { resolve([]); return; }
      var map = function () {
        return root.speechSynthesis.getVoices().map(function (voice) {
          return { id: voice.name, label: voice.name + ' · ' + voice.lang, provider: 'browser' };
        });
      };
      var ready = map();
      if (ready.length) { resolve(ready); return; }
      var done = false;
      var finish = function () { if (done) return; done = true; var list = map(); resolve(list.length ? list : [{ id: '', label: 'Default voice', provider: 'browser' }]); };
      root.speechSynthesis.addEventListener('voiceschanged', finish, { once: true });
      setTimeout(finish, 700);
    });
  }

  function speakBrowser(text, voiceId, hooks, token) {
    if (!('speechSynthesis' in root)) { hooks.onError && hooks.onError(new Error('speechSynthesis unavailable')); return; }
    var utter = new SpeechSynthesisUtterance(text);
    var match = root.speechSynthesis.getVoices().find(function (voice) { return voice.name === voiceId; });
    if (match) utter.voice = match;
    utter.onstart = function () {
      if (token !== generation) return;
      speaking = true; paused = false; hooks.onStart && hooks.onStart();
      stopPulse();
      pulseTimer = setInterval(function () {
        if (!root.speechSynthesis.speaking || paused) return;
        setAmp(0.28 + Math.random() * 0.62);
      }, 120);
    };
    utter.onboundary = function () { if (token === generation && !paused) setAmp(0.35 + Math.random() * 0.6); };
    utter.onend = function () { if (token !== generation) return; speaking = false; stopPulse(); setAmp(0); hooks.onEnd && hooks.onEnd(); };
    utter.onerror = function () { if (token !== generation) return; speaking = false; stopPulse(); setAmp(0); hooks.onError && hooks.onError(new Error('speechSynthesis failed')); };
    current = { kind: 'browser', utter: utter };
    root.speechSynthesis.speak(utter);
  }

  function finish(token, hooks, error) {
    if (token !== generation) return;
    speaking = false; paused = false; current = null;
    if (ampFrame) cancelAnimationFrame(ampFrame);
    ampFrame = 0;
    setAmp(0);
    if (error) hooks.onError && hooks.onError(error);
    else hooks.onEnd && hooks.onEnd();
  }

  async function speakProxy(text, voiceId, hooks, token) {
    var response = await fetch(endpoint, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'audio/mpeg, audio/wav, audio/*' },
      body: JSON.stringify({ text: text, voice_id: voiceId })
    });
    if (!response.ok) throw new Error('tts ' + response.status);
    var type = response.headers.get('content-type') || '';
    if (type.indexOf('json') >= 0 || type.indexOf('text/') === 0) throw new Error('tts returned no audio');
    var bytes = await response.arrayBuffer();
    if (token !== generation) return;
    var Ctx = root.AudioContext || root.webkitAudioContext;
    if (!Ctx) throw new Error('Web Audio unavailable');
    audioCtx = new Ctx();
    var decoded;
    try { decoded = await audioCtx.decodeAudioData(bytes.slice(0)); }
    catch (e) { decoded = null; }
    if (token !== generation) return;
    if (!decoded) { await playElement(bytes, type, hooks, token); return; }
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 512;
    analyser.connect(audioCtx.destination);
    var started = 0, offset = 0, ignoreEnd = false;
    function start(at) {
      ignoreEnd = true;
      if (source) { try { source.onended = null; source.stop(); } catch (e) {} }
      ignoreEnd = false;
      source = audioCtx.createBufferSource();
      source.buffer = decoded;
      source.connect(analyser);
      started = audioCtx.currentTime;
      offset = at;
      source.onended = function () {
        if (ignoreEnd || token !== generation || paused) return;
        finish(token, hooks);
      };
      source.start(0, Math.min(at, Math.max(0, decoded.duration - 0.05)));
    }
    current = {
      kind: 'buffer',
      pause: function () {
        if (!source || paused) return;
        paused = true;
        var played = audioCtx.currentTime - started;
        ignoreEnd = true;
        try { source.stop(); } catch (e) {}
        ignoreEnd = false;
        offset = Math.min(decoded.duration, offset + Math.max(0, played));
        if (ampFrame) cancelAnimationFrame(ampFrame);
        setAmp(0.12);
      },
      resume: function () {
        if (!paused) return;
        paused = false;
        start(offset);
        watchAnalyser();
      }
    };
    speaking = true; paused = false;
    hooks.onStart && hooks.onStart();
    start(0);
    watchAnalyser();
  }

  function playElement(bytes, type, hooks, token) {
    return new Promise(function (resolve) {
      var Ctx = root.AudioContext || root.webkitAudioContext;
      objectUrl = URL.createObjectURL(new Blob([bytes], { type: type || 'audio/mpeg' }));
      element = new Audio(objectUrl);
      element.preload = 'auto';
      var started = false;
      element.onplay = function () { if (!started) { started = true; speaking = true; hooks.onStart && hooks.onStart(); } };
      element.onended = function () { finish(token, hooks); resolve(); };
      element.onerror = function () { finish(token, hooks, new Error('audio element failed')); resolve(); };
      if (Ctx) {
        audioCtx = audioCtx || new Ctx();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 512;
        var node = audioCtx.createMediaElementSource(element);
        node.connect(analyser);
        analyser.connect(audioCtx.destination);
      }
      current = {
        kind: 'element',
        pause: function () { element.pause(); paused = true; setAmp(0.12); },
        resume: function () { paused = false; element.play(); watchAnalyser(); }
      };
      element.play().then(function () { watchAnalyser(); resolve(); }).catch(function (error) { finish(token, hooks, error); resolve(); });
    });
  }

  async function list() {
    endpoint = configuredEndpoint();
    if (endpoint) {
      try {
        var response = await fetch(endpoint + '/voices', { credentials: 'include', headers: { Accept: 'application/json' } });
        if (response.ok) {
          var data = await response.json();
          var raw = Array.isArray(data) ? data : (data.voices || []);
          var voices = raw.map(function (voice) {
            var id = voice.voice_id || voice.id;
            return id ? { id: id, label: (voice.name || id) + ' · ElevenLabs', provider: 'elevenlabs' } : null;
          }).filter(Boolean);
          if (voices.length) { provider = 'elevenlabs'; return voices; }
        }
      } catch (e) {}
    }
    provider = 'browser';
    endpoint = endpoint || '';
    return browserList();
  }

  function speak(opts) {
    opts = opts || {};
    var text = String(opts.text || '').slice(0, 4500);
    if (!text) return;
    stopAudio();
    var token = generation;
    var hooks = { onStart: opts.onStart, onEnd: opts.onEnd, onError: opts.onError };
    if (provider === 'elevenlabs' && endpoint) {
      speakProxy(text, opts.voiceId || '', hooks, token).catch(function () {
        if (token !== generation) return;
        if ('speechSynthesis' in root) speakBrowser(text, '', hooks, token);
        else hooks.onError && hooks.onError(new Error('tts failed'));
      });
      return;
    }
    speakBrowser(text, opts.voiceId || '', hooks, token);
  }

  root.ArtemisVoices = {
    get provider() { return provider; },
    get speaking() { return speaking; },
    get endpoint() { return endpoint; },
    list: list,
    speak: speak,
    stop: function () { stopAudio(); speaking = false; paused = false; current = null; setAmp(0); },
    pause: function () {
      paused = true;
      if (current && current.pause) current.pause();
      else if ('speechSynthesis' in root) root.speechSynthesis.pause();
      setAmp(0.12);
    },
    resume: function () {
      if (current && current.resume) current.resume();
      else if ('speechSynthesis' in root) root.speechSynthesis.resume();
      paused = false;
    }
  };
})(window);
