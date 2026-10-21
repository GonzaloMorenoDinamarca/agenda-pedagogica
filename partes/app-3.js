    '<div class="campo"><label for="cd-prof">Profesor</label><input type="text" id="cd-prof" data-f="cd.profesor" value="'+esc(cd.profesor)+'"></div><button type="submit" class="btn">Guardar datos del curso</button></form>';
  h+='<div class="panel"><h3>Descargar e imprimir</h3><div class="acciones"><button type="button" class="btn" data-a="exp-asis" data-v="dia">Asistencia del día (Excel)</button><button type="button" class="btn" data-a="exp-asis" data-v="todo">Toda la asistencia (Excel)</button><button type="button" class="btn" data-a="exp-nomina">Nómina (CSV)</button><button type="button" class="btn" data-a="imp-lista">Imprimir lista del día</button></div></div>';
  return h+'</div></div>';
}
/* Eliminar un curso borra su nómina, asistencia, notas y registros: antes se pide confirmar, con lo que se perdería a la vista.
   Igual que con un estudiante: el aviso sube entero a la vista y «Sí, eliminar el curso» no cae donde estaba el dedo. */
function vConfCurso(g){
  var nE=g.estudiantes.length,nA=fechasAsistencia(g).length,nN=cal(g).columns.length,nR=Object.keys(g.classLogs).length;
  var nD=Object.keys(S.disertaciones).filter(function(k){return S.disertaciones[k].grupoId===g.id;}).length;
  var p=[];if(nE)p.push(pl(nE,'estudiante','estudiantes'));if(nA)p.push('asistencia de '+pl(nA,'clase','clases'));if(nN)p.push(pl(nN,'evaluación','evaluaciones')+' con sus notas');if(nR)p.push(pl(nR,'registro de clase','registros de clase'));
  var lista=p.length>1?p.slice(0,-1).join(', ')+' y '+p[p.length-1]:(p[0]||'');
  return '<div class="form" id="conf-curso" role="alert" style="border-width:3px"><p><b>¿Eliminar el curso '+esc(nombreGrupo(g))+'?</b> '+(p.length?'Se borra con todo lo suyo: '+esc(lista)+'.':'No tiene estudiantes ni datos registrados.')+
    (nD?' '+(nD===1?'Su disertación queda guardada, pero sin curso.':'Sus '+nD+' disertaciones quedan guardadas, pero sin curso.'):'')+'</p>'+
    (p.length?'<p class="ayuda">Si quieres guardar una copia antes, descarga un respaldo en «Respaldo y datos».</p>':'')+
    '<div class="acciones"><button type="button" class="btn primary" data-a="curso-borrar-si">Sí, eliminar el curso</button><button type="button" class="btn" data-a="curso-borrar-no">Cancelar</button></div></div>';
}

/* =================== Vista: Notas =================== */
/* Semestres: cada evaluación es del 1° o del 2°. Si no lo dice, se deduce de su fecha (hasta junio, 1°) y queda guardado; se cambia al crearla o editarla. */
function semDeFecha(f){var m=+String(f||'').slice(5,7);return m>=1&&m<=6?1:2;}
function semCol(c){if(c.sem!==1&&c.sem!==2){c.sem=semDeFecha(c.date||hoyISO());guardar();}return c.sem;}
/* P1 y P2: promedio de las notas de cada semestre. Pf: promedio de P1 y P2 (con un solo semestre con notas, es ese).
   Siempre con todas las evaluaciones del curso, se mire el semestre que se mire. */
