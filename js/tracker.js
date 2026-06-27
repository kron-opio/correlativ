/**
 * CORRELATIV — Controlador del tracker
 */

(function () {

  // ── Estado global ──────────────────────────────────
  let studentData = null;
  let careerData  = null;
  let progress    = {};
  let notas       = {};   // { [subjectId]: number } — campo propio en Firestore
  let saveTimer   = null;

  const STATUS_LABEL = {
    aprobada:   '✓ APROBADA',
    cursada:    '▶ CURSADA APROBADA',
    cursando:   '◉ CURSANDO',
    disponible: '◆ DISPONIBLE',
    bloqueada:  '✖ BLOQUEADA',
  };

  // ── Init ───────────────────────────────────────────
  async function init() {
    const params    = new URLSearchParams(window.location.search);
    const studentId = params.get('s');

    if (!studentId) {
      window.location.href = 'index.html';
      return;
    }

    studentData = await DATA.getStudent(studentId);
    if (!studentData) {
      window.location.href = 'index.html';
      return;
    }

    careerData = await DATA.getCareer(studentData.careerId);
    if (!careerData) {
      showFatalError('No se encontró la carrera. Contactá a tu docente.');
      return;
    }

    progress = studentData.progress || {};
    notas    = studentData.notas    || {};

    // Header
    document.getElementById('student-name').textContent =
      studentData.name.toUpperCase();
    document.getElementById('career-name').textContent =
      careerData.name + ' · Plan ' + careerData.planYear;
    document.title = 'CORRELATIV :: ' + studentData.name;

    // Render
    render();
    updateStats();

    // Botón salir
    document.getElementById('back-btn').addEventListener('click', () => {
      window.location.href = 'index.html';
    });

    // Modal
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('modal-overlay').addEventListener('click', (e) => {
      if (e.target === document.getElementById('modal-overlay')) closeModal();
    });
  }

  // ── Render principal ───────────────────────────────
  function render() {
    const main    = document.getElementById('tracker-main');
    const loading = document.getElementById('loading-screen');
    if (loading) loading.remove();

    // Agrupar por año → cuatrimestre
    const byYear = {};
    careerData.subjects.forEach(s => {
      if (!byYear[s.year]) byYear[s.year] = {};
      if (!byYear[s.year][s.sem]) byYear[s.year][s.sem] = [];
      byYear[s.year][s.sem].push(s);
    });

    const thresholds  = careerData.semesterThresholds || {};
    const allStatuses = computeAllStatuses(progress, careerData.subjects, thresholds);

    // Panel resumen arriba de todo (inscripción + próximas)
    const overview = document.createElement('section');
    overview.className = 'overview';
    overview.id = 'overview';
    main.appendChild(overview);
    updateOverview(allStatuses);

    Object.keys(byYear)
      .map(Number)
      .sort((a, b) => a - b)
      .forEach(year => {
        const yearEl = buildYearSection(year, byYear[year], allStatuses, thresholds);
        main.appendChild(yearEl);
      });
  }

  // ── Panel resumen: inscripción + próximas a desbloquear ──
  function updateOverview(allStatuses) {
    const section = document.getElementById('overview');
    if (!section) return;

    const disponibles = careerData.subjects
      .filter(s => allStatuses[s.id].status === 'disponible');
    const c1 = disponibles.filter(s => s.sem % 2 === 1);  // cuatris impares
    const c2 = disponibles.filter(s => s.sem % 2 === 0);  // cuatris pares

    const proximas = careerData.subjects
      .filter(s => allStatuses[s.id].status === 'bloqueada')
      .map(s => ({ s, info: allStatuses[s.id] }))
      .filter(x => missingCount(x.info) === 1);

    let html = '';

    // Caja: podés inscribirte
    html += '<div class="overview-box">';
    html += '<div class="overview-title">◆ PODÉS INSCRIBIRTE AHORA</div>';
    if (!disponibles.length) {
      html += '<div class="overview-empty">No hay materias disponibles para '
            + 'inscribirte en este momento.</div>';
    } else {
      html += '<div class="overview-cuatris">';
      html += cuatriCol('1° CUATRIMESTRE', c1);
      html += cuatriCol('2° CUATRIMESTRE', c2);
      html += '</div>';
    }
    html += '</div>';

    // Caja: próximas a desbloquear (a un solo requisito)
    if (proximas.length) {
      html += '<div class="overview-box">';
      html += '<div class="overview-title">◷ PRÓXIMAS A DESBLOQUEAR</div>';
      html += '<ul class="next-list">';
      proximas.forEach(({ s, info }) => {
        html += '<li class="next-item" data-id="' + s.id + '">'
              + '<span class="next-name">' + escHtml(s.name) + '</span>'
              + '<span class="next-missing">' + escHtml(missingLabel(info)) + '</span>'
              + '</li>';
      });
      html += '</ul></div>';
    }

    section.innerHTML = html;

    // Cada ítem abre el modal de su materia
    section.querySelectorAll('[data-id]').forEach(el => {
      el.addEventListener('click', () => {
        const subj = careerData.subjects.find(x => x.id === el.dataset.id);
        if (subj) openModal(subj, allStatuses[subj.id]);
      });
    });
  }

  function cuatriCol(label, list) {
    let h = '<div class="cuatri-col"><div class="cuatri-label">' + label + '</div>';
    if (!list.length) {
      h += '<div class="overview-empty" style="padding:2px 0;font-size:0.9rem">'
         + '— ninguna —</div>';
    } else {
      h += '<ul class="avail-list">';
      list.forEach(s => {
        h += '<li class="avail-item" data-id="' + s.id + '">'
           + '<span>' + escHtml(s.name) + '</span>'
           + '<span class="avail-meta">' + ordinal(s.year) + ' AÑO</span>'
           + '</li>';
      });
      h += '</ul>';
    }
    h += '</div>';
    return h;
  }

  function missingCount(info) {
    return (info.missingCursada?.length || 0)
         + (info.missingAprobada?.length || 0)
         + (info.missingThreshold ? 1 : 0);
  }

  function missingLabel(info) {
    if (info.missingThreshold) return 'falta: umbral del cuatri';
    if (info.missingCursada?.length === 1) {
      const ps = careerData.subjects.find(s => s.id === info.missingCursada[0]);
      return 'cursar: ' + (ps?.name || info.missingCursada[0]);
    }
    if (info.missingAprobada?.length === 1) {
      const ps = careerData.subjects.find(s => s.id === info.missingAprobada[0]);
      return 'aprobar: ' + (ps?.name || info.missingAprobada[0]);
    }
    return '';
  }

  function buildYearSection(year, semMap, allStatuses, thresholds) {
    const section = document.createElement('section');
    section.className = 'year-section';
    section.id = 'year-' + year;

    // ¿Está todo el año aprobado? → se autocolapsa
    const yearSubjects = Object.values(semMap).flat();
    const allApr = yearSubjects.every(s => allStatuses[s.id].status === 'aprobada');

    const header = document.createElement('div');
    header.className = 'year-header';
    header.innerHTML =
      '<span>★ ' + ordinal(year) + ' AÑO</span>' +
      (allApr ? '<span class="year-done-tag">✓ COMPLETO</span>' : '') +
      '<span class="year-toggle">▾</span>';
    if (allApr) section.classList.add('collapsed');
    header.addEventListener('click', () => section.classList.toggle('collapsed'));
    section.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'semesters-grid';

    Object.keys(semMap)
      .map(Number)
      .sort((a, b) => a - b)
      .forEach(sem => {
        grid.appendChild(
          buildSemesterSection(sem, semMap[sem], allStatuses, thresholds)
        );
      });

    section.appendChild(grid);
    return section;
  }

  function buildSemesterSection(sem, subjects, allStatuses, thresholds) {
    const section = document.createElement('div');
    section.className = 'semester-section';
    section.id = 'sem-' + sem;

    const header = document.createElement('div');
    header.className = 'semester-header';
    header.textContent = '◈ ' + sem + '° CUATRIMESTRE';
    section.appendChild(header);

    const thr = thresholds[String(sem)];
    if (thr) {
      const tDiv = document.createElement('div');
      tDiv.className = 'semester-threshold';
      if (thr.minAprobadas > 0) {
        tDiv.textContent =
          '※ Para cursarlo necesitás ' + thr.minAprobadas + ' materias aprobadas en total';
      } else if (thr.minCursadas > 0) {
        tDiv.textContent =
          '※ Para cursarlo necesitás ' + thr.minCursadas + ' materia(s) con cursada aprobada';
      }
      section.appendChild(tDiv);
    }

    const list = document.createElement('div');
    list.className = 'subjects-list';
    subjects.forEach(subj => {
      list.appendChild(buildSubjectCard(subj, allStatuses[subj.id]));
    });
    section.appendChild(list);

    return section;
  }

  function buildSubjectCard(subject, statusInfo) {
    const card = document.createElement('div');
    card.className    = 'subject-card status-' + statusInfo.status;
    card.dataset.id   = subject.id;

    const nota = getNota(subject.id);
    const showNota = statusInfo.status === 'aprobada' && nota != null;

    const hint =
      statusInfo.status === 'bloqueada' ? '? ver info'
      : showNota                        ? '★ ' + fmtNota(nota)
      :                                   '↓ click';

    card.innerHTML =
      '<div class="subject-name">' + escHtml(subject.name) + '</div>' +
      '<div class="subject-footer">' +
        '<span class="subject-badge">' + STATUS_LABEL[statusInfo.status] + '</span>' +
        '<span class="subject-hint' + (showNota ? ' subject-nota' : '') + '">' + hint + '</span>' +
      '</div>';

    card.addEventListener('click', () => openModal(subject, statusInfo));
    return card;
  }

  // ── Modal ──────────────────────────────────────────
  function openModal(subject, statusInfo) {
    const overlay = document.getElementById('modal-overlay');
    const title   = document.getElementById('modal-title');
    const content = document.getElementById('modal-content');

    title.textContent = subject.name.toUpperCase();

    let html = '<div class="modal-body">';

    // ── Sección: cambiar estado ──
    const isAccessible = statusInfo.status !== 'bloqueada';

    html += '<div class="modal-section">';
    html += '<div class="modal-label">▸ ESTADO</div>';

    if (isAccessible) {
      const cur = progress[subject.id] || null;
      html += '<div class="status-btns">';
      html += statusBtn('aprobada', '✓ APROBADA',         cur, subject.id);
      html += statusBtn('cursada',  '▶ CURSADA APROBADA', cur, subject.id);
      html += statusBtn('cursando', '◉ CURSANDO',         cur, subject.id);
      html += statusBtn(null,       '✖ NINGUNA',          cur, subject.id);
      html += '</div>';

      // Nota final — solo visible si la materia está aprobada
      const notaVal = getNota(subject.id);
      html += '<div class="nota-row' + (cur === 'aprobada' ? '' : ' hidden') + '" id="nota-row">';
      html += '<label class="nota-label" for="nota-input">★ NOTA FINAL (1–10):</label>';
      html += '<input type="number" inputmode="decimal" min="1" max="10" step="0.25" '
            + 'class="nota-input" id="nota-input" placeholder="—" '
            + 'value="' + (notaVal != null ? notaVal : '') + '" '
            + 'oninput="TRACKER_UI.setNota(\'' + subject.id + '\', this.value)">';
      html += '</div>';
    } else {
      html += '<div class="blocked-notice">✖ Esta materia no está disponible todavía. '
            + 'Revisá lo que falta abajo.</div>';
    }

    html += '</div>';

    // ── Sección: correlatividades ──
    const hasPrereqs =
      subject.prereqCursada?.length ||
      subject.prereqAprobada?.length ||
      statusInfo.missingThreshold;

    html += '<div class="modal-section">';
    html += '<div class="modal-label">▸ CORRELATIVIDADES</div>';

    if (!hasPrereqs) {
      html += '<div class="prereq-item met">Sin correlatividades individuales</div>';
    } else {
      if (statusInfo.missingThreshold) {
        html += '<div class="threshold-item">⚠ ' + escHtml(statusInfo.missingThreshold) + '</div>';
      }

      if (subject.prereqCursada?.length) {
        html += '<div class="modal-label" style="margin-top:8px">Cursada aprobada requerida:</div>';
        subject.prereqCursada.forEach(pid => {
          const ps  = careerData.subjects.find(s => s.id === pid);
          const st  = progress[pid];
          const met = st === 'cursada' || st === 'aprobada';
          const cls = met ? (st === 'aprobada' ? 'met' : 'met-cursada') : 'not-met';
          const ico = met ? '✓' : '✖';
          html += '<div class="prereq-item ' + cls + '">' + ico + ' ' + escHtml(ps?.name || pid) + '</div>';
        });
      }

      if (subject.prereqAprobada?.length) {
        html += '<div class="modal-label" style="margin-top:8px">Aprobada requerida:</div>';
        subject.prereqAprobada.forEach(pid => {
          const ps  = careerData.subjects.find(s => s.id === pid);
          const met = progress[pid] === 'aprobada';
          const cls = met ? 'met' : 'not-met';
          const ico = met ? '✓' : '✖';
          html += '<div class="prereq-item ' + cls + '">' + ico + ' ' + escHtml(ps?.name || pid) + '</div>';
        });
      }
    }

    html += '</div></div>';

    content.innerHTML = html;
    overlay.classList.remove('hidden');
  }

  function statusBtn(value, label, currentValue, subjectId) {
    const isActive = (value === currentValue) || (value === null && !currentValue);
    const cls = isActive ? ' is-active' : '';
    const key = value || 'ninguna';
    return '<button class="status-btn sbtn-' + key + cls + '" ' +
           'onclick="TRACKER_UI.setStatus(\'' + subjectId + '\', ' +
           (value ? '\'' + value + '\'' : 'null') + ')">' +
           label + '</button>';
  }

  function closeModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
  }

  // ── Cambio de estado (llamado desde modal) ─────────
  window.TRACKER_UI = {
    setStatus(subjectId, value) {
      if (value === null) {
        delete progress[subjectId];
      } else {
        progress[subjectId] = value;
      }

      // La nota solo aplica a materias aprobadas
      if (value !== 'aprobada') clearNota(subjectId);

      rerenderCards();
      updateStats();
      refreshModalButtons(subjectId, value);
      updateNotaRow(subjectId, value);
      scheduleSave();
    },

    setNota(subjectId, raw) {
      const n = parseFloat(raw);
      if (isNaN(n)) {
        setNotaValue(subjectId, null);
      } else {
        setNotaValue(subjectId, Math.round(Math.min(10, Math.max(1, n)) * 100) / 100);
      }
      rerenderCards();
      updateStats();
      scheduleSave();
    }
  };

  // ── Notas ──────────────────────────────────────────
  function getNota(id) {
    const n = notas[id];
    return (typeof n === 'number' && !isNaN(n)) ? n : null;
  }
  function setNotaValue(id, n) {
    if (n == null) delete notas[id];
    else           notas[id] = n;
  }
  function clearNota(id) {
    delete notas[id];
  }
  function fmtNota(n) {
    return Number.isInteger(n) ? String(n) : String(n);
  }

  function updateNotaRow(subjectId, value) {
    const row   = document.getElementById('nota-row');
    const input = document.getElementById('nota-input');
    if (!row) return;
    if (value === 'aprobada') {
      row.classList.remove('hidden');
      if (input) { const n = getNota(subjectId); input.value = (n != null ? n : ''); }
    } else {
      row.classList.add('hidden');
      if (input) input.value = '';
    }
  }

  function rerenderCards() {
    const thresholds  = careerData.semesterThresholds || {};
    const allStatuses = computeAllStatuses(progress, careerData.subjects, thresholds);

    careerData.subjects.forEach(subj => {
      const card = document.querySelector('.subject-card[data-id="' + subj.id + '"]');
      if (!card) return;

      const si = allStatuses[subj.id];
      card.className = 'subject-card status-' + si.status;

      const badge = card.querySelector('.subject-badge');
      const hint  = card.querySelector('.subject-hint');
      if (badge) badge.textContent = STATUS_LABEL[si.status];
      if (hint)  hint.textContent  = si.status === 'bloqueada' ? '? ver info' : '↓ click';

      // Re-bind click con info actualizada
      card.replaceWith(buildSubjectCard(subj, si));
    });

    updateOverview(allStatuses);
    refreshYearTags(allStatuses);
  }

  // Actualiza el tag "✓ COMPLETO" de cada año sin tocar el colapso
  function refreshYearTags(allStatuses) {
    const years = [...new Set(careerData.subjects.map(s => s.year))];
    years.forEach(year => {
      const sec = document.getElementById('year-' + year);
      if (!sec) return;
      const subs   = careerData.subjects.filter(s => s.year === year);
      const allApr = subs.every(s => allStatuses[s.id].status === 'aprobada');
      const tag    = sec.querySelector('.year-done-tag');
      if (allApr && !tag) {
        const t = document.createElement('span');
        t.className   = 'year-done-tag';
        t.textContent = '✓ COMPLETO';
        sec.querySelector('.year-header')
           .insertBefore(t, sec.querySelector('.year-toggle'));
      } else if (!allApr && tag) {
        tag.remove();
      }
    });
  }

  function refreshModalButtons(subjectId, currentValue) {
    document.querySelectorAll('.status-btn').forEach(btn => {
      btn.classList.remove('is-active');
    });
    const activeKey = currentValue || 'ninguna';
    const activeBtn = document.querySelector('.sbtn-' + activeKey);
    if (activeBtn) activeBtn.classList.add('is-active');
  }

  // ── Stats ──────────────────────────────────────────
  function updateStats() {
    const thresholds = careerData.semesterThresholds || {};
    const stats      = getProgressStats(progress, careerData.subjects, thresholds, notas);

    document.getElementById('count-aprobadas').textContent  = stats.aprobadas;
    document.getElementById('count-cursando').textContent   = stats.cursando;
    document.getElementById('count-cursadas').textContent   = stats.cursadas;
    document.getElementById('count-disponibles').textContent= stats.disponibles;
    document.getElementById('count-total').textContent      = stats.total;

    document.getElementById('progress-pct').textContent     = stats.pct + '%';
    document.getElementById('progress-bar').style.width     = stats.pct + '%';

    const promEl = document.getElementById('promedio-num');
    const metaEl = document.getElementById('promedio-meta');
    if (stats.promedio != null) {
      promEl.textContent = stats.promedio.toFixed(2);
      metaEl.textContent = '(' + stats.notasCount + ' nota' +
                           (stats.notasCount === 1 ? '' : 's') + ')';
    } else {
      promEl.textContent = '—';
      metaEl.textContent = 'sin notas cargadas';
    }
  }

  // ── Guardado ───────────────────────────────────────
  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      const params    = new URLSearchParams(window.location.search);
      const studentId = params.get('s');
      const ok        = await DATA.saveProgress(studentId, progress, notas);
      if (ok) showToast();
    }, 1200);
  }

  function showToast() {
    const toast = document.getElementById('save-toast');
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 2000);
  }

  // ── Helpers ────────────────────────────────────────
  function ordinal(n) {
    return ['PRIMER','SEGUNDO','TERCER','CUARTO','QUINTO','SEXTO'][n - 1] || (n + '°');
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function showFatalError(msg) {
    document.getElementById('tracker-main').innerHTML =
      '<div class="pixel-box" style="margin:24px">' +
      '<div class="box-title">ERROR</div>' +
      '<div class="box-content"><p style="font-size:0.5rem">' + escHtml(msg) + '</p></div>' +
      '</div>';
  }

  // ── Arrancar ───────────────────────────────────────
  init();

})();
