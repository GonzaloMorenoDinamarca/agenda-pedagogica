/* Agenda Pedagógica · Liceo A-1 de Arica
   Pensada para la Boox Go 10.3 Gen 1: tinta electrónica monocroma, sin animaciones, todo funciona sin internet.
   Los datos viven solo en este dispositivo (IndexedDB, con localStorage como reserva). */
(function(){
'use strict';

/* =================== Constantes =================== */
var APP='agenda-pedagogica';
var LS_DATOS=APP+':datos', LS_UI=APP+':ui';
var SB_URL='https://zeeifjoiqlotltsckfii.supabase.co';
var SB_KEY='sb_publishable_LT1f75UiZEoR_Fv8xVIK-w_n_dB6FKf';
var PDFJS='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
var ETAPAS=['Investigación','Diseño','Prototipo','Pruebas','Presentación'];
var ESTADOS=[{k:'ok',t:'Al día',g:'✓'},{k:'atencion',t:'Requiere atención',g:'!'},{k:'riesgo',t:'En riesgo',g:'✕'}];
var DIAS=[[1,'L','Lunes'],[2,'M','Martes'],[3,'X','Miércoles'],[4,'J','Jueves'],[5,'V','Viernes'],[6,'S','Sábado']];
var ATT={present:'Presente',absent:'Ausente',late:'Atraso'};
var POR_PAGINA=4, POR_PAGINA_CLASES=10;
var TABS=[['hoy','Hoy'],['asistencia','Asistencia'],['notas','Notas'],['clases','Clases'],['disertaciones','Disertaciones'],['bitacora','Bitácora']];
var $app=document.getElementById('app');
var mqAncho=window.matchMedia('(min-width: 760px)');

/* =================== Utilidades =================== */
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8);}
function pad(n){return String(n).padStart(2,'0');}
function isoDe(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
function hoyISO(){return isoDe(new Date());}
function ahora(){return new Date().toISOString();}
function parseISO(s){var m=/^(\d{4})-(\d{2})-(\d{2})/.exec(s||'');return m?new Date(+m[1],+m[2]-1,+m[3]):null;}
function sumarDias(iso,n){var d=parseISO(iso)||new Date();d.setDate(d.getDate()+n);return isoDe(d);}
var fmtLarga=new Intl.DateTimeFormat('es-CL',{weekday:'short',day:'numeric',month:'short',year:'numeric'});
var fmtCorta=new Intl.DateTimeFormat('es-CL',{day:'numeric',month:'short'});
var fmtDia=new Intl.DateTimeFormat('es-CL',{weekday:'long',day:'numeric',month:'long'});
var fmtHora=new Intl.DateTimeFormat('es-CL',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
function sinPuntos(s){return s.replace(/\./g,'');}
function fLarga(s){var d=parseISO(s);return d?sinPuntos(fmtLarga.format(d)):'Sin fecha';}
function fCorta(s){var d=parseISO(s);return d?sinPuntos(fmtCorta.format(d)):'';}
function fDia(s){var d=parseISO(s);return d?fmtDia.format(d):'';}
function fHora(iso){try{return sinPuntos(fmtHora.format(new Date(iso)));}catch(e){return '';}}
function ddmm(s){var m=/^(\d{4})-(\d{2})-(\d{2})/.exec(s||'');return m?m[3]+'/'+m[2]:'';}
function pl(n,s1,s2){return n+' '+(n===1?s1:s2);}
function cap(s){s=String(s||'');return s.charAt(0).toUpperCase()+s.slice(1);}
function num(n,dec){if(n==null||isNaN(n))return '—';var s=dec==null?String(Math.round(n*10)/10):Number(n).toFixed(dec);return s.replace('.',',');}
function mmss(seg){seg=Math.max(0,Math.round(seg||0));return pad(Math.floor(seg/60))+':'+pad(seg%60);}
function clonar(o){return JSON.parse(JSON.stringify(o));}
function slug(s){return String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'archivo';}
function normNombre(s){return String(s==null?'':s).normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/\s+/g,' ').trim().toLowerCase();}
var colador=new Intl.Collator('es',{sensitivity:'base',numeric:true});
function cmp(a,b){return colador.compare(String(a==null?'':a),String(b==null?'':b));}
function foco(id){setTimeout(function(){var el=document.getElementById(id);if(el){try{el.focus();}catch(e){}}},0);}
function esAncho(){return mqAncho.matches;}
function isoLocal(iso){iso=String(iso||'');return iso.indexOf('T')>0?isoDe(new Date(iso)):iso.slice(0,10);}
function diasDesde(iso){if(!iso)return null;var d=parseISO(isoLocal(iso));if(!d)return null;return Math.round((parseISO(hoyISO())-d)/86400000);}
var MINUS={de:1,del:1,y:1,la:1,las:1,el:1,los:1,en:1,a:1,e:1,o:1,u:1,por:1,para:1,con:1};
function tit(s){s=String(s||'').trim();if(!s||s!==s.toUpperCase()||!/[A-ZÁÉÍÓÚÑ]{3}/.test(s))return s;return s.toLowerCase().split(/\s+/).map(function(w,i){return (i>0&&MINUS[w])?w:w.charAt(0).toUpperCase()+w.slice(1);}).join(' ');}
/* Curso: «4A», «4 a», «4°A», «4º A», «4° Medio A» → «4° A» */
function normCurso(c){c=String(c||'').trim().replace(/\s+/g,' ');if(!c)return '';var m=/^(\d)\s*[°º]?\s*(?:medio\s*)?([a-k])$/i.exec(c);return m?m[1]+'° '+m[2].toUpperCase():c;}
function esCurso(s){return /^\d\s*[°º]?\s*(?:medio\s*)?[a-k]$/i.test(String(s||'').trim());}
function apellidos(e){return (e.ap||'')+(e.am?' '+e.am:'');}
function nombreCompleto(e){return ((e.n?e.n+' ':'')+apellidos(e)).trim();}
function nombreCorto(e){return (((e.n||'').split(' ')[0])+' '+(e.ap||'')).trim();}
/* Orden oficial de la lista: curso, apellido paterno, apellido materno, nombres. Sin curso, al final. */
function cmpEst(a,b,soloApellido){return (soloApellido?0:((a.c?0:1)-(b.c?0:1)||cmp(a.c,b.c)))||cmp(a.ap,b.ap)||cmp(a.am,b.am)||cmp(a.n,b.n);}
function ordenarEst(l,soloApellido){return l.slice().sort(function(a,b){return cmpEst(a,b,soloApellido);});}
/* Promedio exacto en décimas (evita 6,55 → 6,5 por coma flotante) */
function promedioDe(vals){var v=vals.filter(function(x){return x!=null&&!isNaN(x);});if(!v.length)return null;var dec=v.reduce(function(a,b){return a+Math.round(b*10);},0);return Math.round(dec/v.length)/10;}
function parseNota(v){v=String(v==null?'':v).trim().replace(',','.');if(/^\d{2}$/.test(v))v=v[0]+'.'+v[1];if(!/^\d(\.\d+)?$/.test(v))return null;var n=parseFloat(v);return (n>=1&&n<=7)?Math.round(n*10)/10:null;}
/* Escala chilena 1,0–7,0: el 4,0 se alcanza con exigencia × puntaje máximo; redondeo a un decimal. */
function nota(p,max,e){e=e||0.6;if(!(max>0))return null;var corte=e*max,n;if(p<corte)n=1+3*p/corte;else n=4+3*(p-corte)/(max-corte);n=Math.round(n*10+1e-9)/10;return Math.min(7,Math.max(1,n));}
function sugerirTiempo(seg,min,nNiv){var d=Math.abs(seg/60-min);var li=d<=1?0:d<=3?1:d<=5?2:3;return Math.min(li,Math.max(0,nNiv-1));}
/* Nombre y descriptores del criterio Tiempo para m minutos, con los mismos tramos de sugerirTiempo (±1, ±3 y ±5 minutos). */
function textosTiempo(m){function u(n){return n===1?' minuto':' minutos';}function r(a,b){return a<=0?'menos de '+b:'entre '+a+' y '+b;}function c(t){return t.charAt(0).toUpperCase()+t.slice(1);}
  return {nombre:'Tiempo ('+m+u(m)+')',desc:[c(r(m-1,m+1)+u(m+1)+'.'),c((m-1>0?r(m-3,m-1)+u(m-1)+', o ':'')+'entre '+(m+1)+' y '+(m+3)+(m-1>0?'.':u(m+3)+'.')),
    c((m-3>0?r(m-5,m-3)+u(m-3)+', o ':'')+'entre '+(m+3)+' y '+(m+5)+(m-3>0?'.':u(m+5)+'.')),c((m-5>0?'menos de '+(m-5)+' o ':'')+'más de '+(m+5)+u(m+5)+'.')]};}
/* Si cambian los minutos previstos, el criterio «Tiempo (N minutos)» se pone al día. Sus descriptores solo cambian si son los
   automáticos (los que la agenda escribió); un texto escrito a mano no se toca. Devuelve los criterios que cambiaron. */
function ajustarTiempo(r){var m=Math.round(+r.minutos),ch=[];if(!(m>0))return ch;
  r.criterios.forEach(function(k,j){var x=/^Tiempo \((\d+) minutos?\)$/.exec(k.nombre||'');if(!x||+x[1]===m)return;var a=textosTiempo(+x[1]),b=textosTiempo(m);
    k.nombre=b.nombre;if(k.auto==='tiempo'&&r.niveles.length===4&&a.desc.every(function(t,i){return k.descriptores[i]===t;}))k.descriptores=b.desc.slice();ch.push(j);});return ch;}

/* =================== Rúbricas de base =================== */
var NIVELES4=[{nombre:'Sobresaliente',puntos:4},{nombre:'Logrado',puntos:3},{nombre:'Medianamente logrado',puntos:2},{nombre:'Por lograr',puntos:1}];
var OA_SALUD='Analizar, sobre la base de la investigación, factores biológicos, ambientales y sociales que influyen en la salud humana.';
var HAB_ARG='Construir, usar y comunicar argumentos científicos.';
var AYUDA_C1='Propio de esta unidad. Para otra, reescribe su nombre y sus cuatro descriptores, no solo el título.';
function crit(id,nombre,peso,alcance,desc,extra){var k={id:id,nombre:nombre,peso:peso,alcance:alcance,descriptores:desc,auto:null,ayuda:''};return Object.assign(k,extra||{});}
function rubricaOriginal(){
  return {nombre:'Exposición oral (tu rúbrica original)',plantilla:'original',objetivo:OA_SALUD,habilidad:HAB_ARG,exigencia:0.6,minutos:15,creado:ahora(),niveles:clonar(NIVELES4),criterios:[
    crit('o1','Contenido',1,'equipo',['Se nota un buen dominio del tema, no comete errores, no duda.','Demuestra un buen entendimiento de partes del tema. Exposición fluida, comete pocos errores.','Tiene que hacer algunas rectificaciones, y en ocasiones duda.','Rectifica continuamente. El contenido es mínimo, no muestra un conocimiento del tema.']),
    crit('o2','Organización de la información',1,'equipo',['La información está bien organizada, de forma clara y lógica.','La mayor parte de la información se organiza de forma clara y lógica, aunque de vez en cuando alguna diapositiva está fuera de lugar.','No existe un plan claro para organizar la información, cierta dispersión.','La información aparece dispersa y poco organizada.']),
    crit('o3','Exposición',1,'equipo',['Atrae la atención del público y mantiene el interés durante toda la exposición.','Interesa bastante en principio, pero se hace un poco monótono.','Le cuesta conseguir o mantener el interés del público.','Apenas usa recursos para mantener la atención del público.']),
    crit('o4','Expresión oral',1,'equipo',['Habla claramente durante toda la presentación. Su pronunciación es correcta. Su tono de voz es adecuado.','Habla claramente durante la mayor parte de la presentación. Su pronunciación es aceptable, pero en ocasiones realiza pausas innecesarias. Su tono de voz es adecuado.','Algunas veces habla claramente durante la presentación. Su pronunciación es correcta, pero recurre frecuentemente al uso de pausas innecesarias. Su tono de voz no es adecuado.','Durante la mayor parte de la presentación no habla claramente. Su pronunciación es pobre, hace muchas pausas y usa muletillas. Su tono de voz no es adecuado para mantener el interés de la audiencia.']),
    crit('o5','Lenguaje no verbal',1,'equipo',['Tiene buena postura, y demuestra seguridad en sí mismo durante la presentación. Establece contacto visual con todos los presentes.','Tiene buena postura la mayor parte del tiempo y establece contacto visual con todos los presentes. En ocasiones se muestra inseguro.','Algunas veces tiene buena postura y en ocasiones establece contacto visual con todos los presentes. Muestra inseguridad.','Tiene mala postura y no establece contacto visual con los presentes. Muestra gran inseguridad.']),
    crit('o6','Tiempo (15 minutos)',1,'equipo',['Tiempo ajustado al previsto, con un final que retoma las ideas principales y redondea la exposición.','Tiempo ajustado al previsto, pero con un final precipitado o alargado por falta de control del tiempo.','Tiempo no ajustado. Exposición excesivamente corta.','Excesivamente largo o insuficiente para desarrollar correctamente el tema.']),
    crit('o7','Soporte',1,'equipo',['La exposición se acompaña de soportes visuales atractivos y de mucha calidad (imágenes, videos, etc.), que se utilizan de manera efectiva para apoyar y mejorar la presentación.','Utiliza soportes visuales adecuados e interesantes (imágenes, videos, etc.), aunque hay margen para mejorar en su uso.','Los recursos visuales utilizados son limitados y poco efectivos, aunque adecuados, no logran captar el interés de los estudiantes (imágenes, videos, etc.).','No se utilizan recursos visuales o se utilizan de manera ineficaz, resultando en soportes visuales inadecuados.']),
    crit('o8','Trabajo en equipo',1,'equipo',['La exposición muestra planificación y trabajo de equipo en el que todos han colaborado. Todos exponen y participan activamente.','Todos los miembros demuestran conocer la presentación global. Todos exponen, aunque hay alguna variación en la participación de los diferentes alumnos.','La exposición muestra cierta planificación entre los miembros. Todos participan, pero no al mismo nivel.','Demasiado individualista. No se ve colaboración. No todos los miembros del equipo exponen.'])
  ]};
}
function rubricaPropuesta(){
  return {nombre:'Disertación científica (propuesta mejorada)',plantilla:'propuesta',objetivo:OA_SALUD,habilidad:HAB_ARG,exigencia:0.6,minutos:15,creado:ahora(),niveles:clonar(NIVELES4),criterios:[
    crit('p1','Análisis de factores biológicos, ambientales y sociales',2,'equipo',['Explica los tres tipos de factores y al menos una relación entre ellos, con un ejemplo concreto del tema.','Explica los tres tipos de factores, pero no los relaciona entre sí.','Explica solo dos tipos de factores.','Explica uno o ningún tipo de factor.'],{ayuda:AYUDA_C1}),
    crit('p2','Argumentación científica (conclusión, evidencia y razonamiento)',2,'equipo',['Plantea una conclusión clara y la respalda con dos o más evidencias (datos, estudios, gráficos), explicando cómo cada una la apoya.','Plantea una conclusión con evidencias, pero explica cómo la apoya solo una de ellas.','Plantea una conclusión con evidencias, pero no explica cómo la apoyan, o las evidencias no se relacionan con ella.','No plantea una conclusión o no presenta evidencias.']),
    crit('p3','Fuentes de información',1,'equipo',['Cita en las diapositivas tres o más fuentes confiables (artículos científicos, MINSAL, OMS u otra institución) con autor y año.','Cita dos fuentes confiables con autor y año, o tres o más con datos incompletos.','Cita una sola fuente confiable, o solo fuentes sin autor verificable (blogs, sitios anónimos).','No cita fuentes.']),
    crit('p4','Estructura',1,'equipo',['Tiene introducción con propósito o pregunta, desarrollo en orden lógico y cierre que retoma las ideas principales.','Tiene las tres partes, pero una está incompleta o hay una diapositiva fuera de orden.','Falta una de las tres partes (introducción, desarrollo o cierre).','Faltan dos o más partes, o la información se presenta sin orden.']),
    crit('p5','Soporte visual',1,'equipo',['Todas las diapositivas se leen desde el fondo de la sala, tienen 6 líneas de texto o menos, y sus imágenes o gráficos tienen título y fuente.','Una o dos diapositivas tienen exceso de texto, letra pequeña o imágenes sin título o fuente.','Tres o más diapositivas tienen exceso de texto, letra pequeña o imágenes sin título o fuente.','No usa soporte visual, o este no se puede leer.']),
    crit('p6','Tiempo (15 minutos)',1,'equipo',['Entre 14 y 16 minutos.','Entre 12 y 14 minutos, o entre 16 y 18.','Entre 10 y 12 minutos, o entre 18 y 20.','Menos de 10 o más de 20 minutos.'],{auto:'tiempo',ayuda:'Al detener el cronómetro, la agenda marca el nivel que corresponde. Puedes cambiarlo.'}),
    crit('p7','Respuesta a preguntas',1,'equipo',['Responde correctamente las dos preguntas y fundamenta con contenidos de la exposición.','Responde correctamente las dos preguntas, pero fundamenta solo una.','Responde correctamente solo una pregunta.','No responde correctamente ninguna pregunta.'],{ayuda:'Haz dos preguntas al equipo al terminar la exposición.'}),
    crit('p8','Dominio de su parte',2,'individual',['Explica su parte sin leer y sin errores conceptuales.','Consulta sus apuntes o la diapositiva ocasionalmente, o comete un error conceptual menor.','Lee gran parte de su intervención, o comete dos errores conceptuales.','Lee toda su intervención, comete tres o más errores conceptuales, o no expone.']),
    crit('p9','Expresión oral',1,'individual',['Se escucha claramente desde el fondo de la sala, con ritmo pausado y 3 muletillas o menos.','Se escucha claramente, pero acelera el ritmo o usa entre 4 y 6 muletillas.','Se escucha con dificultad en varios momentos, o usa más de 6 muletillas.','No se escucha la mayor parte del tiempo.']),
    crit('p10','Contacto visual y postura',1,'individual',['Mira al público durante casi toda su intervención y se mantiene de frente a la audiencia.','Mira al público la mayor parte del tiempo, pero a veces da la espalda o se apoya.','Mira principalmente la pantalla o sus apuntes.','No mira al público.'])
  ]};
}
/* Igual a la propuesta mejorada, pero con un C1 general: sirve para cualquier unidad sin escribir nada. */
function rubricaGeneral(){var r=rubricaPropuesta();r.nombre='Disertación científica (cualquier tema)';r.plantilla='general';r.objetivo='';
  r.criterios[0]=crit('g1','Explicación del contenido científico',2,'equipo',['Explica correctamente los conceptos clave del tema y cómo se relacionan entre sí, con un ejemplo concreto.','Explica correctamente los conceptos clave, pero no los relaciona entre sí.','Explica solo algunos conceptos clave, o con imprecisiones.','Menciona el tema sin explicar sus conceptos clave, o comete errores conceptuales importantes.'],{ayuda:'Sirve para cualquier tema. Para más precisión, duplícala y nombra los conceptos clave de la unidad.'});
  return r;}
function rubricaVacia(){return {nombre:'',plantilla:null,objetivo:'',habilidad:'',exigencia:0.6,minutos:null,niveles:clonar(NIVELES4),criterios:[crit(uid(),'',1,'equipo',['','','',''])]};}

/* =================== Almacenamiento =================== */
var S=null;
var almacen={ok:true,tipo:null};
var dbp=null;
function idbAbrir(){return new Promise(function(res,rej){try{if(!window.indexedDB)return rej(new Error('sin idb'));var r=indexedDB.open(APP,1);r.onupgradeneeded=function(){r.result.createObjectStore('kv');};r.onsuccess=function(){res(r.result);};r.onerror=function(){rej(r.error);};r.onblocked=function(){rej(new Error('bloqueado'));};}catch(e){rej(e);}});}
function leerLS(){try{return localStorage.getItem(LS_DATOS);}catch(e){return null;}}
/* De dos copias guardadas, la más reciente (marca meta.guardado, que va al comienzo del texto). */
function marcaDe(raw){var m=/"guardado":(\d+)/.exec(String(raw||'').slice(0,4000));return m?+m[1]:0;}
function masReciente(a,b){if(!a)return b;if(!b)return a;return marcaDe(b)>marcaDe(a)?b:a;}
function leerGuardado(){
  return new Promise(function(res){
    dbp=idbAbrir();
    var listo=false;var t=setTimeout(function(){if(!listo){listo=true;dbp=null;res(leerLS());}},4000);
    dbp.then(function(db){var rq=db.transaction('kv','readonly').objectStore('kv').get('datos');rq.onsuccess=function(){if(listo)return;listo=true;clearTimeout(t);almacen.tipo='idb';res(masReciente(rq.result,leerLS()));};rq.onerror=function(){if(listo)return;listo=true;clearTimeout(t);res(leerLS());};})
      .catch(function(){if(listo)return;listo=true;clearTimeout(t);dbp=null;res(leerLS());});
  });
}
var tGuardar=null,cambios=0,guardados=0;
/* Guarda 1 s después del último cambio (agrupa toques y tecleo en una sola escritura). */
function guardar(){cambios++;clearTimeout(tGuardar);tGuardar=setTimeout(persistir,1000);}
/* urgente: la app pasa a segundo plano o se cierra. Si queda algo sin guardar, además de IndexedDB deja al instante
   una copia en localStorage, que no alcanza a perderse al cerrar; al abrir se usa la más reciente de las dos. */
function persistir(urgente){
  clearTimeout(tGuardar);tGuardar=null;if(!S)return;
  if(urgente===true&&guardados>=cambios)return;
  var v=++cambios;S.meta.guardado=Date.now();
  var str;try{str=JSON.stringify(S);}catch(e){return;}
  if(urgente===true&&dbp){try{localStorage.setItem(LS_DATOS,str);guardados=Math.max(guardados,v);}catch(e){}}
  if(dbp){
    dbp.then(function(db){return new Promise(function(res,rej){var tx=db.transaction('kv','readwrite');tx.objectStore('kv').put(str,'datos');tx.oncomplete=res;tx.onerror=function(){rej(tx.error);};tx.onabort=function(){rej(tx.error);};});})
      .then(function(){guardados=Math.max(guardados,v);marcarAlmacen(true,'idb');}).catch(function(){guardarLS(str,v);});
  } else guardarLS(str,v);
}
function guardarLS(str,v){try{localStorage.setItem(LS_DATOS,str);guardados=Math.max(guardados,v);marcarAlmacen(true,'ls');}catch(e){marcarAlmacen(false);}}
function marcarAlmacen(ok,tipo){var antes=almacen.ok;almacen.ok=ok;if(tipo)almacen.tipo=tipo;if(antes!==ok)render();else pintarGuardado();}

/* =================== Modelo =================== */
function vacio(){return {app:APP,version:1,meta:{creado:ahora(),ultimoRespaldo:null},grupos:[],rubricas:{},disertaciones:{},equipos:{},bitacora:{}};}
function validoGrupo(g){return !!(g&&typeof g==='object'&&g.id&&Array.isArray(g.estudiantes));}
function prepGrupo(g){
  if(!g.asistencia||typeof g.asistencia!=='object')g.asistencia={};
  if(!g.notas||typeof g.notas!=='object')g.notas={};
  if(!g.classLogs||typeof g.classLogs!=='object')g.classLogs={};
  if(!g.calificaciones||typeof g.calificaciones!=='object')g.calificaciones={columns:[],data:{}};
  if(!Array.isArray(g.calificaciones.columns))g.calificaciones.columns=[];
  if(!g.calificaciones.data||typeof g.calificaciones.data!=='object')g.calificaciones.data={};
  g.nivel=String(g.nivel||'4');g.asignatura=g.asignatura||'Sin asignatura';g.grupo=g.grupo||'';
  g.estudiantes.forEach(function(e){if(!e.id)e.id=uid();e.ap=e.ap||'';e.am=e.am||'';e.n=e.n||'';e.c=normCurso(e.c);if(e.ret!=null&&!/^\d{4}-\d{2}-\d{2}$/.test(e.ret))delete e.ret;});
  g.estudiantes.sort(function(a,b){return cmpEst(a,b);});
}
function prepRubrica(r){
  if(!Array.isArray(r.niveles)||!r.niveles.length)r.niveles=clonar(NIVELES4);
  r.criterios=(Array.isArray(r.criterios)?r.criterios:[]).map(function(k){k.id=k.id||uid();k.peso=+k.peso||1;k.alcance=k.alcance==='individual'?'individual':'equipo';k.descriptores=Array.isArray(k.descriptores)?k.descriptores:[];k.ayuda=k.ayuda==='Criterio propio de este OA: cámbialo al usar la rúbrica en otra unidad.'?AYUDA_C1:(k.ayuda||'');k.auto=k.auto||null;return k;});
  r.exigencia=+r.exigencia||0.6;
}
function prepDis(d){
  d.equipos=Array.isArray(d.equipos)?d.equipos:[];
  d.equipos.forEach(function(e){e.id=e.id||uid();e.integrantes=Array.isArray(e.integrantes)?e.integrantes:[];e.nombre=e.nombre||'';e.tema=e.tema||'';});
  if(!d.evals||typeof d.evals!=='object')d.evals={};
}
function normalizar(o){
  var r=vacio();
  if(o&&typeof o==='object'){
    if(o.meta&&typeof o.meta==='object')r.meta=Object.assign(r.meta,o.meta);
    if(Array.isArray(o.grupos))r.grupos=o.grupos.filter(validoGrupo);
    ['rubricas','disertaciones','equipos','bitacora'].forEach(function(k){if(o[k]&&typeof o[k]==='object'&&!Array.isArray(o[k]))r[k]=o[k];});
  }
  r.grupos.forEach(prepGrupo);
  if(!r.meta.rubricaGeneral){if(!r.rubricas['expo-general']){r.rubricas['expo-general']=rubricaGeneral();r.rubricas['expo-general'].creado=ahora();}r.meta.rubricaGeneral=1;}
  Object.keys(r.rubricas).forEach(function(id){prepRubrica(r.rubricas[id]);});
  Object.keys(r.disertaciones).forEach(function(id){prepDis(r.disertaciones[id]);});
  return r;
}
function asistenciaLocal(){try{var raw=localStorage.getItem('asistenciaState');if(!raw)return null;var o=JSON.parse(raw);if(o&&Array.isArray(o.groups)){var gs=o.groups.filter(validoGrupo);return gs.length?gs:null;}}catch(e){}return null;}
function libretaLocal(){try{var raw=localStorage.getItem('libreta-equipos-pautas:datos');if(!raw)return null;var o=JSON.parse(raw);return o&&o.datos&&o.datos.equipos?o.datos:null;}catch(e){return null;}}
function semilla(s){
  s.rubricas['expo-original']=rubricaOriginal();
  s.rubricas['expo-propuesta']=rubricaPropuesta();
  s.rubricas['expo-propuesta'].creado=new Date(Date.now()+1).toISOString();
  s.rubricas['expo-general']=rubricaGeneral();s.rubricas['expo-general'].creado=new Date(Date.now()+2).toISOString();s.meta.rubricaGeneral=1;
  var lib=libretaLocal();
  if(lib&&Object.keys(lib.equipos).length){s.equipos=clonar(lib.equipos);s.bitacora=clonar(lib.bitacora||{});s.meta.migradoLibreta=ahora();return;}
  var t0=Date.now();function t(k){return new Date(t0+k).toISOString();}
  s.equipos.bioc={nombre:'Bio-Centinelas',proyecto:'Prevención del dengue: vigilancia del mosquito Aedes aegypti',categoria:'Olimpiadas de Innovación · Bienestar Comunitario',integrantes:[],etapa:null,estado:'ok',creado:t(0)};
  s.equipos.sior={nombre:'S.I.O.R.',proyecto:'Sistema Inteligente de Optimización de Recursos: gestión de agua, energía y residuos',categoria:'Olimpiadas de Innovación · Bienestar Comunitario',integrantes:[],etapa:'Prototipo',estado:'ok',creado:t(1)};
  s.bitacora['reg-sior-1']={equipoId:'sior',fecha:hoyISO(),avance:'La app de monitoreo de luz y agua del liceo ya está construida.',proximos:'Agregar el módulo de residuos.',apoyo:'',etapa:'Prototipo',estado:'ok',creado:t(2)};
}

/* =================== Estado de la interfaz =================== */
var ui={tab:'hoy',msg:null,undo:null,copiaManual:null,formError:null,actualizacion:false,
  grupoId:null,fecha:hoyISO(),aVista:'lista',ficha:null,soloApellido:false,regAbierto:false,estDraft:null,nuevoEst:null,cursoDatos:null,cursoForm:null,pegar:'',pegarCurso:'',pdfPend:null,
  nSel:null,nCurso:'',evalForm:null,renombrar:null,
  cNivel:'',cGrupo:'',cBuscar:'',cDest:false,cPag:0,cEdit:null,cNuevo:null,
  dVista:'lista',dId:null,dEq:0,dEqActivo:null,dTam:3,dForm:null,rId:null,rDraft:null,
  teamId:null,teamMode:'ver',teamDraft:null,entryOpen:false,entryDraft:null,editingEntry:null,entryPage:0,
  importPend:null,cuenta:{email:'',cargando:false,error:null}};
var crono={inicio:null,acumulado:0,intervalo:null,eqId:null};
var swListo=false, persistente=null;
function guardarUI(){try{localStorage.setItem(LS_UI,JSON.stringify({tab:ui.tab,grupoId:ui.grupoId,aVista:ui.aVista,soloApellido:ui.soloApellido,nSel:ui.nSel,nCurso:ui.nCurso,dId:ui.dId,dVista:ui.dVista,dEq:ui.dEq,teamId:ui.teamId}));}catch(e){}}
function cargarUI(){try{var o=JSON.parse(localStorage.getItem(LS_UI)||'null');if(o)['tab','grupoId','aVista','soloApellido','nSel','nCurso','dId','dVista','dEq','teamId'].forEach(function(k){if(o[k]!=null)ui[k]=o[k];});}catch(e){}
  if(['hoy','asistencia','notas','clases','disertaciones','bitacora','respaldo'].indexOf(ui.tab)<0)ui.tab='hoy';
  if(['lista','stats','curso'].indexOf(ui.aVista)<0)ui.aVista='lista';
  if(['lista','config','evaluar','resumen','rubricas'].indexOf(ui.dVista)<0)ui.dVista='lista';
  ui.dEq=+ui.dEq||0;}

/* =================== Mensajes, deshacer, archivos, impresión =================== */
/* Mensajes y «Deshacer» sin temporizadores: en tinta electrónica, quitarlos solos costaría un refresco extra y movería la pantalla.
   Se ocultan en el siguiente cambio de pantalla, pasado su tiempo. */
function flash(t){ui.msg=t;ui.msgHasta=Date.now()+6500;}
function conDeshacer(texto,fn){var snap=JSON.stringify(S);fn();guardar();ui.undo={texto:texto,snap:snap,hasta:Date.now()+30000};}
function textoGuardado(){var s=almacen.ok?'Guardado en esta tableta':'No se está guardando';if(!navigator.onLine)s+=' · sin conexión';return s;}
function pintarGuardado(){var el=document.getElementById('guardado'),t=textoGuardado();if(el&&el.textContent!==t)el.textContent=t;}
function respaldoPendiente(){
  var hay=S.grupos.some(function(g){return Object.keys(g.asistencia).length;})||Object.keys(S.disertaciones).length||Object.keys(S.bitacora).length>1;
  if(!hay)return null;if(!S.meta.ultimoRespaldo)return 'Respaldo pendiente';
  var d=diasDesde(S.meta.ultimoRespaldo);return d>=7?('Último respaldo hace '+d+' días'):null;
}
function descargar(nombre,texto,tipo){
  try{var blob=new Blob([texto],{type:tipo});var url=URL.createObjectURL(blob);var a=document.createElement('a');a.href=url;a.download=nombre;a.rel='noopener';document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(url);a.remove();},2000);flash('Descarga iniciada: «'+nombre+'». Queda en la carpeta Descargas.');return true;}
  catch(e){ui.copiaManual={titulo:'No se pudo descargar el archivo. Selecciona el texto y cópialo.',texto:texto};return false;}
}
function puedeCompartir(tipo,ext){try{return !!(navigator.canShare&&navigator.canShare({files:[new File(['x'],'x.'+ext,{type:tipo})]}));}catch(e){return false;}}
function compartir(nombre,texto,tipo,alListo){try{var f=new File([texto],nombre,{type:tipo});navigator.share({files:[f],title:nombre}).then(function(){if(alListo)alListo();}).catch(function(e){if(e&&e.name==='AbortError')return;flash('No se pudo compartir. Usa el botón Descargar.');render();});}catch(e){flash('No se pudo compartir. Usa el botón Descargar.');render();}}
function copiar(texto,ok){function manual(){ui.copiaManual={titulo:'Selecciona el texto y cópialo para pegarlo en tu planilla.',texto:texto};render();setTimeout(function(){var t=document.getElementById('copia-manual');if(t){t.focus();t.select();}},0);}
  try{navigator.clipboard.writeText(texto).then(function(){flash(ok);render();},manual);}catch(e){manual();}}
