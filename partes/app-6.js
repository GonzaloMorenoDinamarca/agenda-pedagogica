  'c-dest':function(){ui.cDest=!ui.cDest;ui.cPag=0;render();},
  /* Pasar página de una vez (tinta electrónica: un solo refresco, sin arrastre). El salto mide solo la zona que se ve:
     descuenta la barra de abajo y, al evaluar, el marcador fijo de arriba, y repite unas dos líneas para no perder ninguna. */
  'hoja':function(el){var m=document.querySelector('.marcador'),b=document.querySelector('.hojas');var arriba=m?m.offsetHeight:0,abajo=b?b.getBoundingClientRect().top:window.innerHeight;var paso=Math.max(200,abajo-arriba-84);window.scrollTo(0,Math.max(0,window.pageYOffset+(+el.dataset.v)*paso));},
  'c-pag':function(el){ui.cPag=Math.max(0,ui.cPag+(+el.dataset.v));render();window.scrollTo(0,0);},
  'c-nuevo':function(){ui.cNuevo={g:ui.cGrupo||(grupoActual()||{}).id,d:hoyISO()};render();},
  'c-nuevo-cancelar':function(){ui.cNuevo=null;render();},
  'c-editar':function(el){ui.cEdit=el.dataset.g+'|'+el.dataset.d;render();foco('lg-obj');},
  'c-destacar':function(el){var g=grupoPorId(el.dataset.g),l=g&&g.classLogs[el.dataset.d];if(!l)return;l.destacado=!l.destacado;guardar();render();},
  'c-ir':function(el){ui.grupoId=el.dataset.g;ui.fecha=el.dataset.d;ui.aVista='lista';ui.ficha=null;irA('asistencia');},
  'imp-clases':function(){var l=logsFiltrados();if(!l.length){flash('No hay registros con estos filtros.');render();return;}
    imprimir('Registro de clases',pl(l.length,'registro','registros'),'<table><thead><tr><th>Fecha</th><th>Curso</th><th>Contenido de la clase</th></tr></thead><tbody>'+l.map(function(x){return '<tr><td>'+esc(fLarga(x.d))+(x.l.destacado?'<br>★ destacado':'')+'</td><td>'+esc(nombreGrupo(x.g))+'</td><td>'+(x.l.objetivo?'<b>Objetivo:</b> '+esc(x.l.objetivo)+'<br>':'')+(x.l.temas?'<b>Temas:</b> '+esc(x.l.temas)+'<br>':'')+(x.l.obs?'<b>Obs.:</b> '+esc(x.l.obs)+'<br>':'')+(x.l.tarea?'<b>Pendiente:</b> '+esc(x.l.tarea):'')+'</td></tr>';}).join('')+'</tbody></table>');},
  /* Disertaciones */
  'd-nueva':function(el){var g=grupoActual();var pre=el&&el.dataset?el.dataset.r:null;var rid=pre&&S.rubricas[pre]?pre:S.rubricas['expo-original']?'expo-original':Object.keys(S.rubricas)[0];ui.rVer=null;ui.dForm={titulo:'',grupoId:g?g.id:'',rubricaId:rid||'',fecha:hoyISO()};ui.formError=null;ui.dVista='nueva';irA('disertaciones');foco('dn-tit');},
  'd-ver':function(el){ui.rVer=null;if(el.dataset.id){if(el.dataset.id!==ui.dId){ui.dEq=0;crono.acumulado=0;crono.eqId=null;}ui.dId=el.dataset.id;}if(crono.inicio&&el.dataset.v!=='evaluar')detenerCrono(true);ui.dVista=el.dataset.v;ui.formError=null;render();window.scrollTo(0,0);},
  'd-borrar':function(){var d=disActual();if(!d)return;var id=ui.dId;conDeshacer('Se eliminó la disertación «'+(d.titulo||'sin título')+'».',function(){delete S.disertaciones[id];});ui.dId=null;ui.dVista='lista';render();window.scrollTo(0,0);},
  'd-eq-nuevo':function(){var d=disActual();var eq={id:uid(),nombre:'Equipo '+(d.equipos.length+1),tema:'',integrantes:[]};d.equipos.push(eq);ui.dEqActivo=eq.id;guardar();render();},
  'd-eq-activar':function(el){ui.dEqActivo=el.dataset.id;render();},
  'd-eq-borrar':function(el){var d=disActual(),id=el.dataset.id;var eq=d.equipos.filter(function(x){return x.id===id;})[0];conDeshacer('Se eliminó '+(eq&&eq.nombre||'el equipo')+'.',function(){d.equipos=d.equipos.filter(function(x){return x.id!==id;});delete d.evals[id];});render();},
  'd-asignar':function(el){var d=disActual();var eq=d.equipos.filter(function(x){return x.id===ui.dEqActivo;})[0];if(!eq)return;if(eq.integrantes.indexOf(el.dataset.id)<0)eq.integrantes.push(el.dataset.id);guardar();render();},
  'd-quitar':function(el){var d=disActual();d.equipos.forEach(function(eq){eq.integrantes=eq.integrantes.filter(function(s){return s!==el.dataset.id;});});guardar();render();},
  'd-auto':function(){var d=disActual(),g=grupoPorId(d.grupoId);if(!g)return;var asig={};d.equipos.forEach(function(eq){eq.integrantes.forEach(function(s){asig[s]=1;});});
    var sin=ordenarEst(g.estudiantes.filter(function(e){return !asig[e.id]&&!retirado(e);})),t=ui.dTam||3;if(!sin.length)return;
    conDeshacer('Se armaron equipos automáticamente.',function(){var trozos=[];for(var i=0;i<sin.length;i+=t)trozos.push(sin.slice(i,i+t));
      if(trozos.length>1&&trozos[trozos.length-1].length===1){var solo=trozos.pop();trozos[trozos.length-1]=trozos[trozos.length-1].concat(solo);}
      trozos.forEach(function(tr){var eq={id:uid(),nombre:'Equipo '+(d.equipos.length+1),tema:'',integrantes:tr.map(function(e){return e.id;})};d.equipos.push(eq);ui.dEqActivo=eq.id;});});
    render();},
  'd-nav':function(el){var d=disActual();var i=ui.dEq+(+el.dataset.v);if(i<0||i>=d.equipos.length)return;cambiarEquipo(i);},
  'd-ir-eq':function(el){var d=disActual();var i=d.equipos.map(function(x){return x.id;}).indexOf(el.dataset.id);if(i<0)return;ui.dVista='evaluar';cambiarEquipo(i);},
  'd-niv':function(el){var d=disActual(),r=S.rubricas[d.rubricaId],g=grupoPorId(d.grupoId),eq=d.equipos[ui.dEq];var ev=evDe(d,eq.id,true);var cid=el.dataset.c,l=+el.dataset.l;
    if(ev.grupo[cid]===l)delete ev.grupo[cid];else ev.grupo[cid]=l;guardar();
    var cont=el.closest('.niveles');if(cont)cont.querySelectorAll('.nivel').forEach(function(b){b.setAttribute('aria-pressed',String(ev.grupo[cid]===+b.dataset.l));});
    var m=document.getElementById('d-marcador');if(m)m.innerHTML=vDisMarcador(d,r,eq,ev);var rs=document.getElementById('d-res');if(rs)rs.innerHTML=vDisRes(d,r,g,eq,ev);},
  'd-ind':function(el){var d=disActual(),r=S.rubricas[d.rubricaId],g=grupoPorId(d.grupoId),eq=d.equipos[ui.dEq];var ev=evDe(d,eq.id,true);var cid=el.dataset.c,sid=el.dataset.id,l=+el.dataset.l;
    if(!ev.ind[sid])ev.ind[sid]={};if(ev.ind[sid][cid]===l)delete ev.ind[sid][cid];else ev.ind[sid][cid]=l;guardar();
    var cont=el.closest('.ind-niv');if(cont)cont.querySelectorAll('.nivel').forEach(function(b){b.setAttribute('aria-pressed',String(ev.ind[sid][cid]===+b.dataset.l));});
    var m=document.getElementById('d-marcador');if(m)m.innerHTML=vDisMarcador(d,r,eq,ev);var rs=document.getElementById('d-res');if(rs)rs.innerHTML=vDisRes(d,r,g,eq,ev);},
  'd-ausente':function(el){var d=disActual(),eq=d.equipos[ui.dEq];var ev=evDe(d,eq.id,true);var sid=el.dataset.id;if(ev.ausentes[sid])delete ev.ausentes[sid];else ev.ausentes[sid]=true;guardar();render();},
  'd-eval-borrar':function(){var d=disActual(),eq=d.equipos[ui.dEq];conDeshacer('Se borró la evaluación de '+(eq.nombre||'el equipo')+'.',function(){delete d.evals[eq.id];});render();},
  'crono-toggle':function(){var d=disActual(),eq=d&&d.equipos[ui.dEq];if(!eq)return;
    if(crono.inicio&&crono.eqId===eq.id){detenerCrono(true);render();return;}
    if(crono.eqId!==eq.id){var ev=d.evals[eq.id];crono.acumulado=(ev&&ev.duracionSeg)||0;crono.eqId=eq.id;}
    crono.inicio=Date.now();programarTick();
    var r=S.rubricas[d.rubricaId],m=document.getElementById('d-marcador');if(m)m.innerHTML=vDisMarcador(d,r,eq,d.evals[eq.id]);},
  'crono-reset':function(){var d=disActual(),eq=d&&d.equipos[ui.dEq];detenerCrono(false);crono.acumulado=0;crono.eqId=eq?eq.id:null;var r=d&&S.rubricas[d.rubricaId],m=document.getElementById('d-marcador');if(m&&eq)m.innerHTML=vDisMarcador(d,r,eq,d.evals[eq.id]);},
  'd-pasar':function(){var d=disActual();if(!d)return;conDeshacer('Notas pasadas a Notas.',function(){pasarANotas(d);});render();},
  'd-csv':function(){var d=disActual(),r=S.rubricas[d.rubricaId],g=grupoPorId(d.grupoId);descargar('disertacion_'+slug(d.titulo)+'_'+slug(g?g.grupo||g.asignatura:'')+'.csv',aCSV(filasCSVDis(d,r,g)),'text/csv;charset=utf-8');render();},
  'd-copiar':function(){var d=disActual(),r=S.rubricas[d.rubricaId],g=grupoPorId(d.grupoId);copiar(aTSV(filasCSVDis(d,r,g)),'Tabla copiada. Pégala en Excel o Google Sheets.');},
  'd-imp-res':function(){var d=disActual(),r=S.rubricas[d.rubricaId],g=grupoPorId(d.grupoId);var F=filasDis(d,r,g);
    imprimir(d.titulo||'Disertación',nombreGrupo(g)+' · '+r.nombre,'<p>'+esc(escalaTexto(r))+'</p><table><thead><tr><th>Estudiante</th><th>Curso</th><th>Equipo</th><th>Puntaje</th><th>Nota</th></tr></thead><tbody>'+F.map(function(x){return '<tr><td>'+esc(apellidos(x.e))+', '+esc(x.e.n)+'</td><td>'+esc(x.e.c)+'</td><td>'+esc(x.eq.nombre)+'</td><td>'+(x.res.aus?'—':num(x.res.total)+' / '+num(x.res.max))+'</td><td><b>'+(x.res.aus?'Ausente':x.res.nota!=null?num(x.res.nota,1):'Incompleta')+'</b></td></tr>';}).join('')+'</tbody></table>');},
  'd-imp-hojas':function(){var d=disActual(),r=S.rubricas[d.rubricaId],g=grupoPorId(d.grupoId);imprimir('Retroalimentación · '+(d.titulo||'Disertación'),nombreGrupo(g),hojasRetro(d,r,g));},
  /* Rúbricas */
  'r-tpl':function(el){var v=el.dataset.v;ui.rDraft=v==='propuesta'?rubricaPropuesta():v==='general'?rubricaGeneral():v==='original'?rubricaOriginal():rubricaVacia();if(v!=='blanco'){ui.rDraft.criterios.forEach(function(k){k.id=uid();});}ui.rId=null;ui.dVista='rubrica';ui.formError=null;render();window.scrollTo(0,0);foco('r-nombre');},
  'r-ver':function(el){ui.rVer=el.dataset.id;ui.dVista='rubricas';render();window.scrollTo(0,0);},
  'r-ver-cerrar':function(){ui.rVer=null;render();window.scrollTo(0,0);},
  'r-editar':function(el){var r=S.rubricas[el.dataset.id];if(!r)return;ui.rDraft=clonar(r);ui.rId=el.dataset.id;ui.dVista='rubrica';ui.formError=null;render();window.scrollTo(0,0);},
  'r-dup':function(el){var r=S.rubricas[el.dataset.id];if(!r)return;var c=clonar(r);c.nombre=(c.nombre||'Rúbrica')+' (copia)';c.creado=ahora();c.criterios.forEach(function(k){k.id=uid();});S.rubricas[uid()]=c;guardar();flash('Rúbrica duplicada.');render();},
  'r-borrar':function(el){var id=el.dataset.id,r=S.rubricas[id];if(!r)return;var u=usosRubrica(id);conDeshacer('Se eliminó la rúbrica «'+r.nombre+'».'+(u?' Sus disertaciones quedan sin rúbrica hasta que elijas otra.':''),function(){delete S.rubricas[id];});render();},
  'r-cancelar':function(){ui.rDraft=null;ui.rId=null;ui.dVista='rubricas';ui.formError=null;render();window.scrollTo(0,0);},
  'nivel-add':function(){var d=ui.rDraft;d.niveles.push({nombre:'Nuevo nivel',puntos:0});d.criterios.forEach(function(k){k.descriptores.push('');});render();},
  'nivel-del':function(el){var i=+el.dataset.i,d=ui.rDraft;d.niveles.splice(i,1);d.criterios.forEach(function(k){k.descriptores.splice(i,1);});render();},
  'crit-add':function(){var d=ui.rDraft;d.criterios.push(crit(uid(),'',1,'equipo',d.niveles.map(function(){return '';})));render();foco('r-c'+(d.criterios.length-1));},
  'crit-del':function(el){ui.rDraft.criterios.splice(+el.dataset.i,1);render();},
  'crit-up':function(el){var j=+el.dataset.i,cs=ui.rDraft.criterios;if(j>0){var t=cs[j-1];cs[j-1]=cs[j];cs[j]=t;}render();},
  /* Bitácora */
  'team-select':function(el){ui.teamId=el.dataset.id;ui.teamMode='ver';ui.entryOpen=false;ui.entryDraft=null;ui.editingEntry=null;ui.entryPage=0;ui.formError=null;render();if(!esAncho())window.scrollTo(0,0);},
  'team-back':function(){ui.teamId=null;ui.teamMode='ver';ui.entryOpen=false;render();window.scrollTo(0,0);},
  'team-new':function(){ui.teamMode='nuevo';ui.teamDraft={nombre:'',proyecto:'',categoria:'',integrantes:''};ui.formError=null;render();foco('t-nombre');},
  'team-edit':function(){var t=equipoActual();if(!t)return;ui.teamMode='editar';ui.teamDraft={nombre:t.nombre||'',proyecto:t.proyecto||'',categoria:t.categoria||'',integrantes:(t.integrantes||[]).join('\n')};ui.formError=null;render();foco('t-nombre');},
  'team-cancel':function(){ui.teamMode='ver';ui.teamDraft=null;ui.formError=null;render();},
  'team-del':function(){var id=ui.teamId,t=S.equipos[id];if(!t)return;conDeshacer('Se eliminó el equipo '+t.nombre+'.',function(){registrosDe(id).forEach(function(r){delete S.bitacora[r.id];});delete S.equipos[id];});ui.teamId=null;ui.teamMode='ver';ui.teamDraft=null;render();},
  'etapa-set':function(el){var t=S.equipos[ui.teamId];if(!t)return;var e=ETAPAS[+el.dataset.i];t.etapa=t.etapa===e?null:e;t.actualizado=ahora();guardar();render();},
  'estado-set':function(el){var t=S.equipos[ui.teamId];if(!t)return;t.estado=el.dataset.v;t.actualizado=ahora();guardar();render();},
  'entry-open':function(){ui.entryOpen=true;ui.editingEntry=null;ui.entryDraft={fecha:hoyISO(),avance:'',proximos:'',apoyo:''};ui.formError=null;render();foco('e-avance');},
  'entry-cancel':function(){ui.entryOpen=false;ui.entryDraft=null;ui.editingEntry=null;ui.formError=null;render();},
  'entry-edit':function(el){var r=S.bitacora[el.dataset.id];if(!r)return;ui.editingEntry=el.dataset.id;ui.entryDraft={fecha:r.fecha||hoyISO(),avance:r.avance||'',proximos:r.proximos||'',apoyo:r.apoyo||''};ui.entryOpen=true;ui.formError=null;render();arriba('form-registro');foco('e-avance');},
  'entry-del':function(el){var id=el.dataset.id;conDeshacer('Registro eliminado.',function(){delete S.bitacora[id];});render();},
  'pag-prev':function(){ui.entryPage=Math.max(0,ui.entryPage-1);render();},
  'pag-next':function(){ui.entryPage++;render();},
  'export-bit':function(){var f=[['Equipo','Proyecto','Fecha','Etapa','Estado','Avance','Próximos pasos','Apoyo que necesitan']];listaCol('equipos').forEach(function(t){registrosDe(t.id).slice().reverse().forEach(function(r){var e=estadoInfo(r.estado);f.push([t.nombre,t.proyecto||'',r.fecha||'',r.etapa||'',e?e.t:'',r.avance||'',r.proximos||'',r.apoyo||'']);});});descargar('bitacora-equipos-'+hoyISO()+'.csv',aCSV(f),'text/csv;charset=utf-8');render();},
  /* Respaldo */
  'resp-descargar':function(){if(descargar('respaldo-agenda-'+hoyISO()+'.json',respaldoJSON(),'application/json')){S.meta.ultimoRespaldo=ahora();guardar();}render();},
  'resp-compartir':function(){compartir('respaldo-agenda-'+hoyISO()+'.json',respaldoJSON(),'application/json',function(){S.meta.ultimoRespaldo=ahora();guardar();render();});},
  'imp-aplicar':function(){if(!ui.importPend)return;aplicarImport(ui.importPend);render();},
  'imp-cancelar':function(){ui.importPend=null;render();},
  'exp-compat':function(){var st={groups:clonar(S.grupos),currentNivel:null,currentGroupId:null,currentDate:hoyISO(),theme:'light',sortByCurso:true};descargar('backup_asistencia_'+hoyISO()+'.json',JSON.stringify({version:1,fecha:hoyISO(),timestamp:ahora(),state:st},null,2),'application/json');render();}
};

