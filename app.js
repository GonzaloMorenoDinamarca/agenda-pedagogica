/* Agenda Pedagógica · cargador.
   El código de la agenda está en partes/app-1.js … app-6.js (se publica en partes por su tamaño).
   Este archivo las une en orden y las ejecuta como un solo script. Sin internet, las partes salen del caché de sw.js. */
(function () {
  var PARTES = ['partes/app-1.js', 'partes/app-2.js', 'partes/app-3.js', 'partes/app-4.js', 'partes/app-5.js', 'partes/app-6.js'];
  function fallo() {
    var el = document.getElementById('app');
    if (el) el.innerHTML = '<p class="alerta" role="alert">No se pudo abrir la agenda. Conéctate a internet una vez y vuelve a abrirla.</p>';
  }
  Promise.all(PARTES.map(function (u) {
    return fetch(u).then(function (r) { if (!r.ok) throw new Error(u); return r.text(); });
  })).then(function (textos) {
    var s = document.createElement('script');
    s.textContent = textos.join('') + '\n//# sourceURL=agenda.js';
    document.body.appendChild(s);
  }).catch(fallo);
})();
