// Elite AI Bridge // analytics consent + click events. Plain JS, no libraries.
// The Google tag in <head> starts with analytics_storage denied. This file shows
// the consent bar, saves the choice, and sends named click events (no personal data).
(function () {
  "use strict";
  var KEY = "eab-analytics";
  var g = function () { if (typeof window.gtag === "function") window.gtag.apply(null, arguments); };

  function getChoice() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function setChoice(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  // Remove Google Analytics cookies when a visitor withdraws consent.
  function clearGaCookies() {
    var host = location.hostname.replace(/^www\./, "");
    document.cookie.split(";").forEach(function (c) {
      var name = c.split("=")[0].trim();
      if (name === "_ga" || name.indexOf("_ga_") === 0) {
        ["", "; domain=" + host, "; domain=." + host].forEach(function (d) {
          document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/" + d;
        });
      }
    });
  }

  // ---------- styles for the consent bar and the footer link button ----------
  var css = ".consent{position:fixed;left:16px;right:16px;bottom:16px;z-index:90;max-width:760px;margin:0 auto;display:flex;align-items:center;gap:16px 20px;flex-wrap:wrap; padding:16px 18px;border-radius:var(--r);background:linear-gradient(180deg,#30352c,#1d211a);border:1px solid #454b3f;box-shadow:0 12px 30px rgba(0,0,0,.6)} .consent[hidden]{display:none} .consent p{flex:1 1 320px;margin:0;font-size:15px;line-height:1.45;color:#c9cdbe} .consent p b{display:block;font:500 15px/1.2 var(--head);letter-spacing:.12em;color:var(--phos);margin-bottom:4px} .consent-keys{display:flex;gap:12px;flex-wrap:wrap} .consent .key-sm{font-size:16px} .linkbtn{background:none;border:0;padding:0;font:inherit;color:var(--phos);text-decoration:underline;cursor:pointer} .linkbtn:hover{color:#b8ffc8}";
  var st = document.createElement("style");
  st.textContent = css;
  document.head.appendChild(st);

  // ---------- consent bar ----------
  var bar = null;
  function buildBar() {
    bar = document.createElement("div");
    bar.className = "consent";
    bar.setAttribute("role", "dialog");
    bar.setAttribute("aria-live", "polite");
    bar.setAttribute("aria-label", "Analytics cookies");
    bar.innerHTML =
      '<p><b>ANALYTICS // YOUR CALL</b>Can we use Google Analytics cookies to count visits and download clicks? ' +
      'No ads, no selling data. <a href="/privacy.html">Privacy notice</a></p>' +
      '<div class="consent-keys">' +
      '<button type="button" class="key key-cream key-sm" data-choice="granted">ALLOW</button>' +
      '<button type="button" class="key key-grey key-sm" data-choice="denied">NO THANKS</button>' +
      "</div>";
    bar.addEventListener("click", function (e) {
      var b = e.target.closest("[data-choice]");
      if (!b) return;
      var v = b.getAttribute("data-choice");
      setChoice(v);
      g("consent", "update", { analytics_storage: v });
      if (v === "denied") clearGaCookies();
      hideBar();
    });
    document.body.appendChild(bar);
  }
  function showBar() { if (!bar) buildBar(); bar.hidden = false; }
  function hideBar() { if (bar) bar.hidden = true; }

  var choice = getChoice();
  if (choice !== "granted" && choice !== "denied") showBar();

  Array.prototype.forEach.call(document.querySelectorAll("[data-consent-open]"), function (el) {
    el.addEventListener("click", function () {
      showBar();
      var first = bar.querySelector("button");
      if (first) first.focus();
    });
  });

  // ---------- click events ----------
  // Named events come from data-track on the link. Any other link that leaves the
  // site sends outbound_click with the destination domain and link.
  document.addEventListener("click", function (e) {
    var a = e.target.closest ? e.target.closest("a[href]") : null;
    if (!a) return;
    var name = a.getAttribute("data-track");
    var params = { link_location: a.getAttribute("data-loc") || "page", transport_type: "beacon" };
    var isWeb = a.protocol === "http:" || a.protocol === "https:";
    var outbound = isWeb && a.hostname !== location.hostname;
    if (name) {
      if (isWeb) params.link_url = a.href;
      params.outbound = outbound;
      g("event", name, params);
    } else if (outbound) {
      params.link_domain = a.hostname;
      params.link_url = a.href;
      g("event", "outbound_click", params);
    }
  }, true);
})();
