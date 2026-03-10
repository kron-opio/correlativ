/**
 * CORRELATIV — Capa de datos (Firestore)
 */

const DATA = {

  /**
   * Carga el perfil de un estudiante por su ID.
   * @returns {Object|null}
   */
  async getStudent(studentId) {
    try {
      const doc = await db.collection('students').doc(studentId).get();
      if (!doc.exists) return null;
      return { id: doc.id, ...doc.data() };
    } catch (err) {
      console.error('[CORRELATIV] Error al cargar estudiante:', err);
      return null;
    }
  },

  /**
   * Carga los datos de una carrera (materias + umbrales).
   * @returns {Object|null}
   */
  async getCareer(careerId) {
    try {
      const doc = await db.collection('careers').doc(careerId).get();
      if (!doc.exists) return null;
      return { id: doc.id, ...doc.data() };
    } catch (err) {
      console.error('[CORRELATIV] Error al cargar carrera:', err);
      return null;
    }
  },

  /**
   * Guarda el progreso del estudiante.
   * Solo actualiza el campo `progress` (por reglas de Firestore).
   * @returns {boolean}
   */
  async saveProgress(studentId, progress) {
    try {
      await db.collection('students').doc(studentId).update({ progress });
      return true;
    } catch (err) {
      console.error('[CORRELATIV] Error al guardar progreso:', err);
      return false;
    }
  }

};
