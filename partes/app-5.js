  guardarUI();
}
function arriba(id){var el=id?document.getElementById(id):null;if(el){var y=el.getBoundingClientRect().top+window.pageYOffset-12;window.scrollTo(0,Math.max(0,y));}else window.scrollTo(0,0);}
function irA(tab){ui.tab=tab;ui.formError=null;render();window.scrollTo(0,0);}

/* =================== Asistencia: lógica =================== */
function setAtt(g,f,sid,v){if(!g.asistencia[f])g.asistencia[f]={};if(g.asistencia[f][sid]===v)delete g.asistencia[f][sid];else g.asistencia[f][sid]=v;if(!Object.keys(g.asistencia[f]).length)delete g.asistencia[f];guardar();}
function agregarEstudiantes(g,lista){var n=0;lista.forEach(function(e){if(!e.ap&&!e.n)return;g.estudiantes.push({id:uid(),ap:e.ap||'',am:e.am||'',n:e.n||'',c:normCurso(e.c)});n++;});g.estudiantes.sort(function(a,b){return cmpEst(a,b);});return n;}
function parsearLista(txt,cursoDef){
  return String(txt||'').split(/\r?\n/).map(function(l){return l.trim();}).filter(Boolean).map(function(l){
    var p=l.indexOf('\t')>=0?l.split('\t'):(l.indexOf(';')>=0?l.split(';'):l.split(','));
    p=p.map(function(x){return x.trim();}).filter(function(x){return x!=='';});
    if(p.length>1&&/^\d+$/.test(p[0]))p=p.slice(1);
    var c='';
    if(p.length>1&&esCurso(p[p.length-1]))c=p.pop();
    else if(p.length===1){var m=/^(.*?)\s+(\d\s*[°º]?\s*(?:medio\s*)?[A-Ka-k])$/.exec(p[0]);if(m){p[0]=m[1];c=m[2];}}
    var ap='',am='',n='';
    if(p.length>=3){ap=p[0];am=p[1];n=p.slice(2).join(' ');}
    else if(p.length===2){var a=p[0].split(/\s+/);ap=a[0];am=a.slice(1).join(' ');n=p[1];}
    else{var w=(p[0]||'').split(/\s+/);if(w.length>=3){ap=w[0];am=w[1];n=w.slice(2).join(' ');}else if(w.length===2){ap=w[0];n=w[1];}else ap=w[0]||'';}
    return {ap:ap,am:am,n:n,c:normCurso(c||cursoDef||'')};
  }).filter(function(e){return e.ap;});
}
function tablaLista(g,f){
  var est=ordenarEst(g.estudiantes),att=g.asistencia[f]||{},c=conteoDia(g,f);
  return '<p>'+pl(c.total,'estudiante','estudiantes')+' · '+pl(c.p,'presente','presentes')+' · '+pl(c.a,'ausente','ausentes')+' · '+pl(c.l,'atraso','atrasos')+(c.sin?' · '+c.sin+' sin marcar':'')+'</p><table><thead><tr><th>N°</th><th>Apellidos</th><th>Nombres</th><th>Curso</th><th>Asistencia</th></tr></thead><tbody>'+
    est.map(function(e,i){var r=retEn(e,f);return '<tr><td>'+(i+1)+'</td><td>'+(r?'<s>'+esc(apellidos(e))+'</s>':esc(apellidos(e)))+'</td><td>'+(r?'<s>'+esc(e.n)+'</s>':esc(e.n))+'</td><td>'+esc(e.c)+'</td><td>'+(r?'Retirado':(ATT[att[e.id]]||'—'))+'</td></tr>';}).join('')+'</tbody></table>';
}
function exportarAsistencia(g,modo){
  var fechas=modo==='dia'?[ui.fecha]:fechasAsistencia(g);
  if(!fechas.length){flash('Este curso aún no tiene asistencia registrada.');render();return;}
  var est=ordenarEst(g.estudiantes);
  var html='<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"><style>table{border-collapse:collapse;font-family:Calibri,Arial,sans-serif;font-size:11pt}th{background:#1e1e1e;color:#fff;font-weight:bold;padding:6px 12px;border:1px solid #000;text-align:center;white-space:nowrap}td{padding:5px 12px;border:1px solid #bbb;white-space:nowrap}.c{text-align:center}.aus{background:#f2c4c4;font-weight:bold;text-align:center}.atr{background:#f5e6a8;font-weight:bold;text-align:center}.pre{text-align:center}.ret{color:#777;text-align:center}</style></head><body><table><thead><tr><th>N°</th><th>Apellido Paterno</th><th>Apellido Materno</th><th>Nombre</th><th>Curso</th>'+
    fechas.map(function(d){return '<th>'+d.slice(8,10)+'/'+d.slice(5,7)+'/'+d.slice(0,4)+'</th>';}).join('')+(modo==='dia'?'':'<th>% Asistencia</th>')+'</tr></thead><tbody>';
  est.forEach(function(e,i){html+='<tr><td class="c">'+(i+1)+'</td><td>'+esc(e.ap)+'</td><td>'+esc(e.am)+'</td><td>'+esc(e.n)+'</td><td class="c">'+esc(e.c)+'</td>'+
    fechas.map(function(d){if(retEn(e,d))return '<td class="ret">RETIRADO</td>';var s=(g.asistencia[d]||{})[e.id];return '<td class="'+(s==='absent'?'aus':s==='late'?'atr':'pre')+'">'+(s==='present'?'PRESENTE':s==='absent'?'AUSENTE':s==='late'?'ATRASO':'—')+'</td>';}).join('')+
    (modo==='dia'?'':'<td class="c">'+(function(){var s=statsEst(g,e.id);return s.pct==null?'—':s.pct+' %';})()+'</td>')+'</tr>';});
  html+='</tbody></table></body></html>';
  descargar('asistencia_'+slug(g.asignatura)+'_'+slug(g.grupo)+'_'+(modo==='dia'?ui.fecha:'completo')+'.xls',html,'application/vnd.ms-excel;charset=utf-8');render();
}
function grupoCoincide(p){var a=normNombre(p.asignatura),gr=normNombre(p.grupo);return S.grupos.filter(function(g){return normNombre(g.asignatura)===a&&normNombre(g.grupo)===gr&&String(g.nivel)===String(p.nivel);})[0]||null;}
function claveEst(e){return normNombre(e.ap+' '+e.am+' '+e.n);}

