  var ki=critInd(r);
  if(ki.length&&ints.length){
    h+='<div class="seccion"><h3 class="titulo-sec">Criterios individuales</h3><p class="ayuda">Evalúa a cada integrante en el mismo criterio para comparar con justicia. Si alguien no se presentó, márcalo ausente: su nota queda pendiente.</p>';
    h+='<div class="asist-chips">'+ints.map(function(e){var a=!!(ev&&ev.ausentes&&ev.ausentes[e.id]);return '<button type="button" class="btn chico" data-a="d-ausente" data-id="'+esc(e.id)+'" aria-pressed="'+a+'">'+esc(nombreCorto(e))+': '+(a?'Ausente':'Presente')+'</button>';}).join('')+'</div>';
    ki.forEach(function(k){var n=r.criterios.indexOf(k)+1;
      h+='<div class="criterio"><h4><span class="c-num">C'+n+'</span>'+esc(k.nombre||'Criterio sin nombre')+'<span class="peso">'+valeTxt(r,k)+'</span>'+'</h4>'+
        '<details class="desc"><summary>Ver descriptores</summary><ul>'+r.niveles.map(function(lv,li){return '<li><b>'+esc(lv.nombre)+' ('+ptsTxt(ptsCrit(r,k,li))+'):</b> '+esc(k.descriptores[li]||'')+'</li>';}).join('')+'</ul></details>';
      pres.forEach(function(e){var sel=((ev&&ev.ind&&ev.ind[e.id])||{})[k.id];
        h+='<div class="ind-fila"><span class="nom">'+esc(nombreCorto(e))+'</span><div class="ind-niv" style="--n:'+r.niveles.length+'">'+r.niveles.map(function(lv,li){return '<button type="button" class="nivel" data-a="d-ind" data-c="'+esc(k.id)+'" data-id="'+esc(e.id)+'" data-l="'+li+'" aria-pressed="'+(sel===li)+'" aria-label="'+esc(nombreCorto(e)+': '+lv.nombre)+'"><span class="n-cab"><b>'+esc(lv.nombre)+'</b><span>'+num(ptsCrit(r,k,li))+'</span></span></button>';}).join('')+'</div></div>';});
      h+='</div>';});
    h+='</div>';
  }
  h+='<div class="campo"><label for="d-com">Retroalimentación para el equipo</label><textarea id="d-com" rows="3" data-f="d-coment" placeholder="Fortalezas y aspectos a mejorar">'+esc((ev&&ev.comentario)||'')+'</textarea></div>';
  h+='<div id="d-res">'+vDisRes(d,r,g,eq,ev)+'</div>';
  h+='<div class="pie-corr"><div>'+(ev?'<button type="button" class="btn quiet" data-a="d-eval-borrar">Borrar la evaluación de este equipo</button>':'')+'</div>'+
    (i<d.equipos.length-1?'<button type="button" class="btn primary grande" data-a="d-nav" data-v="1">Siguiente equipo ▶</button>':'<button type="button" class="btn primary grande" data-a="d-ver" data-v="resumen">Ver resumen</button>')+'</div>';
  h+='<p class="ayuda">Cada toque se guarda al instante. Toca de nuevo un nivel para quitarlo.</p>';
  return h+'</section>';
}
function vDisResumen(d){
  var g=grupoPorId(d.grupoId),r=S.rubricas[d.rubricaId],h='<section class="seccion">'+cabDis(d,'resumen');
  if(!g||!r)return h+'<div class="alerta">'+(!g?'El curso de esta disertación fue eliminado.':'La rúbrica de esta disertación fue eliminada.')+'</div></section>';
  var F=filasDis(d,r,g),notas=F.filter(function(x){return x.res.nota!=null;}).map(function(x){return x.res.nota;});
  var prom=notas.length?promedioDe(notas):null,apr=notas.filter(function(n){return n>=4;}).length;
  var asign={};d.equipos.forEach(function(eq){eq.integrantes.forEach(function(s){asign[s]=1;});});var sinEq=g.estudiantes.filter(function(e){return !asign[e.id]&&!retirado(e);}).length;
  h+='<div class="stats"><div class="stat">Con nota<b>'+notas.length+' de '+F.length+'</b></div><div class="stat">Promedio<b>'+(prom!=null?num(prom,1):'—')+'</b></div><div class="stat">Aprobados<b>'+apr+(notas.length?' ('+Math.round(apr/notas.length*100)+' %)':'')+'</b></div><div class="stat">Rango<b>'+(notas.length?num(Math.min.apply(null,notas),1)+' – '+num(Math.max.apply(null,notas),1):'—')+'</b></div></div>';
  if(sinEq)h+='<p class="ayuda">'+sinEq+(sinEq===1?' estudiante del curso no está':' estudiantes del curso no están')+' en ningún equipo.</p>';
  var np=d.notasPasadas;
  h+='<div class="panel"><h3>Libro de notas</h3><p>'+(np?'Pasaste las notas el '+esc(fHora(np.fecha))+' a la evaluación «'+esc(nombreColumna(d,g))+'». Si corriges algo, vuelve a pasarlas.':'Las notas completas se agregan a Notas como la evaluación «Disertación: '+esc(d.titulo)+'». Ausentes y evaluaciones incompletas quedan sin nota.')+'</p>'+
    '<div class="acciones"><button type="button" class="btn primary" data-a="d-pasar"'+(notas.length?'':' disabled')+'>'+(np?'Actualizar notas en Notas':'Pasar notas a Notas')+'</button></div></div>';
  h+='<div class="acciones"><button type="button" class="btn" data-a="d-csv">Descargar CSV</button><button type="button" class="btn" data-a="d-copiar">Copiar para planilla</button><button type="button" class="btn" data-a="d-imp-res">Imprimir resumen</button><button type="button" class="btn" data-a="d-imp-hojas">Imprimir retroalimentación por equipo</button></div>';
  var ks=r.criterios;
  h+='<div class="tabla-wrap"><table><thead><tr><th>Estudiante</th><th>Equipo</th>'+ks.map(function(k,i){return '<th class="num" title="'+esc(k.nombre)+'">C'+(i+1)+'</th>';}).join('')+'<th class="num">Total</th><th class="num">Nota</th>'+(r.minutos?'<th class="num">Tiempo</th>':'')+'</tr></thead><tbody>'+
    F.map(function(x){return '<tr><td>'+esc(apellidos(x.e))+', '+esc(x.e.n)+'<small>'+esc(x.e.c)+'</small></td><td><button type="button" class="link" data-a="d-ir-eq" data-id="'+esc(x.eq.id)+'">'+esc(x.eq.nombre||'Equipo')+'</button></td>'+
      ks.map(function(k){var li=k.alcance==='individual'?((x.ev&&x.ev.ind&&x.ev.ind[x.e.id])||{})[k.id]:(x.ev&&x.ev.grupo?x.ev.grupo[k.id]:undefined);return '<td class="num">'+(x.res.aus&&k.alcance==='individual'?'—':(li!=null&&r.niveles[li]?num(ptsCrit(r,k,li)):'·'))+'</td>';}).join('')+
      '<td class="num">'+(x.res.aus?'—':num(x.res.total)+' / '+num(x.res.max))+'</td><td class="num'+(x.res.nota!=null&&x.res.nota<4?' baja':'')+'"><b>'+(x.res.aus?'Ausente':x.res.nota!=null?num(x.res.nota,1):'Faltan '+x.res.faltan)+'</b></td>'+(r.minutos?'<td class="num">'+(x.ev&&x.ev.duracionSeg?mmss(x.ev.duracionSeg):'—')+'</td>':'')+'</tr>';}).join('')+'</tbody></table></div>';
  h+='<p class="leyenda">'+ks.map(function(k,i){return '<span>C'+(i+1)+': '+esc(k.nombre)+(k.alcance==='individual'?' (individual)':'')+' ('+valeTxt(r,k)+')'+'</span>';}).join('')+'<span>Notas bajo 4,0 subrayadas.</span></p>';
  return h+'</section>';
}
function nombreColumna(d,g){var np=d.notasPasadas;if(np){var c=cal(g).columns.filter(function(x){return x.id===np.columnaId;})[0];if(c)return c.name;}return 'Disertación: '+d.titulo;}

