/* MinePred — cadastro, inspeção de material rodante e pedidos demonstrativos.
   Dados mantidos apenas na memória desta aba/sessão até a implementação do backend. */
(function(){
 const $=id=>document.getElementById(id);
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fmtDate=s=>s?new Date(s+'T12:00:00').toLocaleDateString('pt-BR'):'—';
 const machines=[
  {id:'m1',code:'EX-04',name:'Escavadeira hidráulica',model:'SANY SY750H',serial:'DEMO-750-04',hours:6840},
  {id:'m2',code:'EX-02',name:'Escavadeira hidráulica',model:'SANY SY500H',serial:'DEMO-500-02',hours:5120},
  {id:'m3',code:'CL-01',name:'Carregadeira',model:'SANY SW956K',serial:'DEMO-956-01',hours:3910}
 ];
 const products=[
  {id:'p1',category:'FPS',pn:'FPS-120',description:'Dente de caçamba',newMeasure:120,discardMeasure:60,stock:8,monthlyUse:14,leadTime:21,safetyDays:7,machines:['m1']},
  {id:'p2',category:'MATERIAL_RODANTE',pn:'MR-ROLETE-01',description:'Rolete inferior',newMeasure:100,discardMeasure:82,stock:3,monthlyUse:2,leadTime:35,safetyDays:10,machines:['m1','m2']},
  {id:'p3',category:'MATERIAL_RODANTE',pn:'MR-RODA-02',description:'Roda motriz',newMeasure:32,discardMeasure:24,stock:1,monthlyUse:1,leadTime:40,safetyDays:10,machines:['m2']},
  {id:'p4',category:'FPS',pn:'ADP-44',description:'Adaptador de dente',newMeasure:100,discardMeasure:55,stock:12,monthlyUse:5,leadTime:21,safetyDays:7,machines:['m1','m2','m3']}
 ];
 let inspections=[
  {id:'i1',date:'2026-10-22',machineId:'m1',productId:'p1',hours:6840,current:88,life:47,wear:53,condition:'Desgaste irregular',notes:'Registro demonstrativo'},
  {id:'i2',date:'2026-10-21',machineId:'m2',productId:'p2',hours:5120,current:83,life:6,wear:94,condition:'Normal',notes:'Registro demonstrativo'}
 ];
 let orders=[];
 let activeCatalog='machines';
 let pendingOrder=null;
 function notifyLocal(message){if(typeof window.notify==='function')window.notify(message);else alert(message);}
 function machineName(id){const m=machines.find(x=>x.id===id);return m?m.code+' · '+m.model:m?.code||'—';}
 function productLabel(p){return p.pn+' · '+p.description;}
 function lifeCalc(p,current){if(!(p.newMeasure>p.discardMeasure)||current<0)return null;const life=Math.max(0,Math.min(100,(current-p.discardMeasure)/(p.newMeasure-p.discardMeasure)*100));return {life,wear:100-life};}
 function reorderPoint(p){const daily=(+p.monthlyUse||0)/30;return Math.ceil(daily*(+p.leadTime||0)+daily*(+p.safetyDays||0));}
 function recommendedQty(p){return Math.max(0,Math.ceil((+p.monthlyUse||0)*(Math.max(1,(+p.leadTime||0)+(+p.safetyDays||0))/30)+Math.ceil((+p.monthlyUse||0)/30*(+p.safetyDays||0))-(+p.stock||0)));}
 function setCatalogTab(name){activeCatalog=name;document.querySelectorAll('[data-catalog-tab]').forEach(b=>b.classList.toggle('active',b.dataset.catalogTab===name));document.querySelectorAll('.catalog-pane').forEach(p=>p.classList.toggle('active',p.id==='catalog-'+name));}
 document.querySelectorAll('[data-catalog-tab]').forEach(b=>b.addEventListener('click',()=>setCatalogTab(b.dataset.catalogTab)));
 function renderMachineOptions(){const options=machines.map(m=>'<option value="'+esc(m.id)+'">'+esc(machineName(m.id))+'</option>').join('');$('productMachines').innerHTML=options;$('ucMachine').innerHTML=options;}
 function renderCatalog(){
  renderMachineOptions();
  $('machineSummary').textContent=machines.length+' máquinas cadastradas';
  $('machinesTable').innerHTML=machines.map(m=>{const linked=products.filter(p=>p.machines.includes(m.id)).length;return '<tr><td><b>'+esc(m.code)+'</b><small>'+esc(m.name)+'</small></td><td>'+esc(m.model||'—')+'</td><td>'+Number(m.hours||0).toLocaleString('pt-BR')+' h</td><td>'+linked+'</td></tr>';}).join('');
  const q=($('productSearch').value||'').trim().toLowerCase();
  const filtered=products.filter(p=>(p.pn+' '+p.description+' '+p.category).toLowerCase().includes(q));
  $('productsTable').innerHTML=filtered.length?filtered.map(p=>'<tr><td><b>'+esc(p.pn)+'</b><small>'+esc(p.description)+'</small></td><td>'+esc(p.category==='MATERIAL_RODANTE'?'Material rodante':p.category)+'</td><td>'+p.newMeasure+' / '+p.discardMeasure+' mm</td><td>'+p.stock+' un.</td><td>'+p.machines.map(machineName).map(esc).join(', ')+'</td></tr>').join(''):'<tr><td colspan="5" class="empty">Nenhum produto encontrado.</td></tr>';
  $('orderCount').textContent=orders.length;
  $('ordersTable').innerHTML=orders.length?orders.map(o=>'<tr><td><b>'+esc(o.number)+'</b></td><td>'+fmtDate(o.date)+'</td><td><b>'+esc(o.pn)+'</b><small>'+esc(o.description)+'</small></td><td>'+esc(o.machine)+'</td><td>'+o.quantity+' un.</td><td>'+esc(o.reason)+'</td><td><span class="tag orange">Rascunho</span></td></tr>').join(''):'<tr><td colspan="7" class="empty">Nenhum pedido gerado nesta sessão.</td></tr>';
  renderUndercarriageHistory();
 }
 function renderUndercarriageHistory(){
  const rows=inspections.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||'')).slice(0,8);
  $('ucHistoryTable').innerHTML=rows.length?rows.map(i=>{const m=machines.find(x=>x.id===i.machineId),p=products.find(x=>x.id===i.productId);return '<tr><td>'+fmtDate(i.date)+'</td><td><b>'+esc(m?.code||'—')+'</b><small>'+esc(p?.pn||'—')+'</small></td><td>'+i.current+' mm</td><td><b>'+Math.round(i.life)+'%</b></td><td>'+Number(i.hours).toLocaleString('pt-BR')+' h</td></tr>';}).join(''):'<tr><td colspan="5" class="empty">Nenhuma inspeção cadastrada.</td></tr>';
 }
 function prepareUndercarriage(){
  renderMachineOptions();
  const machineId=$('ucMachine').value||machines[0]?.id;
  $('ucMachine').value=machineId||'';
  const currentProduct=$('ucProduct').value;
  const compatible=products.filter(p=>p.category==='MATERIAL_RODANTE'&&(!machineId||p.machines.includes(machineId)));
  const options=compatible.length?compatible:products.filter(p=>p.category==='MATERIAL_RODANTE');
  $('ucProduct').innerHTML=options.map(p=>'<option value="'+esc(p.id)+'">'+esc(productLabel(p))+'</option>').join('');
  if(options.some(p=>p.id===currentProduct))$('ucProduct').value=currentProduct;
  if(!$('ucDate').value)$('ucDate').value=new Date().toISOString().slice(0,10);
  updateUndercarriageCalc();
 }
 function updateUndercarriageCalc(){
  const p=products.find(x=>x.id===$('ucProduct').value);
  const m=machines.find(x=>x.id===$('ucMachine').value);
  if(!p){$('ucLife').textContent='—';$('ucWear').textContent='—';$('ucForecast').textContent='—';$('ucGenerateOrder').hidden=true;return;}
  const current=+$('ucCurrent').value;
  const calc=$('ucCurrent').value!==''?lifeCalc(p,current):null;
  const previous=inspections.filter(i=>i.machineId===m?.id&&i.productId===p.id).sort((a,b)=>b.hours-a.hours)[0];
  let forecast='Sem histórico suficiente';
  if(calc&&previous&&+$('ucHours').value>previous.hours&&previous.current>current){
   const rate=(previous.current-current)/(+$('ucHours').value-previous.hours);
   if(rate>0)forecast=Math.ceil(Math.max(0,(current-p.discardMeasure)/rate)).toLocaleString('pt-BR')+' h de operação';
  }
  $('ucLife').textContent=calc?Math.round(calc.life)+'%':'—';
  $('ucWear').textContent=calc?Math.round(calc.wear)+'%':'—';
  $('ucForecast').textContent=calc?forecast:'—';
  const point=reorderPoint(p),critical=!!calc&&(calc.life<=10||/trinca|solto/i.test($('ucCondition').value));
  const stockLow=p.stock<=point;
  $('ucStock').textContent=p.stock+' un.';
  $('ucReorder').textContent=point+' un.';
  $('ucLead').textContent=p.leadTime+' dias';
  $('ucStockAdvice').textContent=stockLow?'Estoque no ponto de pedido ou abaixo dele. Reposição precisa ser avaliada.':'Estoque acima do ponto de pedido estimado.';
  $('ucAlert').hidden=!(critical||stockLow);
  $('ucAlert').innerHTML=critical?'<b>Componente crítico.</b> A vida útil estimada está em nível crítico ou foi indicada uma condição visual de risco. Avalie a troca conforme procedimento técnico.':stockLow?'<b>Reposição recomendada.</b> O estoque atingiu o ponto de pedido calculado pelo consumo e prazo de fornecimento.':'';
  $('ucGenerateOrder').hidden=!(critical||stockLow);
  $('ucOrderReason').textContent=critical?'Pedido habilitado por criticidade da inspeção.':stockLow?'Pedido habilitado por ponto de reposição do estoque.':'O pedido será habilitado quando a inspeção indicar criticidade ou o estoque atingir o ponto de pedido.';
  pendingOrder=(critical||stockLow)?{productId:p.id,machineId:m?.id,reason:critical?'Inspeção crítica':'Ponto de pedido de estoque'}:null;
 }
 $('machineForm').addEventListener('submit',e=>{
  e.preventDefault();const code=$('machineCode').value.trim().toUpperCase();
  if(machines.some(m=>m.code.toLowerCase()===code.toLowerCase())){notifyLocal('Já existe uma máquina com esse código.');return;}
  machines.push({id:'m'+Date.now(),code,name:$('machineName').value.trim(),model:$('machineModel').value.trim(),serial:$('machineSerial').value.trim(),hours:+$('machineHours').value||0});
  $('machineForm').reset();renderCatalog();notifyLocal('Máquina cadastrada nesta sessão.');
 });
 $('productForm').addEventListener('submit',e=>{
  e.preventDefault();const pn=$('productPN').value.trim().toUpperCase(),newMeasure=+$('productNewMeasure').value,discardMeasure=+$('productDiscardMeasure').value;
  if(products.some(p=>p.pn.toLowerCase()===pn.toLowerCase())){notifyLocal('Já existe um produto com esse PN.');return;}
  if(newMeasure<=discardMeasure){notifyLocal('A medida nova deve ser maior que o limite de descarte.');return;}
  products.push({id:'p'+Date.now(),category:$('productCategory').value,pn,description:$('productDescription').value.trim(),newMeasure,discardMeasure,stock:+$('productStock').value||0,monthlyUse:+$('productMonthlyUse').value||0,leadTime:+$('productLeadTime').value||0,safetyDays:+$('productSafetyDays').value||0,machines:Array.from($('productMachines').selectedOptions).map(o=>o.value)});
  $('productForm').reset();$('productStock').value='0';$('productMonthlyUse').value='0';$('productLeadTime').value='30';$('productSafetyDays').value='7';renderCatalog();notifyLocal('Produto cadastrado nesta sessão.');
 });
 $('productSearch').addEventListener('input',renderCatalog);
 $('ucMachine').addEventListener('change',prepareUndercarriage);
 ['ucProduct','ucCurrent','ucHours','ucCondition'].forEach(id=>$(id).addEventListener('input',updateUndercarriageCalc));
 $('ucProduct').addEventListener('change',updateUndercarriageCalc);
 $('ucCurrent').addEventListener('input',updateUndercarriageCalc);
 $('undercarriageForm').addEventListener('submit',e=>{
  e.preventDefault();const p=products.find(x=>x.id===$('ucProduct').value),m=machines.find(x=>x.id===$('ucMachine').value),current=+$('ucCurrent').value,hours=+$('ucHours').value;
  if(!p||!m)return;const calc=lifeCalc(p,current);if(!calc){notifyLocal('Confira as medidas cadastradas do componente.');return;}
  if(inspections.some(i=>i.machineId===m.id&&i.productId===p.id&&hours<i.hours)){notifyLocal('O horímetro informado é menor que o de uma inspeção anterior. Confira o valor.');return;}
  inspections.unshift({id:'i'+Date.now(),date:$('ucDate').value,machineId:m.id,productId:p.id,hours,current,life:calc.life,wear:calc.wear,condition:$('ucCondition').value,notes:$('ucNotes').value});
  m.hours=Math.max(m.hours,hours);updateUndercarriageCalc();renderUndercarriageHistory();notifyLocal('Inspeção salva no histórico desta sessão.');
 });
 $('ucGenerateOrder').addEventListener('click',()=>{
  if(!pendingOrder)return;const p=products.find(x=>x.id===pendingOrder.productId);if(!p)return;
  const qty=recommendedQty(p);
  orders.unshift({number:'PC-'+String(Date.now()).slice(-6),date:new Date().toISOString().slice(0,10),productId:p.id,pn:p.pn,description:p.description,machine:machineName(pendingOrder.machineId),quantity:Math.max(1,qty),reason:pendingOrder.reason});
  setCatalogTab('orders');renderCatalog();notifyLocal('Pedido criado como rascunho nesta sessão. Revise antes de enviar ao setor de compras.');
 });
 window.renderCatalog=renderCatalog;window.prepareUndercarriage=prepareUndercarriage;
 renderCatalog();prepareUndercarriage();
})();