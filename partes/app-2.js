/* Retirado de la asignatura (se cambió a otra): sigue en la lista con su número, tachado y en gris, y conserva su asistencia y sus notas.
   Desde su fecha de retiro no se le pasa lista ni se cuenta en los totales del curso; los días anteriores quedan como estaban. */
function retEn(e,f){return !!(e&&e.ret&&String(f||'')>=e.ret);}
function retirado(e){return retEn(e,hoyISO());}
function statsEst(g,sid){var e=estPorId(g,sid),p=0,a=0,l=0,r=0;Object.keys(g.asistencia).forEach(function(d){if(retEn(e,d))return;var s=(g.asistencia[d]||{})[sid];if(s==='present')p++;else if(s==='absent')a++;else if(s==='late')l++;if(s)r++;});return {p:p,a:a,l:l,r:r,pct:r?Math.round(p/r*100):null};}
function enRiesgo(s){return s.r>=3&&s.pct<75;}
function conteoDia(g,f){var att=g.asistencia[f]||{};var p=0,a=0,l=0,t=0;g.estudiantes.forEach(function(e){if(retEn(e,f))return;t++;var s=att[e.id];if(s==='present')p++;else if(s==='absent')a++;else if(s==='late')l++;});return {p:p,a:a,l:l,sin:t-p-a-l,total:t};}
function fechasAsistencia(g){return Object.keys(g.asistencia).filter(function(d){return g.asistencia[d]&&Object.keys(g.asistencia[d]).length;}).sort();}
function cal(g){if(!g.calificaciones)g.calificaciones={columns:[],data:{}};return g.calificaciones;}
function buscarColumna(c,name){var n=normNombre(name);return c.columns.filter(function(x){return x.name===name;})[0]||c.columns.filter(function(x){return normNombre(x.name)===n;})[0]||null;}
function promNotasEst(g,sid){return promsEst(g,sid).pf;}

/* =================== Vistas: cabecera =================== */
function segmento(campo,ops){return '<div class="segmento" role="group">'+ops.map(function(o){return '<button type="button" class="seg" data-a="vista" data-k="'+campo+'" data-v="'+o[0]+'" aria-pressed="'+(ui[campo]===o[0])+'">'+o[1]+'</button>';}).join('')+'</div>';}
function vError(){return ui.formError?'<p class="form-error" role="alert">'+esc(ui.formError)+'</p>':'';}
function vCab(){
  if(ui.msg&&!(Date.now()<ui.msgHasta))ui.msg=null;if(ui.undo&&!(Date.now()<ui.undo.hasta))ui.undo=null;
  var pend=respaldoPendiente();
  return '<header class="cab"><div class="marca"><h1>Agenda <span>Pedagógica</span></h1><p class="sub">Liceo A-1 · Arica</p></div>'+
    '<div class="cab-der"><p class="cab-fecha">'+esc(cap(fDia(hoyISO())))+'</p><p class="guardado" id="guardado">'+esc(textoGuardado())+'</p>'+
    '<button type="button" class="link" data-a="tab" data-v="respaldo">'+esc(pend||'Respaldo y datos')+'</button></div></header>'+
    '<nav class="hojas" aria-label="Pasar página"><button type="button" class="btn" data-a="hoja" data-v="-1" aria-label="Subir una página">▲ Subir</button><button type="button" class="btn" data-a="hoja" data-v="1" aria-label="Bajar una página">Bajar ▼</button></nav>'+
    '<nav class="pestanas" aria-label="Secciones">'+TABS.map(function(t){return '<button type="button" class="pest" data-a="tab" data-v="'+t[0]+'" aria-pressed="'+(ui.tab===t[0])+'">'+t[1]+'</button>';}).join('')+'</nav>'+
    (ui.actualizacion?'<div class="deshacer"><span>Hay una versión nueva de la agenda.</span><button type="button" class="btn primary chico" data-a="recargar">Actualizar ahora</button></div>':'')+
    (almacen.ok?'':'<p class="alerta" role="alert">Este navegador no está guardando los datos. Descarga un respaldo ahora en «Respaldo y datos» y abre la agenda desde la app instalada.</p>')+
    (ui.undo?'<div class="deshacer" id="deshacer" role="status"><span>'+esc(ui.undo.texto)+'</span><button type="button" class="btn primary chico" data-a="deshacer">Deshacer</button></div>':'')+
    (ui.msg?'<p class="msg" id="msg" role="status">'+esc(ui.msg)+'</p>':'')+
    (ui.copiaManual?'<div class="copia"><p>'+esc(ui.copiaManual.titulo)+'</p><textarea id="copia-manual" readonly rows="8">'+esc(ui.copiaManual.texto)+'</textarea><div class="acciones"><button type="button" class="btn" data-a="copia-cerrar">Cerrar</button></div></div>':'');
}

