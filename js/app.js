/* ============================================
   رحلة في أساسيات الشبكات — Main Application
   SPA Router + Flexible Section Renderer
   ============================================ */

(function () {
  'use strict';

  // ============================================
  // 1. State Management
  // ============================================
  const State = {
    progress: {},
    sidebarOpen: false,

    load() {
      try {
        const saved = localStorage.getItem('network_journey_progress');
        if (saved) this.progress = JSON.parse(saved);
      } catch (e) { this.progress = {}; }
    },

    save() {
      try {
        localStorage.setItem('network_journey_progress', JSON.stringify(this.progress));
      } catch (e) { /* ignore */ }
    },

    isLessonCompleted(lessonId) { return !!this.progress[lessonId]; },

    toggleLesson(lessonId) {
      if (this.progress[lessonId]) delete this.progress[lessonId];
      else this.progress[lessonId] = Date.now();
      this.save();
    },

    getStationProgress(station) {
      const completed = station.lessons.filter(l => this.isLessonCompleted(l.id)).length;
      return { completed, total: station.lessons.length, percent: station.lessons.length ? Math.round((completed / station.lessons.length) * 100) : 0 };
    },

    getTotalProgress() {
      const allLessons = APP_DATA.stations.flatMap(s => s.lessons);
      const completed = allLessons.filter(l => this.isLessonCompleted(l.id)).length;
      return { completed, total: allLessons.length, percent: allLessons.length ? Math.round((completed / allLessons.length) * 100) : 0 };
    },

    getCompletedStations() {
      return APP_DATA.stations.filter(s => {
        const p = this.getStationProgress(s);
        return p.completed === p.total && p.total > 0;
      }).length;
    }
  };

  // ============================================
  // 2. SVG Icons
  // ============================================
  const Icons = {
    globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
    arrowRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>',
    arrowLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    chevronLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
    map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>',
    skipForward: '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" stroke-width="2"/></svg>',
    restart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>',
    trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>',
    barChart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>',
    zap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
    rocket: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
    alertTriangle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    lightbulb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>',
    code: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
    cpu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>',
    server: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    wifi: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>',
    share2: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>',
    quote: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/></svg>',
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
    list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
    terminal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>',
    compare: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
    steps: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>'
  };

  // Section type icon map
  const sectionIcons = {
    text: Icons.eye,
    list: Icons.list,
    ordered: Icons.list,
    steps: Icons.steps,
    table: Icons.grid,
    tip: Icons.lightbulb,
    warning: Icons.alertTriangle,
    info: Icons.info,
    code: Icons.code,
    grid: Icons.grid,
    comparison: Icons.compare,
    quote: Icons.quote
  };

  const sectionColors = {
    text: 'accent', list: 'accent', ordered: 'accent',
    steps: 'purple', table: 'accent', grid: 'accent',
    tip: 'green', warning: 'orange', info: 'blue',
    code: 'gray', comparison: 'purple', quote: 'cyan'
  };

  // ============================================
  // 3. Helpers
  // ============================================
  function $(sel) { return document.querySelector(sel); }
  function $$(sel) { return document.querySelectorAll(sel); }

  function getNextLesson(stationId, lessonId) {
    const station = APP_DATA.stations.find(s => s.id === stationId);
    if (!station) return null;
    const idx = station.lessons.findIndex(l => l.id === lessonId);
    if (idx < station.lessons.length - 1) return { stationId, lessonId: station.lessons[idx + 1].id };
    const next = APP_DATA.stations.find(s => s.id === stationId + 1);
    if (next && next.lessons.length) return { stationId: next.id, lessonId: next.lessons[0].id };
    return null;
  }

  function showToast(msg, type = 'success') {
    const old = $('.toast'); if (old) old.remove();
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `${Icons.check}<span>${msg}</span>`;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add('visible'));
    setTimeout(() => { t.classList.remove('visible'); setTimeout(() => t.remove(), 300); }, 2500);
  }

  // ============================================
  // 4. Section Renderer (Flexible)
  // ============================================
  function renderSection(section, index) {
    const delay = Math.min(index + 1, 6);
    const baseClass = `lesson-section-card card animate-fade-in-up stagger-${delay}`;

    switch (section.type) {
      case 'text':
        return `<div class="${baseClass}" style="opacity:0">
          ${section.title ? `<div class="section-header"><div class="section-icon accent">${sectionIcons.text}</div><h3>${section.title}</h3></div>` : ''}
          <p class="section-text">${section.content}</p>
        </div>`;

      case 'list':
        return `<div class="${baseClass}" style="opacity:0">
          ${section.title ? `<div class="section-header"><div class="section-icon accent">${sectionIcons.list}</div><h3>${section.title}</h3></div>` : ''}
          <ul class="section-list">${section.items.map(i => `<li>${i}</li>`).join('')}</ul>
        </div>`;

      case 'ordered':
        return `<div class="${baseClass}" style="opacity:0">
          ${section.title ? `<div class="section-header"><div class="section-icon accent">${sectionIcons.ordered}</div><h3>${section.title}</h3></div>` : ''}
          <ol class="section-ordered">${section.items.map(i => `<li>${i}</li>`).join('')}</ol>
        </div>`;

      case 'steps':
        return `<div class="${baseClass}" style="opacity:0">
          ${section.title ? `<div class="section-header"><div class="section-icon purple">${sectionIcons.steps}</div><h3>${section.title}</h3></div>` : ''}
          <div class="section-steps">${section.items.map((s, i) => `
            <div class="step-item">
              <div class="step-num">${i + 1}</div>
              <div class="step-body">
                <div class="step-title">${s.step}</div>
                <div class="step-detail">${s.detail}</div>
              </div>
            </div>`).join('')}
          </div>
        </div>`;

      case 'table':
        return `<div class="${baseClass} table-card" style="opacity:0">
          ${section.title ? `<div class="section-header"><div class="section-icon accent">${sectionIcons.table}</div><h3>${section.title}</h3></div>` : ''}
          <div class="table-wrap">
            <table class="section-table">
              <thead><tr>${section.headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
              <tbody>${section.rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
            </table>
          </div>
        </div>`;

      case 'grid':
        return `<div class="${baseClass}" style="opacity:0">
          ${section.title ? `<div class="section-header"><div class="section-icon accent">${sectionIcons.grid}</div><h3>${section.title}</h3></div>` : ''}
          <div class="section-grid">${section.items.map(g => `
            <div class="grid-item">
              <div class="grid-icon">${g.icon}</div>
              <h4>${g.title}</h4>
              <p>${g.desc}</p>
            </div>`).join('')}
          </div>
        </div>`;

      case 'comparison':
        return `<div class="${baseClass}" style="opacity:0">
          ${section.title ? `<div class="section-header"><div class="section-icon purple">${sectionIcons.comparison}</div><h3>${section.title}</h3></div>` : ''}
          <div class="comparison-grid">
            <div class="comparison-col col-a">
              <div class="comparison-label">${section.colA}</div>
              <ul>${section.itemsA.map(i => `<li>${i}</li>`).join('')}</ul>
            </div>
            <div class="comparison-col col-b">
              <div class="comparison-label">${section.colB}</div>
              <ul>${section.itemsB.map(i => `<li>${i}</li>`).join('')}</ul>
            </div>
          </div>
        </div>`;

      case 'code':
        return `<div class="${baseClass} code-card" style="opacity:0">
          ${section.title ? `<div class="section-header"><div class="section-icon gray">${sectionIcons.code}</div><h3>${section.title}</h3></div>` : ''}
          <div class="code-block"><pre><code>${section.content}</code></pre></div>
        </div>`;

      case 'tip':
        return `<div class="${baseClass} callout callout-tip" style="opacity:0">
          <div class="callout-icon">${Icons.lightbulb}</div>
          <div class="callout-content"><strong>نصيحة:</strong> ${section.content}</div>
        </div>`;

      case 'warning':
        return `<div class="${baseClass} callout callout-warning" style="opacity:0">
          <div class="callout-icon">${Icons.alertTriangle}</div>
          <div class="callout-content"><strong>تنبيه:</strong> ${section.content}</div>
        </div>`;

      case 'info':
        return `<div class="${baseClass} callout callout-info" style="opacity:0">
          <div class="callout-icon">${Icons.info}</div>
          <div class="callout-content">${section.content}</div>
        </div>`;

      case 'quote':
        return `<div class="${baseClass} quote-card" style="opacity:0">
          <div class="quote-mark">"</div>
          <p class="quote-text">${section.content}</p>
        </div>`;

      default:
        return `<div class="${baseClass}" style="opacity:0"><p>${section.content || ''}</p></div>`;
    }
  }

  // ============================================
  // 5. Components
  // ============================================
  function renderHeader() {
    const total = State.getTotalProgress();
    return `
      <header class="app-header" id="app-header">
        <a class="header-logo" href="#/" id="header-logo">
          ${Icons.globe}
          <span>رحلة الشبكات</span>
        </a>
        <nav class="header-nav">
          <button class="header-nav-btn" data-nav="journey" onclick="location.hash='#/journey'">
            ${Icons.map}<span>الرحلة</span>
          </button>
          <button class="header-nav-btn" data-nav="simulator" onclick="location.hash='#/simulator'">
            ${Icons.zap}<span>المحاكي</span>
          </button>
          <button class="header-nav-btn" data-nav="lab" onclick="location.hash='#/lab'">
            ${Icons.cpu}<span>المعمل</span>
          </button>
          <button class="header-nav-btn" data-nav="osi" onclick="location.hash='#/osi'">
            ${Icons.server}<span>الطبقات</span>
          </button>
          <button class="header-nav-btn" data-nav="terminal" onclick="location.hash='#/terminal'">
            ${Icons.code}<span>التيرمنال</span>
          </button>
          <button class="header-nav-btn" data-nav="progress" onclick="location.hash='#/progress'">
            ${Icons.barChart}<span>${total.percent}%</span>
          </button>
        </nav>
      </header>`;
  }

  function renderFooter() {
    return `
      <footer class="app-footer">
        <p class="footer-credit">صمم بواسطة عبدالعزيز أحمد <span class="footer-heart">❤</span></p>
        <p class="footer-dua">صدقة لوالدي رحمه الله عليه، دعواتكم لوالدي 🤲</p>
      </footer>`;
  }

  function renderSidebar(activeStationId, activeLessonId) {
    const total = State.getTotalProgress();
    let html = `<aside class="app-sidebar" id="app-sidebar">
      <div class="sidebar-header"><h3>محطات الرحلة</h3></div>
      <div class="sidebar-content">`;

    APP_DATA.stations.forEach(station => {
      const isOpen = station.id === activeStationId;
      html += `<div class="sidebar-station ${isOpen ? 'open' : ''}" data-station="${station.id}">
        <div class="sidebar-station-header" onclick="App.toggleSidebarStation(${station.id})">
          <div class="station-name"><span class="station-num">${station.id}</span>${station.name}</div>
          <span class="chevron">${Icons.chevronLeft}</span>
        </div>
        <div class="sidebar-lessons">`;
      station.lessons.forEach(lesson => {
        const isActive = lesson.id === activeLessonId;
        const isDone = State.isLessonCompleted(lesson.id);
        html += `<div class="sidebar-lesson ${isActive ? 'active' : ''} ${isDone ? 'completed' : ''}"
          onclick="location.hash='#/lesson/${station.id}/${lesson.id}'" data-lesson="${lesson.id}">
          <span class="lesson-check">${isDone ? '✓' : ''}</span><span>${lesson.title}</span>
        </div>`;
      });
      html += `</div></div>`;
    });

    html += `</div>
      <div class="sidebar-progress">
        <div class="sidebar-progress-label"><span>التقدم الكلي</span><span>${total.percent}%</span></div>
        <div class="sidebar-progress-bar"><div class="sidebar-progress-fill" style="width:${total.percent}%"></div></div>
      </div></aside>`;
    return html;
  }

  // ============================================
  // 6. Particle Animation
  // ============================================
  class ParticleNetwork {
    constructor(canvas) {
      this.canvas = canvas; this.ctx = canvas.getContext('2d');
      this.particles = []; this.numParticles = 50; this.maxDist = 150; this.running = true;
      this.resize(); this.init(); this.animate();
      window.addEventListener('resize', () => this.resize());
    }
    resize() { const r = this.canvas.parentElement.getBoundingClientRect(); this.canvas.width = r.width; this.canvas.height = r.height; }
    init() { this.particles = []; for (let i = 0; i < this.numParticles; i++) this.particles.push({ x: Math.random()*this.canvas.width, y: Math.random()*this.canvas.height, vx: (Math.random()-0.5)*0.5, vy: (Math.random()-0.5)*0.5, r: Math.random()*2+1 }); }
    animate() {
      if (!this.running) return;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;
        this.ctx.beginPath(); this.ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        this.ctx.fillStyle = 'rgba(10,132,255,0.5)'; this.ctx.fill();
      });
      for (let i = 0; i < this.particles.length; i++) for (let j = i+1; j < this.particles.length; j++) {
        const dx = this.particles[i].x-this.particles[j].x, dy = this.particles[i].y-this.particles[j].y;
        const dist = Math.sqrt(dx*dx+dy*dy);
        if (dist < this.maxDist) { this.ctx.beginPath(); this.ctx.moveTo(this.particles[i].x, this.particles[i].y); this.ctx.lineTo(this.particles[j].x, this.particles[j].y); this.ctx.strokeStyle = `rgba(10,132,255,${0.15*(1-dist/this.maxDist)})`; this.ctx.lineWidth = 1; this.ctx.stroke(); }
      }
      requestAnimationFrame(() => this.animate());
    }
    destroy() { this.running = false; }
  }
  let particleInstance = null;

  // ============================================
  // 7. Page Renderers
  // ============================================

  // --- Landing ---
  function renderLanding() {
    const totalLessons = APP_DATA.stations.reduce((sum, s) => sum + s.lessons.length, 0);
    const stationsHtml = APP_DATA.stations.map(s => {
      const sp = State.getStationProgress(s);
      return `<div class="station-preview-item ${sp.percent === 100 ? 'completed' : ''}" onclick="location.hash='#/station/${s.id}'">
        <div class="station-preview-circle">${s.id}</div>
        <span class="station-preview-name">${s.name}</span>
      </div>`;
    }).join('');

    return `<div class="landing-page">
      <section class="hero-section">
        <canvas class="hero-canvas" id="hero-canvas"></canvas>
        <div class="hero-content animate-fade-in">
          <div class="hero-badge">${Icons.rocket}<span>${totalLessons} درس • ${APP_DATA.stations.length} وحدات</span></div>
          <h1 class="hero-title">رحلة في أساسيات<br>الشبكات</h1>
          <p class="hero-subtitle">افهم الشبكات من الصفر — بأسلوب بسيط وتجربة تفاعلية ممتعة</p>
          <div class="hero-cta">
            <button class="btn btn-primary btn-lg" onclick="location.hash='#/journey'">${Icons.arrowLeft} ابدأ الرحلة</button>
            <button class="btn btn-secondary btn-lg" onclick="location.hash='#/simulator'">${Icons.zap} جرّب المحاكي</button>
          </div>
        </div>
      </section>
      <section class="stations-preview">
        <div class="section-title"><h2>محطات الرحلة</h2><p>${APP_DATA.stations.length} وحدات تأخذك خطوة بخطوة</p></div>
        <div class="stations-scroll">${stationsHtml}</div>
      </section>
      ${renderFooter()}
    </div>`;
  }

  // --- Journey ---
  function renderJourney() {
    const stationsHtml = APP_DATA.stations.map((s, i) => {
      const sp = State.getStationProgress(s);
      const cls = sp.percent === 100 ? 'completed' : sp.completed > 0 ? 'in-progress' : '';
      return `<div class="journey-station ${cls} animate-fade-in-up stagger-${Math.min(i+1,6)}" style="opacity:0">
        <div class="journey-node" onclick="location.hash='#/station/${s.id}'">${sp.percent===100?'✓':s.id}</div>
        <div class="journey-station-card" onclick="location.hash='#/station/${s.id}'">
          <div class="card card-interactive">
            <h3>${s.name}</h3>
            <p>${s.description}</p>
            <div class="journey-station-meta"><span>${Icons.book} ${s.lessons.length} دروس</span><span>${sp.percent}%</span></div>
            <div class="progress-bar" style="margin-top:12px"><div class="progress-fill" style="width:${sp.percent}%"></div></div>
          </div>
        </div>
      </div>`;
    }).join('');

    return `<div class="journey-page">
      <div class="journey-header animate-fade-in"><h1>خريطة الرحلة</h1><p>تابع تقدمك عبر ${APP_DATA.stations.length} وحدات</p></div>
      <div class="journey-timeline">${stationsHtml}</div>
      ${renderFooter()}
    </div>`;
  }

  // --- Station ---
  function renderStation(stationId) {
    const station = APP_DATA.stations.find(s => s.id === stationId);
    if (!station) return '<div class="station-page"><h1>الوحدة غير موجودة</h1></div>';
    const sp = State.getStationProgress(station);

    const lessonsHtml = station.lessons.map((lesson, i) => {
      const done = State.isLessonCompleted(lesson.id);
      return `<div class="lesson-card card card-interactive ${done?'completed':''} animate-fade-in-up stagger-${Math.min(i+1,6)}"
        style="opacity:0" onclick="location.hash='#/lesson/${stationId}/${lesson.id}'">
        <div class="lesson-card-num">${done?'✓':lesson.id}</div>
        <div class="lesson-card-content"><h3>${lesson.title}</h3></div>
        <div class="lesson-card-arrow">${Icons.arrowRight}</div>
      </div>`;
    }).join('');

    return `${renderSidebar(stationId, null)}
      <div class="station-page app-main with-sidebar">
        <div class="station-header animate-fade-in">
          <button class="btn-back" onclick="location.hash='#/journey'">${Icons.arrowRight} العودة للخريطة</button>
          <div class="badge badge-accent" style="margin-bottom:12px">الوحدة ${stationId}</div>
          <h1>${station.name}</h1>
          <p>${station.description}</p>
          <div class="progress-bar" style="margin-top:16px"><div class="progress-fill" style="width:${sp.percent}%"></div></div>
          <div style="display:flex;justify-content:space-between;margin-top:8px;font-size:var(--fs-xs);color:var(--text-tertiary)">
            <span>${sp.completed} من ${sp.total} مكتمل</span><span>${sp.percent}%</span>
          </div>
        </div>
        <div class="station-lessons-grid">${lessonsHtml}</div>
      </div>`;
  }

  // --- Lesson Visuals Generator (Dynamic Premium Blue Icons) ---
  function getLessonVisual(text, stationId, lessonId = 0) {
    const commonImgStyle = 'width: 100%; height: 100%; object-fit: contain; border-radius: var(--radius-xl); box-shadow: 0 4px 20px rgba(0,0,0,0.5); background: white;';
    const keywords = text.toLowerCase();
    
    // Map of specific unique Tabler icons for all 37 lessons based on keywords
    const iconMap = [
      { keys: ['مقدمة'], icon: 'device-desktop' },
      { keys: ['طوبولوجيا'], icon: 'hierarchy' },
      { keys: ['wan', 'lan', 'انترنت'], icon: 'world' },
      { keys: ['خادم', 'server'], icon: 'server' },
      { keys: ['أسلاك', 'cables'], icon: 'plug' },
      { keys: ['لاسلكي', 'wi-fi'], icon: 'wifi' },
      { keys: ['راوتر', 'router', 'أجهزة الشبكة'], icon: 'router' },
      { keys: ['بين hub'], icon: 'switch-horizontal' },
      { keys: ['mac'], icon: 'fingerprint' },
      { keys: ['منافذ', 'ports'], icon: 'id' },
      { keys: ['قناع', 'subnetting'], icon: 'network' },
      { keys: ['تصادم', 'بث', 'broadcast'], icon: 'building-broadcast-tower' },
      { keys: ['osi'], icon: 'layers-linked' },
      { keys: ['تغليف'], icon: 'box-model' },
      { keys: ['بروتوكولات'], icon: 'file-code' },
      { keys: ['تبديل', 'layer 2'], icon: 'table' },
      { keys: ['توجيه', 'layer 3'], icon: 'route' },
      { keys: ['arp'], icon: 'address-book' },
      { keys: ['tcp وudp'], icon: 'exchange' },
      { keys: ['هاندشيك'], icon: 'handshake' },
      { keys: ['إرسال', 'unicast'], icon: 'broadcast' },
      { keys: ['ipv4', 'ipv6'], icon: 'versions' },
      { keys: ['طلب', 'request'], icon: 'arrow-right-bar' },
      { keys: ['dhcp'], icon: 'settings-automation' },
      { keys: ['dns'], icon: 'book' },
      { keys: ['nat'], icon: 'arrows-split' },
      { keys: ['vlan'], icon: 'vector-triangle' },
      { keys: ['dmz'], icon: 'shield-lock' },
      { keys: ['ناري', 'firewall'], icon: 'wall' },
      { keys: ['vpn', 'افتراضية'], icon: 'lock-network' },
      { keys: ['تشخيص'], icon: 'terminal' },
      { keys: ['packet tracer'], icon: 'tool' },
      { keys: ['عملاء'], icon: 'users' },
      { keys: ['برمجة'], icon: 'code' },
      { keys: ['أمن', 'سيبراني'], icon: 'shield-check' },
      { keys: ['مالي', 'استراتيجي'], icon: 'chart-bar' },
      { keys: ['خاتمة'], icon: 'flag' }
    ];

    let finalIcon = 'network'; // Default icon
    
    // Find matching icon
    for (const item of iconMap) {
      if (item.keys.some(k => keywords.includes(k))) {
        finalIcon = item.icon;
        break;
      }
    }
    
    // Fallback to specific icons based on station ID if no keyword matches perfectly
    if (finalIcon === 'network') {
      const stationIcons = {
        1: 'world', 2: 'router', 3: 'layers-linked', 4: 'exchange', 
        5: 'shield-lock', 6: 'terminal'
      };
      finalIcon = stationIcons[stationId] || 'network';
    }

    // Return a premium, blue-themed graphical container with the specific icon centered
    return `<div style="position: relative; width: 100%; height: 100%; background: linear-gradient(135deg, #0A84FF 0%, #004488 100%); border-radius: var(--radius-xl); display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 30px rgba(10, 132, 255, 0.3);">
      <img src="https://api.iconify.design/tabler/${finalIcon}.svg?color=white" alt="تصميم توضيحي" style="width: 40%; height: 40%; object-fit: contain; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));" loading="lazy" />
    </div>`;
  }

  // --- Lesson (Flexible Sections) ---
  function renderLesson(stationId, lessonId) {
    const station = APP_DATA.stations.find(s => s.id === stationId);
    if (!station) return '<div class="lesson-page"><h1>الدرس غير موجود</h1></div>';
    const lesson = station.lessons.find(l => l.id === lessonId);
    if (!lesson) return '<div class="lesson-page"><h1>الدرس غير موجود</h1></div>';

    const isDone = State.isLessonCompleted(lessonId);
    const next = getNextLesson(stationId, lessonId);

    const sectionsHtml = lesson.sections.map((sec, i) => {
      // Create a rich search text from title and content to ensure high matching
      const searchText = (sec.title || '') + ' ' + (lesson.title || '') + ' ' + (sec.content ? sec.content.substring(0, 100) : '');
      const visualHtml = getLessonVisual(searchText, stationId, lessonId * 10 + i);
      const safeVisual = visualHtml.replace(/"/g, '&quot;');
      
      return `<div class="lesson-section-wrapper" data-index="${i}" data-visual="${safeVisual}">
        ${renderSection(sec, i)}
      </div>`;
    }).join('');

    const defaultVisual = getLessonVisual(lesson.title, stationId, lessonId);

    return `${renderSidebar(stationId, lessonId)}
      <div class="lesson-page-wrapper with-visuals app-main with-sidebar">
        <div class="lesson-page">
          <div class="lesson-header animate-fade-in">
            <button class="btn-back" onclick="location.hash='#/station/${stationId}'">${Icons.arrowRight} العودة للوحدة</button>
            <div class="lesson-num-badge">الوحدة ${stationId} • الدرس ${lesson.id}</div>
            <h1>${lesson.title}</h1>
          </div>
          <div class="lesson-cards">${sectionsHtml}</div>
        </div>
        
        <div class="lesson-visuals-container animate-fade-in">
          <div class="lesson-visuals-inner" id="lesson-visual-inner">
            ${defaultVisual}
          </div>
        </div>
      </div>
      
      <div class="lesson-bottom-bar with-sidebar" id="lesson-bottom-bar">
        <div class="lesson-bottom-complete ${isDone?'completed':''}" id="lesson-complete-btn" onclick="App.toggleLessonComplete(${lessonId})">
          <span class="check-box">${isDone?'✓':''}</span><span>${isDone?'مكتمل':'إكمال الدرس'}</span>
        </div>
        ${next ? `<button class="btn btn-primary" onclick="location.hash='#/lesson/${next.stationId}/${next.lessonId}'">${Icons.arrowLeft} الدرس التالي</button>` :
          `<button class="btn btn-primary" onclick="location.hash='#/progress'">${Icons.barChart} عرض التقدم</button>`}
      </div>
      <button class="sidebar-toggle" id="sidebar-toggle" onclick="App.toggleMobileSidebar()">${Icons.menu}</button>
      <div class="sidebar-overlay" id="sidebar-overlay" onclick="App.toggleMobileSidebar()"></div>`;
  }

  // --- Simulator ---
  function renderSimulator() {
    const scenarioButtons = Object.values(SIMULATOR_SCENARIOS).map((sc, i) => `
      <button class="scenario-btn ${i===0?'active':''}" data-scenario="${sc.id}" onclick="App.selectScenario('${sc.id}')">${sc.nameAr}</button>`).join('');

    return `<div class="simulator-page">
      <div class="simulator-header animate-fade-in">
        <button class="btn-back" onclick="history.back()">${Icons.arrowRight} رجوع</button>
        <h1>المحاكي التفاعلي</h1><p>شاهد كيف تتحرك البيانات بين الأجهزة</p>
        <div class="simulator-desc card" style="margin-top:20px; padding:15px; border-left:4px solid var(--accent); text-align:right;">
          <h3 style="margin-bottom:8px; color:var(--accent); font-size:16px;">نبذة عن المحاكي</h3>
          <p id="sim-main-desc" style="font-size:14px; color:var(--text-secondary); line-height:1.6; margin:0;">${SIMULATOR_SCENARIOS[Object.keys(SIMULATOR_SCENARIOS)[0]].description}</p>
        </div>
      </div>
      <div class="simulator-scenarios animate-fade-in-up stagger-1" style="opacity:0" id="sim-scenarios">${scenarioButtons}</div>
      <div class="simulator-stage animate-fade-in-up stagger-2" style="opacity:0" id="sim-stage">
        <svg class="simulator-svg" id="sim-svg"></svg>
      </div>
      <div class="simulator-controls animate-fade-in-up stagger-3" style="opacity:0">
        <button class="sim-control-btn" id="sim-restart" onclick="App.simRestart()" title="إعادة">${Icons.restart}</button>
        <button class="sim-control-btn" id="sim-play" onclick="App.simPlayPause()" title="تشغيل">${Icons.play}</button>
        <button class="sim-control-btn" id="sim-step" onclick="App.simStep()" title="خطوة تالية">${Icons.skipForward}</button>
      </div>
      <div class="card simulator-info animate-fade-in-up stagger-4" style="opacity:0" id="sim-info">
        <div class="sim-step-indicator" id="sim-dots"></div>
        <div class="sim-info-label">الطبقة</div><div class="sim-info-value" id="sim-layer">—</div>
        <div class="sim-info-label">الحزمة</div><div class="sim-info-value" id="sim-label">—</div>
        <div class="sim-info-detail" id="sim-detail">اختر سيناريو واضغط ▶ للبدء</div>
      </div>
      ${renderFooter()}
    </div>`;
  }

  // --- Progress ---
  function renderProgress() {
    const total = State.getTotalProgress();
    const completedStations = State.getCompletedStations();
    const circumference = 2 * Math.PI * 54;
    const offset = circumference - (total.percent / 100) * circumference;

    const stationsHtml = APP_DATA.stations.map((s, i) => {
      const sp = State.getStationProgress(s);
      return `<div class="progress-station-card card animate-fade-in-up stagger-${Math.min(i+1,6)}" style="opacity:0">
        <div class="progress-station-header">
          <h3><span class="badge ${sp.percent===100?'badge-success':'badge-accent'}">${s.id}</span> ${s.name}</h3>
          <span class="badge ${sp.percent===100?'badge-success':'badge-accent'}">${sp.percent}%</span>
        </div>
        <div class="progress-station-bar progress-bar"><div class="progress-fill" style="width:${sp.percent}%"></div></div>
        <div class="progress-station-meta"><span>${sp.completed} من ${sp.total}</span>${sp.percent===100?'<span style="color:var(--success)">✓</span>':''}</div>
      </div>`;
    }).join('');

    const achievements = [
      { icon:'🚀', name:'بداية الرحلة', desc:'أكمل الدرس الأول', unlocked: Object.keys(State.progress).length > 0 },
      { icon:'📡', name:'عارف الأساسيات', desc:'أكمل الوحدة 1', unlocked: APP_DATA.stations[0] ? State.getStationProgress(APP_DATA.stations[0]).percent===100 : false },
      { icon:'🔌', name:'خبير الأجهزة', desc:'أكمل الوحدة 2', unlocked: APP_DATA.stations[1] ? State.getStationProgress(APP_DATA.stations[1]).percent===100 : false },
      { icon:'🧩', name:'ماهر العنونة', desc:'أكمل الوحدة 3', unlocked: APP_DATA.stations[2] ? State.getStationProgress(APP_DATA.stations[2]).percent===100 : false },
      { icon:'🔗', name:'فاهم البروتوكولات', desc:'أكمل الوحدة 4', unlocked: APP_DATA.stations[3] ? State.getStationProgress(APP_DATA.stations[3]).percent===100 : false },
      { icon:'⚙️', name:'خبير النماذج', desc:'أكمل الوحدة 6', unlocked: APP_DATA.stations[5] ? State.getStationProgress(APP_DATA.stations[5]).percent===100 : false },
      { icon:'🛡️', name:'حارس الشبكة', desc:'أكمل وحدة الأمن', unlocked: APP_DATA.stations[8] ? State.getStationProgress(APP_DATA.stations[8]).percent===100 : false },
      { icon:'🏆', name:'خاتم الرحلة', desc:'أكمل كل الدروس', unlocked: total.percent===100 }
    ];

    return `<div class="progress-page">
      <div class="progress-page-header animate-fade-in"><h1>تقدّمك في الرحلة</h1></div>
      <div class="progress-overview card animate-fade-in-up stagger-1" style="opacity:0">
        <div class="progress-overview-ring progress-ring">
          <svg width="140" height="140"><circle class="ring-bg" cx="70" cy="70" r="54" fill="none" stroke-width="10"/><circle class="ring-fill" cx="70" cy="70" r="54" fill="none" stroke-width="10" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/></svg>
          <span class="ring-text">${total.percent}%</span>
        </div>
        <div class="progress-overview-stats">
          <div class="progress-stat"><div class="progress-stat-icon blue">${Icons.book}</div><div class="progress-stat-text"><h4>${total.completed} / ${total.total}</h4><p>درس مكتمل</p></div></div>
          <div class="progress-stat"><div class="progress-stat-icon green">${Icons.check}</div><div class="progress-stat-text"><h4>${completedStations} / ${APP_DATA.stations.length}</h4><p>وحدة مكتملة</p></div></div>
          <div class="progress-stat"><div class="progress-stat-icon purple">${Icons.trophy}</div><div class="progress-stat-text"><h4>${achievements.filter(a=>a.unlocked).length} / ${achievements.length}</h4><p>إنجاز</p></div></div>
        </div>
      </div>
      <div class="progress-stations">${stationsHtml}</div>
      <div class="achievements-section">
        <h2>الإنجازات</h2>
        <div class="achievements-grid">${achievements.map(a => `<div class="achievement-card card ${a.unlocked?'':'locked'}"><div class="achievement-icon">${a.icon}</div><h4>${a.name}</h4><p>${a.desc}</p></div>`).join('')}</div>
      </div>
      ${renderFooter()}
    </div>`;
  }

  // --- OSI Layers ---
  function renderOsi() {
    return `<div class="osi-page">
      <div class="osi-header animate-fade-in">
        <h1>طبقات الشبكة (OSI Model)</h1>
        <p>شاهد كيف يتم تغليف البيانات (Encapsulation) أثناء انتقالها عبر الطبقات السبع.</p>
        <button class="btn btn-primary" style="margin-top:20px;" onclick="App.osiSendPacket()">${Icons.play} إرسال رسالة</button>
      </div>
      
      <div class="osi-container">
        <!-- طبقات الموديل -->
        <div class="osi-layers" id="osi-layers-stack">
          <div class="osi-layer l7" onclick="App.osiSelectLayer(7)"><div class="layer-num">7</div><div class="layer-name">Application</div></div>
          <div class="osi-layer l6" onclick="App.osiSelectLayer(6)"><div class="layer-num">6</div><div class="layer-name">Presentation</div></div>
          <div class="osi-layer l5" onclick="App.osiSelectLayer(5)"><div class="layer-num">5</div><div class="layer-name">Session</div></div>
          <div class="osi-layer l4" onclick="App.osiSelectLayer(4)"><div class="layer-num">4</div><div class="layer-name">Transport</div></div>
          <div class="osi-layer l3" onclick="App.osiSelectLayer(3)"><div class="layer-num">3</div><div class="layer-name">Network</div></div>
          <div class="osi-layer l2" onclick="App.osiSelectLayer(2)"><div class="layer-num">2</div><div class="layer-name">Data Link</div></div>
          <div class="osi-layer l1" onclick="App.osiSelectLayer(1)"><div class="layer-num">1</div><div class="layer-name">Physical</div></div>
        </div>

        <!-- معلومات الطبقة -->
        <div class="osi-info card" id="osi-info-panel">
          <h2 id="osi-info-title">اختر طبقة</h2>
          <p id="osi-info-desc">اضغط على أي طبقة من اليسار لترى تفاصيلها، أو اضغط على "إرسال رسالة" لرؤية عملية التغليف (Encapsulation) كاملة.</p>
          <div id="osi-info-meta" style="margin-top: 20px;"></div>
        </div>
      </div>
      ${renderFooter()}
    </div>`;
  }

  // --- Lab (Packet Tracer Lite) ---
  function renderLab() {
    return `<div class="lab-page">
      <div class="lab-header animate-fade-in">
        <h1>معمل بناء الشبكات (Lab)</h1>
        <p>قم بسحب الأجهزة، وصلها ببعضها، واختبر الاتصال باستخدام Ping.</p>
      </div>
      
      <div class="lab-workspace">
        <div class="lab-toolbar card">
          <h3>الأجهزة</h3>
          <div class="lab-tool" draggable="true" ondragstart="App.labDragStart(event, 'computer')">${Icons.cpu} جهاز كمبيوتر</div>
          <div class="lab-tool" draggable="true" ondragstart="App.labDragStart(event, 'server')">${Icons.server} سيرفر</div>
          <div class="lab-tool" draggable="true" ondragstart="App.labDragStart(event, 'switch')">${Icons.server} سويتش</div>
          <div class="lab-tool" draggable="true" ondragstart="App.labDragStart(event, 'router')">${Icons.globe} راوتر</div>
          <div class="lab-tool" draggable="true" ondragstart="App.labDragStart(event, 'firewall')">${Icons.shield} جدار حماية</div>
          <div class="lab-tool" draggable="true" ondragstart="App.labDragStart(event, 'ap')">${Icons.wifi} نقطة وصول</div>
          <div class="lab-tool" draggable="true" ondragstart="App.labDragStart(event, 'hub')">${Icons.share2} هاب</div>
          <hr>
          <h3>أمثلة جاهزة</h3>
          <button class="btn btn-outline" style="width:100%; margin-bottom:8px; font-size:12px;" onclick="App.labLoadExample('home')">🏠 شبكة منزلية</button>
          <button class="btn btn-outline" style="width:100%; margin-bottom:8px; font-size:12px;" onclick="App.labLoadExample('corp')">🏢 شبكة شركة</button>
          <hr>
          <h3>الأدوات</h3>
          <button class="btn btn-outline" id="lab-btn-select" onclick="App.labToggleTool('select')">اختيار (Select)</button>
          <button class="btn btn-outline" id="lab-btn-cable" onclick="App.labToggleTool('cable')">سلك (Cable)</button>
          <button class="btn btn-primary" id="lab-btn-ping" onclick="App.labToggleTool('ping')">فحص (Ping)</button>
          <button class="btn btn-outline" style="color:var(--error); border-color:var(--error);" id="lab-btn-delete" onclick="App.labToggleTool('delete')">حذف (Delete)</button>
          <button class="btn btn-outline" onclick="App.labClear()">مسح الكل</button>
        </div>
        
        <div class="lab-canvas-container" style="flex: 2;">
          <svg class="lab-svg" id="lab-svg"></svg>
          <div class="lab-canvas" id="lab-canvas" ondrop="App.labDrop(event)" ondragover="App.labDragOver(event)">
            <!-- الأجهزة تضاف هنا ديناميكياً -->
          </div>
        </div>

        <div class="lab-properties card" id="lab-properties" style="flex: 1; display: none;">
          <h3>تفاصيل الجهاز</h3>
          <div id="lab-prop-content"></div>
        </div>
      </div>
      ${renderFooter()}
    </div>`;
  }

  // --- Terminal ---
  function renderTerminal() {
    return `<div class="terminal-page">
      <div class="terminal-header animate-fade-in">
        <button class="btn-back" onclick="history.back()">${Icons.arrowRight} رجوع</button>
        <h1>سجل الأوامر (Terminal)</h1>
        <p>جرب كتابة الأوامر الحقيقية للشبكات للتحقق من الاتصال وتتبع المسار.</p>
      </div>
      <div class="terminal-container animate-fade-in-up stagger-1">
        <div class="terminal-window" onclick="document.getElementById('term-input').focus()">
          <div class="terminal-topbar">
            <div class="term-dots"><span class="term-dot close"></span><span class="term-dot min"></span><span class="term-dot max"></span></div>
            <div class="term-title">Administrator: Command Prompt</div>
          </div>
          <div class="terminal-content" id="term-content">
            <div class="term-line">Network OS [Version 1.0.0]</div>
            <div class="term-line">(c) Network Journey. All rights reserved.</div>
            <div class="term-line">&nbsp;</div>
            <div class="term-line">Type 'help' to see available commands.</div>
          </div>
          <div class="terminal-input-row">
            <span class="term-prompt">C:\\Users\\Student&gt;</span>
            <input type="text" id="term-input" class="term-input" autocomplete="off" spellcheck="false" onkeydown="if(event.key==='Enter') App.handleTerminalCommand(this.value)">
          </div>
        </div>
      </div>
      ${renderFooter()}
    </div>`;
  }

  // ============================================
  // 8. Simulator Engine
  // ============================================
  const SimEngine = {
    currentScenario: null, currentStep: -1, playing: false, playInterval: null,

    init(scenarioId) {
      this.stop(); this.currentScenario = SIMULATOR_SCENARIOS[scenarioId]; this.currentStep = -1;
      this.render(); this.updateInfo();
    },

    render() {
      const svg = $('#sim-svg'); if (!svg || !this.currentScenario) return;
      const sc = this.currentScenario; let svgContent = '';
      
      // Calculate bounding box for responsive viewBox
      let minX = 0, minY = 0, maxX = 800, maxY = 400;
      if (sc.devices.length > 0) {
        minX = Math.min(...sc.devices.map(d => d.x)) - 100;
        minY = Math.min(...sc.devices.map(d => d.y)) - 100;
        maxX = Math.max(...sc.devices.map(d => d.x)) + 100;
        maxY = Math.max(...sc.devices.map(d => d.y)) + 100;
      }
      svg.setAttribute('viewBox', `${minX} ${minY} ${maxX - minX} ${maxY - minY}`);
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      
      // User requested to REMOVE the white connection lines completely.

      sc.devices.forEach(d => {
        const icon = this.getDeviceIcon(d.type);
        svgContent += `<g class="sim-device" transform="translate(${d.x},${d.y})">
          <rect class="sim-device-body" x="-36" y="-36" width="72" height="72" rx="16"/>
          <g transform="translate(-16,-16) scale(1.33)">${icon}</g>
          <text class="sim-device-label" y="52">${d.label}</text></g>`;
      });
      svgContent += `<circle id="sim-packet-glow" class="sim-packet-glow" r="14" fill="var(--accent)" cx="-100" cy="-100"/>
        <circle id="sim-packet" r="8" fill="var(--accent)" cx="-100" cy="-100" style="filter:drop-shadow(0 0 6px var(--accent))"/>
        <text id="sim-packet-label" fill="white" font-size="12" font-family="var(--font-family)" font-weight="700" text-anchor="middle" x="-100" y="-100"></text>`;
      svg.innerHTML = svgContent;
    },

    getDeviceIcon(type) {
      const icons = {
        computer: '<svg viewBox="0 0 24 24" class="sim-device-icon"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
        switch: '<svg viewBox="0 0 24 24" class="sim-device-icon"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="7" cy="12" r="1.5" fill="currentColor" class="sim-device-icon"/><circle cx="12" cy="12" r="1.5" fill="currentColor" class="sim-device-icon"/><circle cx="17" cy="12" r="1.5" fill="currentColor" class="sim-device-icon"/></svg>',
        router: '<svg viewBox="0 0 24 24" class="sim-device-icon"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>',
        server: '<svg viewBox="0 0 24 24" class="sim-device-icon"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>'
      };
      return icons[type] || icons.computer;
    },

    step() {
      if (!this.currentScenario) return;
      if (this.currentStep >= this.currentScenario.steps.length - 1) { this.stop(); return; }
      this.currentStep++;
      this.animatePacket(this.currentScenario.steps[this.currentStep]);
      this.updateInfo();
    },

    animatePacket(step) {
      const sc = this.currentScenario;
      const from = sc.devices.find(d => d.id === step.from), to = sc.devices.find(d => d.id === step.to);
      if (!from || !to) return;
      const pkt = $('#sim-packet'), glow = $('#sim-packet-glow'), lbl = $('#sim-packet-label');
      if (!pkt) return;
      
      // Stop current transition and reset to start position instantly
      pkt.style.transition = 'none'; glow.style.transition = 'none'; if (lbl) lbl.style.transition = 'none';
      const color = step.color || 'var(--accent)';
      pkt.setAttribute('fill', color); glow.setAttribute('fill', color);
      pkt.setAttribute('cx', from.x); pkt.setAttribute('cy', from.y);
      glow.setAttribute('cx', from.x); glow.setAttribute('cy', from.y);
      if (lbl) { lbl.setAttribute('x', from.x); lbl.setAttribute('y', from.y - 25); lbl.textContent = step.label; }
      
      // Force a reflow so the browser registers the jump before starting the animation
      void pkt.offsetWidth;
      
      requestAnimationFrame(() => {
        pkt.style.transition = 'all 800ms cubic-bezier(0.4, 0.0, 0.2, 1)'; 
        glow.style.transition = 'all 800ms cubic-bezier(0.4, 0.0, 0.2, 1)';
        if (lbl) lbl.style.transition = 'all 800ms cubic-bezier(0.4, 0.0, 0.2, 1)';
        
        pkt.setAttribute('cx', to.x); pkt.setAttribute('cy', to.y);
        glow.setAttribute('cx', to.x); glow.setAttribute('cy', to.y);
        if (lbl) { lbl.setAttribute('x', (from.x+to.x)/2); lbl.setAttribute('y', Math.min(from.y,to.y)-35); }
      });
    },

    updateInfo() {
      const steps = this.currentScenario ? this.currentScenario.steps : [];
      const dots = $('#sim-dots'), layerEl = $('#sim-layer'), labelEl = $('#sim-label'), detailEl = $('#sim-detail');
      const mainDesc = $('#sim-main-desc');
      
      if (mainDesc && this.currentScenario) mainDesc.textContent = this.currentScenario.description;
      if (dots) dots.innerHTML = steps.map((_, i) => `<div class="sim-step-dot ${i<this.currentStep?'done':i===this.currentStep?'active':''}"></div>`).join('');
      
      if (this.currentStep >= 0 && this.currentStep < steps.length) {
        const s = steps[this.currentStep];
        if (layerEl) layerEl.textContent = s.layer; 
        if (labelEl) labelEl.textContent = s.label; 
        
        let htmlDetail = `<p>${s.details}</p>`;
        if (s.packet) {
          htmlDetail += `<div class="packet-inspector">
            <div class="packet-header"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg> فحص الحزمة (Packet Inspector)</div>
            <div class="packet-body">`;
          for (const [k, v] of Object.entries(s.packet)) {
            htmlDetail += `<div class="packet-row"><span class="packet-key">${k}</span><span class="packet-value">${v}</span></div>`;
          }
          htmlDetail += `</div></div>`;
        }
        if (detailEl) detailEl.innerHTML = htmlDetail;
      } else {
        if (layerEl) layerEl.textContent = '—'; if (labelEl) labelEl.textContent = '—'; if (detailEl) detailEl.innerHTML = 'اختر سيناريو واضغط ▶ للبدء';
      }
    },

    play() {
      if (!this.currentScenario) return; this.playing = true;
      const btn = $('#sim-play'); if (btn) { btn.classList.add('playing'); btn.innerHTML = Icons.pause; }
      this.playInterval = setInterval(() => {
        if (this.currentStep >= this.currentScenario.steps.length - 1) { this.stop(); return; }
        this.step();
      }, 1200);
    },

    stop() {
      this.playing = false; clearInterval(this.playInterval);
      const btn = $('#sim-play'); if (btn) { btn.classList.remove('playing'); btn.innerHTML = Icons.play; }
    },

    restart() { this.stop(); this.currentStep = -1; this.render(); this.updateInfo(); }
  };

  // ============================================
  // 8.1 OSI Engine
  // ============================================
  const OsiEngine = {
    layerData: {
      7: { name: 'Application', desc: 'الواجهة التي يتفاعل معها المستخدم والتطبيقات (مثل المتصفح).', proto: 'HTTP, FTP, SMTP', pdu: 'Data (رسالة)' },
      6: { name: 'Presentation', desc: 'تجهيز البيانات، تشفيرها، وضغطها لتكون مفهومة للطبقة السابعة.', proto: 'SSL, TLS, JPEG', pdu: 'Data' },
      5: { name: 'Session', desc: 'فتح وإغلاق وإدارة الجلسات بين الجهازين.', proto: 'NetBIOS, PPTP', pdu: 'Data' },
      4: { name: 'Transport', desc: 'تقطيع البيانات والتأكد من وصولها (أو إرسالها سريعاً).', proto: 'TCP, UDP', pdu: 'Segment (مقطع)' },
      3: { name: 'Network', desc: 'تحديد المسار والعناوين المنطقية (IP) بين الشبكات المختلفة.', proto: 'IPv4, IPv6, ICMP', pdu: 'Packet (حزمة)' },
      2: { name: 'Data Link', desc: 'إضافة العناوين الفيزيائية (MAC) واكتشاف أخطاء السلك.', proto: 'Ethernet, MAC', pdu: 'Frame (إطار)' },
      1: { name: 'Physical', desc: 'نقل البيانات كإشارات كهربائية أو ضوئية عبر الأسلاك.', proto: 'Cables, Hubs', pdu: 'Bits (أصفار وآحاد)' }
    },
    selectLayer(num) {
      document.querySelectorAll('.osi-layer').forEach(el => el.classList.remove('active'));
      const el = document.querySelector(`.osi-layer.l${num}`);
      if (el) el.classList.add('active');
      
      const data = this.layerData[num];
      document.getElementById('osi-info-title').textContent = `الطبقة ${num}: ${data.name}`;
      document.getElementById('osi-info-desc').textContent = data.desc;
      document.getElementById('osi-info-meta').innerHTML = `
        <p><strong>بروتوكولات شهيرة:</strong> <span class="badge badge-accent">${data.proto}</span></p>
        <p><strong>شكل البيانات (PDU):</strong> <span class="badge badge-purple">${data.pdu}</span></p>
      `;
    },
    async sendPacket() {
      // الأنيميشن من الطبقة 7 لـ 1
      for (let i = 7; i >= 1; i--) {
        this.selectLayer(i);
        const el = document.querySelector(`.osi-layer.l${i}`);
        el.style.transform = 'translateX(20px)';
        el.style.backgroundColor = 'var(--accent)';
        await new Promise(r => setTimeout(r, 600));
        el.style.transform = 'none';
        el.style.backgroundColor = '';
      }
      document.getElementById('osi-info-desc').innerHTML += '<br><br><strong style="color:var(--success)">تم الإرسال بنجاح عبر السلك! ⚡</strong>';
    }
  };

  // ============================================
  // 8.2 Lab Engine
  // ============================================
  const LabEngine = {
    devices: [], connections: [], nextId: 1, currentTool: 'select', selectedNode1: null,
    
    init() { this.devices = []; this.connections = []; this.currentTool = 'select'; this.selectedNode1 = null; this.hideProperties(); this.render(); },
    
    addDevice(type, x, y) {
      this.devices.push({ id: this.nextId++, type, x, y, ip: '192.168.1.'+this.nextId, mac: 'AA:BB:CC:00:00:'+(this.nextId<10?'0'+this.nextId:this.nextId) });
      this.render();
    },

    loadExample(exampleId) {
      this.init();
      if (exampleId === 'home') {
        this.addDevice('router', 400, 100);
        this.addDevice('ap', 400, 200);
        this.addDevice('computer', 250, 300);
        this.addDevice('computer', 550, 300);
        this.connections.push({ n1: 1, n2: 2 }, { n1: 2, n2: 3 }, { n1: 2, n2: 4 });
      } else if (exampleId === 'corp') {
        this.addDevice('firewall', 400, 100);
        this.addDevice('router', 400, 200);
        this.addDevice('switch', 400, 300);
        this.addDevice('server', 200, 300);
        this.addDevice('computer', 250, 400);
        this.addDevice('computer', 400, 400);
        this.addDevice('computer', 550, 400);
        this.connections.push({ n1: 1, n2: 2 }, { n1: 2, n2: 3 }, { n1: 3, n2: 4 }, { n1: 3, n2: 5 }, { n1: 3, n2: 6 }, { n1: 3, n2: 7 });
      }
      this.render();
    },
    
    handleNodeClick(id) {
      if (this.currentTool === 'cable') {
        if (!this.selectedNode1) { this.selectedNode1 = id; this.highlightNode(id); }
        else {
          if (this.selectedNode1 !== id) {
            const exists = this.connections.some(c => (c.n1 === id && c.n2 === this.selectedNode1) || (c.n1 === this.selectedNode1 && c.n2 === id));
            if(!exists) this.connections.push({ n1: this.selectedNode1, n2: id });
          }
          this.selectedNode1 = null; this.currentTool = 'select'; this.render();
          document.getElementById('lab-btn-cable').classList.remove('active');
          document.getElementById('lab-btn-select').classList.add('active');
        }
      } else if (this.currentTool === 'ping') {
        if (!this.selectedNode1) { this.selectedNode1 = id; this.highlightNode(id); }
        else {
          if (this.selectedNode1 !== id) {
            this.simulatePing(this.selectedNode1, id);
          }
          this.selectedNode1 = null; this.currentTool = 'select'; this.render();
          document.getElementById('lab-btn-ping').classList.remove('active');
          document.getElementById('lab-btn-select').classList.add('active');
        }
      } else if (this.currentTool === 'delete') {
        this.devices = this.devices.filter(d => d.id !== id);
        this.connections = this.connections.filter(c => c.n1 !== id && c.n2 !== id);
        this.hideProperties();
        this.render();
      } else if (this.currentTool === 'select') {
        this.showProperties(id);
        this.highlightNode(id);
      }
    },
    
    highlightNode(id) {
      document.querySelectorAll('.lab-node').forEach(n => n.style.borderColor = 'transparent');
      const el = document.getElementById(`lab-node-${id}`);
      if (el) el.style.borderColor = 'var(--accent)';
    },

    showProperties(id) {
      const d = this.devices.find(x => x.id === id);
      if(!d) return;
      const prop = document.getElementById('lab-properties');
      if (prop) prop.style.display = 'block';
      const content = document.getElementById('lab-prop-content');
      if (content) {
        content.innerHTML = `
          <div style="margin-top:15px; font-size:14px; line-height:1.8;">
            <p style="color:var(--text-secondary);"><strong>الاسم:</strong> <span style="color:var(--text-primary);">${d.type.toUpperCase()}-${d.id}</span></p>
            <p style="color:var(--text-secondary);"><strong>النوع:</strong> <span style="color:var(--text-primary);">${d.type}</span></p>
            <p style="color:var(--text-secondary);"><strong>IP Address:</strong> <span style="color:var(--accent); font-family:monospace;">${d.ip}</span></p>
            <p style="color:var(--text-secondary);"><strong>MAC Address:</strong> <span style="color:var(--accent); font-family:monospace;">${d.mac}</span></p>
            <hr style="border-color:var(--separator); margin: 15px 0;">
            <p style="color:var(--success); font-size:12px;">▶ الجهاز يعمل بشكل طبيعي ومتصل بالطاقة.</p>
          </div>
        `;
      }
    },
    
    hideProperties() {
      const prop = document.getElementById('lab-properties');
      if(prop) prop.style.display = 'none';
    },

    setTool(tool) {
      this.currentTool = tool;
      this.selectedNode1 = null;
      document.querySelectorAll('.lab-toolbar .btn').forEach(b => b.classList.remove('active'));
      const activeBtn = document.getElementById(`lab-btn-${tool}`);
      if(activeBtn) activeBtn.classList.add('active');
      this.render();
    },

    simulatePing(id1, id2) {
      const graph = {};
      this.devices.forEach(d => graph[d.id] = []);
      this.connections.forEach(c => { graph[c.n1].push(c.n2); graph[c.n2].push(c.n1); });
      
      const queue = [id1]; const visited = new Set([id1]);
      let connected = false;
      while (queue.length > 0) {
        const curr = queue.shift();
        if (curr === id2) { connected = true; break; }
        graph[curr].forEach(neighbor => {
          if (!visited.has(neighbor)) { visited.add(neighbor); queue.push(neighbor); }
        });
      }

      if (connected) showToast('نجاح Ping: الأجهزة متصلة بشكل صحيح! 📶', 'success');
      else showToast('فشل Ping: لا يوجد مسار (أسلاك) بين الجهازين! ❌', 'error');
    },

    render() {
      const canvas = document.getElementById('lab-canvas');
      const svg = document.getElementById('lab-svg');
      if (!canvas || !svg) return;
      
      canvas.innerHTML = '';
      this.devices.forEach(d => {
        const el = document.createElement('div');
        el.className = 'lab-node'; el.id = `lab-node-${d.id}`;
        el.style.left = `${d.x - 32}px`; el.style.top = `${d.y - 32}px`;
        
        let iconHtml = '';
        if(d.type === 'computer' || d.type === 'pc') iconHtml = SimEngine.getDeviceIcon('computer');
        else if(d.type === 'switch') iconHtml = SimEngine.getDeviceIcon('switch');
        else if(d.type === 'router') iconHtml = SimEngine.getDeviceIcon('router');
        else if(d.type === 'server') iconHtml = SimEngine.getDeviceIcon('server');
        else if(d.type === 'firewall') iconHtml = `<svg viewBox="0 0 24 24" class="sim-device-icon"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
        else if(d.type === 'ap' || d.type === 'repeater' || d.type === 'modem') iconHtml = `<svg viewBox="0 0 24 24" class="sim-device-icon"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg>`;
        else if(d.type === 'hub') iconHtml = `<svg viewBox="0 0 24 24" class="sim-device-icon"><rect x="2" y="10" width="20" height="4" rx="1"/><circle cx="6" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="18" cy="12" r="1" fill="currentColor"/></svg>`;
        else iconHtml = SimEngine.getDeviceIcon('computer');

        el.innerHTML = iconHtml + `<div style="font-size:10px; margin-top:4px; font-weight:bold; color:var(--text-primary); text-shadow:0 0 2px var(--bg-primary);">${d.type.toUpperCase()}-${d.id}</div>`;
        el.onclick = () => this.handleNodeClick(d.id);
        canvas.appendChild(el);
      });
      
      let svgContent = '';
      this.connections.forEach(c => {
        const n1 = this.devices.find(d => d.id === c.n1);
        const n2 = this.devices.find(d => d.id === c.n2);
        if (n1 && n2) {
          svgContent += `<line x1="${n1.x}" y1="${n1.y}" x2="${n2.x}" y2="${n2.y}" stroke="var(--accent)" stroke-width="3" stroke-dasharray="5,5"/>`;
        }
      });
      svg.innerHTML = svgContent;
    }
  };

  // ============================================
  // 8.5 Terminal Engine
  // ============================================
  const TerminalEngine = {
    print(text, isHTML = false) {
      const tc = document.getElementById('term-content');
      if (!tc) return;
      const line = document.createElement('div');
      line.className = 'term-line';
      if (isHTML) line.innerHTML = text; else line.textContent = text;
      tc.appendChild(line);
      tc.scrollTop = tc.scrollHeight;
    },
    async execute(cmdStr) {
      const tc = document.getElementById('term-content');
      const input = document.getElementById('term-input');
      if (!tc || !input) return;
      
      const rawCmd = cmdStr.trim();
      input.value = '';
      this.print(`C:\\Users\\Student> ${rawCmd}`);
      
      if (!rawCmd) return;
      
      const args = rawCmd.split(/\s+/);
      const cmd = args[0].toLowerCase();
      
      input.disabled = true; // Block input while command is running
      
      const delay = ms => new Promise(res => setTimeout(res, ms));

      try {
        switch (cmd) {
          case 'help':
            this.print("Available commands:");
            this.print("  ping [target]    - Send ICMP echo requests to verify connectivity");
            this.print("  ipconfig         - Display current TCP/IP network configuration");
            this.print("  tracert [target] - Trace route to destination");
            this.print("  arp -a           - Display current ARP entries");
            this.print("  nslookup [name]  - DNS query tool");
            this.print("  clear / cls      - Clear the terminal screen");
            break;
            
          case 'clear':
          case 'cls':
            tc.innerHTML = '';
            break;
            
          case 'ipconfig':
          case 'ifconfig':
            await delay(400);
            this.print("Windows IP Configuration\n");
            this.print("Ethernet adapter Local Area Connection:");
            this.print("   Connection-specific DNS Suffix  . : localdomain");
            this.print("   IPv4 Address. . . . . . . . . . . : 192.168.1.100");
            this.print("   Subnet Mask . . . . . . . . . . . : 255.255.255.0");
            this.print("   Default Gateway . . . . . . . . . : 192.168.1.1");
            break;
            
          case 'ping':
            const target = args[1] || '8.8.8.8';
            this.print(`Pinging ${target} with 32 bytes of data:`);
            for(let i=0; i<4; i++) {
              await delay(800);
              const time = Math.floor(Math.random() * 20) + 10;
              this.print(`Reply from ${target}: bytes=32 time=${time}ms TTL=117`);
            }
            await delay(400);
            this.print(`\nPing statistics for ${target}:`);
            this.print(`    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),`);
            break;
            
          case 'tracert':
          case 'traceroute':
            const tTarget = args[1] || 'google.com';
            this.print(`Tracing route to ${tTarget} over a maximum of 30 hops:\n`);
            const hops = [
              "192.168.1.1", "10.10.0.1", "172.217.1.1", "142.250.200.4"
            ];
            for(let i=0; i<hops.length; i++) {
              await delay(1000);
              const t1 = Math.floor(Math.random() * 10) + 1;
              const t2 = Math.floor(Math.random() * 10) + 1;
              const t3 = Math.floor(Math.random() * 10) + 1;
              this.print(`  ${i+1}     ${t1} ms     ${t2} ms     ${t3} ms  ${hops[i]}`);
            }
            this.print("\nTrace complete.");
            break;
            
          case 'arp':
            await delay(300);
            this.print("Interface: 192.168.1.100 --- 0x4");
            this.print("  Internet Address      Physical Address      Type");
            this.print("  192.168.1.1           00-14-22-01-23-45     dynamic");
            this.print("  192.168.1.255         ff-ff-ff-ff-ff-ff     static");
            break;
            
          case 'nslookup':
            const dTarget = args[1] || 'example.com';
            await delay(500);
            this.print(`Server:  UnKnown`);
            this.print(`Address:  192.168.1.1\n`);
            this.print(`Non-authoritative answer:`);
            this.print(`Name:    ${dTarget}`);
            this.print(`Addresses:  93.184.216.34`);
            break;

          default:
            this.print(`'${cmd}' is not recognized as an internal or external command, operable program or batch file.`);
        }
      } catch (e) {
        console.error(e);
      }
      
      this.print("<br>", true); // Empty line before next prompt
      input.disabled = false;
      input.focus();
    }
  };

  // ============================================
  // 9. Router
  // ============================================
  function route() {
    const hash = location.hash || '#/';
    const app = document.getElementById('app');
    if (!app) return;

    if (particleInstance) { particleInstance.destroy(); particleInstance = null; }
    SimEngine.stop();

    let content = '', activePage = '';

    if (hash === '#/' || hash === '' || hash === '#') {
      content = renderHeader() + renderLanding(); activePage = 'landing';
    } else if (hash === '#/journey') {
      content = renderHeader() + renderJourney(); activePage = 'journey';
    } else if (hash.startsWith('#/station/')) {
      content = renderHeader() + renderStation(parseInt(hash.split('/')[2])); activePage = 'station';
    } else if (hash.startsWith('#/lesson/')) {
      const p = hash.split('/');
      content = renderHeader() + renderLesson(parseInt(p[2]), parseInt(p[3])); activePage = 'lesson';
    } else if (hash === '#/simulator') {
      content = renderHeader() + renderSimulator(); activePage = 'simulator';
    } else if (hash === '#/osi') {
      content = renderHeader() + renderOsi(); activePage = 'osi';
    } else if (hash === '#/lab') {
      content = renderHeader() + renderLab(); activePage = 'lab';
    } else if (hash === '#/terminal') {
      content = renderHeader() + renderTerminal(); activePage = 'terminal';
    } else if (hash === '#/progress') {
      content = renderHeader() + renderProgress(); activePage = 'progress';
    } else {
      content = renderHeader() + renderLanding(); activePage = 'landing';
    }

    app.style.opacity = '0'; app.style.transform = 'translateY(8px)';
    setTimeout(() => {
      app.innerHTML = content; window.scrollTo(0, 0);
      $$('.header-nav-btn').forEach(b => b.classList.toggle('active', b.dataset.nav === activePage));
      requestAnimationFrame(() => {
        app.style.transition = 'opacity 300ms ease-in-out, transform 300ms ease-in-out';
        app.style.opacity = '1'; app.style.transform = 'translateY(0)';
      });
      if (activePage === 'landing') { const c = document.getElementById('hero-canvas'); if (c) particleInstance = new ParticleNetwork(c); }
      if (activePage === 'simulator') { SimEngine.init(Object.keys(SIMULATOR_SCENARIOS)[0]); }
      if (activePage === 'lab') { LabEngine.init(); }
      if (activePage === 'osi') { OsiEngine.selectLayer(7); }
      if (activePage === 'lesson') {
        const visualInner = document.getElementById('lesson-visual-inner');
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const visualContent = entry.target.dataset.visual;
              if (visualInner && visualContent && visualContent !== 'default' && visualInner.innerHTML !== visualContent) {
                visualInner.style.opacity = 0;
                setTimeout(() => {
                  visualInner.innerHTML = visualContent;
                  visualInner.style.opacity = 1;
                }, 300);
              }
            }
          });
        }, { rootMargin: '-20% 0px -60% 0px', threshold: 0 });
        
        $$('.lesson-section-wrapper').forEach(el => observer.observe(el));
      }
      if (activePage === 'terminal') {
        setTimeout(() => { const ti = document.getElementById('term-input'); if (ti) ti.focus(); }, 400);
      }
    }, 150);
  }

  // ============================================
  // 10. Public API
  // ============================================
  window.App = {
    handleTerminalCommand(val) { TerminalEngine.execute(val); },
    osiSelectLayer(num) { OsiEngine.selectLayer(num); },
    osiSendPacket() { OsiEngine.sendPacket(); },
    
    labDragStart(e, type) { e.dataTransfer.setData('deviceType', type); },
    labDragOver(e) { e.preventDefault(); },
    labDrop(e) { 
      e.preventDefault(); 
      const type = e.dataTransfer.getData('deviceType');
      const rect = document.getElementById('lab-canvas').getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (type) LabEngine.addDevice(type, x, y);
    },
    labToggleTool: tool => { LabEngine.setTool(tool); },
    labClear: () => { LabEngine.init(); },
    labLoadExample: (id) => { LabEngine.loadExample(id); },

    toggleLessonComplete(lessonId) {
      State.toggleLesson(lessonId);
      const isDone = State.isLessonCompleted(lessonId);
      const btn = $('#lesson-complete-btn');
      if (btn) { btn.className = `lesson-bottom-complete ${isDone?'completed':''}`; btn.innerHTML = `<span class="check-box">${isDone?'✓':''}</span><span>${isDone?'مكتمل':'إكمال الدرس'}</span>`; }
      const sl = $(`.sidebar-lesson[data-lesson="${lessonId}"]`);
      if (sl) { sl.classList.toggle('completed', isDone); const chk = sl.querySelector('.lesson-check'); if (chk) chk.textContent = isDone ? '✓' : ''; }
      const total = State.getTotalProgress();
      const pl = $('.sidebar-progress-label'); if (pl) pl.innerHTML = `<span>التقدم الكلي</span><span>${total.percent}%</span>`;
      const pf = $('.sidebar-progress-fill'); if (pf) pf.style.width = total.percent + '%';
      const hb = $('[data-nav="progress"]'); if (hb) hb.innerHTML = `${Icons.barChart}<span>${total.percent}%</span>`;
      if (isDone) showToast('تم إكمال الدرس بنجاح! 🎉');
    },
    toggleSidebarStation(id) { const el = $(`.sidebar-station[data-station="${id}"]`); if (el) el.classList.toggle('open'); },
    toggleMobileSidebar() {
      const sb = $('#app-sidebar'), ov = $('#sidebar-overlay');
      if (sb) { State.sidebarOpen = !State.sidebarOpen; sb.classList.toggle('open', State.sidebarOpen); if (ov) ov.classList.toggle('visible', State.sidebarOpen); }
    },
    selectScenario(id) { $$('.scenario-btn').forEach(b => b.classList.toggle('active', b.dataset.scenario === id)); SimEngine.init(id); },
    simPlayPause() { SimEngine.playing ? SimEngine.stop() : SimEngine.play(); },
    simStep() { SimEngine.stop(); SimEngine.step(); },
    simRestart() { SimEngine.restart(); }
  };

  // ============================================
  // 11. Init
  // ============================================
  State.load();
  window.addEventListener('hashchange', route);
  window.addEventListener('DOMContentLoaded', route);
  if (document.readyState !== 'loading') route();
})();