/* =================== Vista: Rúbricas =================== */
function usosRubrica(id){return Object.keys(S.disertaciones).filter(function(k){return S.disertaciones[k].rubricaId===id;}).length;}
function vRubricas(){
  if(ui.rVer)return vRubricaVer(ui.rVer);
  var ids=Object.keys(S.rubricas).sort(function(a,b){return cmp(S.rubricas[a].creado,S.rubricas[b].creado);});
  var h='<section class="seccion"><button type="button" class="btn quiet volver" data-a="d-ver" data-v="lista">← Disertaciones</button><div class="lista-cab"><h2 class="titulo-sec">Rúbricas</h2><button type="button" class="btn" data-a="d-ver" data-v="nueva-rubrica">+ Nueva rúbrica</button></div>'+
    '<p class="ayuda">«Ver» muestra la rúbrica tal como se usa al evaluar. «Editar» sirve para cambiar sus textos y puntajes.</p>';
  if(!ids.length)h+='<div class="vacio"><h3>Sin rúbricas</h3><button type="button" class="btn primary" data-a="d-ver" data-v="nueva-rubrica">+ Nueva rúbrica</button></div>';
  ids.forEach(function(id){var r=S.rubricas[id],u=usosRubrica(id);
    h+='<div class="dis-card"><div><h3>'+esc(r.nombre||'Sin nombre')+'</h3><p class="ayuda">'+pl(r.criterios.length,'criterio','criterios')+(critInd(r).length?' ('+pl(critInd(r).length,'individual','individuales')+')':'')+' · '+esc(escalaTexto(r))+'</p><p class="ayuda">'+(u?'Usada en '+u+(u===1?' disertación':' disertaciones'):'Sin usar')+'</p></div>'+
      '<div class="acciones"><button type="button" class="btn primary" data-a="r-ver" data-id="'+esc(id)+'">Ver</button><button type="button" class="btn" data-a="r-editar" data-id="'+esc(id)+'">Editar</button><button type="button" class="btn" data-a="r-dup" data-id="'+esc(id)+'">Duplicar</button><button type="button" class="btn quiet" data-a="r-borrar" data-id="'+esc(id)+'">Eliminar</button></div></div>';});
  return h+'</section>';
}
/* «Ver» una rúbrica: las mismas tarjetas de «Evaluar», solo para mirar, y el atajo para usarla en una disertación. */
function vRubricaVer(id){
  var r=S.rubricas[id];if(!r){ui.rVer=null;return vRubricas();}
  function fila(k){var n=r.criterios.indexOf(k)+1;
    return '<li class="criterio"><h4><span class="c-num">C'+n+'</span>'+esc(k.nombre||'Criterio sin nombre')+'<span class="peso">'+valeTxt(r,k)+'</span>'+'</h4>'+(k.ayuda?'<p class="ayuda">'+esc(k.ayuda)+'</p>':'')+
      '<div class="niveles" style="--n:'+r.niveles.length+'">'+r.niveles.map(function(lv,li){return '<div class="nivel nivel-ver"><span class="n-cab"><b>'+esc(lv.nombre)+'</b><span>'+ptsTxt(ptsCrit(r,k,li))+'</span></span>'+(k.descriptores[li]?'<span class="n-desc">'+esc(k.descriptores[li])+'</span>':'')+'</div>';}).join('')+'</div></li>';}
  var ke=critEq(r),ki=critInd(r);
  var h='<section class="seccion"><button type="button" class="btn quiet volver" data-a="r-ver-cerrar">← Rúbricas</button>'+
    '<div class="det-cab"><div><p class="eyebrow">Rúbrica</p><h2>'+esc(r.nombre||'Sin nombre')+'</h2>'+(r.objetivo?'<p class="proyecto">'+esc(r.objetivo)+'</p>':'')+'</div></div>'+
    '<p class="ayuda">'+esc(escalaTexto(r))+'</p>'+
    '<div class="acciones"><button type="button" class="btn primary" data-a="d-nueva" data-r="'+esc(id)+'">Usar en una disertación nueva</button><button type="button" class="btn" data-a="r-editar" data-id="'+esc(id)+'">Editar textos</button></div>'+
    '<p class="ayuda">Así se ve en «Evaluar»: ahí tocas el nivel de cada criterio y la nota se calcula sola.</p>';
  if(ke.length)h+='<h3 class="titulo-sec">Criterios del equipo</h3><ol class="criterios">'+ke.map(fila).join('')+'</ol>';
  if(ki.length)h+='<h3 class="titulo-sec">Criterios individuales</h3><p class="ayuda">Se marcan para cada integrante.</p><ol class="criterios">'+ki.map(fila).join('')+'</ol>';
  return h+'</section>';
}
function vNuevaRub(){
  return '<section class="seccion"><button type="button" class="btn quiet volver" data-a="d-ver" data-v="rubricas">← Rúbricas</button><h2 class="titulo-sec">Nueva rúbrica</h2><div class="opciones">'+
    '<button type="button" class="opcion" data-a="r-tpl" data-v="general"><b>Disertación científica (cualquier tema)</b><span>Sirve para cualquier tema de ciencias sin editarla: C1 cuenta los conceptos clave que entregas al asignar el tema, y cada nivel se decide contando.</span></button>'+
    '<button type="button" class="opcion" data-a="r-tpl" data-v="original"><b>Exposición oral (tu rúbrica original)</b><span>8 categorías, 4 niveles, 32 puntos y exigencia de 60 %.</span></button>'+
    '<button type="button" class="opcion" data-a="r-tpl" data-v="blanco"><b>Empezar en blanco</b><span>Cuatro niveles listos (4 a 1 punto) para escribir tus criterios.</span></button></div></section>';
}
function vEditorRub(){
  var d=ui.rDraft;if(!d){ui.dVista='rubricas';return vRubricas();}
  var usos=ui.rId?usosRubrica(ui.rId):0;
  var h='<section class="seccion"><button type="button" class="btn quiet volver" data-a="r-cancelar">← Rúbricas</button><form class="editor" data-form="rub"><h2>'+(ui.rId?'Editar rúbrica':'Nueva rúbrica')+'</h2>'+
    '<p class="ayuda">Aquí se cambian los textos y puntajes. Para evaluar con esta rúbrica: Disertaciones → + Nueva disertación → elígela en «Rúbrica» → «Evaluar».</p>'+vError();
  h+='<div class="campo"><label for="r-nombre">Nombre</label><input type="text" id="r-nombre" data-f="rub.nombre" value="'+esc(d.nombre)+'"></div>';
  h+='<div class="campo"><label for="r-obj">Objetivo (opcional)</label><textarea id="r-obj" rows="2" data-f="rub.objetivo">'+esc(d.objetivo||'')+'</textarea></div>';
  h+='<div class="campo"><label for="r-hab">Habilidad (opcional)</label><input type="text" id="r-hab" data-f="rub.habilidad" value="'+esc(d.habilidad||'')+'"></div>';
  h+='<div class="fila-2"><div class="campo"><label for="r-exig">Exigencia</label><select id="r-exig" data-f="rub.exigencia">'+[0.5,0.6,0.7].map(function(e){return '<option value="'+e+'"'+(Math.abs((d.exigencia||0.6)-e)<1e-9?' selected':'')+'>'+Math.round(e*100)+' %</option>';}).join('')+'</select></div>'+
    '<div class="campo"><label for="r-min">Tiempo previsto en minutos (activa el cronómetro)</label><input type="number" id="r-min" min="0" step="1" inputmode="numeric" data-f="rub.minutos" value="'+(d.minutos?esc(d.minutos):'')+'"></div></div>';
  h+='<p class="conteo" id="r-total">'+esc(escalaTexto(d))+'</p>';
  if(usos)h+='<p class="ayuda">Esta rúbrica se usa en '+usos+(usos===1?' disertación':' disertaciones')+'. Si cambias o quitas niveles o criterios, sus notas se recalculan.</p>';
  h+='<fieldset><legend>Niveles de desempeño</legend>'+d.niveles.map(function(n,i){return '<div class="nivel-ed"><div class="campo"><label for="r-n'+i+'">Nivel '+(i+1)+'</label><input type="text" id="r-n'+i+'" data-f="rub.nivel.'+i+'.nombre" value="'+esc(n.nombre)+'"></div><div class="campo"><label for="r-p'+i+'">Puntos</label><input type="number" id="r-p'+i+'" step="0.5" min="0" inputmode="decimal" data-f="rub.nivel.'+i+'.puntos" value="'+(n.puntos!==''&&isFinite(n.puntos)?esc(n.puntos):'')+'"></div>'+(d.niveles.length>2?'<button type="button" class="btn quiet" data-a="nivel-del" data-i="'+i+'">Quitar</button>':'<span></span>')+'</div>';}).join('')+(d.niveles.length<6?'<div><button type="button" class="btn" data-a="nivel-add">+ Agregar nivel</button></div>':'')+'</fieldset>';
  h+='<fieldset><legend>Criterios</legend>'+d.criterios.map(function(k,j){
    return '<div class="crit-ed"><div class="crit-ed-cab"><div class="campo"><label for="r-c'+j+'">C'+(j+1)+' · Nombre</label><input type="text" id="r-c'+j+'" data-f="rub.crit.'+j+'.nombre" value="'+esc(k.nombre)+'"></div>'+
      (j>0?'<button type="button" class="btn" data-a="crit-up" data-i="'+j+'">Subir</button>':'')+(d.criterios.length>1?'<button type="button" class="btn quiet" data-a="crit-del" data-i="'+j+'">Quitar</button>':'')+'</div>'+
      '<div class="fila-2"><div class="campo"><label for="r-c'+j+'-al">Se evalúa</label><select id="r-c'+j+'-al" data-f="rub.crit.'+j+'.alcance"><option value="equipo"'+(k.alcance!=='individual'?' selected':'')+'>Al equipo (misma nota para todos)</option><option value="individual"'+(k.alcance==='individual'?' selected':'')+'>A cada integrante</option></select></div>'+
      '<div class="campo"><label for="r-c'+j+'-pe">Cuánto vale</label><select id="r-c'+j+'-pe" data-f="rub.crit.'+j+'.peso">'+[1,2,3].map(function(p){return '<option value="'+p+'"'+((+k.peso||1)===p?' selected':'')+'>'+(p===1?'Normal':p===2?'Doble':'Triple')+'</option>';}).join('')+'</select></div></div>'+
      '<div class="campo"><label for="r-c'+j+'-ay">Indicación para quien evalúa (opcional)</label><input type="text" id="r-c'+j+'-ay" data-f="rub.crit.'+j+'.ayuda" value="'+esc(k.ayuda||'')+'"></div>'+
      (d.minutos?'<label class="campo-check" for="r-c'+j+'-au"><input type="checkbox" id="r-c'+j+'-au" data-f="rub.crit.'+j+'.auto"'+(k.auto==='tiempo'?' checked':'')+'> Sugerir el nivel con el cronómetro (±1, ±3 y ±5 minutos del tiempo previsto)</label>':'')+
      d.niveles.map(function(n,i){return '<div class="campo"><label for="r-c'+j+'d'+i+'">'+esc(n.nombre||('Nivel '+(i+1)))+'</label><textarea id="r-c'+j+'d'+i+'" rows="2" data-f="rub.crit.'+j+'.desc.'+i+'">'+esc(k.descriptores[i]||'')+'</textarea></div>';}).join('')+'</div>';
  }).join('')+'<div><button type="button" class="btn" data-a="crit-add">+ Agregar criterio</button></div></fieldset>';
  h+='<div class="acciones"><button type="submit" class="btn primary">Guardar rúbrica</button><button type="button" class="btn" data-a="r-cancelar">Cancelar</button></div></form></section>';
  return h;
}