/* =================== Vista: Hoy =================== */
function vBienvenida(){
  var loc=asistenciaLocal();
  return '<div class="panel"><h3>Trae tus cursos para empezar</h3><p>Tu agenda todavía no tiene cursos. Puedes traer todo lo que tienes en Control de Asistencia: cursos, nóminas, asistencia, observaciones, notas y registros de clase.</p><div class="acciones">'+
    (loc?'<button type="button" class="btn primary" data-a="imp-local">Traer '+loc.length+(loc.length===1?' curso guardado':' cursos guardados')+' en esta tableta</button>':'')+
    '<button type="button" class="btn'+(loc?'':' primary')+'" data-a="ir-cuenta">Desde mi cuenta de Control de Asistencia</button>'+
    '<label class="btn" for="arch-bienv">Desde un archivo de respaldo</label><input type="file" id="arch-bienv" class="oculto" data-file="respaldo" accept=".json,application/json">'+
    '</div><p class="ayuda">¿Un curso nuevo? <label class="link" for="pdf-bienv">Importa la nómina en PDF</label><input type="file" id="pdf-bienv" class="oculto" data-file="pdf" accept=".pdf,application/pdf">.</p></div>';
}
function progresoDis(d){var r=S.rubricas[d.rubricaId];var g=grupoPorId(d.grupoId);if(!r||!g)return {listos:0,total:d.equipos.length};return {listos:d.equipos.filter(function(eq){return equipoListo(d,r,eq);}).length,total:d.equipos.length};}
function vHoyDis(){
  var hoy=hoyISO();
  var ds=Object.keys(S.disertaciones).map(function(id){var d=S.disertaciones[id];return {id:id,d:d,pr:progresoDis(d)};})
    .filter(function(x){return x.pr.total===0||x.pr.listos<x.pr.total||(x.d.fecha&&x.d.fecha>=sumarDias(hoy,-7));})
    .sort(function(a,b){return cmp(a.d.fecha,b.d.fecha);}).slice(0,5);
  return '<div class="panel"><h3>Disertaciones</h3>'+(ds.length?'<ul class="lista-simple">'+ds.map(function(x){var g=grupoPorId(x.d.grupoId);
    return '<li><button type="button" class="item-btn" data-a="d-abrir" data-id="'+esc(x.id)+'"><b>'+esc(x.d.titulo||'Sin título')+'</b><span>'+esc(g?nombreGrupo(g):'Curso eliminado')+' · '+esc(x.d.fecha?fCorta(x.d.fecha):'sin fecha')+' · '+(x.pr.total?x.pr.listos+' de '+pl(x.pr.total,'equipo evaluado','equipos evaluados'):'equipos por armar')+'</span></button></li>';}).join('')+'</ul>':'<p class="ayuda">No hay disertaciones pendientes.</p>')+
    '<div class="acciones"><button type="button" class="btn" data-a="d-nueva">+ Nueva disertación</button></div></div>';
}
function vHoyBit(){
  var eqs=listaCol('equipos').map(function(t){var regs=registrosDe(t.id);var ult=regs[0];return {t:t,ult:ult,dias:ult?diasDesde(ult.fecha):null};})
    .filter(function(x){return x.t.estado==='atencion'||x.t.estado==='riesgo'||x.dias==null||x.dias>14;});
  return '<div class="panel"><h3>Bitácora de equipos</h3>'+(eqs.length?'<ul class="lista-simple">'+eqs.map(function(x){var e=estadoInfo(x.t.estado);
    return '<li><button type="button" class="item-btn" data-a="b-abrir" data-id="'+esc(x.t.id)+'"><b>'+esc(x.t.nombre)+'</b><span>'+(e?esc(e.t):'Sin estado')+' · '+(x.ult?'último registro '+(x.dias===0?'hoy':x.dias===1?'ayer':'hace '+x.dias+' días'):'sin registros')+'</span></button></li>';}).join('')+'</ul>':'<p class="ayuda">Todos los equipos están al día y con registros recientes.</p>')+'</div>';
}
function vHoy(){
  var hoy=hoyISO();
  var h='<section class="seccion">';
  var gs=gruposOrden();
  if(!gs.length){h+=vPdfPend()+(ui.cursoForm?vFormCursoNuevo():'')+vBienvenida()+'<div class="dos-col">'+vHoyDis()+vHoyBit()+'</div>';return h+'</section>';}
  var c1='<div class="panel"><h3>Tus cursos</h3>';
  c1+='<div class="cursos-hoy">'+gs.map(function(g){var c=conteoDia(g,hoy);var tom=c.p+c.a+c.l>0;var log=g.classLogs[hoy];
    return '<button type="button" class="curso-hoy'+(tom?' hecho':'')+'" data-a="ir-lista" data-id="'+esc(g.id)+'"><b>'+esc(nombreGrupo(g))+'</b><span>'+(tom?'Lista: '+pl(c.p,'presente','presentes')+' · '+pl(c.a,'ausente','ausentes')+' · '+pl(c.l,'atraso','atrasos')+(c.sin?' · '+c.sin+' sin marcar':''):'Lista pendiente · '+pl(c.total,'estudiante','estudiantes'))+'</span><span>'+(log?'Registro de clase hecho':'Sin registro de clase')+'</span></button>';}).join('')+'</div>';
  c1+='</div>';
  var pend=[];gs.forEach(function(g){var ds=Object.keys(g.classLogs).filter(function(d){return d<=hoy;}).sort();for(var i=ds.length-1;i>=0;i--){var l=g.classLogs[ds[i]];if(l&&l.tarea){pend.push({g:g,d:ds[i],t:l.tarea});break;}}});
  pend.sort(function(a,b){return cmp(b.d,a.d);});
  var c2='<div class="panel"><h3>Pendientes para la próxima clase</h3>'+(pend.length?'<ul class="lista-simple">'+pend.map(function(x){return '<li><button type="button" class="item-btn fuerte" data-a="ir-lista" data-id="'+esc(x.g.id)+'"><b>'+esc(x.t)+'</b><span>'+esc(nombreGrupo(x.g))+' · anotado el '+esc(fCorta(x.d))+'</span></button></li>';}).join('')+'</ul>':'<p class="ayuda">Sin pendientes. Se anotan en el registro de cada clase.</p>')+'</div>';
  var riesgo=gs.map(function(g){return {g:g,n:g.estudiantes.filter(function(e){return !retirado(e)&&enRiesgo(statsEst(g,e.id));}).length};}).filter(function(x){return x.n>0;});
  var c3='<div class="panel"><h3>Asistencia bajo 75 %</h3>'+(riesgo.length?'<ul class="lista-simple">'+riesgo.map(function(x){return '<li><button type="button" class="item-btn" data-a="ir-stats" data-id="'+esc(x.g.id)+'"><b>'+x.n+(x.n===1?' estudiante':' estudiantes')+'</b><span>'+esc(nombreGrupo(x.g))+'</span></button></li>';}).join('')+'</ul>':'<p class="ayuda">Nadie bajo 75 %. Se cuenta desde la tercera clase registrada.</p>')+'</div>';
  h+='<div class="dos-col"><div class="seccion">'+c1+c2+'</div><div class="seccion">'+c3+vHoyDis()+vHoyBit()+'</div></div>';
  return h+'</section>';
}