/* =================== PDF de nómina (formato del sistema del liceo) =================== */
function cargarScript(src){return new Promise(function(res,rej){var s=document.createElement('script');s.src=src;s.onload=res;s.onerror=function(){rej(new Error('No se pudo cargar el lector de PDF.'));};document.head.appendChild(s);});}
function asegurarPdfjs(){if(window.pdfjsLib&&window.pdfjsWorker)return Promise.resolve();return cargarScript(PDFJS+'pdf.worker.min.js').then(function(){return cargarScript(PDFJS+'pdf.min.js');});}
/* Al terminar de leer la nómina se sueltan el documento y el lector de PDF, para que no sigan ocupando memoria
   mientras la agenda queda abierta. Si se importa otro PDF, el lector se vuelve a cargar (queda guardado para usarse sin conexión). */
function soltarPdfjs(){['pdfjsLib','pdfjsWorker','pdfjs-dist/build/pdf','pdfjs-dist/build/pdf.worker'].forEach(function(k){try{delete window[k];}catch(e){}});
  Array.prototype.forEach.call(document.querySelectorAll('script[src^="'+PDFJS+'"]'),function(s){s.remove();});}
/* Los errores del lector vienen en inglés («Invalid PDF structure.»): se avisan en español. */
function errorPdf(e){var n=(e&&e.name)||'';if(n==='PasswordException')return new Error('Ese PDF tiene contraseña y la agenda no puede leerlo.');if(/Exception$/.test(n))return new Error('Ese archivo no es un PDF válido o está dañado.');return e;}
function leerPdf(file){
  var tarea=null;function soltar(){try{if(tarea)tarea.destroy();}catch(e){}tarea=null;soltarPdfjs();}
  return asegurarPdfjs().then(function(){var lib=window.pdfjsLib;lib.GlobalWorkerOptions.workerSrc=PDFJS+'pdf.worker.min.js';return file.arrayBuffer().then(function(buf){tarea=lib.getDocument({data:buf,isEvalSupported:false});return tarea.promise;});})
  .then(function(pdf){
    var txt='',cad=Promise.resolve();
    for(var i=1;i<=pdf.numPages;i++)(function(i){cad=cad.then(function(){return pdf.getPage(i).then(function(pg){return pg.getTextContent();}).then(function(tc){
      var m=new Map();tc.items.forEach(function(it){if(!it.str||!it.str.trim())return;var y=Math.round(it.transform[5]),x=it.transform[4];if(!m.has(y))m.set(y,[]);m.get(y).push({x:x,text:it.str});});
      Array.from(m.keys()).sort(function(a,b){return b-a;}).forEach(function(y){var its=m.get(y).sort(function(a,b){return a.x-b.x;});var line='';its.forEach(function(it,idx){if(idx>0){var gap=it.x-(its[idx-1].x+its[idx-1].text.length*3.5);line+=gap>15?'  ':(gap>3?' ':'');}line+=it.text;});txt+=line.trim()+'\n';});txt+='\n';});});})(i);
    return cad.then(function(){return parsePDFText(txt);});
  }).then(function(r){soltar();return r;},function(e){soltar();throw errorPdf(e);});
}
function parsePDFText(text){
  var lines=text.split('\n').map(function(l){return l.trim();}).filter(Boolean);
  var asignatura='',profesor='',grupo='',nivel='',est=[],headerDone=false,buffer='';
  for(var i=0;i<lines.length;i++){var line=lines[i];
    if(/^Asignatura\s*:/i.test(line)){asignatura=line.replace(/^Asignatura\s*:\s*/i,'').trim();continue;}
    if(/^Profesor\s*:/i.test(line)){profesor=line.replace(/^Profesor\s*:\s*/i,'').trim();continue;}
    if(/^Grupo\s*:/i.test(line)){grupo=line.replace(/^Grupo\s*:\s*/i,'').trim();continue;}
    if(/^Nivel\s*:/i.test(line)){var mn=line.replace(/^Nivel\s*:\s*/i,'').match(/(\d)/);nivel=mn?mn[1]:'';continue;}
    if(/Total\s*de\s*Estudiantes/i.test(line))continue;
    if(/Apellido\s*Paterno/i.test(line)&&/Apellido\s*Materno/i.test(line)){headerDone=true;continue;}
    if(!headerDone)continue;if(/^Asignatura|^Profesor|^Grupo|^Nivel|^Total\s*de/i.test(line))continue;
    var tiene=/(\d)\s+([A-K])\s*$/.test(line)||/(\d)°\s*([A-K])\s*$/.test(line);
    if(tiene){var full=buffer?(buffer+' '+line):line;buffer='';var m=full.match(/(\d)\s+([A-K])\s*$/)||full.match(/(\d)°\s*([A-K])\s*$/);
      if(m){var curso=m[1]+'° '+m[2];var w=full.substring(0,full.length-m[0].length).trim().split(/\s+/).filter(Boolean);if(w.length&&/^\d+$/.test(w[0]))w.shift();
        if(w.length>=3)est.push({id:uid(),ap:w[0],am:w[1],n:w.slice(2).join(' '),c:curso});else if(w.length===2)est.push({id:uid(),ap:w[0],am:w[1],n:'',c:curso});if(!nivel)nivel=m[1];}}
    else buffer=buffer?(buffer+' '+line):line;
  }
  return {asignatura:asignatura,profesor:profesor,grupo:grupo,nivel:nivel||'4',estudiantes:est};
}