/* =================== Vista: Bitácora de equipos =================== */
function listaCol(col){return Object.keys(S[col]).map(function(id){var o=Object.assign({},S[col][id]);o.id=id;return o;}).sort(function(a,b){return cmp(a.creado,b.creado)||cmp(a.id,b.id);});}
function equipoActual(){return ui.teamId&&S.equipos[ui.teamId]?Object.assign({id:ui.teamId},S.equipos[ui.teamId]):null;}
function registrosDe(id){return listaCol('bitacora').filter(function(r){return r.equipoId===id;}).sort(function(a,b){return cmp(b.fecha,a.fecha)||cmp(b.creado,a.creado);});}
function estadoInfo(k){for(var i=0;i<ESTADOS.length;i++)if(ESTADOS[i].k===k)return ESTADOS[i];return null;}
function chipEstado(k){var e=estadoInfo(k);return e?'<span class="chip '+e.k+'"><span aria-hidden="true">'+e.g+'</span>'+esc(e.t)+'</span>':'';}
function sinId(o){var c=clonar(o);delete c.id;return c;}
function vBitacora(){
  var eqs=listaCol('equipos');
  if(ui.teamId&&!S.equipos[ui.teamId])ui.teamId=null;
  if(esAncho()&&!ui.teamId&&eqs.length&&ui.teamMode!=='nuevo')ui.teamId=eqs[0].id;
  var con=!!ui.teamId||ui.teamMode==='nuevo';
  var l='<div class="lista"><div class="lista-cab"><h2 class="titulo-sec">Equipos</h2><button type="button" class="btn" data-a="team-new">+ Nuevo equipo</button></div>'+(eqs.length?'':'<p class="ayuda">Aún no hay equipos.</p>');
  eqs.forEach(function(t){var regs=registrosDe(t.id),ult=regs[0],e=estadoInfo(t.estado);
    l+='<button type="button" class="equipo" data-a="team-select" data-id="'+esc(t.id)+'" aria-pressed="'+(t.id===ui.teamId)+'"><span class="eq-nombre">'+esc(t.nombre||'Equipo sin nombre')+'</span>'+(t.proyecto?'<span class="eq-proy">'+esc(t.proyecto)+'</span>':'')+'<span class="eq-meta">'+(e?esc(e.g+' '+e.t):'Sin estado')+' · '+(ult?'Último registro '+esc(fCorta(ult.fecha)):'Sin registros')+'</span></button>';});
  if(eqs.length)l+='<button type="button" class="btn quiet" data-a="export-bit">Descargar bitácora (CSV)</button>';
  l+='</div>';
  return '<div class="bit'+(con?' con-detalle':'')+'">'+l+'<section class="detalle" aria-label="Detalle del equipo">'+vDetalleEq(eqs)+'</section></div>';
}
function vDetalleEq(eqs){
  if(ui.teamMode==='nuevo'||ui.teamMode==='editar')return vFormEquipo();
  var t=equipoActual();
  if(!t)return eqs.length?'<div class="vacio"><h3>Elige un equipo</h3><p>Toca un equipo de la lista para ver su avance y anotar la reunión de hoy.</p></div>':'<div class="vacio"><h3>Agrega tu primer equipo</h3><p>Anota el nombre, el proyecto y sus integrantes. Después registras cada reunión de avance.</p><button type="button" class="btn primary" data-a="team-new">+ Nuevo equipo</button></div>';
  var ei=ETAPAS.indexOf(t.etapa);
  var regs=registrosDe(t.id),pags=Math.max(1,Math.ceil(regs.length/POR_PAGINA));if(ui.entryPage>=pags)ui.entryPage=pags-1;
  var h='<button type="button" class="btn quiet volver solo-angosto" data-a="team-back">← Todos los equipos</button>';
  h+='<div class="det-cab"><div>'+(t.categoria?'<p class="eyebrow">'+esc(t.categoria)+'</p>':'')+'<h2>'+esc(t.nombre)+'</h2>'+(t.proyecto?'<p class="proyecto">'+esc(t.proyecto)+'</p>':'')+'</div><button type="button" class="btn" data-a="team-edit">Editar equipo</button></div>';
  h+='<p class="integrantes"><strong>Integrantes:</strong> '+(t.integrantes&&t.integrantes.length?esc(t.integrantes.join(', ')):'aún sin nombres. Agrégalos en Editar equipo.')+'</p>';
  h+='<div><h3 class="etiqueta">Etapa del proyecto'+(ei<0?' · toca la etapa en que están':'')+'</h3><div class="etapas">'+ETAPAS.map(function(e,i){return '<button type="button" class="etapa'+(ei>i?' hecha':'')+'" data-a="etapa-set" data-i="'+i+'" aria-pressed="'+(ei===i)+'"><small>'+(i+1)+'</small>'+esc(e)+'</button>';}).join('')+'</div></div>';
  h+='<div><h3 class="etiqueta">Estado</h3><div class="estados">'+ESTADOS.map(function(s){return '<button type="button" class="btn" data-a="estado-set" data-v="'+s.k+'" aria-pressed="'+(t.estado===s.k)+'"><span aria-hidden="true">'+s.g+'</span>'+s.t+'</button>';}).join('')+'</div></div>';
  h+='<div class="registros"><div class="reg-cab"><h3>Registros <span>('+regs.length+')</span></h3>'+(ui.entryOpen?'':'<button type="button" class="btn primary" data-a="entry-open">+ Nuevo registro</button>')+'</div>';
  if(ui.entryOpen)h+=vFormRegistro();
  if(!regs.length&&!ui.entryOpen)h+='<div class="vacio"><h3>Sin registros todavía</h3><p>Anota la primera reunión: qué avanzaron, qué sigue y qué apoyo necesitan.</p></div>';
  regs.slice(ui.entryPage*POR_PAGINA,(ui.entryPage+1)*POR_PAGINA).forEach(function(r){
    h+='<article class="registro"><header><time datetime="'+esc(r.fecha)+'">'+esc(fLarga(r.fecha))+'</time><span class="reg-tags">'+(r.etapa?esc(r.etapa):'')+(r.etapa&&r.estado?' · ':'')+chipEstado(r.estado)+'</span></header><dl class="campos">'+
      (r.avance?'<dt>Avance</dt><dd>'+esc(r.avance)+'</dd>':'')+(r.proximos?'<dt>Próximos pasos</dt><dd>'+esc(r.proximos)+'</dd>':'')+(r.apoyo?'<dt>Apoyo que necesitan</dt><dd>'+esc(r.apoyo)+'</dd>':'')+
      '</dl>'+(ui.confEntry===r.id?vConfEntry(t,r):'<div class="acciones"><button type="button" class="btn quiet" data-a="entry-edit" data-id="'+esc(r.id)+'">Editar</button><button type="button" class="btn quiet" data-a="entry-del" data-id="'+esc(r.id)+'">Eliminar</button></div>')+'</article>';});
  if(pags>1)h+='<div class="paginador"><button type="button" class="btn" data-a="pag-prev"'+(ui.entryPage===0?' disabled':'')+'>← Más recientes</button><span>Página '+(ui.entryPage+1)+' de '+pags+'</span><button type="button" class="btn" data-a="pag-next"'+(ui.entryPage>=pags-1?' disabled':'')+'>Más antiguos →</button></div>';
  return h+'</div>';
}
/* Eliminar un registro de la bitácora pide confirmar, con lo que se perdería. El último registro queda al final de la página:
   el espacio bajo el aviso deja subirlo entero a la vista, así «Sí» no cae donde estaba el dedo. */