/* =================== Vista: Asistencia =================== */
function vSinCursos(){return '<section class="seccion">'+vPdfPend()+(ui.cursoForm?vFormCursoNuevo():'')+vBienvenida()+'</section>';}
function vFechaNav(){
  return '<div class="fecha-nav" role="group" aria-label="Fecha"><button type="button" class="btn" data-a="fecha-mover" data-v="-1" aria-label="Día anterior">◀</button>'+
    '<div class="campo"><label for="sel-fecha">Fecha</label><input type="date" id="sel-fecha" data-sel="fecha" value="'+esc(ui.fecha)+'"></div>'+
    '<button type="button" class="btn" data-a="fecha-mover" data-v="1" aria-label="Día siguiente">▶</button>'+(ui.fecha!==hoyISO()?'<button type="button" class="btn" data-a="fecha-hoy">Hoy</button>':'')+'</div>';
}
function vAsistencia(){
  if(!S.grupos.length)return vSinCursos();
  var g=grupoActual();
  if(ui.ficha){var e=estPorId(g,ui.ficha);if(e)return vFicha(g,e);ui.ficha=null;}
  var h='<section class="seccion"><div class="barra"><div class="campo"><label for="sel-grupo">Curso</label><select id="sel-grupo" data-sel="grupo">'+opcionesGrupos(g.id)+'</select></div>'+(ui.aVista==='lista'?vFechaNav():'')+'</div>';
  h+=segmento('aVista',[['lista','Pasar lista'],['stats','Estadísticas'],['curso','Curso y nómina']]);
  h+=ui.aVista==='stats'?vStats(g):ui.aVista==='curso'?vCurso(g):vLista(g);
  return h+'</section>';
}
function vPat(sid,st){
  return '<div class="pat" role="group" aria-label="Asistencia">'+[['present','P','Presente'],['absent','A','Ausente'],['late','T','Atraso']].map(function(o){
    return '<button type="button" data-a="marcar" data-id="'+esc(sid)+'" data-v="'+o[0]+'" aria-pressed="'+(st===o[0])+'" aria-label="'+o[2]+'">'+o[1]+'</button>';}).join('')+'</div>';
}
function vConteo(g){
  var c=conteoDia(g,ui.fecha);
  function sp(n,a,b){return '<span><b>'+n+'</b> '+(n===1?a:b)+'</span>';}
  return '<div class="conteo-lista">'+sp(c.total,'estudiante','estudiantes')+sp(c.p,'presente','presentes')+sp(c.a,'ausente','ausentes')+sp(c.l,'atraso','atrasos')+
    (c.sin&&c.total?sp(c.sin,'sin marcar','sin marcar')+'<button type="button" class="btn" data-a="todos-presentes">'+(c.sin===1?'Marcar presente al que falta':'Marcar presentes a los '+c.sin+' sin marcar')+'</button>':'')+'</div>';
}
function vFormLog(g,f,ctx){
  var l=g.classLogs[f]||{};
  var at=' data-g="'+esc(g.id)+'" data-d="'+esc(f)+'"';
  return '<div class="form" id="form-log"><h3>Registro de la clase · '+esc(fLarga(f))+'</h3>'+(ctx==='clases'?'<p class="eyebrow">'+esc(nombreGrupo(g))+'</p>':'')+
    '<div class="campo"><label for="lg-obj">Objetivo de la clase</label><textarea id="lg-obj" rows="2" data-f="log.objetivo"'+at+'>'+esc(l.objetivo||'')+'</textarea></div>'+
    '<div class="campo"><label for="lg-tem">Temas y conceptos clave</label><textarea id="lg-tem" rows="3" data-f="log.temas"'+at+'>'+esc(l.temas||'')+'</textarea></div>'+
    '<div class="campo"><label for="lg-obs">Observaciones generales</label><textarea id="lg-obs" rows="2" data-f="log.obs"'+at+'>'+esc(l.obs||'')+'</textarea></div>'+
    '<div class="campo"><label for="lg-tar">Pendiente para la próxima clase</label><textarea id="lg-tar" rows="2" data-f="log.tarea"'+at+'>'+esc(l.tarea||'')+'</textarea></div>'+
    '<label class="campo-check" for="lg-dest"><input type="checkbox" id="lg-dest" data-f="log.destacado"'+at+(l.destacado?' checked':'')+'> Destacar este registro</label>'+
    '<p class="ayuda">Se guarda mientras escribes.</p>'+(ui.confLog===g.id+'|'+f&&g.classLogs[f]?vConfLog(g,f,l):'<div class="acciones"><button type="button" class="btn primary" data-a="log-listo" data-ctx="'+ctx+'">Listo</button>'+
    (g.classLogs[f]?'<button type="button" class="btn quiet" data-a="log-borrar"'+at+'>Borrar registro</button>':'')+'</div>')+'</div>';
}
/* Borrar el registro de una clase pide confirmar, con lo que se perdería a la vista. Como con un estudiante o un curso:
   el aviso sube entero a la vista y «Sí, borrar el registro» no cae donde estaba el dedo. */
