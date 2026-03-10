/**
 * CORRELATIV — Controlador de la página de inicio
 */

(function () {

  // Si la URL ya trae ?s=xxx, redirigir directo al tracker
  const params = new URLSearchParams(window.location.search);
  const studentId = params.get('s');
  if (studentId && studentId.trim()) {
    window.location.href = 'tracker.html?s=' + encodeURIComponent(studentId.trim());
    return;
  }

  const form      = document.getElementById('landing-form');
  const input     = document.getElementById('student-id');
  const errorMsg  = document.getElementById('error-msg');
  const submitBtn = document.getElementById('submit-btn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = input.value.trim();
    if (!id) return;

    errorMsg.classList.add('hidden');
    submitBtn.textContent = '▶ VERIFICANDO...';
    submitBtn.disabled = true;

    try {
      const student = await DATA.getStudent(id);
      if (student) {
        window.location.href = 'tracker.html?s=' + encodeURIComponent(id);
      } else {
        errorMsg.classList.remove('hidden');
        resetBtn();
      }
    } catch {
      errorMsg.classList.remove('hidden');
      resetBtn();
    }
  });

  function resetBtn() {
    submitBtn.textContent = '▶ ACCEDER';
    submitBtn.disabled = false;
  }

})();