/* =================== Formularios =================== */
var ENVIOS={
  'est':function(){var g=grupoActual(),d=ui.estDraft,e=estPorId(g,d.sid);if(!e)return;var ap=d.ap.trim(),n=d.n.trim(),c=cursoDeDraft(d);
    if(!ap||!n){ui.formError='El apellido paterno y los nombres son obligatorios.';render();return;}
    if(d.otro&&!c){ui.formError='Escribe el nombre del curso.';render();foco('es-co');return;}
    e.ap=ap;e.am=d.am.trim();e.n=n;e.c=c;g.estudiantes.sort(function(a,b){return cmpEst(a,b);});guardar();ui.estDraft=null;ui.formError=null;flash('Datos guardados.');render();},
  'nuevo-est':function(){var g=grupoActual(),d=ui.nuevoEst,ap=d.ap.trim(),n=d.n.trim(),c=cursoDeDraft(d);
    if(!ap||!n){flash('Escribe al menos el apellido paterno y los nombres.');render();foco(ap?'ne-n':'ne-ap');return;}
    if(!c){flash('Elige el curso del estudiante para ordenarlo con sus compañeros.');render();foco('ne-c');return;}
    agregarEstudiantes(g,[{ap:ap,am:d.am.trim(),n:n,c:c}]);guardar();
    var pos=ordenarEst(g.estudiantes).map(function(x){return x.ap+'|'+x.n;}).indexOf(ap+'|'+n)+1;
    ui.nuevoEst={ap:'',am:'',n:'',c:c,otro:false,cOtro:''};flash('Agregado: '+n+' '+ap+' en '+c+' (N° '+pos+' de la lista).');render();foco('ne-ap');},
  'curso-datos':function(){var g=grupoActual(),d=ui.cursoDatos;if(!d.asignatura.trim()){ui.formError='Escribe la asignatura.';render();return;}
    g.asignatura=d.asignatura.trim();g.grupo=d.grupo.trim();g.nivel=d.nivel;g.profesor=d.profesor.trim();guardar();ui.cursoDatos=null;ui.formError=null;flash('Datos del curso guardados.');render();},
  'curso-nuevo':function(){var d=ui.cursoForm;if(!d.asignatura.trim()){ui.formError='Escribe la asignatura.';render();foco('cn-asig');return;}
    var g={id:uid(),asignatura:d.asignatura.trim(),grupo:d.grupo.trim(),nivel:d.nivel,profesor:'',estudiantes:[],asistencia:{},notas:{},classLogs:{},calificaciones:{columns:[],data:{}}};
    agregarEstudiantes(g,parsearLista(d.lista,''));S.grupos.push(g);guardar();ui.cursoForm=null;ui.formError=null;ui.grupoId=g.id;ui.tab='asistencia';ui.aVista=g.estudiantes.length?'lista':'curso';flash('Curso creado'+(g.estudiantes.length?' con '+pl(g.estudiantes.length,'estudiante','estudiantes'):'')+'.');render();window.scrollTo(0,0);},
  'eval':function(){var d=ui.evalForm,nom=d.nombre.trim();if(!nom){ui.formError='Escribe el nombre de la evaluación.';render();foco('ev-nombre');return;}
    var g=grupoPorId(ui.nSel.slice(2));if(buscarColumna(cal(g),nom)){ui.formError='Ya existe una evaluación con ese nombre en este curso.';render();foco('ev-nombre');return;}
    var sem=+d.sem===1?1:2;cal(g).columns.push({id:uid(),name:nom,date:d.fecha||'',sem:sem});if(ui.nSem!=='a')ui.nSem=String(sem);guardar();ui.evalForm=null;ui.formError=null;flash('Evaluación «'+nom+'» agregada al '+sem+'° semestre.');render();},
  'renombrar':function(){var d=ui.renombrar,nom=d.nombre.trim();if(!nom){ui.formError='Escribe un nombre.';render();return;}var g=grupoPorId(d.gid);var col=cal(g).columns.filter(function(c){return c.id===d.cid;})[0];if(col){col.name=nom;col.date=d.fecha||'';col.sem=+d.sem===1?1:2;if(ui.nSem!=='a')ui.nSem=String(col.sem);guardar();}ui.renombrar=null;ui.formError=null;flash('Evaluación actualizada.');render();},
  'c-nuevo':function(){var d=ui.cNuevo;if(!d.g||!d.d)return;ui.cEdit=d.g+'|'+d.d;ui.cNuevo=null;render();foco('lg-obj');},
  'dis':function(){var f=ui.dForm;if(!f.titulo.trim()){ui.formError='Escribe el título o tema general.';render();foco('dn-tit');return;}if(!grupoPorId(f.grupoId)||!S.rubricas[f.rubricaId]){ui.formError='Elige el curso y la rúbrica.';render();return;}
    var id=uid();S.disertaciones[id]={titulo:f.titulo.trim(),grupoId:f.grupoId,rubricaId:f.rubricaId,fecha:f.fecha||'',creado:ahora(),equipos:[],evals:{}};guardar();
    ui.dId=id;ui.dEq=0;ui.dVista='config';ui.dForm=null;ui.formError=null;crono.acumulado=0;crono.eqId=null;render();window.scrollTo(0,0);},
  'rub':function(){var d=ui.rDraft;d.nombre=(d.nombre||'').trim();
    if(!d.nombre){ui.formError='Escribe el nombre de la rúbrica.';render();foco('r-nombre');return;}
    for(var i=0;i<d.niveles.length;i++){var n=d.niveles[i];if(!String(n.nombre||'').trim()||n.puntos===''||!isFinite(n.puntos)||n.puntos<0){ui.formError='Revisa el nivel '+(i+1)+': necesita nombre y puntos.';render();foco('r-n'+i);return;}n.puntos=+n.puntos;}
    for(var j=0;j<d.criterios.length;j++){if(!String(d.criterios[j].nombre||'').trim()){ui.formError='Escribe el nombre del criterio C'+(j+1)+'.';render();foco('r-c'+j);return;}}
    if(maxDe(d,d.criterios)<=0){ui.formError='El puntaje máximo debe ser mayor que cero.';render();return;}
    d.minutos=d.minutos&&+d.minutos>0?Math.round(+d.minutos):null;if(!d.minutos)d.criterios.forEach(function(k){k.auto=null;});else ajustarTiempo(d);
    prepRubrica(d);
    if(ui.rId){d.actualizado=ahora();S.rubricas[ui.rId]=d;}else{d.creado=ahora();S.rubricas[uid()]=d;}
    guardar();ui.rDraft=null;ui.rId=null;ui.dVista='rubricas';ui.formError=null;flash('Rúbrica guardada.');render();window.scrollTo(0,0);},
  'team':function(){var d=ui.teamDraft,nombre=d.nombre.trim();if(!nombre){ui.formError='Escribe el nombre del equipo.';render();foco('t-nombre');return;}
    var ints=d.integrantes.split(/\r?\n/).map(function(s){return s.trim();}).filter(Boolean);
    if(ui.teamMode==='nuevo'){var id=uid();S.equipos[id]={nombre:nombre,proyecto:d.proyecto.trim(),categoria:d.categoria.trim(),integrantes:ints,etapa:null,estado:'ok',creado:ahora()};ui.teamId=id;}
    else{var t=S.equipos[ui.teamId];t.nombre=nombre;t.proyecto=d.proyecto.trim();t.categoria=d.categoria.trim();t.integrantes=ints;t.actualizado=ahora();}
    guardar();ui.teamMode='ver';ui.teamDraft=null;ui.formError=null;flash('Equipo guardado.');render();},
  'entry':function(){var d=ui.entryDraft,av=d.avance.trim(),pr=d.proximos.trim(),ap=d.apoyo.trim();if(!av&&!pr&&!ap){ui.formError='Escribe al menos qué avanzaron en la reunión.';render();foco('e-avance');return;}
    var t=equipoActual();if(!t)return;
    if(ui.editingEntry&&S.bitacora[ui.editingEntry]){var b=S.bitacora[ui.editingEntry];b.fecha=d.fecha||hoyISO();b.avance=av;b.proximos=pr;b.apoyo=ap;b.actualizado=ahora();}
    else{S.bitacora[uid()]={equipoId:t.id,fecha:d.fecha||hoyISO(),avance:av,proximos:pr,apoyo:ap,etapa:t.etapa||null,estado:t.estado||null,creado:ahora()};ui.entryPage=0;}
    guardar();ui.entryOpen=false;ui.entryDraft=null;ui.editingEntry=null;ui.formError=null;flash('Registro guardado.');render();},
  'cuenta':function(){var em=(document.getElementById('cu-email')||{}).value||'',pw=(document.getElementById('cu-pass')||{}).value||'';ui.cuenta.email=em.trim();
    if(!ui.cuenta.email||!pw){ui.cuenta.error='Escribe tu correo y tu contraseña.';render();return;}traerDeCuenta(ui.cuenta.email,pw);}
};