function promsEst(g,sid){var c=cal(g),d=c.data[sid]||{},s1=[],s2=[];c.columns.forEach(function(col){var v=d[col.id];if(v==null)return;(semCol(col)===1?s1:s2).push(v);});var p1=promedioDe(s1),p2=promedioDe(s2);return {p1:p1,p2:p2,pf:promedioDe([p1,p2])};}
function pintarProms(g,sid){var p=promsEst(g,sid);['p1','p2','pf'].forEach(function(k){var el=document.getElementById(k+'-'+sid);if(el){el.textContent=p[k]!=null?num(p[k],1):'—';el.classList.toggle('baja',p[k]!=null&&p[k]<4);}});}
function columnasNotas(gs,todos){
  if(!todos){var g=gs[0];return cal(g).columns.map(function(c){var por={};por[g.id]=c.id;return {key:c.id,id:c.id,name:c.name,date:c.date||'',sem:semCol(c),por:por};});}
  var map={},orden=[];
  gs.forEach(function(g){cal(g).columns.forEach(function(c){var k=normNombre(c.name);if(!map[k]){map[k]={key:'n:'+k,name:c.name,date:c.date||'',sem:semCol(c),por:{}};orden.push(map[k]);}if(!map[k].por[g.id])map[k].por[g.id]=c.id;});});
  return orden;
}
/* Qué evaluaciones se ven: las del semestre elegido o todo el año (primero las del 1°). */
function colsVista(cols){if(ui.nSem==='a')return cols.filter(function(c){return c.sem===1;}).concat(cols.filter(function(c){return c.sem===2;}));var s=+ui.nSem;return cols.filter(function(c){return c.sem===s;});}
function campoSem(pre,v){return '<div class="campo"><label for="'+pre+'-sem">Semestre</label><select id="'+pre+'-sem" data-f="'+pre+'.sem">'+[['1','1° semestre'],['2','2° semestre']].map(function(o){return '<option value="'+o[0]+'"'+(String(v)===o[0]?' selected':'')+'>'+o[1]+'</option>';}).join('')+'</select></div>';}
function datosNotas(){
  if(!ui.nSel||(ui.nSel.indexOf('g:')===0&&!grupoPorId(ui.nSel.slice(2)))||(ui.nSel.indexOf('n:')===0&&!S.grupos.some(function(g){return g.nivel===ui.nSel.slice(2);})))ui.nSel='g:'+grupoActual().id;
  var todos=ui.nSel.indexOf('n:')===0,nivel=todos?ui.nSel.slice(2):null;
  var gs=todos?gruposOrden().filter(function(g){return g.nivel===nivel;}):[grupoPorId(ui.nSel.slice(2))];
  var cols=columnasNotas(gs,todos);
  var filas=[];gs.forEach(function(g){g.estudiantes.forEach(function(e){filas.push({g:g,e:e});});});
  var cursos={};filas.forEach(function(x){if(x.e.c)cursos[x.e.c]=1;});cursos=Object.keys(cursos).sort(cmp);
  if(ui.nCurso&&cursos.indexOf(ui.nCurso)<0)ui.nCurso='';
  if(ui.nCurso)filas=filas.filter(function(x){return x.e.c===ui.nCurso;});
  filas.sort(function(a,b){return cmpEst(a.e,b.e);});
  return {todos:todos,nivel:nivel,gs:gs,cols:cols,filas:filas,cursos:cursos};
}
function vNotas(){
  if(!S.grupos.length)return vSinCursos();
  var D=datosNotas();
  if(ui.nSem!=='1'&&ui.nSem!=='2'&&ui.nSem!=='a')ui.nSem=String(semDeFecha(hoyISO()));
  var h='<section class="seccion"><div class="barra"><div class="campo"><label for="sel-notas">Curso</label><select id="sel-notas" data-sel="notas">'+opcionesGrupos(ui.nSel,true)+'</select></div>'+
    (D.cursos.length>1?'<div class="campo"><label for="sel-ncurso">Filtrar por curso</label><select id="sel-ncurso" data-sel="ncurso"><option value="">Todos los cursos</option>'+D.cursos.map(function(c){return '<option value="'+esc(c)+'"'+(ui.nCurso===c?' selected':'')+'>'+esc(c)+'</option>';}).join('')+'</select></div>':'')+'</div>';
  h+=segmento('nSem',[['1','1° semestre'],['2','2° semestre'],['a','Año completo']]);
  h+='<div class="acciones">'+(D.todos?'':'<button type="button" class="btn primary" data-a="ev-nueva">+ Evaluación</button>')+'<button type="button" class="btn" data-a="exp-notas">Descargar CSV</button>'+
    (D.todos?'':'<label class="btn" for="notas-csv">Importar CSV</label><input type="file" id="notas-csv" class="oculto" data-file="notas-csv" accept=".csv,text/csv">')+'<button type="button" class="btn" data-a="imp-notas">Imprimir</button></div>';
  if(D.todos)h+='<p class="ayuda">Vista de todos los grupos del nivel: las evaluaciones con el mismo nombre se muestran en una sola columna. «—» indica que ese grupo no tiene esa evaluación.</p>';
  if(ui.evalForm)h+='<form class="form" data-form="eval"><h3>Nueva evaluación</h3>'+vError()+'<div class="fila-3"><div class="campo"><label for="ev-nombre">Nombre</label><input type="text" id="ev-nombre" data-f="ev.nombre" value="'+esc(ui.evalForm.nombre)+'" placeholder="Ej.: Prueba 1"></div><div class="campo"><label for="ev-fecha">Fecha</label><input type="date" id="ev-fecha" data-f="ev.fecha" value="'+esc(ui.evalForm.fecha)+'"></div>'+campoSem('ev',ui.evalForm.sem)+'</div><div class="acciones"><button type="submit" class="btn primary">Agregar evaluación</button><button type="button" class="btn" data-a="ev-cancelar">Cancelar</button></div></form>';
  if(ui.renombrar)h+='<form class="form" data-form="renombrar"><h3>Editar evaluación</h3>'+vError()+'<div class="fila-3"><div class="campo"><label for="ren-nombre">Nombre</label><input type="text" id="ren-nombre" data-f="ren.nombre" value="'+esc(ui.renombrar.nombre)+'"></div><div class="campo"><label for="ren-fecha">Fecha</label><input type="date" id="ren-fecha" data-f="ren.fecha" value="'+esc(ui.renombrar.fecha)+'"></div>'+campoSem('ren',ui.renombrar.sem)+'</div><div class="acciones"><button type="submit" class="btn primary">Guardar</button><button type="button" class="btn" data-a="ren-cancelar">Cancelar</button></div></form>';
  if(!D.cols.length)return h+'<div class="vacio"><h3>'+(D.todos?'Ningún grupo de este nivel tiene evaluaciones':'Agrega la primera evaluación')+'</h3><p>Cada evaluación es una columna de notas. Las notas de las disertaciones también llegan aquí.</p></div></section>';
  if(!D.filas.length)return h+'<div class="vacio"><h3>Sin estudiantes</h3></div></section>';
  var cols=colsVista(D.cols);
  if(!cols.length)h+='<p class="ayuda">Aún no hay evaluaciones del '+ui.nSem+'° semestre.'+(D.todos?'':' Agrégalas con «+ Evaluación».')+'</p>';
  function sub(c){var a=[];if(ui.nSem==='a')a.push(c.sem+'° sem.');if(c.date)a.push(fCorta(c.date));return a.length?'<small>'+esc(a.join(' · '))+'</small>':'';}
  var th='<tr><th class="col-nombre">Estudiante</th>'+(D.todos?'<th>Grupo</th>':'')+cols.map(function(c){return '<th class="ev">'+esc(c.name)+sub(c)+(D.todos?'':'<div class="ev-acc"><button type="button" data-a="ev-editar" data-c="'+esc(c.id)+'" aria-label="Editar '+esc(c.name)+'">✎</button><button type="button" data-a="ev-borrar" data-c="'+esc(c.id)+'" aria-label="Eliminar '+esc(c.name)+'">✕</button></div>')+'</th>';}).join('')+
    '<th class="pc p-ini" title="Promedio del 1° semestre">P1<small>1° sem.</small></th><th class="pc" title="Promedio del 2° semestre">P2<small>2° sem.</small></th><th class="pc pf" title="Promedio final: promedio de P1 y P2">Pf<small>final</small></th></tr>';
  function celP(k,v,sid,cls){return '<td class="prom pc'+cls+(v!=null&&v<4?' baja':'')+'" id="'+k+'-'+esc(sid)+'">'+(v!=null?num(v,1):'—')+'</td>';}
  var multi=D.cursos.length>1&&!ui.nCurso,last=null,body='',ncol=cols.length+4+(D.todos?1:0);
  D.filas.forEach(function(x){
    if(multi&&x.e.c!==last){last=x.e.c;body+='<tr class="sep"><td colspan="'+ncol+'">'+esc(x.e.c||'Sin curso')+'</td></tr>';}
    var c=cal(x.g),rt=retirado(x.e);
    body+='<tr'+(rt?' class="ret"':'')+'><td class="col-nombre">'+(rt?'<span class="tachado">':'')+'<b>'+esc(apellidos(x.e))+'</b>, '+esc(x.e.n)+(rt?'</span>':'')+'<small>'+esc(x.e.c||'')+(rt?(x.e.c?' · ':'')+'retirado':'')+'</small></td>'+(D.todos?'<td>'+esc(tit(x.g.grupo||x.g.asignatura))+'</td>':'')+
      cols.map(function(col){var cid=col.por[x.g.id];if(!cid)return '<td class="nc" title="Este grupo no tiene esta evaluación">—</td>';var v=(c.data[x.e.id]||{})[cid];
        return '<td class="nc"><input class="nota-in'+(v!=null&&v<4?' baja':'')+'" id="nt-'+esc(x.e.id)+'-'+esc(cid)+'" type="text" inputmode="decimal" autocomplete="off" data-f="nota" data-g="'+esc(x.g.id)+'" data-sid="'+esc(x.e.id)+'" data-c="'+esc(cid)+'" value="'+(v!=null?num(v,1):'')+'" aria-label="'+esc(col.name)+' de '+esc(nombreCorto(x.e))+'"></td>';}).join('');
    var p=promsEst(x.g,x.e.id);
    body+=celP('p1',p.p1,x.e.id,' p-ini')+celP('p2',p.p2,x.e.id,'')+celP('pf',p.pf,x.e.id,' pf')+'</tr>';
  });
  h+='<div class="tabla-wrap"><table class="tabla-notas"><thead>'+th+'</thead><tbody>'+body+'</tbody></table></div><p class="ayuda">P1 y P2: promedio de las notas de cada semestre. Pf: promedio de P1 y P2. Escribe la nota con coma o punto (5,6 o 5.6), o sin separador (56); se guarda al instante.</p>';
  return h+'</section>';
}