function celdaCSV(v){v=String(v==null?'':v);return /[;"\n\r]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v;}
function aCSV(filas){return '﻿'+filas.map(function(f){return f.map(celdaCSV).join(';');}).join('\r\n');}
function aTSV(filas){return filas.map(function(f){return f.map(function(v){return String(v==null?'':v).replace(/[\t\r\n]+/g,' ');}).join('\t');}).join('\n');}
function parseCSV(text){
  text=String(text||'').replace(/^﻿/,'');var primera=text.split(/\r?\n/)[0]||'';var sep=primera.indexOf(';')>=0?';':(primera.indexOf('\t')>=0?'\t':',');
  var filas=[],fila=[],campo='',q=false;
  for(var i=0;i<text.length;i++){var ch=text[i];
    if(q){if(ch==='"'){if(text[i+1]==='"'){campo+='"';i++;}else q=false;}else campo+=ch;}
    else if(ch==='"')q=true;
    else if(ch===sep){fila.push(campo);campo='';}
    else if(ch==='\n'||ch==='\r'){if(ch==='\r'&&text[i+1]==='\n')i++;fila.push(campo);campo='';if(fila.some(function(x){return x.trim()!=='';}))filas.push(fila);fila=[];}
    else campo+=ch;}
  fila.push(campo);if(fila.some(function(x){return x.trim()!=='';}))filas.push(fila);
  return filas.map(function(f){return f.map(function(x){return x.trim();});});
}
var tituloDoc=document.title;
function imprimir(titulo,sub,html){
  var a=document.getElementById('imprimible');
  a.innerHTML='<div class="imp-cab"><h1>'+esc(titulo)+'</h1><p>'+esc(sub||'')+(sub?' · ':'')+'Liceo A-1 · Arica · '+esc(fLarga(hoyISO()))+'</p></div>'+html;
  document.title=titulo;
  setTimeout(function(){try{window.print();}catch(e){flash('No se pudo abrir la impresión en este navegador.');render();}},50);
}
window.addEventListener('afterprint',function(){document.title=tituloDoc;});

/* =================== Consultas comunes =================== */
function gruposOrden(){return S.grupos.slice().sort(function(a,b){return cmp(a.nivel,b.nivel)||cmp(a.asignatura,b.asignatura)||cmp(a.grupo,b.grupo);});}
function grupoPorId(id){for(var i=0;i<S.grupos.length;i++)if(S.grupos[i].id===id)return S.grupos[i];return null;}
function grupoActual(){var g=grupoPorId(ui.grupoId);if(!g&&S.grupos.length){g=gruposOrden()[0];ui.grupoId=g.id;}return g;}
function nombreGrupo(g){return g.nivel+'° · '+tit(g.asignatura)+(g.grupo?' · '+tit(g.grupo):'');}
function opcionesGrupos(selId,extraNivel){
  var por={};gruposOrden().forEach(function(g){(por[g.nivel]=por[g.nivel]||[]).push(g);});
  return Object.keys(por).sort(cmp).map(function(n){
    return '<optgroup label="'+esc(n)+'° medio">'+(extraNivel?'<option value="n:'+esc(n)+'"'+(selId==='n:'+n?' selected':'')+'>★ Todos los grupos de '+esc(n)+'° medio</option>':'')+
      por[n].map(function(g){var v=extraNivel?'g:'+g.id:g.id;return '<option value="'+esc(v)+'"'+(selId===v?' selected':'')+'>'+esc(nombreGrupo(g))+'</option>';}).join('')+'</optgroup>';
  }).join('');
}
function estPorId(g,sid){if(!g)return null;for(var i=0;i<g.estudiantes.length;i++)if(g.estudiantes[i].id===sid)return g.estudiantes[i];return null;}
function mapaEst(g){var m={};(g?g.estudiantes:[]).forEach(function(e){m[e.id]=e;});return m;}
function cursosDe(g){var s={};(g?g.estudiantes:[]).forEach(function(e){if(e.c)s[e.c]=1;});return Object.keys(s).sort(cmp);}