function vConfLog(g,f,l){
  var p=[];if(l.objetivo)p.push('el objetivo');if(l.temas)p.push('los temas');if(l.obs)p.push('las observaciones');if(l.tarea)p.push('el pendiente');if(l.destacado)p.push('la marca de destacado');
  var lista=p.length>1?p.slice(0,-1).join(', ')+' y '+p[p.length-1]:(p[0]||'');
  return '<div class="form" id="conf-log" role="alert" style="border-width:3px"><p><b>¿Borrar el registro de la clase del '+esc(fLarga(f))+'?</b> Se borra '+esc(lista)+'.</p>'+
    '<div class="acciones"><button type="button" class="btn primary" data-a="log-borrar-si" data-g="'+esc(g.id)+'" data-d="'+esc(f)+'">Sí, borrar el registro</button><button type="button" class="btn" data-a="log-borrar-no">Cancelar</button></div></div>';
}
function vRegClase(g,f){
  if(ui.regAbierto)return vFormLog(g,f,'lista');
  var l=g.classLogs[f];var p=[];
  if(l&&l.objetivo)p.push('<p><b>Objetivo:</b> '+esc(l.objetivo)+'</p>');
  if(l&&l.temas)p.push('<p><b>Temas:</b> '+esc(l.temas)+'</p>');
  if(l&&l.obs)p.push('<p><b>Observaciones:</b> '+esc(l.obs)+'</p>');
  return '<div class="reg-clase"><div><p class="etiqueta">Registro de la clase'+(l&&l.destacado?' · ★ destacado':'')+'</p>'+(p.length?p.join(''):'<p class="ayuda">Sin registro para este día.</p>')+(l&&l.tarea?'<p class="reg-tarea">Pendiente: '+esc(l.tarea)+'</p>':'')+'</div>'+
    '<button type="button" class="btn" data-a="reg-abrir">'+(l?'Editar registro':'+ Registrar la clase')+'</button></div>';
}
function vLista(g){
  var h='<div id="conteo">'+vConteo(g)+'</div>'+vRegClase(g,ui.fecha);
  if(!g.estudiantes.length)return h+'<div class="vacio"><h3>Este curso no tiene estudiantes</h3><p>Agrégalos o importa la nómina en PDF desde «Curso y nómina».</p><button type="button" class="btn primary" data-a="vista" data-k="aVista" data-v="curso">Ir a Curso y nómina</button></div>';
  var est=ordenarEst(g.estudiantes,ui.soloApellido),att=g.asistencia[ui.fecha]||{},obs=g.notas[ui.fecha]||{};
  var multi=!ui.soloApellido&&cursosDe(g).length>1;
  h+='<div class="acciones"><span class="ayuda">Orden de la lista:</span><div class="segmento" role="group"><button type="button" class="seg" data-a="orden" data-v="curso" aria-pressed="'+(!ui.soloApellido)+'">Curso y apellido</button><button type="button" class="seg" data-a="orden" data-v="apellido" aria-pressed="'+ui.soloApellido+'">Solo apellido</button></div></div>';
  var last=null,n=0,rows='';
  est.forEach(function(e){
    if(multi&&e.c!==last){last=e.c;rows+='<li class="sep-curso">'+esc(e.c||'Sin curso')+'</li>';}
    n++;
    if(retEn(e,ui.fecha)){rows+='<li class="alumno ret"><span class="n-lista">'+n+'</span><button type="button" class="al-nombre" data-a="ficha" data-id="'+esc(e.id)+'"><span class="tachado"><b>'+esc(apellidos(e))+'</b>'+(e.n?', '+esc(e.n):'')+'</span>'+
      '<small>'+esc(e.c||'Sin curso')+' · retirado desde el '+esc(ddmm(e.ret))+'</small></button><span class="ret-et">Retirado</span></li>';return;}
    var s=statsEst(g,e.id),bajo=enRiesgo(s);
    rows+='<li class="alumno"><span class="n-lista">'+n+'</span><button type="button" class="al-nombre" data-a="ficha" data-id="'+esc(e.id)+'"><b>'+esc(apellidos(e))+'</b>'+(e.n?', '+esc(e.n):'')+
      '<small>'+esc(e.c||'Sin curso')+(bajo?' · asistencia '+s.pct+' %':'')+'</small></button>'+vPat(e.id,att[e.id]||null)+
      '<button type="button" class="obs-b'+(obs[e.id]?' tiene':'')+'" data-a="ficha-obs" data-id="'+esc(e.id)+'" aria-label="Observación de '+esc(nombreCorto(e))+'">'+(obs[e.id]?'Obs ✓':'Obs')+'</button></li>';
  });
  return h+'<ol class="alumnos">'+rows+'</ol>';
}
function campoCurso(pre,g,draft,fp){fp=fp||pre;
  var cs=cursosDe(g);if(draft.c&&draft.c!=='__otro'&&cs.indexOf(draft.c)<0)cs=cs.concat([draft.c]).sort(cmp);
  return '<div class="campo"><label for="'+pre+'-c">Curso</label><select id="'+pre+'-c" data-f="'+fp+'.c"><option value="">Elige el curso</option>'+
    cs.map(function(c){return '<option value="'+esc(c)+'"'+(!draft.otro&&draft.c===c?' selected':'')+'>'+esc(c)+'</option>';}).join('')+
    '<option value="__otro"'+(draft.otro?' selected':'')+'>Otro curso…</option></select>'+
    (draft.otro?'<input type="text" id="'+pre+'-co" data-f="'+fp+'.cOtro" value="'+esc(draft.cOtro||'')+'" placeholder="Ej.: 4° C" aria-label="Nombre del curso">':'')+'</div>';
}
function cursoDeDraft(d){return normCurso(d.otro?d.cOtro:d.c);}
/* Agregar estudiantes: si llegan varios a la vez, se llenan varias filas y se agregan todos con un solo toque.
   Cada fila parte vacía, también el curso: se elige a mano para no asignar a nadie a un curso equivocado.
   La primera fila conserva los id de siempre (ne-ap, ne-n…); las siguientes son ne1-ap, ne2-ap… */