/* =================== Vista: Clases =================== */
function todosLogs(){var r=[];S.grupos.forEach(function(g){Object.keys(g.classLogs).forEach(function(d){var l=g.classLogs[d];if(l&&(l.objetivo||l.temas||l.obs||l.tarea||l.destacado))r.push({g:g,d:d,l:l});});});r.sort(function(a,b){return cmp(b.d,a.d)||cmp(nombreGrupo(a.g),nombreGrupo(b.g));});return r;}
function logsFiltrados(){
  var b=normNombre(ui.cBuscar);
  return todosLogs().filter(function(x){
    if(ui.cNivel&&x.g.nivel!==ui.cNivel)return false;
    if(ui.cGrupo&&x.g.id!==ui.cGrupo)return false;
    if(ui.cDest&&!x.l.destacado)return false;
    if(b&&[x.g.asignatura,x.g.grupo,x.l.objetivo,x.l.temas,x.l.obs,x.l.tarea].map(normNombre).join(' ').indexOf(b)<0)return false;
    return true;
  });
}
function camposLog(l){return (l.objetivo?'<dt>Objetivo</dt><dd>'+esc(l.objetivo)+'</dd>':'')+(l.temas?'<dt>Temas</dt><dd>'+esc(l.temas)+'</dd>':'')+(l.obs?'<dt>Observaciones</dt><dd>'+esc(l.obs)+'</dd>':'')+(l.tarea?'<dt>Pendiente</dt><dd><b>'+esc(l.tarea)+'</b></dd>':'');}
function vClases(){
  var niveles={};S.grupos.forEach(function(g){niveles[g.nivel]=1;});niveles=Object.keys(niveles).sort(cmp);
  var lista=logsFiltrados(),pags=Math.max(1,Math.ceil(lista.length/POR_PAGINA_CLASES));if(ui.cPag>=pags)ui.cPag=pags-1;
  var h='<section class="seccion"><h2 class="titulo-sec">Registro de clases</h2>';
  h+='<div class="filtros"><div class="campo"><label for="c-nivel">Nivel</label><select id="c-nivel" data-sel="cnivel"><option value="">Todos</option>'+niveles.map(function(n){return '<option value="'+esc(n)+'"'+(ui.cNivel===n?' selected':'')+'>'+esc(n)+'° medio</option>';}).join('')+'</select></div>'+
    '<div class="campo"><label for="c-grupo">Curso</label><select id="c-grupo" data-sel="cgrupo"><option value="">Todos</option>'+opcionesGrupos(ui.cGrupo)+'</select></div>'+
    '<div class="campo"><label for="c-buscar">Buscar</label><input type="search" id="c-buscar" data-f="cbuscar" value="'+esc(ui.cBuscar)+'" placeholder="Tema, objetivo…"></div>'+
    '<button type="button" class="btn" data-a="c-dest" aria-pressed="'+ui.cDest+'">★ Solo destacados</button></div>';
  h+='<div class="acciones">'+(S.grupos.length?'<button type="button" class="btn primary" data-a="c-nuevo">+ Nuevo registro</button>':'')+'<button type="button" class="btn" data-a="imp-clases">Imprimir</button><span class="ayuda">'+lista.length+(lista.length===1?' registro':' registros')+'</span></div>';
  if(ui.cNuevo)h+='<form class="form" data-form="c-nuevo"><h3>Nuevo registro de clase</h3><div class="fila-2"><div class="campo"><label for="cnu-g">Curso</label><select id="cnu-g" data-f="cnu.g">'+opcionesGrupos(ui.cNuevo.g)+'</select></div><div class="campo"><label for="cnu-d">Fecha</label><input type="date" id="cnu-d" data-f="cnu.d" value="'+esc(ui.cNuevo.d)+'"></div></div><div class="acciones"><button type="submit" class="btn primary">Escribir el registro</button><button type="button" class="btn" data-a="c-nuevo-cancelar">Cancelar</button></div></form>';
  if(ui.cEdit&&!lista.some(function(x){return x.g.id+'|'+x.d===ui.cEdit;})){var p=ui.cEdit.split('|');var ge=grupoPorId(p[0]);if(ge)h+=vFormLog(ge,p[1],'clases');}
  if(!lista.length)h+='<div class="vacio"><h3>'+(todosLogs().length?'Ningún registro coincide con los filtros':'Aún no hay registros de clase')+'</h3><p>Los registros se escriben al pasar lista (botón «Registrar la clase») o con «Nuevo registro».</p></div>';
  lista.slice(ui.cPag*POR_PAGINA_CLASES,(ui.cPag+1)*POR_PAGINA_CLASES).forEach(function(x){
    var key=x.g.id+'|'+x.d,at=' data-g="'+esc(x.g.id)+'" data-d="'+esc(x.d)+'"';
    if(ui.cEdit===key){h+=vFormLog(x.g,x.d,'clases');return;}
    h+='<article class="reg-card'+(x.l.destacado?' dest':'')+'"><header><time datetime="'+esc(x.d)+'">'+esc(fLarga(x.d))+'</time>'+(x.l.destacado?'<span class="chip negro">★ Destacado</span>':'')+'</header><p class="eyebrow">'+esc(nombreGrupo(x.g))+'</p><dl class="campos">'+camposLog(x.l)+'</dl>'+
      '<div class="acciones"><button type="button" class="btn chico" data-a="c-destacar"'+at+'>'+(x.l.destacado?'Quitar destacado':'★ Destacar')+'</button><button type="button" class="btn chico" data-a="c-editar"'+at+'>Editar</button><button type="button" class="btn chico quiet" data-a="c-ir"'+at+'>Ver la lista de ese día</button></div></article>';
  });
  if(pags>1)h+='<div class="paginador"><button type="button" class="btn" data-a="c-pag" data-v="-1"'+(ui.cPag===0?' disabled':'')+'>← Más recientes</button><span>Página '+(ui.cPag+1)+' de '+pags+'</span><button type="button" class="btn" data-a="c-pag" data-v="1"'+(ui.cPag>=pags-1?' disabled':'')+'>Más antiguos →</button></div>';
  return h+'</section>';
}

