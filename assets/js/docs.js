(function () {
  "use strict";

  var ROOT = new URL("../../", document.currentScript.src).pathname;   // e.g. /Software-Dev-Interview-Prep/
  var NAV = window.NAV || [];
  var KEY_DONE = "sdip-studied", KEY_THEME = "sdip-theme";

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var href = function (p) { return ROOT + p; };
  var norm = function (p) { return p.replace(/index\.html$/, "").replace(/\.html$/, "").replace(/\/+$/, ""); };

  function load() { try { return new Set(JSON.parse(localStorage.getItem(KEY_DONE)) || []); } catch (e) { return new Set(); } }
  function save() { try { localStorage.setItem(KEY_DONE, JSON.stringify(Array.from(done))); } catch (e) {} }
  var done = load();

  /* ---------- data ---------- */
  var flat = [];
  NAV.forEach(function (s) { s.pages.forEach(function (p) { flat.push({ s: s, p: p }); }); });
  var ready = flat.filter(function (x) { return x.p.path; });
  var here = norm(location.pathname);
  var current = ready.filter(function (x) { return norm(href(x.p.path)) === here; })[0];
  var isHome = document.body.getAttribute("data-home") === "true";

  /* ---------- sidebar ---------- */
  function renderSidebar() {
    var h = '<div class="side-title"><span>Table of contents</span><span>' + NAV.length + " topics</span></div>";
    NAV.forEach(function (s) {
      var isOpen = current && current.s === s ? " open" : "";
      h += '<details class="grp"' + isOpen + '><summary><span class="em">' + s.emoji + '</span><span class="gt">' + esc(s.title) +
           '</span><span class="cnt">' + s.pages.length + "</span></summary><ul>";
      s.pages.forEach(function (p) {
        if (p.path) {
          var cls = (current && current.p === p ? " active" : "") + (done.has(p.path) ? " done" : "");
          h += '<li><a class="pg' + cls + '" href="' + href(p.path) + '">' + esc(p.title) + "</a></li>";
        } else {
          h += '<li><span class="pg soon" title="Planned">' + esc(p.title) + "</span></li>";
        }
      });
      h += "</ul></details>";
    });
    $("#sidebar").innerHTML = h;
    var act = $(".pg.active");
    if (act && act.scrollIntoView) act.scrollIntoView({ block: "center" });
  }

  /* ---------- home hub ---------- */
  function renderHub() {
    var total = ready.length, d = ready.filter(function (x) { return done.has(x.p.path); }).length;
    var pct = total ? Math.round(d / total * 100) : 0;
    var h = '<section class="hero"><h1>Software Dev Interview Prep</h1>' +
      '<p class="lede">Java, Spring Boot, Kafka, system design and DSA. Short notes with copy-paste examples. Pick a topic from the contents or press <kbd>Ctrl K</kbd> to search.</p>' +
      '<div class="prog"><div class="prog-text"><span>' + d + " of " + total + ' published topics studied</span><span>' + (flat.length - total) + ' planned</span></div>' +
      '<div class="bar"><i style="width:' + pct + '%"></i></div></div></section>';
    NAV.forEach(function (s) {
      var rd = s.pages.filter(function (p) { return p.path; }).length;
      h += '<section class="block" id="' + esc(s.id) + '"><div class="block-head"><h2><span class="em">' + s.emoji + "</span>" + esc(s.title) + "</h2><p>" + esc(s.desc) +
           '</p><span class="meta">' + rd + " published, " + (s.pages.length - rd) + " planned</span></div><ul class=\"block-list\">";
      s.pages.forEach(function (p) {
        if (p.path) {
          h += '<li><a href="' + href(p.path) + '"><b>' + esc(p.title) + "</b><span>" + esc(p.desc || "") + "</span></a>" +
               (done.has(p.path) ? '<i class="tick" title="Studied">✓</i>' : "") + "</li>";
        } else {
          h += '<li class="soon"><div><b>' + esc(p.title) + "</b><span>" + esc(p.desc || "") + '</span></div><i class="tag">Planned</i></li>';
        }
      });
      h += "</ul></section>";
    });
    $("#hub").innerHTML = h;
  }

  /* ---------- article extras ---------- */
  function slug(t) { return t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

  function renderArticle() {
    var art = $("#content");

    // breadcrumb
    var crumb = '<nav class="crumb" aria-label="Breadcrumb"><a href="' + ROOT + '">Home</a>' +
      (current ? ' <span>/</span> <a href="' + ROOT + "#" + esc(current.s.id) + '">' + esc(current.s.title) + '</a> <span>/</span> ' + esc(current.p.title) : "") + "</nav>";
    art.insertAdjacentHTML("beforebegin", crumb);

    // wrap tables, add copy buttons
    $$("table", art).forEach(function (t) {
      var w = document.createElement("div"); w.className = "table-wrap";
      t.parentNode.insertBefore(w, t); w.appendChild(t);
    });
    $$("pre", art).forEach(function (pre) {
      var box = pre.closest(".highlighter-rouge") || pre;
      if (box.querySelector(".copy")) return;
      box.classList.add("has-copy");
      var b = document.createElement("button");
      b.type = "button"; b.className = "copy"; b.textContent = "Copy";
      b.addEventListener("click", function () {
        var text = pre.innerText;
        var ok = function () { b.textContent = "Copied"; setTimeout(function () { b.textContent = "Copy"; }, 1500); };
        if (navigator.clipboard) navigator.clipboard.writeText(text).then(ok, function () {});
        else { var ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove(); ok(); }
      });
      box.appendChild(b);
    });

    // hide a hand-written "Table of Contents" section: the sidebar outline replaces it
    $$("h2", art).forEach(function (h) {
      if (/^table of contents$/i.test(h.textContent.trim())) {
        var n = h.nextElementSibling;
        if (n && (n.tagName === "UL" || n.tagName === "OL")) n.remove();
        h.remove();
      }
    });

    // on this page
    var heads = $$("h2, h3", art);
    heads.forEach(function (h) { if (!h.id) h.id = slug(h.textContent); });
    var toc = $("#toc");
    if (heads.length >= 3) {
      toc.innerHTML = '<div class="toc-title">On this page</div><ul>' + heads.map(function (h) {
        return '<li class="' + h.tagName.toLowerCase() + '"><a href="#' + h.id + '">' + esc(h.textContent) + "</a></li>";
      }).join("") + "</ul>";
      var links = $$("a", toc);
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) links.forEach(function (a) { a.classList.toggle("on", a.getAttribute("href") === "#" + e.target.id); });
        });
      }, { rootMargin: "-70px 0px -70% 0px" });
      heads.forEach(function (h) { io.observe(h); });
    } else { toc.style.display = "none"; }

    if (!current) return;

    // studied toggle
    var btn = document.createElement("button");
    btn.type = "button"; btn.className = "study";
    var paint = function () { btn.textContent = done.has(current.p.path) ? "Studied ✓  (click to undo)" : "Mark as studied"; btn.classList.toggle("on", done.has(current.p.path)); };
    paint();
    btn.addEventListener("click", function () {
      done.has(current.p.path) ? done.delete(current.p.path) : done.add(current.p.path);
      save(); paint();
      var a = $(".pg.active"); if (a) a.classList.toggle("done", done.has(current.p.path));
    });
    art.appendChild(btn);

    // prev / next (across published pages)
    var i = ready.indexOf(current), prev = ready[i - 1], next = ready[i + 1];
    var card = function (x, dir) {
      return x ? '<a class="pn ' + dir + '" href="' + href(x.p.path) + '"><small>' + (dir === "prev" ? "Previous" : "Next") + '</small><b>' + esc(x.p.title) + "</b><span>" + esc(x.s.title) + "</span></a>" : "<span></span>";
    };
    var sec = current.s.pages.filter(function (p) { return p.path; });
    art.insertAdjacentHTML("afterend",
      '<div class="pager">' + card(prev, "prev") + card(next, "next") + "</div>" +
      '<p class="foot-note">' + esc(current.s.title) + ": page " + (sec.indexOf(current.p) + 1) + " of " + sec.length + " published</p>");
  }

  /* ---------- search palette ---------- */
  function buildPalette() {
    var el = document.createElement("div");
    el.className = "pal"; el.hidden = true;
    el.innerHTML = '<div class="pal-box" role="dialog" aria-label="Search topics"><input id="palQ" type="text" placeholder="Search topics..." autocomplete="off" aria-label="Search topics">' +
      '<ul id="palList"></ul><div class="pal-foot">Up and down to move, Enter to open, Esc to close</div></div>';
    document.body.appendChild(el);
    var q = $("#palQ", el), list = $("#palList", el), sel = 0, items = [];

    function draw() {
      var term = q.value.trim().toLowerCase();
      items = flat.filter(function (x) {
        return !term || (x.p.title + " " + (x.p.desc || "") + " " + x.s.title).toLowerCase().indexOf(term) > -1;
      }).slice(0, 30);
      if (sel >= items.length) sel = 0;
      list.innerHTML = items.length ? items.map(function (x, i) {
        return '<li class="' + (i === sel ? "sel" : "") + (x.p.path ? "" : " soon") + '" data-i="' + i + '"><span class="em">' + x.s.emoji + "</span><div><b>" + esc(x.p.title) + "</b><small>" + esc(x.s.title) + "</small></div>" +
               (x.p.path ? "" : '<i class="tag">Planned</i>') + "</li>";
      }).join("") : '<li class="none">No topics match.</li>';
    }
    function go(i) { var x = items[i]; if (x && x.p.path) location.href = href(x.p.path); }
    function open() { el.hidden = false; q.value = ""; sel = 0; draw(); q.focus(); }
    function close() { el.hidden = true; }

    q.addEventListener("input", function () { sel = 0; draw(); });
    q.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); sel = Math.min(sel + 1, items.length - 1); draw(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); sel = Math.max(sel - 1, 0); draw(); }
      else if (e.key === "Enter") { go(sel); }
    });
    list.addEventListener("click", function (e) { var li = e.target.closest("li[data-i]"); if (li) go(+li.getAttribute("data-i")); });
    el.addEventListener("mousedown", function (e) { if (e.target === el) close(); });
    document.addEventListener("keydown", function (e) {
      var typing = /input|textarea/i.test(document.activeElement.tagName);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); el.hidden ? open() : close(); }
      else if (e.key === "/" && !typing) { e.preventDefault(); open(); }
      else if (e.key === "Escape" && !el.hidden) close();
    });
    $("#searchBtn").addEventListener("click", open);
  }

  /* ---------- chrome ---------- */
  function setupChrome() {
    $("#themeBtn").addEventListener("click", function () {
      var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem(KEY_THEME, next); } catch (e) {}
    });
    var toggle = function (on) { document.body.classList.toggle("menu-open", on); };
    $("#menuBtn").addEventListener("click", function () { toggle(!document.body.classList.contains("menu-open")); });
    $("#scrim").addEventListener("click", function () { toggle(false); });
  }

  renderSidebar();
  if (isHome) { renderHub(); $("#toc").style.display = "none"; } else { renderArticle(); }
  buildPalette();
  setupChrome();
})();
