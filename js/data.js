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
   * Guarda el progreso del estudiante (campo `progress`) y, en una
   * actualización aparte, las notas finales (campo `notas`).
   *
   * Se hacen en dos `update()` separados a propósito: si todavía no
   * desplegaste las reglas que permiten `notas`, ese update fallará pero
   * el de `progress` ya quedó guardado igual (no se pierde el avance).
   *
   * @returns {boolean} true si al menos el progreso se guardó.
   */
  async saveProgress(studentId, progress, notas) {
    const ref = db.collection('students').doc(studentId);

    let progressOk = false;
    try {
      await ref.update({ progress });
      progressOk = true;
    } catch (err) {
      console.error('[CORRELATIV] Error al guardar progreso:', err);
    }

    if (notas !== undefined) {
      try {
        await ref.update({ notas });
      } catch (err) {
        console.error('[CORRELATIV] Error al guardar notas '
          + '(¿faltan desplegar las Firestore Rules para `notas`?):', err);
      }
    }

    return progressOk;
  }

};