var MAX_NUEVOS=8;
function filaNueva(){return {ap:'',am:'',n:'',c:'',otro:false,cOtro:''};}
function idFila(i){return i?'ne'+i:'ne';}
function filaVacia(f){return !f.ap.trim()&&!f.am.trim()&&!f.n.trim();}
function vNuevosEst(g,ne){var fs=ne.filas,varias=fs.length>1;
  var h='<form class="panel" data-form="nuevo-est"><h3>Agregar estudiantes</h3>'+(ui.neError?'<p class="form-error" role="alert">'+esc(ui.neError)+'</p>':'');
  fs.forEach(function(f,i){var id=idFila(i),fp='ne.'+i;
    var campos='<div class="fila-2"><div class="campo"><label for="'+id+'-ap">Apellido paterno</label><input type="text" id="'+id+'-ap" data-f="'+fp+'.ap" value="'+esc(f.ap)+'" autocomplete="off"></div><div class="campo"><label for="'+id+'-am">Apellido materno</label><input type="text" id="'+id+'-am" data-f="'+fp+'.am" value="'+esc(f.am)+'" autocomplete="off"></div></div>'+
      '<div class="campo"><label for="'+id+'-n">Nombres</label><input type="text" id="'+id+'-n" data-f="'+fp+'.n" value="'+esc(f.n)+'" autocomplete="off"></div>'+campoCurso(id,g,f,fp);
    h+=varias?'<fieldset class="ne-fila" id="'+id+'-fila"><legend>Estudiante '+(i+1)+'</legend>'+campos+'<div><button type="button" class="btn quiet" data-a="ne-quitar" data-i="'+i+'">Quitar esta fila</button></div></fieldset>':campos;});
  var n=fs.length;
  h+='<div class="acciones">'+(n<MAX_NUEVOS?'<button type="button" class="btn" data-a="ne-fila">+ Otro estudiante</button>':'')+'<button type="submit" class="btn primary">'+(varias?'Agregar los '+n+' a la lista':'Agregar a la lista')+'</button></div>'+
    '<p class="ayuda">Si llegan varios, toca «+ Otro estudiante» por cada uno y agrégalos todos juntos. Quedan ordenados con su curso y por apellido paterno.</p></form>';
  return h;}