function vConfEntry(t,r){var p=[];if(r.avance)p.push('el avance');if(r.proximos)p.push('los próximos pasos');if(r.apoyo)p.push('el apoyo que necesitan');
  var lista=p.length>1?p.slice(0,-1).join(', ')+' y '+p[p.length-1]:(p[0]||'el registro');
  return '<div class="form" id="conf-entry" role="alert" style="border-width:3px;margin-bottom:75vh"><p><b>¿Eliminar el registro del '+esc(fLarga(r.fecha))+' de '+esc(t.nombre||'este equipo')+'?</b> Se borra lo anotado: '+esc(lista)+'.</p>'+
    '<div class="acciones"><button type="button" class="btn primary" data-a="entry-del-si" data-id="'+esc(r.id)+'">Sí, eliminar el registro</button><button type="button" class="btn" data-a="entry-del-no">Cancelar</button></div></div>';}
function vFormRegistro(){
  var d=ui.entryDraft,ed=!!ui.editingEntry;
  return '<form class="form" id="form-registro" data-form="entry"><h3>'+(ed?'Editar registro':'Nuevo registro')+'</h3>'+vError()+
    '<div class="campo" style="max-width:260px"><label for="e-fecha">Fecha</label><input type="date" id="e-fecha" data-f="entry.fecha" value="'+esc(d.fecha)+'"></div>'+
    '<div class="campo"><label for="e-avance">¿Qué avanzaron?</label><textarea id="e-avance" rows="3" data-f="entry.avance">'+esc(d.avance)+'</textarea></div>'+
    '<div class="fila-2"><div class="campo"><label for="e-prox">Próximos pasos</label><textarea id="e-prox" rows="3" data-f="entry.proximos">'+esc(d.proximos)+'</textarea></div><div class="campo"><label for="e-apoyo">Apoyo que necesitan</label><textarea id="e-apoyo" rows="3" data-f="entry.apoyo">'+esc(d.apoyo)+'</textarea></div></div>'+
    (ed?'':'<p class="ayuda">Se guarda junto con la etapa y el estado actuales del equipo.</p>')+
    '<div class="acciones"><button type="submit" class="btn primary">Guardar registro</button><button type="button" class="btn" data-a="entry-cancel">Cancelar</button></div></form>';
}
function vFormEquipo(){
  var d=ui.teamDraft,nuevo=ui.teamMode==='nuevo';
  return '<form class="form" data-form="team"><h3>'+(nuevo?'Nuevo equipo':'Editar equipo')+'</h3>'+vError()+
    '<div class="campo"><label for="t-nombre">Nombre del equipo</label><input type="text" id="t-nombre" data-f="team.nombre" value="'+esc(d.nombre)+'"></div>'+
    '<div class="campo"><label for="t-proy">Proyecto</label><input type="text" id="t-proy" data-f="team.proyecto" value="'+esc(d.proyecto)+'"></div>'+
    '<div class="campo"><label for="t-cat">Categoría o contexto</label><input type="text" id="t-cat" data-f="team.categoria" value="'+esc(d.categoria)+'" placeholder="Ej.: Olimpiadas de Innovación, Feria científica"></div>'+
    '<div class="campo"><label for="t-int">Integrantes (uno por línea)</label><textarea id="t-int" rows="4" data-f="team.integrantes">'+esc(d.integrantes)+'</textarea></div>'+
    '<div class="acciones"><button type="submit" class="btn primary">Guardar equipo</button><button type="button" class="btn" data-a="team-cancel">Cancelar</button>'+(nuevo?'':'<button type="button" class="btn quiet" data-a="team-del">Eliminar equipo</button>')+'</div></form>';
}