/* =================== Notas: lógica =================== */
function exportarNotas(){
  var D=datosNotas(),cols=D.cols.filter(function(c){return c.sem===1;}).concat(D.cols.filter(function(c){return c.sem===2;}));
  var filas=[['N°','Apellidos','Nombres','Curso'].concat(D.todos?['Grupo']:[],cols.map(function(c){return c.name;}),['P1 (1° semestre)','P2 (2° semestre)','Pf (promedio final)'])];
  D.filas.forEach(function(x,i){var c=cal(x.g);var p=promsEst(x.g,x.e.id);
    filas.push([i+1,apellidos(x.e),x.e.n,x.e.c].concat(D.todos?[tit(x.g.grupo||x.g.asignatura)]:[],cols.map(function(col){var cid=col.por[x.g.id];var v=cid?(c.data[x.e.id]||{})[cid]:null;return v!=null?num(v,1):'';}),[p.p1,p.p2,p.pf].map(function(v){return v!=null?num(v,1):'';})));});
  var nombre=D.todos?'notas_'+D.nivel+'medio_todos':'notas_'+slug(D.gs[0].asignatura)+'_'+slug(D.gs[0].grupo);
  descargar(nombre+(ui.nCurso?'_'+slug(ui.nCurso):'')+'_'+hoyISO()+'.csv',aCSV(filas),'text/csv;charset=utf-8');render();
}
function importarNotasCSV(file,g){
  file.text().then(function(text){
    var filas=parseCSV(text);if(filas.length<2){flash('El archivo no tiene filas de notas.');render();return;}
    var cab=filas[0];var ini=/grupo/i.test(cab[4]||'')?5:4;var fin=cab.length;while(fin>ini&&/^\s*(p1|p2|pf)(\s*\(.*\))?\s*$|^\s*promedio/i.test(cab[fin-1]||''))fin--;
    var nombres=cab.slice(ini,fin).filter(function(x){return x;});if(!nombres.length){flash('No encontré columnas de evaluaciones. Usa el mismo formato del CSV que descarga la agenda.');render();return;}
    var c=cal(g);
    conDeshacer('Notas importadas desde CSV.',function(){
      var sem=ui.nSem==='1'||ui.nSem==='2'?+ui.nSem:semDeFecha(hoyISO());nombres.forEach(function(n){if(!buscarColumna(c,n))c.columns.push({id:uid(),name:n,date:'',sem:sem});});
      var ok=0,nf=0;
      filas.slice(1).forEach(function(f){var ap=normNombre(f[1]),nn=normNombre(f[2]);var e=g.estudiantes.filter(function(s){return normNombre(apellidos(s))===ap&&normNombre(s.n)===nn;})[0];if(!e){nf++;return;}ok++;
        if(!c.data[e.id])c.data[e.id]={};nombres.forEach(function(n,j){var col=buscarColumna(c,n);var v=parseNota(f[ini+j]);if(col&&v!=null)c.data[e.id][col.id]=v;});});
      flash('Notas importadas para '+pl(ok,'estudiante','estudiantes')+(nf?'; '+(nf===1?'1 fila no coincidió':nf+' filas no coincidieron')+' con la nómina':'')+'.');
    });
    render();
  }).catch(function(){flash('No se pudo leer el archivo.');render();});
}

/* =================== Disertaciones: lógica =================== */
function tiempoCrono(){return crono.acumulado+(crono.inicio?(Date.now()-crono.inicio)/1000:0);}
/* En marcha, el cronómetro cambia en pantalla una vez por minuto (no cada segundo): en tinta electrónica cada cambio es un refresco.
   La duración exacta se calcula con el reloj al detenerlo, aunque la tableta se haya suspendido. */