function vFicha(g,e){
  var f=ui.fecha,s=statsEst(g,e.id),att=(g.asistencia[f]||{})[e.id]||null,obs=(g.notas[f]||{})[e.id]||'';
  if(!ui.estDraft||ui.estDraft.sid!==e.id)ui.estDraft={sid:e.id,ap:e.ap,am:e.am,n:e.n,c:e.c,otro:false,cOtro:''};
  var d=ui.estDraft;
  var h='<section class="seccion"><button type="button" class="btn quiet volver" data-a="ficha-cerrar">← Volver a la lista</button>';
  h+='<div class="ficha-cab"><p class="eyebrow">'+esc(nombreGrupo(g))+' · '+esc(e.c||'Sin curso')+'</p><h2>'+esc(nombreCompleto(e))+'</h2>'+(e.ret?'<p><span class="chip">Retirado de la asignatura desde el '+esc(fCorta(e.ret))+'</span></p>':'')+'</div><div class="dos-col"><div class="seccion">';
  h+='<div class="panel"><h3>Observación del '+esc(fLarga(f))+'</h3><textarea id="obs-txt" rows="4" data-f="obs" data-id="'+esc(e.id)+'" placeholder="Escribe una observación sobre el estudiante">'+esc(obs)+'</textarea><p class="ayuda">Se guarda mientras escribes. Para anotar en otro día, cambia la fecha en la lista.</p>'+(obs?(ui.confObs===e.id+'|'+f?vConfObs(e,f,obs):'<div class="acciones"><button type="button" class="btn quiet" data-a="obs-borrar" data-id="'+esc(e.id)+'">Borrar observación</button></div>'):'')+'</div>';
  var fs=fechasAsistencia(g).filter(function(x){return g.asistencia[x][e.id];}).reverse().slice(0,10);
  h+='<div class="panel"><h3>Asistencia</h3><div class="acciones"><span>'+esc(fCorta(f))+':</span>'+(retEn(e,f)?'<span class="ret-et">Retirado</span>':vPat(e.id,att))+'</div>'+
    (s.r?'<p><b class="'+(enRiesgo(s)?'baja':'')+'">'+s.pct+' %</b> en '+s.r+(s.r===1?' clase registrada':' clases registradas')+' · '+pl(s.p,'presente','presentes')+' · '+pl(s.a,'ausente','ausentes')+' · '+pl(s.l,'atraso','atrasos')+'</p>':'<p class="ayuda">Aún sin clases registradas.</p>')+
    (fs.length?'<ul class="lista-simple">'+fs.map(function(x){return '<li class="item-btn"><span>'+esc(fLarga(x))+' · <b>'+ATT[g.asistencia[x][e.id]]+'</b></span></li>';}).join('')+'</ul>':'')+'</div>';
  var c=cal(g),ps=promsEst(g,e.id);
  function filaP(et,v){return '<tr class="fila-p"><td><b>'+et+'</b></td><td class="num'+(v!=null&&v<4?' baja':'')+'"><b>'+(v!=null?num(v,1):'—')+'</b></td></tr>';}
  function filasSem(sm){var cs=c.columns.filter(function(col){return semCol(col)===sm;});if(!cs.length)return '';
    return cs.map(function(col){var v=(c.data[e.id]||{})[col.id];return '<tr><td>'+esc(col.name)+(col.date?'<small>'+esc(fCorta(col.date))+'</small>':'')+'</td><td class="num'+(v!=null&&v<4?' baja':'')+'">'+(v!=null?num(v,1):'—')+'</td></tr>';}).join('')+filaP('P'+sm+' · '+sm+'° semestre',ps['p'+sm]);}
  h+='<div class="panel"><h3>Notas</h3>'+(c.columns.length?'<table><tbody>'+filasSem(1)+filasSem(2)+filaP('Pf · promedio final',ps.pf)+'</tbody></table>':'<p class="ayuda">Este curso aún no tiene evaluaciones.</p>')+'</div>';
  h+='</div><div class="seccion">';
  if(e.ret)h+='<div class="panel"><h3>Retirado de la asignatura</h3><div class="campo"><label for="es-ret">Desde</label><input type="date" id="es-ret" data-sel="est-ret" data-id="'+esc(e.id)+'" value="'+esc(e.ret)+'"></div>'+
    '<p class="ayuda">Sigue en la lista con su número, tachado y en gris. Desde esa fecha no se le pasa lista ni se cuenta en los totales del curso; su asistencia y sus notas quedan guardadas.</p>'+
    '<div class="acciones"><button type="button" class="btn" data-a="est-reincorporar" data-id="'+esc(e.id)+'">Reincorporar a la lista</button></div></div>';
  var hist=Object.keys(g.notas).filter(function(x){return x!==f&&g.notas[x]&&g.notas[x][e.id];}).sort().reverse();
  h+='<div class="panel"><h3>Observaciones de otros días</h3>'+(hist.length?'<ul class="hist">'+hist.map(function(x){return '<li><time datetime="'+esc(x)+'">'+esc(fLarga(x))+'</time><p>'+esc(g.notas[x][e.id])+'</p></li>';}).join('')+'</ul>':'<p class="ayuda">No hay observaciones de otros días.</p>')+'</div>';
  h+='<form class="panel" data-form="est"><h3>Datos del estudiante</h3>'+vError()+
    '<div class="fila-2"><div class="campo"><label for="es-ap">Apellido paterno</label><input type="text" id="es-ap" data-f="es.ap" value="'+esc(d.ap)+'"></div><div class="campo"><label for="es-am">Apellido materno</label><input type="text" id="es-am" data-f="es.am" value="'+esc(d.am)+'"></div></div>'+
    '<div class="campo"><label for="es-n">Nombres</label><input type="text" id="es-n" data-f="es.n" value="'+esc(d.n)+'"></div>'+campoCurso('es',g,d)+
    (ui.confBorrar===e.id?vConfBorrar(g,e):
    '<div class="acciones"><button type="submit" class="btn primary">Guardar datos</button>'+(e.ret?'':'<button type="button" class="btn" data-a="est-retirar" data-id="'+esc(e.id)+'">Marcar como retirado</button>')+'<button type="button" class="btn quiet" data-a="est-borrar" data-id="'+esc(e.id)+'">Eliminar estudiante</button></div>'+
    (e.ret?'':'<p class="ayuda">«Marcar como retirado» es para quien se cambió de asignatura: sigue en la lista con el nombre tachado y ya no se cuenta al pasar lista. «Eliminar» lo borra con toda su asistencia y sus notas.</p>'))+'</form>';
  return h+'</div></div></section>';
}
/* Eliminar a un estudiante borra todo lo suyo y no se recupera pasados unos segundos: antes se pide confirmar, con lo que se perdería a la vista.
   El aviso queda entero en la parte alta de la pantalla y «Sí, eliminar» no cae donde estaba el dedo, así un doble toque en la tinta electrónica no lo activa. */
function vConfBorrar(g,e){
  var nA=fechasAsistencia(g).filter(function(d){return g.asistencia[d][e.id];}).length;
  var nO=Object.keys(g.notas).filter(function(d){return g.notas[d]&&g.notas[d][e.id];}).length;
  var dn=cal(g).data[e.id]||{},nN=cal(g).columns.filter(function(c){return dn[c.id]!=null;}).length;
  var nE=0;Object.keys(S.disertaciones).forEach(function(k){S.disertaciones[k].equipos.forEach(function(eq){if(eq.integrantes.indexOf(e.id)>=0)nE++;});});
  var p=[];if(nA)p.push('asistencia de '+pl(nA,'clase','clases'));if(nO)p.push(pl(nO,'observación','observaciones'));if(nN)p.push(pl(nN,'nota','notas'));if(nE)p.push('su lugar en '+pl(nE,'equipo de disertación','equipos de disertación'));
  var lista=p.length>1?p.slice(0,-1).join(', ')+' y '+p[p.length-1]:(p[0]||'');
  return '<div class="form" id="conf-est" role="alert" style="border-width:3px"><p><b>¿Eliminar a '+esc(nombreCompleto(e))+'?</b> '+(p.length?'Se borra con todo lo suyo: '+esc(lista)+'.':'No tiene asistencia, observaciones ni notas registradas.')+'</p>'+
    (e.ret?'':'<p class="ayuda">Si se cambió de asignatura, mejor márcalo como retirado: sigue en la lista y conserva todo.</p>')+
    '<div class="acciones"><button type="button" class="btn primary" data-a="est-borrar-si" data-id="'+esc(e.id)+'">Sí, eliminar</button>'+(e.ret?'':'<button type="button" class="btn" data-a="est-retirar" data-id="'+esc(e.id)+'">Marcar como retirado</button>')+'<button type="button" class="btn" data-a="est-borrar-no">Cancelar</button></div></div>';
}
/* Borrar una observación pide confirmar, mostrando su comienzo. Como en los demás avisos, «Sí» no cae donde estaba el dedo. */
function vConfObs(e,f,obs){var t=String(obs).trim();if(t.length>90)t=t.slice(0,90).trim()+'…';
  return '<div class="form" id="conf-obs" role="alert" style="border-width:3px"><p><b>¿Borrar la observación del '+esc(fLarga(f))+' sobre '+esc(nombreCorto(e))+'?</b> Se borra: «'+esc(t)+'».</p>'+
    '<div class="acciones"><button type="button" class="btn primary" data-a="obs-borrar-si" data-id="'+esc(e.id)+'">Sí, borrar la observación</button><button type="button" class="btn" data-a="obs-borrar-no">Cancelar</button></div></div>';}