/* =================== Eventos =================== */
var tBuscar=null;
/* Al tocar un campo de texto, lo deja de inmediato en la parte alta de la pantalla, antes de que aparezca el teclado:
   así el navegador no desplaza la página con animación, que en tinta electrónica deja texto negro corrido. */
var toque={el:null,t:0};
document.addEventListener('pointerdown',function(e){toque.el=e.target;toque.t=Date.now();},true);
document.addEventListener('focusin',function(e){var el=e.target;
  if(!el||!(el.tagName==='TEXTAREA'||(el.tagName==='INPUT'&&/^(text|search|email|password|number)$/.test(el.type))))return;
  if(toque.el!==el||Date.now()-toque.t>1500)return;
  var r=el.getBoundingClientRect(),h=window.innerHeight;if(r.top>=h*0.08&&r.bottom<=h*0.45)return;
  window.scrollTo(0,Math.max(0,window.pageYOffset+r.top-h*0.15));});
document.addEventListener('click',function(e){var el=e.target.closest('[data-a]');if(!el||!$app.contains(el)||el.disabled)return;var fn=A[el.dataset.a];if(fn){e.preventDefault();if(revisarDia())return;fn(el,e);}});
document.addEventListener('submit',function(e){var f=e.target;if(!f.dataset||!f.dataset.form)return;e.preventDefault();var fn=ENVIOS[f.dataset.form];if(fn)fn();});
function escribirLog(el){var g=grupoPorId(el.dataset.g),d=el.dataset.d;if(!g)return;var k=el.dataset.f.split('.')[1];
  var l=g.classLogs[d]||{objetivo:'',temas:'',obs:'',tarea:'',destacado:false};l[k]=el.type==='checkbox'?el.checked:el.value;
  if(!l.objetivo&&!l.temas&&!l.obs&&!l.tarea&&!l.destacado)delete g.classLogs[d];else g.classLogs[d]=l;guardar();}