function minCrono(s){return Math.floor(s/60)+' min';}
function programarTick(){clearTimeout(crono.intervalo);crono.intervalo=null;if(!crono.inicio)return;var ms=60000-Math.floor(tiempoCrono()*1000)%60000;crono.intervalo=setTimeout(function(){tick();programarTick();},ms+50);}
function tick(){var el=document.getElementById('crono-t');if(!el)return;var s=tiempoCrono(),t=minCrono(s);if(el.textContent!==t)el.textContent=t;var d=disActual(),r=d&&S.rubricas[d.rubricaId],pas=!!(r&&r.minutos&&s>r.minutos*60);if(el.classList.contains('pasado')!==pas)el.classList.toggle('pasado',pas);}
function detenerCrono(registrar){
  if(crono.inicio){crono.acumulado+=(Date.now()-crono.inicio)/1000;crono.inicio=null;}
  clearTimeout(crono.intervalo);crono.intervalo=null;
  if(!registrar||!crono.eqId)return;
  var d=disActual();if(!d)return;var r=S.rubricas[d.rubricaId];var eq=d.equipos.filter(function(e){return e.id===crono.eqId;})[0];if(!eq||!r)return;
  var ev=evDe(d,eq.id,true);ev.duracionSeg=Math.round(crono.acumulado);
  var k=r.criterios.filter(function(x){return x.auto==='tiempo'&&x.alcance!=='individual';})[0];
  var msg='Tiempo registrado para '+(eq.nombre||'el equipo')+': '+mmss(ev.duracionSeg)+'.';
  if(k&&r.minutos){var li=sugerirTiempo(ev.duracionSeg,+r.minutos,r.niveles.length);ev.sugerido={c:k.id,li:li};if(ev.grupo[k.id]==null){ev.grupo[k.id]=li;msg+=' Marqué «'+r.niveles[li].nombre+'» en «'+k.nombre+'»; puedes cambiarlo.';}}
  guardar();flash(msg);
}
function cambiarEquipo(i){
  var d=disActual();if(crono.inicio)detenerCrono(true);
  crono.acumulado=0;crono.eqId=null;ui.dEq=i;render();arriba('eq-top');
}
function pasarANotas(d){
  var g=grupoPorId(d.grupoId),r=S.rubricas[d.rubricaId];if(!g||!r)return;
  var c=cal(g),col=d.notasPasadas?c.columns.filter(function(x){return x.id===d.notasPasadas.columnaId;})[0]:null;
  var nom='Disertación: '+(d.titulo||'sin título');
  if(!col)col=buscarColumna(c,nom);
  if(!col){col={id:uid(),name:nom,date:d.fecha||'',sem:semDeFecha(d.fecha||hoyISO())};c.columns.push(col);}
  var n=0,p=0;
  filasDis(d,r,g).forEach(function(x){if(!c.data[x.e.id])c.data[x.e.id]={};if(x.res.nota!=null){c.data[x.e.id][col.id]=x.res.nota;n++;}else{delete c.data[x.e.id][col.id];p++;}});
  d.notasPasadas={columnaId:col.id,fecha:ahora(),n:n,p:p};guardar();
  flash('Listo: '+n+(n===1?' nota pasó':' notas pasaron')+' a Notas › '+nombreGrupo(g)+' › «'+col.name+'».'+(p?' '+p+' sin nota (ausentes o incompletas).':''));
}
function filasCSVDis(d,r,g){
  var ks=r.criterios;var cab=['Estudiante','Curso','Equipo','Tema'].concat(ks.map(function(k,i){return 'C'+(i+1)+' '+k.nombre;}),['Puntaje','Puntaje máximo','Nota'],r.minutos?['Duración']:[],['Retroalimentación']);
  return [cab].concat(filasDis(d,r,g).map(function(x){
    return [nombreCompleto(x.e),x.e.c,x.eq.nombre,x.eq.tema].concat(ks.map(function(k){if(x.res.aus&&k.alcance==='individual')return '';var li=k.alcance==='individual'?((x.ev&&x.ev.ind&&x.ev.ind[x.e.id])||{})[k.id]:(x.ev&&x.ev.grupo?x.ev.grupo[k.id]:undefined);return li!=null&&r.niveles[li]?num(ptsCrit(r,k,li)):'';}),
      [x.res.aus?'Ausente':num(x.res.total),num(x.res.max),x.res.nota!=null?num(x.res.nota,1):''],r.minutos?[x.ev&&x.ev.duracionSeg?mmss(x.ev.duracionSeg):'']:[],[(x.ev&&x.ev.comentario)||'']);}));
}
function hojasRetro(d,r,g){
  var m=mapaEst(g);
  return d.equipos.map(function(eq,i){var ev=d.evals[eq.id];var ints=ordenarEst(eq.integrantes.map(function(s){return m[s];}).filter(Boolean));
    var h='<div class="'+(i?'salto':'')+'"><h2>'+esc(eq.nombre||'Equipo')+(eq.tema?' · '+esc(eq.tema):'')+'</h2><p><b>'+esc(d.titulo)+'</b> · '+esc(nombreGrupo(g))+(d.fecha?' · '+esc(fLarga(d.fecha)):'')+(ev&&ev.duracionSeg?' · Duración: '+mmss(ev.duracionSeg):'')+'</p><p>Integrantes: '+esc(ints.map(nombreCompleto).join(', '))+'</p>';
    h+='<table><thead><tr><th>Criterio del equipo</th><th>Nivel logrado</th><th>Puntos</th></tr></thead><tbody>'+critEq(r).map(function(k){var li=ev&&ev.grupo?ev.grupo[k.id]:undefined;return '<tr><td><b>'+esc(k.nombre)+'</b> ('+valeTxt(r,k)+')</td><td>'+(li!=null&&r.niveles[li]?'<span class="sel">'+esc(r.niveles[li].nombre)+'</span>: '+esc(k.descriptores[li]||''):'Sin evaluar')+'</td><td>'+(li!=null?num(ptsCrit(r,k,li)):'—')+'</td></tr>';}).join('')+'</tbody></table>';
    if(critInd(r).length)ints.forEach(function(e){var x=resEst(r,ev,e.id);h+='<p style="margin-top:8pt"><b>'+esc(nombreCompleto(e))+'</b> · '+(x.aus?'Ausente':x.nota!=null?'Nota '+num(x.nota,1)+' ('+num(x.total)+' de '+num(x.max)+' puntos)':'Evaluación incompleta')+'</p>'+(x.aus?'':'<table><tbody>'+critInd(r).map(function(k){var li=((ev&&ev.ind&&ev.ind[e.id])||{})[k.id];return '<tr><td><b>'+esc(k.nombre)+'</b> ('+valeTxt(r,k)+')</td><td>'+(li!=null&&r.niveles[li]?'<span class="sel">'+esc(r.niveles[li].nombre)+'</span>: '+esc(k.descriptores[li]||''):'Sin evaluar')+'</td><td>'+(li!=null?num(ptsCrit(r,k,li)):'—')+'</td></tr>';}).join('')+'</tbody></table>');});
    else h+='<p><b>Nota del equipo:</b> '+(function(){var x=ints.length?resEst(r,ev,ints[0].id):null;return x&&x.nota!=null?num(x.nota,1):'Evaluación incompleta';})()+'</p>';
    if(ev&&ev.comentario)h+='<h2>Retroalimentación</h2><p>'+esc(ev.comentario)+'</p>';
    return h+'</div>';}).join('');
}

