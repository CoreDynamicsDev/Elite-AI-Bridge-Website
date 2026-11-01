// Elite AI Bridge // SHIP'S LOG. Reads the newest releases from GitHub's public API and fills
// the section, so publishing a release updates the site by itself. The page already holds the
// current release as plain HTML, so it still reads right if GitHub can't be reached.
(function () {
  "use strict";
  var API = "https://api.github.com/repos/CoreDynamicsDev/Elite-AI-Bridge-Download/releases?per_page=6";
  var MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  var $ = function (id) { return document.getElementById(id); };
  if (!$("logItems") || !window.fetch) return;

  function esc(t) {
    return String(t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function plain(t) { return String(t).replace(/\*\*|`/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").trim(); }
  function day(iso) {
    var d = new Date(iso);
    return isNaN(d) ? "" : d.getUTCDate() + " " + MONTHS[d.getUTCMonth()] + " " + d.getUTCFullYear();
  }
  function version(r) { return String(r.tag_name || "").replace(/^v/i, ""); }
  function firstSentence(t) {
    var m = plain(t).match(/^(.+?[.!?])(\s|$)/);
    var s = m ? m[1] : plain(t);
    return s.length > 110 ? s.slice(0, 107).replace(/[\s,(]+\S*$/, "") + "..." : s;
  }

  // The "What's new" list of a release body: top-level "- " lines, split into a bold label
  // ("**MINING page:**") and the rest.
  function headlines(body) {
    var lines = String(body || "").split(/\r?\n/), on = false, out = [];
    for (var i = 0; i < lines.length; i++) {
      var L = lines[i];
      if (/^##\s/.test(L)) { on = /what'?s new|^##\s*new/i.test(L); continue; }
      if (!on) continue;
      var sub = L.match(/^\s+- \*\*(.+?)\*\*/);
      if (sub && out.length) { out[out.length - 1].subs.push(plain(sub[1]).replace(/:$/, "")); continue; }
      if (!/^- /.test(L)) continue;
      var m = L.match(/^- \*\*(.+?)\*\*\s*(.*)$/);
      if (m) out.push({ label: plain(m[1]).replace(/:$/, ""), text: m[2], subs: [] });
      else out.push({ label: "", text: L.slice(2), subs: [] });
    }
    return out;
  }

  fetch(API, { headers: { Accept: "application/vnd.github+json" } })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (list) {
      list = (list || []).filter(function (r) { return !r.draft && !r.prerelease; });
      if (!list.length) return;
      var latest = list[0], v = version(latest);
      var items = headlines(latest.body);
      if (v) {
        $("logVer").textContent = "ELITE AI BRIDGE " + v;
        var unit = $("unitTag"); if (unit) unit.textContent = "CORE DYNAMICS DEV // UNIT " + v;
      }
      $("logDate").textContent = day(latest.published_at);
      $("logLink").href = latest.html_url;
      if (items.length) {
        $("logItems").innerHTML = items.slice(0, 5).map(function (h) {
          var t = h.subs.length ? h.subs.join(", ") + "." : firstSentence(h.text);
          return "<li>" + (h.label ? "<b>" + esc(h.label) + "</b> " : "") + esc(t) + "</li>";
        }).join("");
      }
      var past = list.slice(1, 5).map(function (r) {
        var hs = headlines(r.body), labels = hs.filter(function (h) { return h.label; });
        var line = (labels.length ? labels.map(function (h) { return h.label; }) : hs.map(function (h) { return firstSentence(h.text); }))
          .slice(0, 3).join(", ");
        if (!line) line = firstSentence(String(r.body || "").replace(/^#.*$/gm, "").replace(/^-\s*/gm, ""));
        return '<li><a href="' + esc(r.html_url) + '" rel="noopener" data-track="release_notes_click" data-loc="ship_log_past">' +
          "<b>" + esc(version(r)) + "</b><span>" + esc(day(r.published_at)) + "</span><em>" + esc(line) + "</em></a></li>";
      });
      if (past.length) $("logList").innerHTML = past.join("");
    })
    .catch(function () { /* keep the release already written into the page */ });
})();