function grafAsistencia(g,fechas){
  var ult=fechas.slice(-12),W=640,H=230,ml=40,mr=8,mt=18,mb=34,iw=W-ml-mr,ih=H-mt-mb,n=ult.length||1,bw=iw/n;
  function y(v){return mt+ih-(v/100)*ih;}
  var s='<svg class="grafico" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Porcentaje de presentes en las últimas clases">';
  [0,25,50,75,100].forEach(function(v){s+='<line x1="'+ml+'" x2="'+(W-mr)+'" y1="'+y(v)+'" y2="'+y(v)+'" stroke="currentColor" stroke-opacity="'+(v===75?1:0.25)+'" stroke-width="'+(v===75?1.5:1)+'"'+(v===75?' stroke-dasharray="6 4"':'')+'/><text x="'+(ml-6)+'" y="'+(y(v)+4)+'" text-anchor="end" font-size="12" fill="currentColor">'+v+' %</text>';});
  /* La cifra va dentro de la barra, en blanco, para que la línea punteada del 75 % nunca la tache; si la barra es muy baja, va encima. */
  ult.forEach(function(d,i){var c=conteoDia(g,d);var pct=Math.round(c.p/(c.total||1)*100);var w=bw*0.6,x=ml+i*bw+(bw-w)/2,alto=mt+ih-y(pct),dentro=alto>=22;
    s+='<rect x="'+x.toFixed(1)+'" y="'+y(pct).toFixed(1)+'" width="'+w.toFixed(1)+'" height="'+alto.toFixed(1)+'" fill="currentColor"/>'+
      '<text x="'+(x+w/2).toFixed(1)+'" y="'+(dentro?y(pct)+16:y(pct)-5).toFixed(1)+'" text-anchor="middle" font-size="12" font-weight="700" fill="'+(dentro?'#fff':'currentColor')+'">'+pct+'</text>'+
      '<text x="'+(x+w/2).toFixed(1)+'" y="'+(H-12)+'" text-anchor="middle" font-size="12" fill="currentColor">'+ddmm(d)+'</text>';});
  return s+'</svg>';
}
function datosStats(g){
  var fechas=fechasAsistencia(g);var filas=g.estudiantes.map(function(e){return {e:e,s:statsEst(g,e.id),prom:promNotasEst(g,e.id)};}).filter(function(x){return x.s.r>0&&!retirado(x.e);});
  filas.sort(function(a,b){return a.s.pct-b.s.pct||cmpEst(a.e,b.e);});
  var tp=0,tr=0;filas.forEach(function(x){tp+=x.s.p;tr+=x.s.r;});
  return {fechas:fechas,filas:filas,prom:tr?Math.round(tp/tr*100):null,bajo:filas.filter(function(x){return enRiesgo(x.s);}).length,ret:g.estudiantes.filter(retirado).length};
}
function vStats(g){
  var D=datosStats(g);
  if(!D.fechas.length)return '<div class="vacio"><h3>Sin asistencia registrada</h3><p>Las estadísticas aparecen cuando pasas lista al menos una vez.</p></div>';
  var hasCal=cal(g).columns.length>0;
  var h='<div class="stats"><div class="stat">Clases<b>'+D.fechas.length+'</b></div><div class="stat">Asistencia promedio<b>'+(D.prom!=null?D.prom+' %':'—')+'</b></div><div class="stat">Bajo 75 %<b>'+D.bajo+'</b></div><div class="stat">Estudiantes<b>'+(g.estudiantes.length-D.ret)+'</b></div></div>';
  h+='<div class="panel suave"><h3>Presentes por clase (últimas '+Math.min(12,D.fechas.length)+')</h3>'+grafAsistencia(g,D.fechas)+'<p class="leyenda"><span>Porcentaje del curso marcado como presente. La línea punteada marca 75 %.</span></p></div>';
  h+='<div class="acciones"><button type="button" class="btn" data-a="imp-stats">Imprimir estadísticas</button></div>';
  h+='<div class="tabla-wrap"><table><thead><tr><th>Estudiante</th><th>Curso</th><th class="num">Asistencia</th><th class="num">P</th><th class="num">A</th><th class="num">T</th><th class="num">Clases</th>'+(hasCal?'<th class="num">Prom. notas</th>':'')+'</tr></thead><tbody>'+
    D.filas.map(function(x){return '<tr><td><button type="button" class="link" data-a="ficha" data-id="'+esc(x.e.id)+'">'+esc(apellidos(x.e))+', '+esc(x.e.n)+'</button></td><td>'+esc(x.e.c)+'</td><td class="num'+(enRiesgo(x.s)?' baja':'')+'">'+x.s.pct+' %</td><td class="num">'+x.s.p+'</td><td class="num">'+x.s.a+'</td><td class="num">'+x.s.l+'</td><td class="num">'+x.s.r+'</td>'+(hasCal?'<td class="num'+(x.prom!=null&&x.prom<4?' baja':'')+'">'+(x.prom!=null?num(x.prom,1):'—')+'</td>':'')+'</tr>';}).join('')+'</tbody></table></div>';
  if(D.ret)h+='<p class="ayuda">No incluye a '+pl(D.ret,'estudiante retirado','estudiantes retirados')+' de la asignatura; su asistencia está en su ficha.</p>';
  h+='<div class="panel suave"><h3>Historial de clases</h3><p class="ayuda">Toca una fecha para abrir la lista de ese día.</p><div class="fechas-grid">'+D.fechas.slice().reverse().map(function(d){var c=conteoDia(g,d);
    return '<button type="button" class="fecha-b'+(c.a?' con-aus':'')+'" data-a="ir-fecha" data-v="'+d+'"><b>'+esc(fCorta(d))+'</b><span>P '+c.p+' · A '+c.a+' · T '+c.l+'</span></button>';}).join('')+'</div></div>';
  return h;
}
function vPdfPend(){
  var p=ui.pdfPend;if(!p)return '';var m=grupoCoincide(p);
  return '<div class="panel"><h3>Nómina leída del PDF</h3><p><b>'+esc(tit(p.asignatura))+'</b>'+(p.grupo?' · '+esc(tit(p.grupo)):'')+' · '+esc(p.nivel)+'° medio · '+pl(p.estudiantes.length,'estudiante','estudiantes')+(p.profesor?' · Profesor: '+esc(p.profesor):'')+'</p>'+
    '<div class="acciones">'+(m?'<button type="button" class="btn primary" data-a="pdf-actualizar">Actualizar la nómina de '+esc(nombreGrupo(m))+'</button>':'')+
    '<button type="button" class="btn'+(m?'':' primary')+'" data-a="pdf-nuevo">'+(m?'Crear otro curso con esta nómina':'Crear el curso')+'</button><button type="button" class="btn quiet" data-a="pdf-cancelar">Cancelar</button></div>'+
    (m?'<p class="ayuda">Actualizar conserva la asistencia y las notas: agrega a quienes falten y corrige el curso de quienes ya están.</p>':'')+'</div>';
}
function vFormCursoNuevo(){
  var d=ui.cursoForm;
  return '<form class="form" data-form="curso-nuevo"><h3>Nuevo curso</h3>'+vError()+
    '<div class="fila-3"><div class="campo"><label for="cn-asig">Asignatura</label><input type="text" id="cn-asig" data-f="cn.asignatura" value="'+esc(d.asignatura)+'" placeholder="Ej.: Biología Celular y Molecular"></div>'+
    '<div class="campo"><label for="cn-grupo">Grupo</label><input type="text" id="cn-grupo" data-f="cn.grupo" value="'+esc(d.grupo)+'" placeholder="Ej.: Grupo 1"></div>'+
    '<div class="campo"><label for="cn-nivel">Nivel</label><select id="cn-nivel" data-f="cn.nivel">'+['1','2','3','4'].map(function(n){return '<option value="'+n+'"'+(d.nivel===n?' selected':'')+'>'+n+'° medio</option>';}).join('')+'</select></div></div>'+
    '<div class="campo"><label for="cn-lista">Estudiantes (opcional, uno por línea)</label><textarea id="cn-lista" rows="6" data-f="cn.lista" placeholder="Pérez, Soto, María José, 4° A">'+esc(d.lista)+'</textarea><p class="ayuda">Formato: apellido paterno, apellido materno, nombres, curso. También puedes pegar las columnas copiadas desde Excel.</p></div>'+
    '<div class="acciones"><button type="submit" class="btn primary">Crear curso</button><button type="button" class="btn" data-a="cn-cancelar">Cancelar</button></div></form>';
}
function vCurso(g){
  if(!ui.cursoDatos||ui.cursoDatos.id!==g.id)ui.cursoDatos={id:g.id,asignatura:g.asignatura,grupo:g.grupo,nivel:g.nivel,profesor:g.profesor||''};
  if(!ui.nuevoEst||!ui.nuevoEst.filas)ui.nuevoEst={filas:[filaNueva()]};
  var cd=ui.cursoDatos,ne=ui.nuevoEst;
  var h=vPdfPend()+(ui.cursoForm?vFormCursoNuevo():'')+'<div class="dos-col"><div class="seccion">';
  h+=vNuevosEst(g,ne);
  h+='<div class="panel"><h3>Cursos</h3><div class="acciones"><label class="btn" for="pdf-curso">Importar nómina en PDF</label><input type="file" id="pdf-curso" class="oculto" data-file="pdf" accept=".pdf,application/pdf"></div>'+
    (ui.confCurso===g.id?vConfCurso(g):'<div class="acciones"><button type="button" class="btn quiet" data-a="curso-borrar">Eliminar este curso y todos sus datos</button></div>')+'</div>';
  h+='</div><div class="seccion">';
  h+='<form class="panel" data-form="curso-datos"><h3>Datos del curso</h3>'+vError()+
    '<div class="campo"><label for="cd-asig">Asignatura</label><input type="text" id="cd-asig" data-f="cd.asignatura" value="'+esc(cd.asignatura)+'"></div>'+
    '<div class="fila-2"><div class="campo"><label for="cd-grupo">Grupo</label><input type="text" id="cd-grupo" data-f="cd.grupo" value="'+esc(cd.grupo)+'"></div><div class="campo"><label for="cd-nivel">Nivel</label><select id="cd-nivel" data-f="cd.nivel">'+['1','2','3','4'].map(function(n){return '<option value="'+n+'"'+(cd.nivel===n?' selected':'')+'>'+n+'° medio</option>';}).join('')+'</select></div></div>'+