/* =================== Respaldo: lógica =================== */
function detectarFormato(o){
  if(o&&o.app===APP&&o.datos)return {tipo:'agenda',datos:normalizar(o.datos),exportado:o.exportado};
  var st=o&&o.state&&Array.isArray(o.state.groups)?o.state:(o&&Array.isArray(o.groups)?o:null);
  if(st){var gs=st.groups.filter(validoGrupo);return gs.length?{tipo:'asistencia',grupos:gs,exportado:o.timestamp||o.fecha||null,origen:'el respaldo de Control de Asistencia'}:null;}
  if(o&&o.app==='libreta-equipos-pautas'&&o.datos)return {tipo:'libreta',equipos:o.datos.equipos||{},bitacora:o.datos.bitacora||{},exportado:o.exportado};
  return null;
}
function aplicarImport(p){
  if(p.tipo==='agenda'){conDeshacer('Se restauró el respaldo de la agenda.',function(){S=p.datos;});ui.grupoId=null;ui.dId=null;ui.teamId=null;ui.nSel=null;flash('Respaldo restaurado.');}
  else if(p.tipo==='asistencia'){var gs=clonar(p.grupos);gs.forEach(prepGrupo);conDeshacer('Se reemplazaron los cursos.',function(){S.grupos=gs;});ui.grupoId=null;ui.nSel=null;flash('Listo: '+resumenGrupos(gs)+'.');}
  else{conDeshacer('Se agregó la bitácora de la Libreta.',function(){Object.assign(S.equipos,clonar(p.equipos));Object.assign(S.bitacora,clonar(p.bitacora));S.meta.migradoLibreta=ahora();});flash('Bitácora agregada.');}
  ui.importPend=null;
}
function respaldoJSON(){return JSON.stringify({app:APP,version:1,exportado:ahora(),datos:S});}
function traerDeCuenta(email,pass){
  ui.cuenta.cargando=true;ui.cuenta.error=null;render();
  var tok,uidU;
  fetch(SB_URL+'/auth/v1/token?grant_type=password',{method:'POST',headers:{'apikey':SB_KEY,'Content-Type':'application/json'},body:JSON.stringify({email:email,password:pass})})
  .then(function(r){return r.json().catch(function(){return {};}).then(function(j){
    if(!r.ok){var t=String(j.error_description||j.msg||j.error_code||j.error||'');throw {msg:/confirm/i.test(t)?'Debes confirmar tu correo antes de entrar.':(/invalid/i.test(t)||r.status===400)?'Correo o contraseña incorrectos.':'No se pudo entrar a tu cuenta ('+(t||r.status)+').'};}
    tok=j.access_token;uidU=j.user&&j.user.id;if(!tok||!uidU)throw {msg:'Tu cuenta respondió sin sesión. Inténtalo de nuevo.'};
    return fetch(SB_URL+'/rest/v1/app_data?select=state,updated_at&id=eq.'+encodeURIComponent(uidU),{headers:{'apikey':SB_KEY,'Authorization':'Bearer '+tok}});
  });})
  .then(function(r){return r.json().then(function(rows){
    if(!r.ok)throw {msg:'No se pudieron leer tus datos ('+r.status+').'};
    if(!Array.isArray(rows)||!rows.length||!rows[0].state||!Array.isArray(rows[0].state.groups))throw {msg:'Tu cuenta no tiene cursos guardados.'};
    var gs=rows[0].state.groups.filter(validoGrupo);if(!gs.length)throw {msg:'Tu cuenta no tiene cursos guardados.'};
    ui.importPend={tipo:'asistencia',grupos:gs,exportado:rows[0].updated_at,origen:'tu cuenta de Control de Asistencia'};
    ui.cuenta.cargando=false;flash('Leí tu cuenta. Revisa el resumen y confirma.');
    if(!S.grupos.length){aplicarImport(ui.importPend);irA('hoy');return;}
    ui.tab='respaldo';render();var el=document.querySelector('.confirmar');if(el)el.scrollIntoView();
  });})
  .catch(function(e){ui.cuenta.cargando=false;ui.cuenta.error=e&&e.msg?e.msg:(navigator.onLine?'No se pudo conectar con tu cuenta. Inténtalo de nuevo en un momento.':'Sin conexión. Conéctate a internet para traer tus datos (solo esta vez).');render();});
}

