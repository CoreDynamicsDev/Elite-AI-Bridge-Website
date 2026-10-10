// Elite AI Bridge 2.0 // site behaviour. Plain JS, no libraries.
(function () {
  "use strict";
  document.documentElement.classList.remove("no-js");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // ---------- key sounds (synthesised, off by default) ----------
  var sound = false, ac = null;
  try { sound = localStorage.getItem("eab-sound") === "1"; } catch (e) {}
  var sndBtn = $("#snd");
  function paintSnd() { if (!sndBtn) return; sndBtn.setAttribute("aria-pressed", sound); sndBtn.querySelector("b").textContent = sound ? "ON" : "OFF"; }
  function click(freq, len) {
    if (!sound) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      var o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime;
      o.type = "square"; o.frequency.setValueAtTime(freq || 1800, t); o.frequency.exponentialRampToValueAtTime(220, t + (len || 0.05));
      g.gain.setValueAtTime(0.06, t); g.gain.exponentialRampToValueAtTime(0.0001, t + (len || 0.05));
      o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + (len || 0.05) + 0.01);
    } catch (e) {}
  }
  if (sndBtn) {
    paintSnd();
    sndBtn.addEventListener("click", function () {
      sound = !sound; paintSnd(); click(1400, 0.06);
      try { localStorage.setItem("eab-sound", sound ? "1" : "0"); } catch (e) {}
    });
  }
  $$(".key, .dkey").forEach(function (k) { k.addEventListener("pointerdown", function () { click(1600, 0.045); }); });

  // ---------- boot sequence + LEDs ----------
  var leds = $$(".led");
  var lines = [
    ["CORE DYNAMICS DEV // UNIT 2.0.0", -1],
    ["", -1],
    ["LINK ............ OK", 0],
    ["ELITE JOURNAL ... OK", 1],
    ["SHIP VOICE ...... OK", 2],
    ["AI CO-PILOT ..... STANDBY", 3],
    ["", -1],
    ["BRIDGE ONLINE.", -1]
  ];
  var bootEl = $("#boot"), bootTx = $("#bootText"), crt = $("#heroCrt");
  function powerOn() {
    if (bootEl) bootEl.classList.add("off");
    if (crt) { crt.classList.add("poweron"); setTimeout(function () { crt.classList.add("flicker"); }, 1000); }
    var p = $(".monitor .pwr"); if (p) p.classList.add("on");
    leds.forEach(function (l) { l.classList.add("on"); });
  }
  if (reduce || !bootTx) { powerOn(); }
  else {
    var li = 0, ch = 0, out = "";
    (function type() {
      if (li >= lines.length) { setTimeout(powerOn, 420); return; }
      var L = lines[li][0];
      if (ch <= L.length) {
        bootTx.innerHTML = out + L.slice(0, ch) + '<span class="cur"></span>';
        ch += 2; setTimeout(type, 14);
      } else {
        out += L + "\n"; if (lines[li][1] >= 0 && leds[lines[li][1]]) { leds[lines[li][1]].classList.add("on"); click(900, 0.03); }
        li++; ch = 0; setTimeout(type, L ? 150 : 60);
      }
    })();
  }

  // ---------- hero tilt ----------
  var mon = $("#heroMon .bezel");
  if (mon && !reduce && window.matchMedia("(pointer:fine)").matches) {
    var hero = $(".hero");
    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      mon.style.transform = "rotateY(" + (x * 6).toFixed(2) + "deg) rotateX(" + (-y * 4).toFixed(2) + "deg)";
    });
    hero.addEventListener("pointerleave", function () { mon.style.transform = ""; });
  }

  // ---------- module deck ----------
  var keys = $$("#modKeys .dkey"), img = $("#modImg"), stat = $("#modStatic"), roT = $("#roTitle"), roB = $("#roBody");
  var copy = {};
  $$("#modCopy dd").forEach(function (d) { copy[d.dataset.k] = d.textContent; });
  var titles = {};
  $$("#modCopy dt").forEach(function (d) { titles[d.dataset.k] = d.textContent.toUpperCase(); });
  // preload the mid size so swaps are instant
  keys.forEach(function (k) { var i = new Image(); i.src = "assets/img/" + k.dataset.img + "-1280.webp"; });
  var auto = null, cur = 0;
  function show(i, user) {
    cur = i; var k = keys[i], n = k.dataset.img;
    keys.forEach(function (b, j) { b.setAttribute("aria-selected", j === i); b.tabIndex = j === i ? 0 : -1; });
    if (stat && !reduce) { stat.classList.remove("go"); void stat.offsetWidth; stat.classList.add("go"); }
    img.srcset = "assets/img/" + n + "-640.webp 640w, assets/img/" + n + "-1280.webp 1280w, assets/img/" + n + "-2400.webp 2400w";
    img.src = "assets/img/" + n + "-1280.webp";
    img.alt = (titles[n] || n) + " screen";
    roT.textContent = titles[n] || ""; roB.textContent = copy[n] || "";
    if (user) { stopAuto(); if (window.innerWidth < 900) k.scrollIntoView({ block: "nearest", inline: "center", behavior: reduce ? "auto" : "smooth" }); }
  }
  function stopAuto() { if (auto) { clearInterval(auto); auto = null; } }
  keys.forEach(function (k, i) {
    k.addEventListener("click", function () { show(i, true); });
    k.addEventListener("keydown", function (e) {
      var d = (e.key === "ArrowDown" || e.key === "ArrowRight") ? 1 : (e.key === "ArrowUp" || e.key === "ArrowLeft") ? -1 : 0;
      if (d) { e.preventDefault(); var n = (i + d + keys.length) % keys.length; show(n, true); keys[n].focus(); }
    });
  });
  if (keys.length) {
    show(0, false);
    var deck = $(".deck");
    if (!reduce && "IntersectionObserver" in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting && !auto && deck.dataset.touched !== "1") auto = setInterval(function () { show((cur + 1) % keys.length, false); }, 4200);
          if (!e.isIntersecting) stopAuto();
        });
      }, { threshold: 0.4 }).observe(deck);
      deck.addEventListener("pointerdown", function () { deck.dataset.touched = "1"; stopAuto(); });
    }
  }

  // ---------- AI comms typing ----------
  var comms = $("#comms");
  if (comms && !reduce && "IntersectionObserver" in window) {
    var rows = $$("p", comms), says = rows.map(function (p) { return p.querySelector(".say").textContent; });
    comms.classList.add("typing");
    var io = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return; io.disconnect();
      var r = 0;
      (function next() {
        if (r >= rows.length) return;
        var p = rows[r], s = p.querySelector(".say"), full = says[r], c = 0;
        s.textContent = ""; p.classList.add("shown");
        (function t() {
          s.textContent = full.slice(0, c); c++;
          if (c <= full.length) setTimeout(t, p.classList.contains("b") ? 22 : 38);
          else { r++; setTimeout(next, 650); }
        })();
      })();
    }, { threshold: 0.5 });
    io.observe(comms);
  }

  // ---------- reveal on scroll ----------
  if (!reduce && "IntersectionObserver" in window) {
    var els = $$(".sec-head, .card, .split-copy, .strip, .small-mon, .ov-copy, .ov-img, .comms, .dkkey, .faq details, .dl-plate, .video-mon");
    els.forEach(function (el) { el.classList.add("rv"); });
    var ro = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); ro.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    els.forEach(function (el) { ro.observe(el); });
  }
})();