function campoDraft(obj,k,el){var v=el.value;if(k==='c'){obj.c=v;if(v==='__otro'){obj.otro=true;render();foco(el.id.replace(/-c$/,'-co'));}else if(obj.otro){obj.otro=false;render();}}else obj[k]=v;}
document.addEventListener('input',function(e){
  var el=e.target;if(!el.dataset||!el.dataset.f)return;var f=el.dataset.f,p=f.split('.'),v=el.value;
  if(el.type==='checkbox')return;
  switch(p[0]){
    case 'log':escribirLog(el);return;
    case 'obs':var g=grupoActual(),sid=el.dataset.id;if(!g.notas[ui.fecha])g.notas[ui.fecha]={};if(v.trim())g.notas[ui.fecha][sid]=v;else{delete g.notas[ui.fecha][sid];if(!Object.keys(g.notas[ui.fecha]).length)delete g.notas[ui.fecha];}guardar();return;
    case 'es':if(ui.estDraft)campoDraft(ui.estDraft,p[1],el);return;
    case 'ne':if(ui.nuevoEst)campoDraft(ui.nuevoEst,p[1],el);return;
    case 'cd':if(ui.cursoDatos)ui.cursoDatos[p[1]]=v;return;
    case 'cn':if(ui.cursoForm)ui.cursoForm[p[1]]=v;return;
    case 'pegar':ui.pegar=v;return;
    case 'pegarCurso':ui.pegarCurso=v;return;
    case 'nota':var gn=grupoPorId(el.dataset.g);if(!gn)return;var c=cal(gn),s=el.dataset.sid,cid=el.dataset.c;if(!c.data[s])c.data[s]={};
      if(v.trim()===''){delete c.data[s][cid];}else{var nv=parseNota(v);if(nv==null)return;c.data[s][cid]=nv;el.classList.toggle('baja',nv<4);}
      guardar();pintarProms(gn,s);return;
    case 'ev':case 'ren':var fo=p[0]==='ev'?ui.evalForm:ui.renombrar;if(!fo)return;fo[p[1]]=v;
      if(p[1]==='fecha'&&v){fo.sem=String(semDeFecha(v));var se=document.getElementById(p[0]+'-sem');if(se)se.value=fo.sem;}return;
    case 'cbuscar':ui.cBuscar=v;ui.cPag=0;clearTimeout(tBuscar);tBuscar=setTimeout(render,450);return;
    case 'cnu':if(ui.cNuevo)ui.cNuevo[p[1]]=v;return;
    case 'dn':if(ui.dForm)ui.dForm[p[1]]=v;return;
    case 'dc':var dd=disActual();if(dd){dd.titulo=v;guardar();}return;
    case 'deq':var d2=disActual();if(!d2)return;var eq=d2.equipos.filter(function(x){return x.id===el.dataset.id;})[0];if(eq){eq[p[1]]=v;guardar();}return;
    case 'd-coment':var d3=disActual();if(!d3)return;var eq3=d3.equipos[ui.dEq];if(!eq3)return;var ev3=evDe(d3,eq3.id,true);ev3.comentario=v;guardar();return;
    case 'rub':var r=ui.rDraft;if(!r)return;
      if(p[1]==='nivel'){var n=r.niveles[+p[2]];if(n){if(p[3]==='puntos'){var x=parseFloat(String(v).replace(',','.'));n.puntos=isFinite(x)?x:'';}else n.nombre=v;}}
      else if(p[1]==='crit'){var k=r.criterios[+p[2]];if(k){if(p[3]==='desc')k.descriptores[+p[4]]=v;else if(p[3]==='peso')k.peso=+v||1;else k[p[3]]=v;}}
      else if(p[1]==='exigencia')r.exigencia=parseFloat(v)||0.6;
      else if(p[1]==='minutos'){var hadMin=!!r.minutos;r.minutos=v;var aj=ajustarTiempo(r);if(hadMin!==!!v){render();return;}
        aj.forEach(function(j){var k=r.criterios[j],e=document.getElementById('r-c'+j);if(e)e.value=k.nombre;k.descriptores.forEach(function(t,i){var x=document.getElementById('r-c'+j+'d'+i);if(x)x.value=t;});});}
      else r[p[1]]=v;
      var t=document.getElementById('r-total');if(t)t.textContent=escalaTexto(r);return;
    case 'team':if(ui.teamDraft)ui.teamDraft[p[1]]=v;return;
    case 'entry':if(ui.entryDraft)ui.entryDraft[p[1]]=v;return;
    case 'cuenta':ui.cuenta.email=v;return;
  }
});
document.addEventListener('change',function(e){
  var el=e.target;
  if(el.type==='checkbox'&&el.dataset.f){var p=el.dataset.f.split('.');if(p[0]==='log')escribirLog(el);else if(p[0]==='rub'&&ui.rDraft){var k=ui.rDraft.criterios[+p[2]];if(k)k.auto=el.checked?'tiempo':null;}return;}
  if(el.dataset&&el.dataset.f==='nota'){var v=el.value.trim();if(v&&parseNota(v)==null){var g=grupoPorId(el.dataset.g),old=(cal(g).data[el.dataset.sid]||{})[el.dataset.c];el.value=old!=null?num(old,1):'';flash('Nota no válida: escribe un número entre 1,0 y 7,0 (por ejemplo 5,6 o 56).');var m=document.getElementById('msg');if(!m){var cab=document.querySelector('.pestanas');if(cab)cab.insertAdjacentHTML('afterend','<p class="msg" id="msg" role="status">'+esc(ui.msg)+'</p>');}else m.textContent=ui.msg;}else if(v){el.value=num(parseNota(v),1);}return;}
  if(el.dataset&&el.dataset.file&&el.files&&el.files[0]){var file=el.files[0],tipo=el.dataset.file;el.value='';
    if(tipo==='respaldo'){file.text().then(function(t){var o;try{o=JSON.parse(t);}catch(x){o=null;}var p=detectarFormato(o);if(!p){flash('Ese archivo no es un respaldo que la agenda reconozca. Elige un .json de la agenda, de Control de Asistencia o de la Libreta.');render();return;}
      if(p.tipo==='asistencia'&&!S.grupos.length){aplicarImport(p);irA('hoy');return;}ui.importPend=p;ui.tab='respaldo';render();var c=document.querySelector('.confirmar');if(c)c.scrollIntoView();}).catch(function(){flash('No se pudo leer el archivo.');render();});}
    else if(tipo==='pdf'){flash('Leyendo el PDF…');render();leerPdf(file).then(function(p){if(!p.estudiantes.length){flash('No encontré estudiantes en el PDF. La importación está hecha para la nómina que entrega el sistema del liceo.');render();return;}ui.pdfPend=p;if(S.grupos.length){ui.tab='asistencia';ui.aVista='curso';ui.ficha=null;}ui.msg=null;render();window.scrollTo(0,0);})
      .catch(function(x){flash((x&&x.message)||'No se pudo leer el PDF.'+(navigator.onLine?'':' Si es la primera vez, conéctate a internet para descargar el lector.'));render();});}
    else if(tipo==='notas-csv'){var gg=grupoPorId((ui.nSel||'').slice(2));if(gg)importarNotasCSV(file,gg);}
    return;}
  var s=el.dataset&&el.dataset.sel;if(!s)return;var v2=el.value;
  switch(s){
    case 'grupo':ui.grupoId=v2;ui.ficha=null;ui.regAbierto=false;ui.cursoDatos=null;ui.nuevoEst=null;ui.pegarCurso='';render();break;
    case 'fecha':if(v2){ui.fecha=v2;ui.regAbierto=false;render();}break;
    case 'ir-lista':if(v2){ui.grupoId=v2;ui.fecha=hoyISO();ui.aVista='lista';irA('asistencia');}break;
    case 'notas':ui.nSel=v2;ui.evalForm=null;ui.renombrar=null;if(v2.indexOf('g:')===0)ui.grupoId=v2.slice(2);render();break;
    case 'ncurso':ui.nCurso=v2;render();break;
    case 'cnivel':ui.cNivel=v2;ui.cPag=0;render();break;
    case 'cgrupo':ui.cGrupo=v2;ui.cPag=0;render();break;
    case 'dtam':ui.dTam=+v2||3;break;
    case 'est-ret':var ge=grupoActual(),er=estPorId(ge,el.dataset.id);if(er){if(v2)er.ret=v2;guardar();render();}break;
    case 'd-eq':cambiarEquipo(+v2);break;
    case 'dc-fecha':var d=disActual();if(d){d.fecha=v2;guardar();}break;
    case 'dc-rubrica':var d1=disActual();if(d1&&S.rubricas[v2]){d1.rubricaId=v2;guardar();render();}break;
    case 'dc-grupo':var d2=disActual();if(d2&&grupoPorId(v2)){if(d2.equipos.some(function(x){return x.integrantes.length;})){flash('Primero deja los equipos sin integrantes.');render();break;}d2.grupoId=v2;guardar();render();}break;
  }
});
window.addEventListener('online',pintarGuardado);window.addEventListener('offline',pintarGuardado);
if(mqAncho.addEventListener)mqAncho.addEventListener('change',function(){render();});
window.addEventListener('pagehide',function(){persistir(true);});
document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')persistir(true);});
/* Si la agenda queda abierta de un día para otro (la Boox la congela en segundo plano y la retoma tal cual),
   la lista pasa sola al día nuevo: así no se pasa lista en la fecha anterior por error. Una fecha elegida a mano no se toca. */
