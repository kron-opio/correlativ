/**
 * CORRELATIV — Motor de correlatividades
 *
 * Lógica pura: sin Firebase, sin DOM.
 * Se puede testear de forma independiente.
 *
 * Dos tipos de prerrequisito (según reglamento UNA):
 *   prereqCursada  → la materia debe estar CURSADA o APROBADA
 *   prereqAprobada → la materia debe estar APROBADA (nota final)
 *
 * Umbrales de cuatrimestre:
 *   semesterThresholds[sem] = { minCursadas, minAprobadas }
 *   (conteo acumulado de TODAS las materias, no solo de ese cuatrimestre)
 */

/**
 * Calcula el estado de UNA materia.
 *
 * @param {string}   subjectId
 * @param {Object}   progress            — { [subjectId]: 'cursada'|'aprobada' }
 * @param {Object[]} allSubjects         — lista completa de materias de la carrera
 * @param {Object}   semesterThresholds  — { [sem]: {minCursadas, minAprobadas} }
 *
 * @returns {{
 *   status: 'aprobada'|'cursada'|'disponible'|'bloqueada',
 *   missingCursada:   string[],   ids de prereqCursada no cumplidos
 *   missingAprobada:  string[],   ids de prereqAprobada no cumplidos
 *   missingThreshold: string|null texto descriptivo si falta umbral
 * }}
 */
function computeSubjectStatus(subjectId, progress, allSubjects, semesterThresholds) {
  const subject = allSubjects.find(s => s.id === subjectId);
  if (!subject) {
    return { status: 'bloqueada', missingCursada: [], missingAprobada: [], missingThreshold: null };
  }

  // Si el usuario ya marcó un estado, ese estado es definitivo
  const userState = progress[subjectId];
  if (userState === 'aprobada') {
    return { status: 'aprobada', missingCursada: [], missingAprobada: [], missingThreshold: null };
  }
  if (userState === 'cursada') {
    return { status: 'cursada', missingCursada: [], missingAprobada: [], missingThreshold: null };
  }
  if (userState === 'cursando') {
    return { status: 'cursando', missingCursada: [], missingAprobada: [], missingThreshold: null };
  }

  // Conteos globales
  const totalAprobadas = Object.values(progress).filter(v => v === 'aprobada').length;
  const totalCursadas  = Object.values(progress).filter(v => v === 'cursada' || v === 'aprobada').length;

  // Verificar umbral de cuatrimestre
  let missingThreshold = null;
  const threshold = (semesterThresholds || {})[String(subject.sem)];
  if (threshold) {
    if (threshold.minAprobadas > 0 && totalAprobadas < threshold.minAprobadas) {
      missingThreshold =
        `Umbral: necesitás ${threshold.minAprobadas} materias aprobadas — tenés ${totalAprobadas}`;
    } else if (threshold.minCursadas > 0 && totalCursadas < threshold.minCursadas) {
      missingThreshold =
        `Umbral: necesitás ${threshold.minCursadas} materia(s) con cursada aprobada — tenés ${totalCursadas}`;
    }
  }

  // Verificar prereqs individuales
  const missingCursada = (subject.prereqCursada || []).filter(pid => {
    const s = progress[pid];
    return s !== 'cursada' && s !== 'aprobada';
  });

  const missingAprobada = (subject.prereqAprobada || []).filter(pid => {
    return progress[pid] !== 'aprobada';
  });

  const isBlocked =
    missingCursada.length > 0 ||
    missingAprobada.length > 0 ||
    missingThreshold !== null;

  return {
    status: isBlocked ? 'bloqueada' : 'disponible',
    missingCursada,
    missingAprobada,
    missingThreshold
  };
}

/**
 * Calcula el estado de TODAS las materias de la carrera.
 *
 * @returns {Object} — { [subjectId]: resultado de computeSubjectStatus }
 */
function computeAllStatuses(progress, allSubjects, semesterThresholds) {
  const result = {};
  allSubjects.forEach(subject => {
    result[subject.id] = computeSubjectStatus(
      subject.id,
      progress,
      allSubjects,
      semesterThresholds
    );
  });
  return result;
}

/**
 * Estadísticas de progreso.
 */
function getProgressStats(progress, allSubjects, semesterThresholds) {
  const total     = allSubjects.length;
  const aprobadas = Object.values(progress).filter(v => v === 'aprobada').length;
  const cursadas  = Object.values(progress).filter(v => v === 'cursada').length;
  const cursando  = Object.values(progress).filter(v => v === 'cursando').length;

  const statuses    = computeAllStatuses(progress, allSubjects, semesterThresholds);
  const disponibles = Object.values(statuses).filter(s => s.status === 'disponible').length;

  return {
    total,
    aprobadas,
    cursadas,
    cursando,
    disponibles,
    pct: total > 0 ? Math.round((aprobadas / total) * 100) : 0
  };
}