/* =================== Acciones =================== */
var A={
  /* Al cambiar de pestaña, el aviso de la anterior se va (era de esa pantalla); «Deshacer» sigue disponible. */
  'tab':function(el){if(el.dataset.v!=='asistencia')ui.ficha=null;ui.regAbierto=false;ui.msg=null;irA(el.dataset.v);},
  'vista':function(el){ui[el.dataset.k]=el.dataset.v;ui.formError=null;ui.regAbierto=false;render();arriba();},
  'deshacer':function(){if(!ui.undo)return;S=normalizar(JSON.parse(ui.undo.snap));ui.undo=null;persistir();flash('Se deshizo el cambio.');render();},
  'copia-cerrar':function(){ui.copiaManual=null;render();},
  'recargar':function(){persistir();setTimeout(function(){location.reload();},300);},
  /* Hoy */
  'ir-lista':function(el){ui.grupoId=el.dataset.id;ui.fecha=hoyISO();ui.aVista='lista';ui.ficha=null;ui.regAbierto=false;irA('asistencia');},
  'ir-stats':function(el){ui.grupoId=el.dataset.id;ui.aVista='stats';ui.ficha=null;irA('asistencia');},
  'ir-cuenta':function(){irA('respaldo');setTimeout(function(){var b=document.getElementById('bloque-cuenta');if(b)b.scrollIntoView();foco('cu-email');},0);},
  'imp-local':function(){var gs=asistenciaLocal();if(!gs)return;var p={tipo:'asistencia',grupos:gs,origen:'Control de Asistencia en esta tableta'};if(!S.grupos.length){aplicarImport(p);irA('hoy');}else{ui.importPend=p;irA('respaldo');}},
  'imp-libreta':function(){var l=libretaLocal();if(!l)return;ui.importPend={tipo:'libreta',equipos:l.equipos,bitacora:l.bitacora||{}};render();},
  'd-abrir':function(el){var d=S.disertaciones[el.dataset.id];if(!d)return;ui.dId=el.dataset.id;var pr=progresoDis(d);ui.dVista=pr.total&&pr.listos===pr.total?'resumen':(pr.total?'evaluar':'config');ui.dEq=0;irA('disertaciones');},
  'b-abrir':function(el){ui.teamId=el.dataset.id;ui.teamMode='ver';irA('bitacora');},
  /* Asistencia */
  'fecha-mover':function(el){ui.fecha=sumarDias(ui.fecha,+el.dataset.v);ui.regAbierto=false;render();},
  'fecha-hoy':function(){ui.fecha=hoyISO();ui.regAbierto=false;render();},
  'marcar':function(el){var g=grupoActual();if(!g)return;var sid=el.dataset.id;setAtt(g,ui.fecha,sid,el.dataset.v);var st=(g.asistencia[ui.fecha]||{})[sid]||null;
    var grp=el.closest('.pat');if(grp)grp.querySelectorAll('button').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.v===st));});
    var c=document.getElementById('conteo');if(c)c.innerHTML=vConteo(g);},
  'todos-presentes':function(){var g=grupoActual();if(!g)return;if(!g.asistencia[ui.fecha])g.asistencia[ui.fecha]={};var n=0;g.estudiantes.forEach(function(e){if(!retEn(e,ui.fecha)&&!g.asistencia[ui.fecha][e.id]){g.asistencia[ui.fecha][e.id]='present';n++;}});guardar();flash(pl(n,'estudiante marcado como presente','estudiantes marcados como presentes')+'. Toca P de nuevo para quitar a alguien.');render();},
  'orden':function(el){ui.soloApellido=el.dataset.v==='apellido';render();},
  'ficha':function(el){ui.ficha=el.dataset.id;ui.estDraft=null;ui.formError=null;if(ui.tab!=='asistencia')ui.tab='asistencia';render();window.scrollTo(0,0);},
  'ficha-obs':function(el){ui.ficha=el.dataset.id;ui.estDraft=null;ui.formError=null;render();window.scrollTo(0,0);foco('obs-txt');},
  'ficha-cerrar':function(){ui.ficha=null;ui.estDraft=null;ui.formError=null;render();},
  'obs-borrar':function(el){var g=grupoActual();var sid=el.dataset.id;conDeshacer('Observación borrada.',function(){if(g.notas[ui.fecha]){delete g.notas[ui.fecha][sid];if(!Object.keys(g.notas[ui.fecha]).length)delete g.notas[ui.fecha];}});render();},
  'reg-abrir':function(){ui.regAbierto=true;render();arriba('form-log');foco('lg-obj');},
  'log-listo':function(el){if(el.dataset.ctx==='clases')ui.cEdit=null;else ui.regAbierto=false;flash('Registro de clase guardado.');render();},
  'log-borrar':function(el){var g=grupoPorId(el.dataset.g),d=el.dataset.d;if(!g)return;conDeshacer('Registro de clase borrado.',function(){delete g.classLogs[d];});ui.regAbierto=false;ui.cEdit=null;render();},
  'est-borrar':function(el){var g=grupoActual(),sid=el.dataset.id,e=estPorId(g,sid);if(!e)return;
    conDeshacer('Se eliminó a '+nombreCompleto(e)+'.',function(){g.estudiantes=g.estudiantes.filter(function(s){return s.id!==sid;});Object.keys(g.asistencia).forEach(function(d){delete g.asistencia[d][sid];});Object.keys(g.notas).forEach(function(d){delete g.notas[d][sid];});delete cal(g).data[sid];
      Object.keys(S.disertaciones).forEach(function(k){S.disertaciones[k].equipos.forEach(function(eq){eq.integrantes=eq.integrantes.filter(function(s){return s!==sid;});});});});
    ui.ficha=null;ui.estDraft=null;render();},
  'est-retirar':function(el){var g=grupoActual(),e=estPorId(g,el.dataset.id);if(!e)return;conDeshacer('Retiro registrado: '+nombreCompleto(e)+' sigue en la lista con el nombre tachado y ya no se cuenta al pasar lista.',function(){e.ret=hoyISO();});render();},
  'est-reincorporar':function(el){var g=grupoActual(),e=estPorId(g,el.dataset.id);if(!e)return;delete e.ret;guardar();flash(nombreCompleto(e)+' volvió a la lista.');render();},
  'exp-asis':function(el){exportarAsistencia(grupoActual(),el.dataset.v);},
  'exp-nomina':function(){var g=grupoActual();descargar('nomina_'+slug(g.asignatura)+'_'+slug(g.grupo)+'.csv',aCSV([['N° lista','Apellido Paterno','Apellido Materno','Nombre(s)','Curso','Estado']].concat(ordenarEst(g.estudiantes).map(function(e,i){return [i+1,e.ap,e.am,e.n,e.c,e.ret?'Retirado desde el '+e.ret.slice(8,10)+'/'+e.ret.slice(5,7)+'/'+e.ret.slice(0,4):''];}))),'text/csv;charset=utf-8');render();},
  'imp-lista':function(){var g=grupoActual();imprimir('Lista de asistencia · '+fLarga(ui.fecha),nombreGrupo(g),tablaLista(g,ui.fecha));},
  'imp-stats':function(){var g=grupoActual(),D=datosStats(g),hasCal=cal(g).columns.length>0;
    imprimir('Estadísticas de asistencia',nombreGrupo(g),'<p>'+pl(D.fechas.length,'clase','clases')+' · asistencia promedio '+(D.prom!=null?D.prom+' %':'—')+' · '+D.bajo+' bajo 75 %</p><table><thead><tr><th>Estudiante</th><th>Curso</th><th>Asistencia</th><th>P</th><th>A</th><th>T</th><th>Clases</th>'+(hasCal?'<th>Prom. notas</th>':'')+'</tr></thead><tbody>'+
      D.filas.map(function(x){return '<tr><td>'+esc(apellidos(x.e))+', '+esc(x.e.n)+'</td><td>'+esc(x.e.c)+'</td><td>'+x.s.pct+' %</td><td>'+x.s.p+'</td><td>'+x.s.a+'</td><td>'+x.s.l+'</td><td>'+x.s.r+'</td>'+(hasCal?'<td>'+(x.prom!=null?num(x.prom,1):'—')+'</td>':'')+'</tr>';}).join('')+'</tbody></table>');},
  'curso-nuevo':function(){ui.cursoForm={asignatura:'',grupo:'',nivel:'4',lista:''};ui.formError=null;if(S.grupos.length){ui.tab='asistencia';ui.aVista='curso';ui.ficha=null;}render();arriba();foco('cn-asig');},
  'cn-cancelar':function(){ui.cursoForm=null;ui.formError=null;render();},
  'curso-borrar':function(){var g=grupoActual();conDeshacer('Se eliminó el curso '+nombreGrupo(g)+'.',function(){S.grupos=S.grupos.filter(function(x){return x.id!==g.id;});});ui.grupoId=null;ui.aVista='lista';render();window.scrollTo(0,0);},
  'pdf-actualizar':function(){var p=ui.pdfPend,g=grupoCoincide(p);if(!g)return;var nuevos=0,act=0;
    conDeshacer('Se actualizó la nómina.',function(){var por={};g.estudiantes.forEach(function(e){por[claveEst(e)]=e;});
      p.estudiantes.forEach(function(e){var ex=por[claveEst(e)];if(ex){if(ex.c!==normCurso(e.c)){ex.c=normCurso(e.c);act++;}}else{g.estudiantes.push({id:uid(),ap:e.ap,am:e.am,n:e.n,c:normCurso(e.c)});nuevos++;}});
      if(p.profesor)g.profesor=p.profesor;g.estudiantes.sort(function(a,b){return cmpEst(a,b);});});
    var fuera=g.estudiantes.filter(function(e){return !retirado(e)&&!p.estudiantes.some(function(x){return claveEst(x)===claveEst(e);});}).length;
    ui.pdfPend=null;ui.grupoId=g.id;ui.tab='asistencia';ui.aVista='lista';flash('Nómina actualizada: '+pl(nuevos,'agregado','agregados')+', '+act+' con curso corregido.'+(fuera?' '+fuera+' de la lista no aparecen en el PDF; desde su ficha puedes marcarlos como retirados o eliminarlos.':''));render();},
  'pdf-nuevo':function(){var p=ui.pdfPend;var g={id:uid(),asignatura:p.asignatura||'Sin asignatura',grupo:p.grupo||'',nivel:String(p.nivel||'4'),profesor:p.profesor||'',estudiantes:[],asistencia:{},notas:{},classLogs:{},calificaciones:{columns:[],data:{}}};
    agregarEstudiantes(g,p.estudiantes);conDeshacer('Se creó el curso '+nombreGrupo(g)+'.',function(){S.grupos.push(g);});ui.pdfPend=null;ui.grupoId=g.id;ui.tab='asistencia';ui.aVista='lista';flash('Curso creado con '+pl(g.estudiantes.length,'estudiante','estudiantes')+'.');render();},
  'pdf-cancelar':function(){ui.pdfPend=null;render();},
  'ir-fecha':function(el){ui.fecha=el.dataset.v;ui.aVista='lista';render();window.scrollTo(0,0);},
  /* Notas */
  'ev-nueva':function(){ui.evalForm={nombre:'',fecha:hoyISO(),sem:ui.nSem==='1'||ui.nSem==='2'?ui.nSem:String(semDeFecha(hoyISO()))};ui.renombrar=null;ui.formError=null;render();foco('ev-nombre');},
  'ev-cancelar':function(){ui.evalForm=null;ui.formError=null;render();},
  'ev-editar':function(el){var g=grupoPorId(ui.nSel.slice(2));var col=cal(g).columns.filter(function(c){return c.id===el.dataset.c;})[0];if(!col)return;ui.renombrar={gid:g.id,cid:col.id,nombre:col.name,fecha:col.date||'',sem:String(semCol(col))};ui.evalForm=null;ui.formError=null;render();arriba();foco('ren-nombre');},
  'ren-cancelar':function(){ui.renombrar=null;ui.formError=null;render();},
  'ev-borrar':function(el){var g=grupoPorId(ui.nSel.slice(2)),c=cal(g),cid=el.dataset.c;var col=c.columns.filter(function(x){return x.id===cid;})[0];if(!col)return;
    conDeshacer('Se eliminó la evaluación «'+col.name+'».',function(){c.columns=c.columns.filter(function(x){return x.id!==cid;});Object.keys(c.data).forEach(function(s){delete c.data[s][cid];});});render();},
  'exp-notas':function(){exportarNotas();},
  'imp-notas':function(){var D=datosNotas(),cols=colsVista(D.cols);if(!D.cols.length){flash('No hay evaluaciones para imprimir.');render();return;}
    imprimir('Notas · '+(ui.nSem==='a'?'año completo':ui.nSem+'° semestre'),D.todos?D.nivel+'° medio · todos los grupos':nombreGrupo(D.gs[0]),(ui.nCurso?'<p>Curso: '+esc(ui.nCurso)+'</p>':'')+'<table><thead><tr><th>N°</th><th>Estudiante</th><th>Curso</th>'+cols.map(function(c){return '<th>'+esc(c.name)+'</th>';}).join('')+'<th>P1</th><th>P2</th><th>Pf</th></tr></thead><tbody>'+
      D.filas.map(function(x,i){var c=cal(x.g);var p=promsEst(x.g,x.e.id);return '<tr><td>'+(i+1)+'</td><td>'+(retirado(x.e)?'<s>'+esc(apellidos(x.e))+', '+esc(x.e.n)+'</s> (retirado)':esc(apellidos(x.e))+', '+esc(x.e.n))+'</td><td>'+esc(x.e.c)+'</td>'+cols.map(function(col){var cid=col.por[x.g.id];var v=cid?(c.data[x.e.id]||{})[cid]:null;return '<td>'+(v!=null?num(v,1):'—')+'</td>';}).join('')+[p.p1,p.p2,p.pf].map(function(v,j){var t=v!=null?num(v,1):'—';return '<td>'+(j===2?'<b>'+t+'</b>':t)+'</td>';}).join('')+'</tr>';}).join('')+'</tbody></table><p>P1 y P2: promedio de las notas de cada semestre. Pf: promedio de P1 y P2.</p>');},
  /* Clases */