/* =================== Vista: Respaldo y datos =================== */
function resumenGrupos(gs){var est=0,fe=0,ev=0,lg=0;gs.forEach(function(g){est+=(g.estudiantes||[]).length;fe+=Object.keys(g.asistencia||{}).length;ev+=((g.calificaciones||{}).columns||[]).length;lg+=Object.keys(g.classLogs||{}).length;});
  return pl(gs.length,'curso','cursos')+', '+pl(est,'estudiante','estudiantes')+', '+pl(fe,'día','días')+' de asistencia, '+pl(ev,'evaluación','evaluaciones')+' y '+pl(lg,'registro','registros')+' de clase';}
function vRespaldo(){
  var nG=S.grupos.length,nE=S.grupos.reduce(function(s,g){return s+g.estudiantes.length;},0);
  var d=diasDesde(S.meta.ultimoRespaldo),inst=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
  var loc=asistenciaLocal(),lib=libretaLocal();
  var h='<section class="seccion"><h2 class="titulo-sec">Respaldo y datos</h2><div class="dos-col"><div class="seccion">';
  h+='<div class="bloque"><h2>Tus datos</h2><p>Todo se guarda solo en esta tableta. No se sube a internet ni se comparte.</p><p class="conteo">'+pl(nG,'curso','cursos')+' · '+pl(nE,'estudiante','estudiantes')+' · '+pl(Object.keys(S.disertaciones).length,'disertación','disertaciones')+' · '+pl(Object.keys(S.rubricas).length,'rúbrica','rúbricas')+' · '+pl(Object.keys(S.equipos).length,'equipo','equipos')+' en la bitácora</p>'+
    '<p>'+(S.meta.ultimoRespaldo?'Último respaldo: '+esc(fLarga(isoLocal(S.meta.ultimoRespaldo)))+(d===0?' (hoy)':' (hace '+d+(d===1?' día)':' días)')):'Todavía no has descargado un respaldo.')+'</p>'+(persistente===true?'<p class="ayuda">El navegador marcó estos datos como permanentes: no los borrará para liberar espacio.</p>':'')+'</div>';
  h+='<div class="bloque"><h2>Respaldar</h2><p>Si borras los datos del navegador o cambias de tableta, solo un archivo de respaldo recupera tu agenda. Descárgalo una vez por semana y guárdalo en Drive o en tu notebook.</p><div class="acciones"><button type="button" class="btn primary" data-a="resp-descargar">Descargar respaldo</button>'+(puedeCompartir('application/json','json')?'<button type="button" class="btn" data-a="resp-compartir">Enviar respaldo a Drive o correo</button>':'')+'</div></div>';
  h+='<div class="bloque"><h2>Restaurar o importar un archivo</h2><p>Acepta respaldos de esta agenda, de Control de Asistencia y de la Libreta de Equipos y Pautas. Antes de reemplazar algo te muestro qué contiene.</p><div class="acciones"><label class="btn" for="arch-resp">Elegir archivo</label><input type="file" id="arch-resp" class="oculto" data-file="respaldo" accept=".json,application/json"></div>'+vImportPend()+'</div>';
  h+='</div><div class="seccion">';
  h+='<div class="bloque" id="bloque-cuenta"><h2>Traer datos de Control de Asistencia</h2><p>Copia una vez tus cursos, nóminas, asistencia, observaciones, notas y registros de clase. Necesita internet solo para esto; tu contraseña no se guarda y tu cuenta no se modifica.</p>'+
    (loc?'<div class="acciones"><button type="button" class="btn primary" data-a="imp-local">Traer '+loc.length+(loc.length===1?' curso guardado':' cursos guardados')+' en esta tableta</button></div>':'')+
    '<form class="form" data-form="cuenta"><h3>Desde tu cuenta</h3>'+(ui.cuenta.error?'<p class="form-error" role="alert">'+esc(ui.cuenta.error)+'</p>':'')+
    '<div class="campo"><label for="cu-email">Correo</label><input type="email" id="cu-email" data-f="cuenta.email" value="'+esc(ui.cuenta.email)+'" autocomplete="email"></div>'+
    '<div class="campo"><label for="cu-pass">Contraseña</label><input type="password" id="cu-pass" autocomplete="current-password"></div>'+
    '<div class="acciones"><button type="submit" class="btn primary"'+(ui.cuenta.cargando?' disabled':'')+'>'+(ui.cuenta.cargando?'Leyendo tu cuenta…':'Traer mis datos')+'</button></div></form></div>';
  h+='<div class="bloque"><h2>Llevar datos a Control de Asistencia</h2><p>Descarga tus cursos, asistencia y notas en el formato de respaldo de Control de Asistencia, para abrirlo con su botón «Restaurar backup». Ojo: allá reemplaza todos los datos.</p><div class="acciones"><button type="button" class="btn" data-a="exp-compat"'+(nG?'':' disabled')+'>Descargar archivo para Control de Asistencia</button></div></div>';
  if(lib&&!S.meta.migradoLibreta)h+='<div class="bloque"><h2>Libreta de Equipos y Pautas</h2><p>Encontré tu Libreta anterior en esta tableta con '+pl(Object.keys(lib.equipos).length,'equipo','equipos')+' y '+pl(Object.keys(lib.bitacora||{}).length,'registro','registros')+'.</p><div class="acciones"><button type="button" class="btn" data-a="imp-libreta">Traer su bitácora de equipos</button></div></div>';
  h+='<div class="bloque"><h2>Usar sin internet</h2>';
  if(inst)h+='<p>Estás usando la agenda instalada. Funciona sin conexión.</p>';
  else h+='<ol class="pasos"><li>Abre esta dirección en Chrome de la Boox, con internet.</li><li>Toca el menú ⋮ y elige <strong>Instalar app</strong> o <strong>Agregar a la pantalla principal</strong>.</li><li>Abre la agenda desde el ícono. Desde ahí funciona sin conexión.</li></ol><p class="ayuda">'+(swListo?'Esta página ya quedó guardada para usarse sin conexión.':'Preparando la versión sin conexión…')+'</p>';
  h+='</div></div></div></section>';
  return h;
}
function vImportPend(){
  var p=ui.importPend;if(!p)return '';var txt,btn;
  if(p.tipo==='agenda'){txt='Respaldo de la agenda'+(p.exportado?' del '+fLarga(isoLocal(p.exportado)):'')+': '+resumenGrupos(p.datos.grupos)+', '+pl(Object.keys(p.datos.disertaciones).length,'disertación','disertaciones')+' y '+pl(Object.keys(p.datos.equipos).length,'equipo','equipos')+' de la bitácora. Reemplaza toda la agenda actual.';btn='Sí, reemplazar todo';}
  else if(p.tipo==='asistencia'){txt='Desde '+p.origen+(p.exportado?' ('+fLarga(isoLocal(p.exportado))+')':'')+': '+resumenGrupos(p.grupos)+'.'+(S.grupos.length?(S.grupos.length===1?' Reemplaza el curso actual de la agenda;':' Reemplaza los '+S.grupos.length+' cursos actuales de la agenda;')+' las disertaciones, rúbricas y la bitácora no se tocan.':'');btn=S.grupos.length?'Sí, reemplazar mis cursos':'Traer estos datos';}
  else {txt='Libreta de Equipos y Pautas: '+pl(Object.keys(p.equipos).length,'equipo','equipos')+' y '+pl(Object.keys(p.bitacora).length,'registro','registros')+'. Se agregan a tu bitácora.';btn='Agregar a la bitácora';}
  return '<div class="confirmar" role="group" aria-label="Confirmar importación"><span>'+esc(txt)+'</span><button type="button" class="btn primary chico" data-a="imp-aplicar">'+btn+'</button><button type="button" class="btn chico" data-a="imp-cancelar">Cancelar</button></div>';
}

/* =================== Render =================== */
function render(){
  if(!S)return;
  var ae=document.activeElement,fid=null,s0=null,s1=null;
  if(ae&&ae.id&&$app.contains(ae)){fid=ae.id;try{s0=ae.selectionStart;s1=ae.selectionEnd;}catch(e){}}
  var cuerpo;
  switch(ui.tab){case 'asistencia':cuerpo=vAsistencia();break;case 'notas':cuerpo=vNotas();break;case 'clases':cuerpo=vClases();break;case 'disertaciones':cuerpo=vDisertaciones();break;case 'bitacora':cuerpo=vBitacora();break;case 'respaldo':cuerpo=vRespaldo();break;default:cuerpo=vHoy();}
  $app.innerHTML=vCab()+cuerpo;
  if(fid){var el=document.getElementById(fid);if(el){try{el.focus({preventScroll:true});}catch(e){el.focus();}try{if(s0!=null&&el.setSelectionRange)el.setSelectionRange(s0,s1);}catch(e){}}}