/* =================== Disertaciones: cálculo =================== */
function maxNivel(r){var m=0;(r.niveles||[]).forEach(function(n){var p=+n.puntos;if(isFinite(p)&&p>m)m=p;});return m;}
function critEq(r){return r.criterios.filter(function(k){return k.alcance!=='individual';});}
function critInd(r){return r.criterios.filter(function(k){return k.alcance==='individual';});}
/* Cuánto vale un criterio, como en una prueba: su puntaje máximo («vale 8 pts»). «× 2» y «vale doble» no se entendían. */
function valeTxt(r,k){var m=maxNivel(r)*(+k.peso||1);return 'vale '+num(m)+(m===1?' pt':' pts');}
function ptsCrit(r,k,li){var nv=r.niveles[li];return nv?(+nv.puntos||0)*(+k.peso||1):0;}
function maxDe(r,ks){var m=maxNivel(r);return ks.reduce(function(s,k){return s+m*(+k.peso||1);},0);}
function resEquipo(r,ev){var p=0,h=0,ks=critEq(r);ks.forEach(function(k){var li=ev&&ev.grupo?ev.grupo[k.id]:undefined;if(li!=null&&r.niveles[li]){p+=ptsCrit(r,k,li);h++;}});return {p:p,h:h,t:ks.length,max:maxDe(r,ks)};}
function resInd(r,ev,sid){var p=0,h=0,ks=critInd(r),sel=(ev&&ev.ind&&ev.ind[sid])||{};ks.forEach(function(k){var li=sel[k.id];if(li!=null&&r.niveles[li]){p+=ptsCrit(r,k,li);h++;}});return {p:p,h:h,t:ks.length,max:maxDe(r,ks)};}
function resEst(r,ev,sid){var aus=!!(ev&&ev.ausentes&&ev.ausentes[sid]);var e=resEquipo(r,ev),i=resInd(r,ev,sid);var max=e.max+i.max,falt=(e.t-e.h)+(i.t-i.h),comp=!aus&&falt===0&&max>0;return {aus:aus,e:e,i:i,total:e.p+i.p,max:max,faltan:falt,completo:comp,nota:comp?nota(e.p+i.p,max,r.exigencia):null};}
function equipoListo(d,r,eq){var ev=d.evals[eq.id];if(!ev||!eq.integrantes.length)return false;var e=resEquipo(r,ev);if(e.h<e.t)return false;var ki=critInd(r).length;return eq.integrantes.every(function(s){return (ev.ausentes||{})[s]||resInd(r,ev,s).h===ki;});}
function evDe(d,eqId,crear){var ev=d.evals[eqId];if(!ev&&crear)ev=d.evals[eqId]={grupo:{},ind:{},ausentes:{},comentario:'',duracionSeg:null,sugerido:null};if(ev){ev.grupo=ev.grupo||{};ev.ind=ev.ind||{};ev.ausentes=ev.ausentes||{};}return ev;}
function disActual(){return ui.dId&&S.disertaciones[ui.dId]?S.disertaciones[ui.dId]:null;}
function filasDis(d,r,g){var m=mapaEst(g),f=[];d.equipos.forEach(function(eq){var ev=d.evals[eq.id];ordenarEst(eq.integrantes.map(function(s){return m[s];}).filter(Boolean)).forEach(function(e){f.push({e:e,eq:eq,ev:ev,res:resEst(r,ev,e.id)});});});return f;}
function escalaTexto(r){var max=maxDe(r,r.criterios),e=r.exigencia||0.6;var ki=critInd(r).length;return 'Escala 1,0 a 7,0 · exigencia '+Math.round(e*100)+' % · '+num(max)+' puntos por estudiante'+(ki?' ('+num(maxDe(r,critEq(r)))+' del equipo + '+num(maxDe(r,critInd(r)))+' individuales)':'')+' · nota 4,0 con '+num(e*max)+' puntos';}

