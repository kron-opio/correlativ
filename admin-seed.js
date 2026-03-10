/**
 * CORRELATIV — Script de carga inicial (admin)
 *
 * Uso:
 *   1. npm install
 *   2. Bajá tu clave de servicio desde Firebase Console:
 *      Configuración del proyecto → Cuentas de servicio → Generar nueva clave privada
 *      Guardala como `serviceAccountKey.json` en la raíz de este proyecto
 *      ⚠️  NUNCA subas ese archivo a git (ya está en .gitignore)
 *   3. node admin-seed.js
 *
 * Para agregar estudiantes: editá el array STUDENTS al final del archivo
 * y volvé a correr el script. Solo se agregan los nuevos (no pisa los existentes).
 *
 * Para agregar una carrera nueva: agregá un objeto similar a CURADURIA_2015
 * y llamalo en la función seed().
 */

const admin          = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// ══════════════════════════════════════════════════════════════
// CARRERA: LICENCIATURA EN CURADURÍA EN ARTES
// UNA — Plan 2015
// ══════════════════════════════════════════════════════════════

const CURADURIA_2015 = {
  name:        'Licenciatura en Curaduría en Artes',
  institution: 'UNA — Crítica de Artes',
  planYear:    2015,

  // Umbrales por cuatrimestre
  // sem 2  → necesitás 1 materia con cursada aprobada (del sem 1)
  // sem 3/4 → 4 materias aprobadas (para pasar al 2° año)
  // sem 5/6 → 8 materias aprobadas (para pasar al 3° año)
  // sem 7   → 18 materias aprobadas (para pasar al 4° año)
  // sem 8   → 20 materias aprobadas
  semesterThresholds: {
    '2': { minCursadas: 1, minAprobadas: 0 },
    '3': { minCursadas: 0, minAprobadas: 4 },
    '4': { minCursadas: 0, minAprobadas: 4 },
    '5': { minCursadas: 0, minAprobadas: 8 },
    '6': { minCursadas: 0, minAprobadas: 8 },
    '7': { minCursadas: 0, minAprobadas: 18 },
    '8': { minCursadas: 0, minAprobadas: 20 },
  },

  subjects: [

    // ── AÑO 1 · CUATRIMESTRE 1 ────────────────────────────────
    {
      id:            'lenguajes-artisticos',
      name:          'Lenguajes Artísticos',
      year: 1, sem: 1,
      prereqCursada:  [],
      prereqAprobada: [],
    },
    {
      id:            'taller-herramientas-digitales',
      name:          'Taller de Herramientas Digitales',
      year: 1, sem: 1,
      prereqCursada:  [],
      prereqAprobada: [],
    },
    {
      id:            'taller-escritura-1',
      name:          'Taller de Producción de Escritura crítica y curatorial 1',
      year: 1, sem: 1,
      prereqCursada:  [],
      prereqAprobada: [],
    },
    {
      id:            'historia-artes-visuales',
      name:          'Historia de las Artes Visuales',
      year: 1, sem: 1,
      prereqCursada:  [],
      prereqAprobada: [],
    },

    // ── AÑO 1 · CUATRIMESTRE 2 ────────────────────────────────
    // (umbral: 1 cursada aprobada)
    {
      id:            'historia-artes-musicales',
      name:          'Historia de las Artes Musicales',
      year: 1, sem: 2,
      prereqCursada:  [],
      prereqAprobada: [],
    },
    {
      id:            'estudios-curatoriales-1',
      name:          'Estudios Curatoriales 1: Introducción a la Curaduría',
      year: 1, sem: 2,
      prereqCursada:  ['historia-artes-visuales'],
      prereqAprobada: [],
    },
    {
      id:            'espacio-electivo',
      name:          'Espacio Curricular Electivo',
      year: 1, sem: 2,
      prereqCursada:  [],
      prereqAprobada: [],
    },
    {
      id:            'semiotica-teorias-com',
      name:          'Semiótica y Teorías de la comunicación',
      year: 1, sem: 2,
      prereqCursada:  [],
      prereqAprobada: [],
    },

    // ── AÑO 2 · CUATRIMESTRE 3 ────────────────────────────────
    // (umbral: 4 aprobadas)
    {
      id:            'semiotica-general',
      name:          'Semiótica General',
      year: 2, sem: 3,
      prereqCursada:  ['semiotica-teorias-com'],
      prereqAprobada: [],
    },
    {
      id:            'historia-artes-dramaticas',
      name:          'Historia de las Artes Dramáticas',
      year: 2, sem: 3,
      prereqCursada:  [],
      prereqAprobada: [],
    },
    {
      id:            'historia-artes-movimiento',
      name:          'Historia de las Artes del Movimiento',
      year: 2, sem: 3,
      prereqCursada:  [],
      prereqAprobada: [],
    },
    {
      id:            'estudios-curatoriales-2',
      name:          'Estudios Curatoriales 2: Gestión del Patrimonio',
      year: 2, sem: 3,
      prereqCursada:  ['estudios-curatoriales-1'],
      prereqAprobada: [],
    },

    // ── AÑO 2 · CUATRIMESTRE 4 ────────────────────────────────
    // (umbral: 4 aprobadas, igual que sem 3)
    {
      id:            'teoria-estilos',
      name:          'Teoría de los Estilos',
      year: 2, sem: 4,
      prereqCursada:  ['semiotica-general'],
      prereqAprobada: ['semiotica-teorias-com'],
    },
    {
      id:            'historia-artes-audiovisuales',
      name:          'Historia de las Artes Audiovisuales',
      year: 2, sem: 4,
      prereqCursada:  [],
      prereqAprobada: [],
    },
    {
      id:            'estetica-general',
      name:          'Estética General',
      year: 2, sem: 4,
      prereqCursada:  [],
      prereqAprobada: [],
    },
    {
      id:            'estudios-curatoriales-3',
      name:          'Estudios Curatoriales 3: Dispositivos de la puesta en escena',
      year: 2, sem: 4,
      prereqCursada:  ['estudios-curatoriales-1'],
      prereqAprobada: [],
    },

    // ── AÑO 3 · CUATRIMESTRE 5 ────────────────────────────────
    // (umbral: 8 aprobadas)
    {
      id:            'taller-escritura-2',
      name:          'Taller de Producción de Escritura crítica y curatorial 2',
      year: 3, sem: 5,
      prereqCursada:  [],
      prereqAprobada: ['taller-escritura-1'],
    },
    {
      id:            'arte-sociedad-critica',
      name:          'Arte, Sociedad y Crítica',
      year: 3, sem: 5,
      prereqCursada:  ['estetica-general'],
      prereqAprobada: [],
    },
    {
      id:            'semiotica-artes',
      name:          'Semiótica de las Artes',
      year: 3, sem: 5,
      prereqCursada:  ['semiotica-general'],
      prereqAprobada: ['semiotica-teorias-com'],
    },

    // ── AÑO 3 · CUATRIMESTRE 6 ────────────────────────────────
    // (umbral: 8 aprobadas, igual que sem 5)
    {
      id:            'taller-difusion-artistica',
      name:          'Taller de diseño y planificación de la difusión artística',
      year: 3, sem: 6,
      prereqCursada:  [],
      prereqAprobada: ['taller-escritura-2'],
    },
    {
      id:            'proyecto-curatorial-1',
      name:          'Proyecto Curatorial 1',
      year: 3, sem: 6,
      prereqCursada:  ['estudios-curatoriales-2', 'estudios-curatoriales-3'],
      prereqAprobada: ['estudios-curatoriales-1'],
    },
    {
      id:            'taller-curaduria-audiovisual',
      name:          'Taller de Curaduría en Medios Audiovisuales y Digitales',
      year: 3, sem: 6,
      prereqCursada:  ['taller-herramientas-digitales'],
      prereqAprobada: [],
    },

    // ── AÑO 4 · CUATRIMESTRE 7 ────────────────────────────────
    // (umbral: 18 aprobadas)
    {
      id:            'semiotica-proyectos-curatoriales',
      name:          'Semiótica y Proyectos curatoriales',
      year: 4, sem: 7,
      prereqCursada:  ['semiotica-artes'],
      prereqAprobada: ['semiotica-general'],
    },
    {
      id:            'proyecto-curatorial-2',
      name:          'Proyecto Curatorial 2',
      year: 4, sem: 7,
      prereqCursada:  ['estudios-curatoriales-2', 'estudios-curatoriales-3'],
      prereqAprobada: ['estudios-curatoriales-1', 'proyecto-curatorial-1'],
    },
    {
      id:            'seminario-practica-1',
      name:          'Seminario de Práctica Curatorial 1 (Del Lenguaje Específico)',
      year: 4, sem: 7,
      prereqCursada:  [],
      prereqAprobada: [],
    },

    // ── AÑO 4 · CUATRIMESTRE 8 ────────────────────────────────
    // (umbral: 20 aprobadas)
    {
      id:            'seminario-practica-2',
      name:          'Seminario de Práctica Curatorial 2 (del lenguaje específico)',
      year: 4, sem: 8,
      prereqCursada:  [],
      prereqAprobada: [],
    },
    {
      id:            'proyecto-curatorial-3',
      name:          'Proyecto Curatorial 3 (final)',
      year: 4, sem: 8,
      prereqCursada:  [],
      prereqAprobada: ['proyecto-curatorial-2'],
    },

  ],
};