var diaVisto=hoyISO();
function revisarDia(){var h=hoyISO();if(h===diaVisto)return false;if(ui.fecha===diaVisto){ui.fecha=h;ui.regAbierto=false;}diaVisto=h;flash('Cambió el día: la agenda ya muestra la fecha de hoy ('+fLarga(h)+').');render();return true;}
document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible')revisarDia();});
window.addEventListener('pageshow',revisarDia);

/* =================== Inicio =================== */
leerGuardado().then(function(raw){
  var nuevo=false;
  if(raw){try{S=normalizar(JSON.parse(raw));}catch(e){S=null;try{localStorage.setItem(LS_DATOS+':danado-'+Date.now(),raw);}catch(x){}}}
  if(!S){S=vacio();semilla(S);nuevo=true;}
  cargarUI();
  var h=(location.hash||'').slice(1);if(['hoy','asistencia','notas','clases','disertaciones','bitacora','respaldo'].indexOf(h)>=0)ui.tab=h;
  render();
  if(nuevo)persistir();
  try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persisted().then(function(p){return p?true:navigator.storage.persist();}).then(function(r){persistente=!!r;if(ui.tab==='respaldo')render();}).catch(function(){});}catch(e){}
  if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')){
    var habia=!!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange',function(){if(habia){ui.actualizacion=true;render();}habia=true;});
    navigator.serviceWorker.register('sw.js').then(function(){return navigator.serviceWorker.ready;}).then(function(){swListo=true;if(ui.tab==='respaldo')render();}).catch(function(){});
  }
});
window.__agenda={estado:function(){return S;},ui:function(){return ui;},parsearLista:parsearLista,normCurso:normCurso,nota:nota,parsePDFText:parsePDFText};
})();