/* =================== Vista: Disertaciones =================== */
function vDisertaciones(){
  var d=disActual();
  if(!d&&['config','evaluar','resumen'].indexOf(ui.dVista)>=0)ui.dVista='lista';
  switch(ui.dVista){case 'config':return vDisConfig(d);case 'evaluar':return vDisEvaluar(d);case 'resumen':return vDisResumen(d);case 'rubricas':return vRubricas();case 'rubrica':return vEditorRub();case 'nueva-rubrica':return vNuevaRub();case 'nueva':return vDisNueva();default:return vDisLista();}
}
function vDisLista(){
  var ids=Object.keys(S.disertaciones).sort(function(a,b){return cmp(S.disertaciones[b].fecha,S.disertaciones[a].fecha)||cmp(S.disertaciones[b].creado,S.disertaciones[a].creado);});
  var h='<section class="seccion"><div class="lista-cab"><h2 class="titulo-sec">Disertaciones</h2><div class="acciones"><button type="button" class="btn primary" data-a="d-nueva">+ Nueva disertación</button><button type="button" class="btn" data-a="d-ver" data-v="rubricas">Rúbricas</button></div></div>';
  if(!ids.length)h+='<div class="vacio"><h3>Crea tu primera disertación</h3><p>Eliges el curso y la rúbrica, armas los equipos con la nómina y evalúas en vivo con cronómetro. La nota de cada estudiante pasa a Notas con un toque.</p><button type="button" class="btn primary" data-a="d-nueva">+ Nueva disertación</button></div>';
  ids.forEach(function(id){var d=S.disertaciones[id],g=grupoPorId(d.grupoId),r=S.rubricas[d.rubricaId],pr=progresoDis(d);
    h+='<div class="dis-card"><div><h3>'+esc(d.titulo||'Sin título')+'</h3><p class="ayuda">'+esc(g?nombreGrupo(g):'Curso eliminado')+' · '+esc(d.fecha?fLarga(d.fecha):'sin fecha')+'</p><p class="ayuda">'+esc(r?r.nombre:'Rúbrica eliminada')+' · '+(pr.total?pr.listos+' de '+pl(pr.total,'equipo evaluado','equipos evaluados'):'equipos por armar')+(d.notasPasadas?' · notas en el libro':'')+'</p></div>'+
      '<div class="acciones"><button type="button" class="btn primary" data-a="d-ver" data-v="evaluar" data-id="'+esc(id)+'">Evaluar</button><button type="button" class="btn" data-a="d-ver" data-v="resumen" data-id="'+esc(id)+'">Resumen</button><button type="button" class="btn" data-a="d-ver" data-v="config" data-id="'+esc(id)+'">Equipos y datos</button></div></div>';});
  return h+'</section>';
}
function opcionesRubricas(sel){return Object.keys(S.rubricas).sort(function(a,b){return cmp(S.rubricas[a].creado,S.rubricas[b].creado);}).map(function(id){return '<option value="'+esc(id)+'"'+(sel===id?' selected':'')+'>'+esc(S.rubricas[id].nombre||'Sin nombre')+'</option>';}).join('');}
function vDisNueva(){
  var h='<section class="seccion"><button type="button" class="btn quiet volver" data-a="d-ver" data-v="lista">← Disertaciones</button>';
  if(!S.grupos.length)return h+'<div class="vacio"><h3>Primero trae tus cursos</h3><p>Los equipos se arman con la nómina de un curso.</p><button type="button" class="btn primary" data-a="tab" data-v="hoy">Ir a Hoy</button></div></section>';
  if(!Object.keys(S.rubricas).length)return h+'<div class="vacio"><h3>Necesitas una rúbrica</h3><button type="button" class="btn primary" data-a="d-ver" data-v="nueva-rubrica">+ Nueva rúbrica</button></div></section>';
  var f=ui.dForm;
  return h+'<form class="form" data-form="dis"><h3>Nueva disertación</h3>'+vError()+
    '<div class="campo"><label for="dn-tit">Título o tema general</label><input type="text" id="dn-tit" data-f="dn.titulo" value="'+esc(f.titulo)+'" placeholder="Ej.: Factores que influyen en la salud humana"></div>'+
    '<div class="fila-2"><div class="campo"><label for="dn-g">Curso</label><select id="dn-g" data-f="dn.grupoId">'+opcionesGrupos(f.grupoId)+'</select></div><div class="campo"><label for="dn-f">Fecha</label><input type="date" id="dn-f" data-f="dn.fecha" value="'+esc(f.fecha)+'"></div></div>'+
    '<div class="campo"><label for="dn-r">Rúbrica</label><select id="dn-r" data-f="dn.rubricaId">'+opcionesRubricas(f.rubricaId)+'</select></div>'+
    '<div class="acciones"><button type="submit" class="btn primary">Crear y armar equipos</button><button type="button" class="btn" data-a="d-ver" data-v="lista">Cancelar</button></div></form></section>';
}
function cabDis(d,actual){
  return '<button type="button" class="btn quiet volver" data-a="d-ver" data-v="lista">← Disertaciones</button><div class="det-cab"><div><p class="eyebrow">'+esc((grupoPorId(d.grupoId)?nombreGrupo(grupoPorId(d.grupoId)):'Curso eliminado')+(d.fecha?' · '+fLarga(d.fecha):''))+'</p><h2>'+esc(d.titulo||'Sin título')+'</h2></div></div>'+
    '<div class="segmento" role="group"><button type="button" class="seg" data-a="d-ver" data-v="config" aria-pressed="'+(actual==='config')+'">Equipos y datos</button><button type="button" class="seg" data-a="d-ver" data-v="evaluar" aria-pressed="'+(actual==='evaluar')+'">Evaluar</button><button type="button" class="seg" data-a="d-ver" data-v="resumen" aria-pressed="'+(actual==='resumen')+'">Resumen</button></div>';
}
function vDisConfig(d){
  var g=grupoPorId(d.grupoId),h='<section class="seccion">'+cabDis(d,'config');
  var conInt=d.equipos.some(function(e){return e.integrantes.length;}),conEval=Object.keys(d.evals).length>0;
  h+='<div class="panel"><h3>Datos</h3><div class="campo"><label for="dc-tit">Título o tema general</label><input type="text" id="dc-tit" data-f="dc.titulo" value="'+esc(d.titulo)+'"></div>'+
    '<div class="fila-2"><div class="campo"><label for="dc-f">Fecha</label><input type="date" id="dc-f" data-sel="dc-fecha" value="'+esc(d.fecha||'')+'"></div><div class="campo"><label for="dc-r">Rúbrica</label><select id="dc-r" data-sel="dc-rubrica">'+opcionesRubricas(d.rubricaId)+'</select></div></div>'+
    '<div class="campo"><label for="dc-g">Curso</label><select id="dc-g" data-sel="dc-grupo"'+(conInt?' disabled':'')+'>'+opcionesGrupos(d.grupoId)+'</select>'+(conInt?'<p class="ayuda">Para cambiar el curso, primero deja los equipos sin integrantes.</p>':'')+'</div>'+
    (conEval?'<p class="ayuda">Si cambias la rúbrica, las marcas de criterios que no existan en la nueva rúbrica dejan de contar.</p>':'')+
    '<div class="acciones"><button type="button" class="btn quiet" data-a="d-borrar">Eliminar esta disertación</button></div></div>';
  if(!g)return h+'<div class="alerta">El curso de esta disertación fue eliminado.</div></section>';
  var asignado={};d.equipos.forEach(function(eq){eq.integrantes.forEach(function(s){asignado[s]=eq.id;});});
  var sin=ordenarEst(g.estudiantes.filter(function(e){return !asignado[e.id]&&!retirado(e);}));
  if(!d.equipos.some(function(e){return e.id===ui.dEqActivo;}))ui.dEqActivo=d.equipos.length?d.equipos[d.equipos.length-1].id:null;
  var act=d.equipos.filter(function(e){return e.id===ui.dEqActivo;})[0];
  h+='<div class="panel"><h3>Sin equipo ('+sin.length+')</h3>'+(act?'<p class="ayuda">Toca un nombre para agregarlo a <b>'+esc(act.nombre||'el equipo')+'</b>. Para cambiar de equipo, toca «Agregar aquí» en otro.</p>':'<p class="ayuda">Crea un equipo para empezar a asignar estudiantes.</p>')+
    (sin.length?'<div class="pool">'+sin.map(function(e){return '<button type="button" class="btn chico" data-a="d-asignar" data-id="'+esc(e.id)+'"'+(act?'':' disabled')+'><b>'+esc(e.ap)+'</b>&nbsp;'+esc((e.n||'').split(' ')[0])+'&nbsp;·&nbsp;'+esc(e.c||'')+'</button>';}).join('')+'</div>':'<p>Todos los estudiantes tienen equipo.</p>')+
    '<div class="acciones"><button type="button" class="btn" data-a="d-eq-nuevo">+ Equipo</button>'+(sin.length?'<label for="d-tam">Armar el resto en equipos de</label><select id="d-tam" data-sel="dtam" style="width:auto">'+[2,3,4,5,6].map(function(n){return '<option value="'+n+'"'+(ui.dTam===n?' selected':'')+'>'+n+'</option>';}).join('')+'</select><button type="button" class="btn" data-a="d-auto">Armar por orden de lista</button>':'')+'</div></div>';
  var m=mapaEst(g);
  d.equipos.forEach(function(eq){var esAct=eq.id===ui.dEqActivo;
    h+='<div class="eq-card'+(esAct?' activo':'')+'"><div class="eq-card-cab"><button type="button" class="btn'+(esAct?' primary':'')+'" data-a="d-eq-activar" data-id="'+esc(eq.id)+'" aria-pressed="'+esAct+'">'+(esAct?'Agregando aquí':'Agregar aquí')+'</button><button type="button" class="btn quiet" data-a="d-eq-borrar" data-id="'+esc(eq.id)+'">Eliminar equipo</button></div>'+
      '<div class="fila-2"><div class="campo"><label for="deq-n-'+esc(eq.id)+'">Nombre</label><input type="text" id="deq-n-'+esc(eq.id)+'" data-f="deq.nombre" data-id="'+esc(eq.id)+'" value="'+esc(eq.nombre)+'"></div><div class="campo"><label for="deq-t-'+esc(eq.id)+'">Tema</label><input type="text" id="deq-t-'+esc(eq.id)+'" data-f="deq.tema" data-id="'+esc(eq.id)+'" value="'+esc(eq.tema)+'"></div></div>'+
      '<div class="chips">'+(eq.integrantes.length?ordenarEst(eq.integrantes.map(function(s){return m[s]||{id:s,ap:'(estudiante eliminado)',am:'',n:'',c:''};})).map(function(e){return '<button type="button" class="chip-btn'+(retirado(e)?' ret':'')+'" data-a="d-quitar" data-id="'+esc(e.id)+'" aria-label="Quitar a '+esc(nombreCorto(e))+'">'+(retirado(e)?'<span class="tachado">'+esc(nombreCorto(e))+'</span> · retirado':esc(nombreCorto(e)))+' ✕</button>';}).join(''):'<span class="ayuda">Sin integrantes.</span>')+'</div></div>';});
  if(d.equipos.length)h+='<div class="acciones"><button type="button" class="btn primary grande" data-a="d-ver" data-v="evaluar">Ir a evaluar</button></div>';
  return h+'</section>';
}
function vCrono(r,ev,eqId){
  var s=crono.eqId===eqId?tiempoCrono():((ev&&ev.duracionSeg)||0),corriendo=crono.inicio&&crono.eqId===eqId;
  return '<div class="m-bloque crono" role="group" aria-label="Cronómetro"><span class="m-et">Tiempo</span><span class="m-val crono-t'+(r.minutos&&s>r.minutos*60?' pasado':'')+'" id="crono-t">'+(corriendo?minCrono(s):mmss(s))+'</span><span class="crono-meta">de '+esc(r.minutos)+':00'+(corriendo?' · cambia cada minuto':'')+'</span>'+
    '<button type="button" class="btn chico" data-a="crono-toggle">'+(corriendo?'Detener y registrar':(s?'Continuar':'Iniciar'))+'</button><button type="button" class="btn chico quiet" data-a="crono-reset">Reiniciar</button>'+
    (ev&&ev.duracionSeg&&!corriendo?'<span class="crono-reg">Registrado: '+mmss(ev.duracionSeg)+'</span>':'')+'</div>';
}
function vDisMarcador(d,r,eq,ev){
  var e=resEquipo(r,ev),ki=critInd(r).length;
  var falt=(e.t-e.h)+eq.integrantes.reduce(function(s,sid){return s+((ev&&ev.ausentes&&ev.ausentes[sid])?0:ki-resInd(r,ev,sid).h);},0);
  return (r.minutos?vCrono(r,ev,eq.id):'')+'<div class="m-bloque"><span class="m-et">Equipo</span><span class="m-val">'+num(e.p)+' / '+num(e.max)+'</span></div><div class="m-bloque"><span class="m-et">'+(falt?'Faltan':'Estado')+'</span><span class="m-val">'+(falt?falt+(falt===1?' marca':' marcas'):'Completo')+'</span></div>';
}
function vDisRes(d,r,g,eq,ev){
  var m=mapaEst(g);var ints=ordenarEst(eq.integrantes.map(function(s){return m[s];}).filter(Boolean));
  if(!ints.length)return '';
  return '<div class="tabla-wrap"><table><thead><tr><th>Estudiante</th><th class="num">Equipo</th>'+(critInd(r).length?'<th class="num">Individual</th>':'')+'<th class="num">Total</th><th class="num">Nota</th></tr></thead><tbody>'+
    ints.map(function(e){var x=resEst(r,ev,e.id);return '<tr><td>'+esc(nombreCorto(e))+'<small>'+esc(e.c)+'</small></td><td class="num">'+num(x.e.p)+'</td>'+(critInd(r).length?'<td class="num">'+(x.aus?'—':num(x.i.p))+'</td>':'')+'<td class="num">'+(x.aus?'—':num(x.total)+' / '+num(x.max))+'</td><td class="num'+(x.nota!=null&&x.nota<4?' baja':'')+'"><b>'+(x.aus?'Ausente':x.nota!=null?num(x.nota,1):'Faltan '+x.faltan)+'</b></td></tr>';}).join('')+'</tbody></table></div>';
}
function vDisEvaluar(d){
  var g=grupoPorId(d.grupoId),r=S.rubricas[d.rubricaId],h='<section class="seccion">'+cabDis(d,'evaluar');
  if(!g||!r)return h+'<div class="alerta">'+(!g?'El curso de esta disertación fue eliminado.':'La rúbrica de esta disertación fue eliminada. Elige otra en «Equipos y datos».')+'</div></section>';
  if(!d.equipos.length)return h+'<div class="vacio"><h3>Arma los equipos primero</h3><button type="button" class="btn primary" data-a="d-ver" data-v="config">Ir a Equipos y datos</button></div></section>';
  if(ui.dEq>=d.equipos.length)ui.dEq=d.equipos.length-1;if(ui.dEq<0)ui.dEq=0;
  var i=ui.dEq,eq=d.equipos[i],ev=evDe(d,eq.id,false),m=mapaEst(g);
  var ints=ordenarEst(eq.integrantes.map(function(s){return m[s];}).filter(Boolean));
  var pres=ints.filter(function(e){return !(ev&&ev.ausentes&&ev.ausentes[e.id]);});
  h+='<div class="ficha"><p><b>Rúbrica:</b> '+esc(r.nombre)+'</p><p class="ayuda">'+esc(escalaTexto(r))+'</p></div>';
  h+='<div class="nav-grupo" id="eq-top"><button type="button" class="btn" data-a="d-nav" data-v="-1"'+(i===0?' disabled':'')+'>◀ Anterior</button><div class="g-actual"><label for="sel-eq" class="g-num">Equipo '+(i+1)+' de '+d.equipos.length+'</label><select id="sel-eq" data-sel="d-eq">'+
    d.equipos.map(function(x,k){return '<option value="'+k+'"'+(k===i?' selected':'')+'>'+(equipoListo(d,r,x)?'✓ ':'')+esc(x.nombre||'Equipo '+(k+1))+'</option>';}).join('')+'</select></div><button type="button" class="btn" data-a="d-nav" data-v="1"'+(i>=d.equipos.length-1?' disabled':'')+'>Siguiente ▶</button></div>';
  h+='<p class="integrantes">'+(eq.tema?'<b>Tema:</b> '+esc(eq.tema)+' · ':'')+'<b>Integrantes:</b> '+(ints.length?esc(ints.map(nombreCorto).join(', ')):'sin integrantes')+'</p>';
  h+='<div class="marcador" id="d-marcador">'+vDisMarcador(d,r,eq,ev)+'</div>';
  var ke=critEq(r);
  if(ke.length)h+='<h3 class="titulo-sec">Criterios del equipo</h3><ol class="criterios">'+ke.map(function(k){var sel=ev&&ev.grupo?ev.grupo[k.id]:undefined;var n=r.criterios.indexOf(k)+1;
    return '<li class="criterio"><h4><span class="c-num">C'+n+'</span>'+esc(k.nombre||'Criterio sin nombre')+'<span class="peso">'+valeTxt(r,k)+'</span>'+'</h4>'+(k.ayuda?'<p class="ayuda">'+esc(k.ayuda)+'</p>':'')+
      '<div class="niveles" style="--n:'+r.niveles.length+'">'+r.niveles.map(function(lv,li){var sug=ev&&ev.sugerido&&ev.sugerido.c===k.id&&ev.sugerido.li===li;
        return '<button type="button" class="nivel" data-a="d-niv" data-c="'+esc(k.id)+'" data-l="'+li+'" aria-pressed="'+(sel===li)+'"><span class="n-cab"><b>'+esc(lv.nombre)+'</b><span>'+num(ptsCrit(r,k,li))+' pts</span></span>'+(k.descriptores[li]?'<span class="n-desc">'+esc(k.descriptores[li])+'</span>':'')+(sug?'<span class="n-sug">Según el cronómetro</span>':'')+'</button>';}).join('')+'</div></li>';}).join('')+'</ol>';