// ══════════════════════════════════════════════════════════════
// ESTUDIANTES NUEVOS
//
// Agregá acá los estudiantes que querés cargar.
// Cada vez que corras el script, se insertan solo los que tienen
// un nombre que no existe todavía (compara por nombre exacto).
//
// El script imprime la URL única de cada estudiante → mandásela
// por donde quieras (WhatsApp, mail, etc.)
// ══════════════════════════════════════════════════════════════

const STUDENTS = [
  // { name: 'Nombre Apellido', careerId: 'curaduria-2015' },
  // { name: 'Otra Persona',    careerId: 'curaduria-2015' },
];

// ── URL base de tu GitHub Pages ────────────────────────────────
// Reemplazá TU_USUARIO y TU_REPO con los tuyos
const BASE_URL = 'https://TU_USUARIO.github.io/TU_REPO';

// ══════════════════════════════════════════════════════════════
// SEED
// ══════════════════════════════════════════════════════════════

async function seed() {
  console.log('\n🌸 CORRELATIV — SEED SCRIPT\n');

  // 1. Cargar carrera
  console.log('📚 Cargando carrera: ' + CURADURIA_2015.name + ' ...');
  await db.collection('careers').doc('curaduria-2015').set(CURADURIA_2015);
  console.log('   ✓ Carrera cargada (' + CURADURIA_2015.subjects.length + ' materias)\n');

  // 2. Insertar estudiantes (solo los nuevos)
  if (STUDENTS.length === 0) {
    console.log('ℹ  No hay estudiantes en STUDENTS[]. Para agregar, editá ese array.\n');
  } else {
    console.log('👩‍🎓 Generando estudiantes nuevos:\n');

    // Chequear cuáles ya existen por nombre
    const existing = await db.collection('students').get();
    const existingNames = new Set(existing.docs.map(d => d.data().name));

    for (const s of STUDENTS) {
      if (existingNames.has(s.name)) {
        console.log('   ~ ' + s.name + ' (ya existe, saltado)');
        continue;
      }

      const id = uuidv4();
      await db.collection('students').doc(id).set({
        name:     s.name,
        careerId: s.careerId,
        progress: {},
      });

      console.log('   ✓ ' + s.name);
      console.log('     URL: ' + BASE_URL + '/tracker.html?s=' + id + '\n');
    }
  }

  console.log('✅ Listo.\n');
  process.exit(0);
}

seed().catch(err => {
  console.error('\n❌ Error:', err.message || err);
  process.exit(1);
});
