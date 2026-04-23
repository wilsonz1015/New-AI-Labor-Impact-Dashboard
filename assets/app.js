(function(){
  if (!window.DASHBOARD_DATA) {
    console.error('Missing dashboard data. Make sure data/dashboard-data.js is loaded before assets/app.js.');
    return;
  }

  var OCC = window.DASHBOARD_DATA.OCC || [];
  var TSK = window.DASHBOARD_DATA.TSK || {};
  var LS = window.DASHBOARD_DATA.LS || [];
  var SOCM = window.DASHBOARD_DATA.SOCM || {};

var LSM={};for(var lsi=0;lsi<LS.length;lsi++)LSM[LS[lsi].id]=LS[lsi];

var SL={ch:"Chat"};
var CL={B:"Augmentation",R:"Displacement",N:"Neutral"};
var src="ch",srt="aug",cat="all",qry="",dsrc="ch",curId="",tSort="sc",tSortDir=-1;
var mSort="s",mSortDir=-1;
var lsQry="",lsSort="c",lsSortDir=-1,lsCurId="",sumHoverId="";
var LSGL={all:"All",detailed:"Detailed",broad:"Broad",minor:"Minor",major:"Major",total:"Total"};

function pct(v){return(v*100).toFixed(1)+"%"}
function cls(v){return v>0?"p":v<0?"n":"z"}
function f2(v){return v.toFixed(2)}
function esc(s){return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}
function fql(a){if(a<=0)return"N/A";if(a<=2)return"Yearly";if(a<=6)return"Quarterly";if(a<=18)return"Monthly";if(a<=40)return"Twice/mo";if(a<=80)return"Weekly";if(a<=180)return"Few/wk";if(a<=350)return"Daily";if(a<=600)return"Multi/day";if(a<=900)return"Several/day";return"Hourly+"}
function tip(label,desc){return'<span class="tip-wrap">'+label+'<span class="tip-box">'+desc+'</span></span>'}
function tipDown(label,desc){return'<span class="tip-wrap tip-down">'+label+'<span class="tip-box">'+desc+'</span></span>'}
function nil(v){return v===null||v===undefined||v===""}
function fmtNum(v,d){if(nil(v))return"—";if(typeof v==="number")return v.toLocaleString(undefined,{minimumFractionDigits:d,maximumFractionDigits:d});return esc(String(v))}
function fmtScore(v){return nil(v)?"—":fmtNum(v,2)}
function fmtPct2(v){if(nil(v))return"—";if(typeof v==="number")return(v*100).toFixed(2)+"%";return esc(String(v))}
function fmtMoney0(v){if(nil(v))return"—";if(typeof v==="number")return"$"+Math.round(v).toLocaleString();return esc(String(v))}
function fmtInt(v){if(nil(v))return"—";if(typeof v==="number")return Math.round(v).toLocaleString();return esc(String(v))}
function fmtK(v){if(nil(v))return"—";if(typeof v==="number")return v.toLocaleString(undefined,{minimumFractionDigits:1,maximumFractionDigits:1});return esc(String(v))}
function grpBadge(g){return'<span class="grp-badge">'+(LSGL[g]||esc(String(g)))+'</span>'}
function pctArrow(v){return nil(v)?"":(v>0?" ↑":v<0?" ↓":"")}
function scoreHue(v){if(nil(v))return 0;var t=Math.max(0,Math.min(1,(Number(v)-1)/4));return Math.round(t*120)}
function scoreChip(v,lg){if(nil(v))return '<span class="score-chip na'+(lg?' lg':'')+'">—</span>';var h=scoreHue(v),bg='hsla('+h+',78%,55%,.12)',bd='hsla('+h+',78%,55%,.34)',tx='hsl('+h+',78%,64%)';return '<span class="score-chip'+(lg?' lg':'')+'" style="background:'+bg+';border-color:'+bd+';color:'+tx+'">'+fmtNum(v,2)+'</span>'}
function trimLabel(s,m){return !s?"":(s.length>m?s.slice(0,m-1)+'…':s)}
function baseSoc(id){return String(id).split('.')[0]}
function lsForOcc(id){return LSM[baseSoc(id)]||null}
function upperBound(arr,val){var lo=0,hi=arr.length;while(lo<hi){var mid=(lo+hi)>>1;if(arr[mid]<=val)lo=mid+1;else hi=mid}return lo}
function pctRankSorted(arr,val){if(!arr.length)return .5;if(arr.length===1)return 1;var idx=Math.max(0,upperBound(arr,val)-1);return idx/(arr.length-1)}
function fmtSigned2(v){if(nil(v))return '—';return (v>0?'+':'')+f2(v)}


function tObj(t,sk){
  var o={tk:t[0],im:t[1],rl:t[2],fa:t[3],fw:t[4],hu:t[5],ai:t[6]};
  if(t[6]===1){var a=t[7];
    o.e=a[0];o.au=a[1];o.ag=a[2];o.sc=a[3];o.d=a[4];o.fb=a[5];o.ti=a[6];o.v=a[7];o.l=a[8];o.u=a[9];
  }else{o.e=0;o.au=0;o.ag=0;o.sc=0;o.d=0;o.fb=0;o.ti=0;o.v=0;o.l=0;o.u=0;}
  return o
}

function stats(){
  var b=0,r=0,n=0;
  for(var i=0;i<OCC.length;i++){var c=OCC[i][src].ct;if(c==="B")b++;else if(c==="R")r++;else n++}
  document.getElementById("sts").innerHTML='<div class="st"><div class="d g"></div><b>'+b+'</b><span>Augmented</span></div><div class="st"><div class="d r"></div><b>'+r+'</b><span>At Risk</span></div><div class="st"><div class="d y"></div><b>'+n+'</b><span>Neutral</span></div><div class="st" style="margin-left:auto"><span>Mode:</span> <b>Chat only</b></div>'
}

/* Main table columns config */
var mainCols=[
  {k:"n",  l:"Occupation",      t:"O*NET occupation title. Click any row for detailed task breakdown.",s:"min-width:240px"},
  {k:"s",  l:"Score",           t:"Frequency-weighted average of task scores. Positive = net augmentation, negative = displacement risk."},
  {k:"ct", l:"Category",        t:"Augmented (positive score), At Risk (negative), or Neutral (zero/below threshold)."},
  {k:"ai", l:"AI Tasks",        t:"Tasks with a non-zero displayed AI score / total O*NET tasks."},
  {k:"cv", l:"Coverage",        t:"% of occupation tasks with a non-zero displayed AI score."},
  {k:"au", l:"Avg Automation",  t:"Mean automation share (Directive + Feedback Loop) across tasks with a non-zero displayed AI score."},
  {k:"ag", l:"Avg Augmentation",t:"Mean augmentation share (Task Iteration + Validation + Learning) across tasks with a non-zero displayed AI score."}
];

function renderMainTh(){
  var h="";
  for(var i=0;i<mainCols.length;i++){
    var c=mainCols[i];
    var isSorted=c.k===mSort;
    var arrow=isSorted?(mSortDir===1?" &#9650;":" &#9660;"):" &#8597;";
    h+='<th'+(c.s?' style="'+c.s+'"':'')+' class="'+(isSorted?"sorted":"")+'" onclick="msort(\''+c.k+'\')">';
    h+=tipDown(c.l+'<span class="sa">'+arrow+'</span>',c.t);
    h+='</th>';
  }
  document.getElementById("mainTh").querySelector("tr").innerHTML=h;
}

window.msort=function(col){
  if(mSort===col){mSortDir*=-1}else{mSort=col;mSortDir=(col==="n")?1:-1}
  srt="custom";
  var ps=document.querySelectorAll("#srtP .pl");for(var i=0;i<ps.length;i++)ps[i].classList.remove("on");
  render();
renderLS();
};

function render(){
  renderMainTh();
  var list=OCC.slice();
  if(qry){var q=qry.toLowerCase();list=list.filter(function(o){return o.n.toLowerCase().indexOf(q)>=0||o.id.toLowerCase().indexOf(q)>=0})}
  if(cat!=="all")list=list.filter(function(o){return o[src].ct===cat});
  if(srt==="aug"){list.sort(function(a,b){return b[src].s-a[src].s})}
  else if(srt==="risk"){list.sort(function(a,b){return a[src].s-b[src].s})}
  else if(srt==="az"){list.sort(function(a,b){return a.n.localeCompare(b.n)})}
  else{
    var sk=mSort,dir=mSortDir;
    list.sort(function(a,b){
      var va,vb;
      if(sk==="n"){va=a.n.toLowerCase();vb=b.n.toLowerCase();return dir*(va<vb?-1:va>vb?1:0)}
      else if(sk==="ct"){va=a[src].ct;vb=b[src].ct;return dir*(va<vb?-1:va>vb?1:0)}
      else if(sk==="ai"){va=a[src].ai;vb=b[src].ai;return dir*(va-vb)}
      else{va=a[src][sk];vb=b[src][sk];return dir*(va-vb)}
    });
  }
  document.getElementById("cnt").textContent=list.length+" occupations";
  var h="";
  for(var i=0;i<list.length;i++){var o=list[i],d=o[src];
    h+='<tr data-id="'+o.id+'"><td class="tn">'+esc(o.n)+'</td><td class="m '+cls(d.s)+'">'+f2(d.s)+'</td><td><span class="bg '+d.ct+'">'+CL[d.ct]+'</span></td><td class="m">'+d.ai+' <span style="color:var(--t4)">/</span> '+o.t+'</td><td class="m">'+pct(d.cv)+'</td><td class="m n">'+pct(d.au)+'</td><td class="m p">'+pct(d.ag)+'</td></tr>'}
  document.getElementById("tb").innerHTML=h;stats()
}

/* Detail panel */
function sortTasks(tasks,sk,col,dir){
  var parsed=[];for(var i=0;i<tasks.length;i++)parsed.push(tObj(tasks[i],sk,occId));
  parsed.sort(function(a,b){var va,vb;
    if(col==="tk"){va=a.tk.toLowerCase();vb=b.tk.toLowerCase();return dir*(va<vb?-1:va>vb?1:0)}
    va=a[col];vb=b[col];return dir*(va-vb)});
  return parsed
}

function buildTaskTable(id,sk,sortCol,sortDir){
  var raw=TSK[id]||[];
  if(!raw.length)return'<div class="sct" style="color:var(--t4);margin-top:12px">No task data.</div>';
  var tasks=sortTasks(raw,sk,sortCol,sortDir,id);
  var aiCount=0,scoreEligibleCount=0;for(var i=0;i<tasks.length;i++){if(tasks[i].ai)aiCount++;if(isScoreEligibleAiTask(tasks[i]))scoreEligibleCount++;}
  var h='<div class="sct">All Tasks ('+tasks.length+' total, '+scoreEligibleCount+' score-eligible AI tasks, '+aiCount+' with any AI data)</div>';
  h+='<div class="scs">Interaction values show % of total interactions per task. Freq Wt% = share of this occupation\'s total frequency weight. Click column headers to sort.</div>';
  h+='<div style="background:var(--s1);border:1px solid var(--b1);border-radius:var(--r);padding:10px 14px;margin-bottom:14px;font-size:.76rem;color:var(--t3);line-height:1.5"><span style="color:var(--amb);font-weight:600">[human]</span> = Task requires physical presence or face-to-face interaction (e.g. examining patients, classroom teaching, operating machinery). These tasks are excluded from AI scoring even if Claude interaction data exists, because the task itself cannot be performed by AI.</div>';
  h+='<div style="overflow-x:auto;border:1px solid var(--b1);border-radius:var(--r)"><table class="tt"><thead>';
  h+='<tr><th colspan="5" style="border-right:1px solid var(--b2)">Task Details</th>';
  h+='<th colspan="2" style="border-right:1px solid var(--b2)">Scores</th>';
  h+='<th colspan="3" class="cg-auto" style="border-right:1px solid var(--b2);text-align:center">Automation (Dir + FB)</th>';
  h+='<th colspan="3" class="cg-aug" style="border-right:1px solid var(--b2);text-align:center">Augmentation (TI + Val + Lrn)</th>';
  h+='<th>Other</th></tr><tr>';
  var cols=[
    ["tk","Task","O*NET task description.",""],
    ["im","Imp","Importance (1-5).",""],
    ["rl","Rel","Relevance (0-100).",""],
    ["fa","Freq","How often performed.",""],
    ["fw","FW%","Share of occupation frequency weight.|border-right:1px solid var(--b2)"],
    ["sc","Score","Task score for chat data.|"],
    ["au","A/A%","Visual: red=automation, green=augmentation.|border-right:1px solid var(--b2)"],
    ["d","Dir%","Directive %. Automation.|cg-auto"],
    ["fb","FB%","Feedback Loop %. Automation.|cg-auto"],
    ["au","Tot%","Total automation (Dir+FB).|cg-auto|border-right:1px solid var(--b2)"],
    ["ti","TI%","Task Iteration %. Augmentation.|cg-aug"],
    ["v","Val%","Validation %. Augmentation.|cg-aug"],
    ["l","Lrn%","Learning %. Augmentation.|cg-aug|border-right:1px solid var(--b2)"],
    ["u","Unc%","Unclassified %."]
  ];
  for(var i=0;i<cols.length;i++){
    var c=cols[i],parts=c[2].split("|"),desc=parts[0],extra="",cls2="";
    for(var p=1;p<parts.length;p++){if(parts[p].indexOf("cg-")===0)cls2=" "+parts[p];else extra+=parts[p]+";"}
    var isSorted=c[0]===sortCol;
    var arrow=isSorted?(sortDir===1?" &#9650;":" &#9660;"):" &#8597;";
    h+='<th class="'+(isSorted?"sorted":"")+cls2+'" style="cursor:pointer;'+(extra||"")+'" onclick="tsort(\''+c[0]+'\')">';
    h+=tip(c[1]+'<span class="sa">'+arrow+'</span>',desc);
    h+='</th>'
  }
  h+='</tr></thead><tbody>';
  for(var j=0;j<tasks.length;j++){
    var t=tasks[j],isAI=t.ai===1,rc=isAI?"":"no-ai-row",hfl=t.hu?'<span class="hf">[human]</span>':'';
    h+='<tr class="'+rc+'"><td class="tx">'+esc(t.tk)+hfl+'</td>';
    h+='<td class="m">'+t.im+'</td><td class="m">'+t.rl+'</td>';
    h+='<td class="fl">'+fql(t.fa)+'</td>';
    h+='<td class="m" style="border-right:1px solid var(--b2)">'+t.fw+'%</td>';
    if(isAI){
      h+='<td class="m '+cls(t.sc)+'">'+t.sc.toFixed(1)+'</td>';
      h+='<td style="border-right:1px solid var(--b2)"><div style="display:flex;height:7px;border-radius:4px;overflow:hidden;min-width:50px"><div style="width:'+pct(t.au)+';background:var(--red)"></div><div style="width:'+pct(t.ag)+';background:var(--grn)"></div></div></td>';
      h+='<td class="m n">'+t.d+'%</td><td class="m n">'+t.fb+'%</td>';
      h+='<td class="m n" style="border-right:1px solid var(--b2);font-weight:600">'+pct(t.au)+'</td>';
      h+='<td class="m p">'+t.ti+'%</td><td class="m p">'+t.v+'%</td>';
      h+='<td class="m p" style="border-right:1px solid var(--b2)">'+t.l+'%</td>';
      h+='<td class="m z">'+t.u+'%</td>'
    }else{h+='<td class="m z" colspan="9" style="text-align:center;font-style:italic">No AI interaction data</td>'}
    h+='</tr>'
  }
  h+='</tbody></table></div>';return h
}

function buildDetail(id){
  var o=null;for(var i=0;i<OCC.length;i++){if(OCC[i].id===id){o=OCC[i];break}}
  if(!o)return"";curId=id;
  var s=dsrc,d=o[s];
  var h='<button class="x" id="xb">&times;</button>';
  h+='<div class="dt">'+esc(o.n)+'</div>';
  h+='<div class="dc">'+o.id+' &middot; '+o.t+' total tasks</div>';
  h+='<div class="dw"><span>Data source:</span><span class="grp-badge">Chat only</span></div>';
  h+='<div class="sc-row">';
  h+='<div class="sc-box"><div class="lb">Score ('+SL[s]+')</div><div class="vl '+cls(d.s)+'">'+f2(d.s)+'</div><div class="mt"><span class="bg '+d.ct+'" style="font-size:.6rem;padding:1px 7px">'+CL[d.ct]+'</span></div></div>';
  var detailTasks=sortTasks(TSK[id]||[],s,tSort,tSortDir,id),eligibleAiCount=0;
    for(var k=0;k<detailTasks.length;k++){if(isScoreEligibleAiTask(detailTasks[k]))eligibleAiCount++}
    var eligibleCoverage=o.t?eligibleAiCount/o.t:0;
    h+='<div class="sc-box"><div class="lb">AI Coverage</div><div class="vl" style="font-size:1.4rem">'+eligibleAiCount+' <span style="font-size:.9rem;color:var(--t3)">/ '+o.t+'</span></div><div class="mt">'+pct(eligibleCoverage)+' coverage</div></div>';
  h+='<div class="sc-box"><div class="lb">Automation vs Augmentation</div><div style="margin-top:8px"><div class="br"><div class="bl">Auto</div><div class="bt"><div class="bfa" style="width:'+pct(d.au)+'"></div></div><div class="bv n">'+pct(d.au)+'</div></div><div class="br"><div class="bl">Aug</div><div class="bt"><div class="bfg" style="width:'+pct(d.ag)+'"></div></div><div class="bv p">'+pct(d.ag)+'</div></div></div></div>';
  h+='</div>';
  h+='<div id="ta">'+buildTaskTable(id,dsrc,tSort,tSortDir)+'</div>';
  h+='<div class="contact-note pnl-contact-note"><strong>Questions?</strong> Please direct any questions to Wilson Zhang at <a href="mailto:wilson.z1015@gmail.com" style="color:var(--blue);text-decoration:none">wilson.z1015@gmail.com</a>.</div>';
  return h
}

function detail(id){dsrc=src;tSort="sc";tSortDir=-1;document.getElementById("pnl").innerHTML=buildDetail(id);document.getElementById("ov").classList.add("open");document.body.style.overflow="hidden";document.getElementById("xb").onclick=cld}
window.ssrc=function(ns){dsrc="ch";tSort="sc";tSortDir=-1;document.getElementById("pnl").innerHTML=buildDetail(curId);document.getElementById("xb").onclick=cld};
window.tsort=function(col){if(tSort===col){tSortDir*=-1}else{tSort=col;tSortDir=-1}document.getElementById("ta").innerHTML=buildTaskTable(curId,dsrc,tSort,tSortDir)};
function cld(){document.getElementById("ov").classList.remove("open");document.body.style.overflow=""}


var lsCols=[
  {k:"n",l:"Occupation",t:"BLS/SOC occupation title. Click any row for score and history details.",s:"min-width:320px"},
  {k:"c",l:"Composite",t:"Equal-weight average of projected employment, wage, and actual employment scores when all three are available."},
  {k:"ps",l:"Proj Emp Score",t:"1–5 score derived from the occupation’s 2024–2034 projected employment CAGR percentile rank."},
  {k:"ws",l:"Wage Score",t:"1–5 score derived from the occupation’s actual wage CAGR percentile rank."},
  {k:"es",l:"Act Emp Score",t:"1–5 score derived from the occupation’s actual employment CAGR percentile rank."},
  {k:"g",l:"Group",t:"SOC aggregation level from the workbook: detailed, broad, minor, major, or total."}
];

function lsCompare(a,b,key,dir){
  var va=a[key],vb=b[key],an=nil(va),bn=nil(vb);
  if(key==="n"||key==="g"){
    if(an&&bn)return 0;if(an)return 1;if(bn)return -1;
    va=String(va).toLowerCase();vb=String(vb).toLowerCase();
    return dir*(va<vb?-1:va>vb?1:0);
  }
  if(an&&bn)return 0;
  if(an)return 1;
  if(bn)return -1;
  return dir*(va-vb);
}

function renderLsTh(){
  var h="";
  for(var i=0;i<lsCols.length;i++){
    var c=lsCols[i],isSorted=c.k===lsSort;
    var arrow=isSorted?(lsSortDir===1?" &#9650;":" &#9660;"):" &#8597;";
    h+='<th'+(c.s?' style="'+c.s+'"':'')+' class="'+(isSorted?"sorted":"")+'" onclick="lssort(\''+c.k+'\')">';
    h+=tipDown(c.l+'<span class="sa">'+arrow+'</span>',c.t);
    h+='</th>';
  }
  document.getElementById("lsTh").querySelector("tr").innerHTML=h;
}

function renderLS(){
  renderLsTh();
  var list=LS.slice();
  if(lsQry){
    var q=lsQry.toLowerCase();
    list=list.filter(function(o){return o.n.toLowerCase().indexOf(q)>=0||o.id.toLowerCase().indexOf(q)>=0});
  }
  list.sort(function(a,b){return lsCompare(a,b,lsSort,lsSortDir)});
  document.getElementById("lsCnt").textContent=list.length.toLocaleString()+" occupations";
  var h="";
  for(var j=0;j<list.length;j++){
    var o=list[j];
    h+='<tr data-id="'+o.id+'">';
    h+='<td><div class="tn">'+esc(o.n)+'</div></td>';
    h+='<td>'+scoreChip(o.c)+'</td>';
    h+='<td>'+scoreChip(o.ps)+'</td>';
    h+='<td>'+scoreChip(o.ws)+'</td>';
    h+='<td>'+scoreChip(o.es)+'</td>';
    h+='<td>'+grpBadge(o.g)+'</td>';
    h+='</tr>';
  }
  document.getElementById("lsTb").innerHTML=h;
}

function lsMetricRow(label,val){return '<div class="k">'+label+'</div><div class="v">'+val+'</div>'}

function buildLSDetail(id){
  var o=LSM[id];
  if(!o)return"";
  lsCurId=id;
  var h='<button class="x" id="xb">&times;</button>';
  h+='<div class="dt">'+esc(o.n)+'</div>';
  h+='<div class="dc">'+o.id+' &middot; '+(LSGL[o.g]||o.g)+'</div>';
  h+='<div class="sc-row">';
  h+='<div class="sc-box"><div class="lb">Composite Score</div><div class="vl">'+scoreChip(o.c,true)+'</div><div class="mt">Equal-weight average of available pillars</div></div>';
  h+='<div class="sc-box"><div class="lb">Projected Employment Score</div><div class="vl">'+scoreChip(o.ps,true)+'</div><div class="mt">From 2024–2034 projected employment CAGR</div></div>';
  h+='<div class="sc-box"><div class="lb">Wage Score</div><div class="vl">'+scoreChip(o.ws,true)+'</div><div class="mt">From actual wage CAGR</div></div>';
  h+='<div class="sc-box"><div class="lb">Actual Employment Score</div><div class="vl">'+scoreChip(o.es,true)+'</div><div class="mt">From actual employment CAGR</div></div>';
  h+='</div>';
  h+='<div class="sc-row">';
  h+='<div class="sc-box"><div class="lb">Projected Employment CAGR</div><div class="vl '+cls(nil(o.pc)?0:o.pc)+'">'+fmtPct2(o.pc)+'</div><div class="mt">2024–2034 BLS projection</div></div>';
  h+='<div class="sc-box"><div class="lb">Wage CAGR Used</div><div class="vl '+cls(nil(o.wc)?0:o.wc)+'">'+fmtPct2(o.wc)+'</div><div class="mt">Window: '+(o.wb?o.wb.replace(/-/g,'–'):'N/A')+'</div></div>';
  h+='<div class="sc-box"><div class="lb">Actual Employment CAGR Used</div><div class="vl '+cls(nil(o.ec)?0:o.ec)+'">'+fmtPct2(o.ec)+'</div><div class="mt">Window: '+(o.eb?o.eb.replace(/-/g,'–'):'N/A')+'</div></div>';
  h+='<div class="sc-box"><div class="lb">Score Coverage</div><div class="vl" style="font-size:1.05rem;line-height:1.45;font-family:inherit">'+grpBadge(o.g)+'</div><div class="mt">Workbook SOC level for this row</div></div>';
  h+='</div>';
  if(nil(o.ps))h+='<div class="inline-note">Projected employment fields are blank for this occupation code in the workbook’s projection match, so the projected employment score and composite score are also blank.</div>';
  h+='<div class="sct">Actual Wage and Employment History</div>';
  h+='<div class="scs">These are the 2019–2024 values carried into the dashboard from the workbook. The wage score uses the annual wage series; the actual employment score uses the employment series.</div>';
  h+='<div style="overflow-x:auto;border:1px solid var(--b1);border-radius:var(--r);margin-bottom:16px"><table class="tt"><thead><tr><th>Year</th><th>Mean Annual Wage</th><th>Employment</th></tr></thead><tbody>';
  for(var yr=2019;yr<=2024;yr++){
    var idx=yr-2019;
    h+='<tr><td class="m">'+yr+'</td><td class="m">'+fmtMoney0(o.wa[idx])+'</td><td class="m">'+fmtInt(o.em[idx])+'</td></tr>';
  }
  h+='</tbody></table></div>';
  h+='<div class="sct">Projected Employment CAGR</div>';
  h+='<div class="scs">This drill-down now shows only the projected employment CAGR from the workbook’s BLS Employment Projections source.</div>';
  h+='<div class="kv">';
  h+=lsMetricRow('Projected employment CAGR, 2024–2034',fmtPct2(o.pc));
  h+='</div>';
  h+='<div class="inline-note">The workbook keeps only the fields needed here. Any special BLS markers in the history series (for example, <span class="m">*</span> or <span class="m">**</span>) are carried through unchanged rather than inferred.</div>';
  h+='<div class="contact-note pnl-contact-note"><strong>Questions?</strong> Please direct any questions to Wilson Zhang at <a href="mailto:wilson.z1015@gmail.com" style="color:var(--blue);text-decoration:none">wilson.z1015@gmail.com</a>.</div>';
  return h;
}

function lsDetail(id){document.getElementById("pnl").innerHTML=buildLSDetail(id);document.getElementById("ov").classList.add("open");document.body.style.overflow="hidden";document.getElementById("xb").onclick=cld}
window.lssort=function(col){if(lsSort===col){lsSortDir*=-1}else{lsSort=col;lsSortDir=(col==="n"||col==="g")?1:-1}renderLS()};

function syncSourceButtons(){
  var groups=["srcP","sumSrcP"];
  for(var gi=0;gi<groups.length;gi++){
    var el=document.getElementById(groups[gi]);
    if(!el)continue;
    var bs=el.querySelectorAll('.pl');
    for(var bi=0;bi<bs.length;bi++)bs[bi].classList.toggle('on',bs[bi].getAttribute('data-s')===src);
  }
}

function setSource(ns){src="ch";syncSourceButtons();render();renderSummary()}

function buildSummaryData(){
  var pts=[];
  for(var i=0;i<OCC.length;i++){
    var o=OCC[i],l=lsForOcc(o.id);
    if(!l||nil(l.c))continue;
    var d=o[src];
    if(!d||nil(d.s))continue;
    pts.push({id:o.id,n:o.n,base:baseSoc(o.id),x:d.s,y:l.c,auto:d.au,aug:d.ag,cat:d.ct,lab:l});
  }
  var xs=[],ys=[];
  for(var j=0;j<pts.length;j++){xs.push(pts[j].x);ys.push(pts[j].y)}
  xs.sort(function(a,b){return a-b});
  ys.sort(function(a,b){return a-b});
  for(var k=0;k<pts.length;k++){
    pts[k].xp=pctRankSorted(xs,pts[k].x);
    pts[k].yp=pctRankSorted(ys,pts[k].y);
    pts[k].benefit=pts[k].x>0?(pts[k].xp+pts[k].yp):-999;
    pts[k].suffer=pts[k].x<0?((1-pts[k].xp)+(1-pts[k].yp)):-999;
  }
  var benefit=pts.filter(function(p){return p.x>0}).slice().sort(function(a,b){return b.benefit-a.benefit||b.x-a.x||b.y-a.y}).slice(0,20);
  var suffer=pts.filter(function(p){return p.x<0}).slice().sort(function(a,b){return b.suffer-a.suffer||a.x-b.x||a.y-b.y}).slice(0,20);
  var marks={};
  for(var bi=0;bi<benefit.length;bi++)marks[benefit[bi].id]={kind:'benefit',rank:bi+1};
  for(var si=0;si<suffer.length;si++)marks[suffer[si].id]={kind:'suffer',rank:si+1};
  return {points:pts,benefit:benefit,suffer:suffer,marks:marks};
}

function makeSummaryList(arr,kind){
  function headCell(label,tip,extraCls){
    return '<div class="cell'+(extraCls?' '+extraCls:'')+'" title="'+esc(tip)+'"><span class="tip-label">'+esc(label)+'</span></div>';
  }
  var sumTip=kind==='benefit'
    ? 'AI percentile plus labor shortage percentile. Higher values indicate occupations that rank more strongly on both AI upside and labor shortage pressure.'
    : 'AI percentile plus labor shortage percentile. Lower values indicate occupations with more downside exposure; this table is ordered from the lowest combined percentiles upward.';
  var h='<div class="sum-list-head">'+
    headCell('#','Rank within this top-20 list.')+
    headCell('Occupation','Occupation title from O*NET.')+
    headCell('AI augmentation vs. automation score','Net AI score for the occupation. Positive values suggest more augmentation upside; negative values suggest more automation exposure.','num')+
    headCell('AI percentile','Percentile rank of the occupation\'s AI augmentation vs. automation score across plotted occupations.','num')+
    headCell('Labor shortage score','Composite labor shortage score for the occupation. Higher values indicate tighter labor market pressure.','num')+
    headCell('Labor percentile','Percentile rank of the occupation\'s labor shortage score across plotted occupations.','num')+
    headCell('Sum of percentiles',sumTip,'num')+
  '</div>';
  for(var i=0;i<arr.length;i++){
    var p=arr[i],sumVal=p.xp+p.yp,sumCls=kind==='benefit'?'p':'n',aiCls=p.x>0?'p':p.x<0?'n':'z';
    h+='<div class="sum-item" data-id="'+p.id+'">'+
      '<div class="cell rk">'+(i+1)+'</div>'+
      '<div class="cell nm">'+esc(p.n)+'</div>'+
      '<div class="cell num m '+aiCls+'">'+fmtSigned2(p.x)+'</div>'+
      '<div class="cell num m pctv">'+pct(p.xp)+'</div>'+
      '<div class="cell num">'+scoreChip(p.y)+'</div>'+
      '<div class="cell num m pctv">'+pct(p.yp)+'</div>'+
      '<div class="cell num m sumv '+sumCls+'">'+f2(sumVal)+'</div>'+
    '</div>';
  }
  return h;
}

function showSumTip(ev,p){
  var tip=document.getElementById('sumTip'),card=document.getElementById('quadCard');
  if(!tip||!card)return;
  tip.innerHTML='<b>'+esc(p.n)+'</b><br><span style="font-family:IBM Plex Mono,monospace;color:var(--t4)">'+p.id+' &middot; SOC '+p.base+'</span><br>AI score: <span class="'+(p.x>0?'p':p.x<0?'n':'z')+'">'+fmtSigned2(p.x)+'</span><br>Labor shortage composite: '+fmtNum(p.y,2)+'<br>Automation: '+pct(p.auto)+' &middot; Augmentation: '+pct(p.aug)+'<br>Click to open the AI task drill-down';
  tip.style.display='block';
  var rect=card.getBoundingClientRect();
  var x=ev.clientX-rect.left+14,y=ev.clientY-rect.top+14;
  x=Math.min(x,rect.width-330); y=Math.min(y,rect.height-120);
  if(x<10)x=10; if(y<10)y=10;
  tip.style.left=x+'px'; tip.style.top=y+'px';
}
function hideSumTip(){var tip=document.getElementById('sumTip');if(tip)tip.style.display='none'}

function renderSummary(){
  var svg=document.getElementById('quadSvg');
  if(!svg)return;
  syncSourceButtons();
  var data=buildSummaryData();
  document.getElementById('sumNote').textContent=data.points.length.toLocaleString()+' occupations are plotted because they have both an AI score for '+SL[src]+' and a composite labor shortage score. Labels are shown for the 20 strongest AI tailwinds and the 20 strongest AI headwinds, ranked by combined percentile across the two axes.';
  document.getElementById('sumBenefit').innerHTML=makeSummaryList(data.benefit,'benefit');
  document.getElementById('sumSuffer').innerHTML=makeSummaryList(data.suffer,'suffer');
  var W=1200,H=620,L=210,R=990,T=34,B=542,PW=R-L,PH=B-T;
  var absRaw=1;
  for(var i=0;i<data.points.length;i++)absRaw=Math.max(absRaw,Math.abs(data.points[i].x));
  var absX=Math.ceil(absRaw*1.1);
  if(absX<5)absX=5;
  var xMin=-absX,xMax=absX,yMin=1,yMax=5;
  function xScale(v){return L+(v-xMin)/(xMax-xMin)*PW}
  function yScale(v){return T+(yMax-v)/(yMax-yMin)*PH}
  var x0=xScale(0),y3=yScale(3);
  function axisLabel(v){var av=Math.abs(v);var s=av>=10?String(Math.round(v)):String(Math.round(v*10)/10);return s.replace(/\.0$/,'')}
  function escAttr(s){return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
  var h='';
  h+='<rect x="0" y="0" width="'+W+'" height="'+H+'" fill="transparent"/>';
  h+='<rect x="'+L+'" y="'+T+'" width="'+(x0-L)+'" height="'+(y3-T)+'" fill="rgba(251,191,36,.04)"/>';
  h+='<rect x="'+x0+'" y="'+T+'" width="'+(R-x0)+'" height="'+(y3-T)+'" fill="rgba(52,211,153,.05)"/>';
  h+='<rect x="'+L+'" y="'+y3+'" width="'+(x0-L)+'" height="'+(B-y3)+'" fill="rgba(248,113,113,.05)"/>';
  h+='<rect x="'+x0+'" y="'+y3+'" width="'+(R-x0)+'" height="'+(B-y3)+'" fill="rgba(76,154,255,.04)"/>';
  for(var y=1;y<=5;y++){
    var yy=yScale(y);
    h+='<line x1="'+L+'" y1="'+yy+'" x2="'+R+'" y2="'+yy+'" stroke="rgba(255,255,255,.07)" stroke-width="1"/>';
    h+='<text x="'+(L-12)+'" y="'+(yy+4)+'" fill="var(--t4)" font-size="12" text-anchor="end">'+y+'</text>';
  }
  var xticks=[xMin,xMin/2,0,xMax/2,xMax];
  for(var xt=0;xt<xticks.length;xt++){
    var xv=xticks[xt],xx=xScale(xv);
    h+='<line x1="'+xx+'" y1="'+T+'" x2="'+xx+'" y2="'+B+'" stroke="rgba(255,255,255,.05)" stroke-width="1"/>';
    h+='<text x="'+xx+'" y="'+(B+22)+'" fill="var(--t4)" font-size="12" text-anchor="middle">'+axisLabel(xv)+'</text>';
  }
  h+='<line x1="'+L+'" y1="'+y3+'" x2="'+R+'" y2="'+y3+'" stroke="rgba(255,255,255,.18)" stroke-width="1.4"/>';
  h+='<line x1="'+x0+'" y1="'+T+'" x2="'+x0+'" y2="'+B+'" stroke="rgba(255,255,255,.18)" stroke-width="1.4"/>';
  h+='<rect x="'+L+'" y="'+T+'" width="'+PW+'" height="'+PH+'" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="1"/>';
  h+='<text x="'+(L+16)+'" y="'+(T+18)+'" fill="rgba(251,191,36,.9)" font-size="12" font-weight="700">High shortage, automation risk</text>';
  h+='<text x="'+(R-16)+'" y="'+(T+18)+'" fill="rgba(52,211,153,.95)" font-size="12" font-weight="700" text-anchor="end">Benefit from AI</text>';
  h+='<text x="'+(L+16)+'" y="'+(B-14)+'" fill="rgba(248,113,113,.95)" font-size="12" font-weight="700">Suffer most from AI</text>';
  h+='<text x="'+(R-16)+'" y="'+(B-14)+'" fill="rgba(76,154,255,.95)" font-size="12" font-weight="700" text-anchor="end">AI lift, softer shortage</text>';
  h+='<text x="'+((L+R)/2)+'" y="'+(H-18)+'" fill="var(--t3)" font-size="13" text-anchor="middle">AI augmentation vs. automation score</text>';
  h+='<text x="'+(L+6)+'" y="'+(H-36)+'" fill="var(--red)" font-size="12">More automation risk</text>';
  h+='<text x="'+(R-6)+'" y="'+(H-36)+'" fill="var(--grn)" font-size="12" text-anchor="end">More augmentation gain</text>';
  h+='<text transform="translate(32 '+((T+B)/2)+') rotate(-90)" fill="var(--t3)" font-size="13" text-anchor="middle">Labor shortage composite score</text>';
  for(var pi=0;pi<data.points.length;pi++){
    var p=data.points[pi],mark=data.marks[p.id],cx=xScale(p.x),cy=yScale(p.y),fill=p.x>0?'#34d399':p.x<0?'#f87171':'#a8b8cc',op=mark?.95:.33,r=mark?5.6:3.2;
    p.cx=cx; p.cy=cy;
    h+='<circle class="sum-pt" data-id="'+escAttr(p.id)+'" cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="'+fill+'" fill-opacity="'+op+'" stroke="'+fill+'" stroke-opacity="'+(mark?.55:.18)+'" stroke-width="'+(mark?1.6:1)+'" style="cursor:pointer" />';
  }
  function place(items,top,bottom,gap){
    items=items.slice().sort(function(a,b){return a.cy-b.cy});
    for(var i=0;i<items.length;i++){items[i].ly=Math.max(top,Math.min(bottom,items[i].cy))}
    for(var j=1;j<items.length;j++)if(items[j].ly<items[j-1].ly+gap)items[j].ly=items[j-1].ly+gap;
    if(items.length&&items[items.length-1].ly>bottom){
      items[items.length-1].ly=bottom;
      for(var k=items.length-2;k>=0;k--)if(items[k].ly>items[k+1].ly-gap)items[k].ly=items[k+1].ly-gap;
      if(items[0].ly<top){
        items[0].ly=top;
        for(var m=1;m<items.length;m++)if(items[m].ly<items[m-1].ly+gap)items[m].ly=items[m-1].ly+gap;
      }
    }
    return items;
  }
  var rightItems=place(data.benefit,T+18,B-8,18),leftItems=place(data.suffer,T+18,B-8,18);
  for(var ri=0;ri<rightItems.length;ri++){
    var rp=rightItems[ri],rx=R+16,tx=R+20;
    h+='<line x1="'+rp.cx+'" y1="'+rp.cy+'" x2="'+rx+'" y2="'+rp.ly+'" stroke="rgba(52,211,153,.45)" stroke-width="1"/>';
    h+='<text x="'+tx+'" y="'+(rp.ly+4)+'" fill="rgba(52,211,153,.98)" font-size="11.5">'+esc(trimLabel(rp.n,34))+'</text>';
  }
  for(var li=0;li<leftItems.length;li++){
    var lp=leftItems[li],lx=L-16,lt=L-20;
    h+='<line x1="'+lp.cx+'" y1="'+lp.cy+'" x2="'+lx+'" y2="'+lp.ly+'" stroke="rgba(248,113,113,.45)" stroke-width="1"/>';
    h+='<text x="'+lt+'" y="'+(lp.ly+4)+'" fill="rgba(248,113,113,.98)" font-size="11.5" text-anchor="end">'+esc(trimLabel(lp.n,34))+'</text>';
  }
  svg.innerHTML=h;
  var tipPts=svg.querySelectorAll('.sum-pt');
  for(var qi=0;qi<tipPts.length;qi++){
    tipPts[qi].addEventListener('mousemove',function(ev){
      var id=this.getAttribute('data-id'),p=null;
      for(var si=0;si<data.points.length;si++)if(data.points[si].id===id){p=data.points[si];break}
      if(p)showSumTip(ev,p);
    });
    tipPts[qi].addEventListener('mouseleave',hideSumTip);
    tipPts[qi].addEventListener('click',function(){detail(this.getAttribute('data-id'))});
  }
}


document.getElementById("qry").oninput=function(e){qry=e.target.value;render()};
document.getElementById("srcP").onclick=function(e){var b=e.target;if(!b.classList.contains("pl"))return;setSource(b.getAttribute("data-s"))};
document.getElementById("sumSrcP").onclick=function(e){var b=e.target;if(!b.classList.contains("pl"))return;setSource(b.getAttribute("data-s"))};

function showView(v){
  if(["tbl","ls","sum","met"].indexOf(v)<0)v="tbl";
  var bs=document.querySelectorAll(".nb");
  for(var i=0;i<bs.length;i++)bs[i].classList.toggle("on",bs[i].getAttribute("data-v")===v);
  document.getElementById("vTbl").style.display=v==="tbl"?"":"none";
  document.getElementById("vLs").style.display=v==="ls"?"":"none";
  document.getElementById("vSum").style.display=v==="sum"?"":"none";
  document.getElementById("vMet").style.display=v==="met"?"":"none";
  if(v==="sum")renderSummary();
}
document.getElementById("nav").onclick=function(e){
  var b=e.target;if(!b.classList.contains("nb"))return;
  var v=b.getAttribute("data-v");
  showView(v);
  try{location.hash=v}catch(err){}
};
document.getElementById("tb").onclick=function(e){var tr=e.target.closest("tr");if(tr){var id=tr.getAttribute("data-id");if(id)detail(id)}};

document.getElementById("lsQry").oninput=function(e){lsQry=e.target.value;renderLS()};
document.getElementById("lsTb").onclick=function(e){var tr=e.target.closest("tr");if(tr){var id=tr.getAttribute("data-id");if(id)lsDetail(id)}};
document.getElementById("sumBenefit").onclick=function(e){var it=e.target.closest('.sum-item');if(it)detail(it.getAttribute('data-id'))};
document.getElementById("sumSuffer").onclick=function(e){var it=e.target.closest('.sum-item');if(it)detail(it.getAttribute('data-id'))};

document.getElementById("ov").onclick=function(e){if(e.target===document.getElementById("ov"))cld()};
document.onkeydown=function(e){if(e.key==="Escape")cld()};
syncSourceButtons();
render();
renderLS();
renderSummary();
showView((location.hash||"#sum").replace("#",""));


/* ---- dashboard patch ---- */

(function(){
  var st=document.createElement('style');
  st.id='dashboardPatchStyles';
  st.textContent=''
    +'.soc-desc{background:var(--s1);border:1px solid var(--b1);border-radius:var(--r);padding:12px 14px;margin:12px 0 14px}'
    +'.soc-cap{font-size:.71rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--t3);margin-bottom:6px}'
    +'.soc-copy{font-size:.82rem;line-height:1.55;color:var(--t2)}'
    +'.soc-copy.miss{color:var(--t4)}'
    +'.human-row{background:rgba(251,191,36,.045)}'
    +'.human-row td{border-top-color:rgba(251,191,36,.14)}'
    +'.hf{font-size:.63rem;color:var(--amb);margin-left:4px;font-weight:700;letter-spacing:.01em}';
  document.head.appendChild(st);

  function socKey(id){
    id=String(id||'');
    return SOCM[id]?id:(SOCM[baseSoc(id)]?baseSoc(id):'');
  }
  window.socInfo=function(id){
    var k=socKey(id);
    return k?SOCM[k]:null;
  };
  window.buildSocDescBox=function(id,label){
    var k=socKey(id),info=k?SOCM[k]:null,desc=info&&info[1]?info[1]:'',cap=label||'BLS/SOC job description';
    if(k&&String(id)!==k)cap+=' (base SOC '+k+')';
    else if(k)cap+=' ('+k+')';
    if(desc)return '<div class="soc-desc"><div class="soc-cap">'+esc(cap)+'</div><div class="soc-copy">'+esc(desc)+'</div></div>';
    return '<div class="soc-desc"><div class="soc-cap">'+esc(cap)+'</div><div class="soc-copy miss">BLS does not publish a narrative definition for this SOC level in the referenced workbook.</div></div>';
  };

  var OCCNAME={};for(var on=0;on<OCC.length;on++)OCCNAME[OCC[on].id]=OCC[on].n;
  window.normTaskText=function(text){
    return String(text||'').toLowerCase().replace(/[\u2018\u2019]/g,"'").replace(/\s+/g,' ').trim();
  };
  function anyTaskMatch(s,arr){for(var i=0;i<arr.length;i++)if(arr[i].test(s))return true;return false}
  function occTaskContext(id){
    var name=OCCNAME[id]||OCCNAME[baseSoc(id)]||'';
    var info=window.socInfo?window.socInfo(id):null;
    return window.normTaskText(name+' '+(info&&info[0]?info[0]+' ':'')+(info&&info[1]?info[1]:''));
  }

  window.isPhysicalActivityTask=function(text,occId){
    var s=window.normTaskText(text),ctx=occTaskContext(occId);
    if(!s)return false;

    var negatives=/\b(data cleaning|search engine|website|web site|seo|search query|market trends|client plans|public records|database|computer programs?|software|digital assets?|spreadsheets?|documents?)\b/;
    var artsCtx=/\b(actor|actors|dancer|dancers|musician|musicians|singer|singers|comedian|comedians|entertainer|entertainers|clown|magician|puppeteer|performer|performing arts|announcer|disc jockey|dj)\b/;
    var educationCtx=/\b(teacher|teachers|instructor|instructors|professor|professors|coach|coaches|childcare|daycare|counselor|counselors|social worker|social workers)\b/;
    var serviceCtx=/\b(cashiers?|retail|salespersons?|bartenders?|servers?|waiters?|waitresses?|food service|restaurant|lodging|hotel|concierges?|hosts?|hostesses?)\b/;

    var embodied=[
      /\b(body movements?|facial expressions?|gestures?|mannerisms?|voice production|contort face)\b/,
      /\b(portray|interpret)\b.*\b(role|roles|emotions?|actions?|situations?)\b/,
      /\bperform\b.*\b(role|roles|audiences?|stage|live|stunts?|cues?|dances?|songs?|skits?|comedy routines?|illusions?)\b/,
      /\b(audition|casting calls?)\b/,
      /\b(rehearse|rehearsal)\b.*\b(role|roles|stunts?|cues?|dramatic|comedic|stage|script)\b/,
      /\b(sing|dance)\b.*\b(performance|performances|dramatic|comedic|stage)\b/,
      /\b(tell jokes|perform comic dances|comedy routines?|entertain audiences?)\b/
    ];
    var directHuman=[
      /\b(greet|assist|advise|counsel|coach|teach|instruct|train|demonstrate|interview|answer|explain|help|refer|recommend|serve|seat|escort|admit|care for|provide information)\b.*\b(patients?|clients?|residents?|children|child|students?|pupils?|athletes?|customers?|guests?|passengers?|diners?|patrons?|families|parents|guardians|individuals?)\b/,
      /\b(patients?|clients?|residents?|children|child|students?|pupils?|athletes?|customers?|guests?|passengers?|diners?|patrons?|families|parents|guardians|individuals?)\b.*\b(greet|assist|advise|counsel|coach|teach|instruct|train|demonstrate|interview|answer|explain|help|refer|recommend|serve|seat|escort|admit|care for)\b/,
      /\b(monitor|supervise|observe|watch)\b.*\b(patients?|residents?|children|child|students?|athletes?)\b/,
      /\brecord\b.*\b(patients?' medical information|vital signs)\b/,
      /\b(feed|bathe|dress|groom|massage|transfer|lift|turn|style|shampoo|cut hair|manicure|pedicure|apply makeup)\b.*\b(patients?|clients?|residents?|children|child|customers?|performers?)\b/,
      /\b(guard|patrol|arrest|rescue|evacuate|restrain)\b/
    ];
    var educationLive=[
      /\b(instruct through|lectures?, discussions?, and demonstrations?)\b/,
      /\bplan and conduct activities\b.*\b(students?|class|classroom)\b/,
      /\borganize and lead activities\b.*\b(development|students?|children|child)\b/,
      /\bprepare materials and classrooms?\b/,
      /\bhelp\b.*\b(children|child|students?)\b.*\b(homework|school work|coursework)\b/,
      /\bobserve and evaluate\b.*\b(students?' performance|students?' behavior|physical health)\b/,
      /\bpractice sessions?\b/,
      /\b(training direction|physical conditioning programs?)\b/,
      /\boffice hours\b.*\bstudents?\b/,
      /\b(explain and enforce safety rules? and regulations?)\b/
    ];
    var retailService=[
      /\breceive payment\b.*\b(cash|check|credit cards?|vouchers?|automatic debits?)\b/,
      /\banswer\b.*\b(customers?' questions|questions regarding the store)\b/,
      /\b(recommend|select|help locate|obtain)\b.*\bmerchandise\b.*\b(customer needs|desires)\b/,
      /\b(prepare merchandise for purchase|prepare merchandise for rental|ticket, arrange, and display merchandise|stock shelves|sales floor work|checkout counter|cash register)\b/,
      /\bexplain how\b.*\bmenu items\b/,
      /\b(greeting|assisting) customers\b/
    ];
    var food=[
      /\b(grill|cook|fry|bake|roast|broil|steam|boil|saute|poach|mix|prepare|wash|cut|clean|plate|serve)\b.*\b(food|foods|meals?|dishes?|ingredients?|beverages?|coffee|sandwiches?|salads?|soups?|pizza|french fries|eggs|pancakes|cocktails?|drinks?)\b/,
      /\bmix ingredients\b.*\b(cocktails?|drinks?)\b/
    ];
    var handling=[
      /\b(load|unload|lift|carry|transport|dump|hoist|move|stock)\b.*\b(materials?|packages?|containers?|bins?|refuse|grain|liquids?|slurries?|powder(?:ed)? materials?|merchandise|shelves)\b/,
      /\b(collect garbage|dump refuse|recyclable materials)\b/
    ];
    var driving=[
      /\b(drive|steer|pilot|navigate|route)\b.*\b(trucks?|vehicles?|forklifts?|tractors?|loaders?|cars?|buses?)\b/,
      /\bdrive trucks?\b/
    ];
    var equipment=[
      /\b(clean|lubricate|repair|install|assemble|disassemble|replace|paint|refuel|inspect|test|adjust|connect|attach|disconnect|calibrate)\b.*\b(equipment|machinery|machines?|truck|trucks|vehicle|vehicles|pump|pumps|engine|engines|valve|valves|pipeline|pipelines|hose|hoses|filters?|gaskets?|pipes?|conveyors?|loaders?|tractors?|forklifts?|compressors?|meters?|gauges?|wells?|tanks?|vessels?|ultrasound equipment|audio visual equipment|audio-visual equipment|cameras?|recording equipment|security systems?|medical equipment)\b/,
      /\boperate\b.*\b(truck|trucks|vehicle|vehicles|pump|pumps|engine|engines|valve|valves|conveyor|conveyors|hoisting devices?|compressor|compressors|industrial trucks?|tractors?|loaders?|grill|grills|broiler|broilers|oven|ovens|roaster|roasters|ultrasound equipment|audio visual equipment|audio-visual equipment|camera|cameras|machinery|equipment)\b/,
      /\b(start|stop|open|close|turn|regulate)\b.*\b(valves?|pumps?|engines?|flows?)\b/,
      /\b(using hand tools|hand tools|power tools)\b/,
      /\b(connect hoses?|connect pipelines?|attach pumps? and hoses?)\b/
    ];
    var sampleLab=[
      /\b(collect|draw|take)\b.*\b(samples?|specimens?)\b/,
      /\b(add|mix)\b.*\b(chemicals?|cement|acids?|solutions?|materials?)\b/,
      /\b(test|analyze)\b.*\b(samples?|specimens?|materials?|solutions?)\b.*\b(laboratory apparatus|testing equipment|using .* equipment)\b/
    ];
    var housekeeping=[/\b(housekeeping duties|clean rooms?|clean trucks?|clean interiors?)\b/];

    if(anyTaskMatch(s,embodied) && (anyTaskMatch(s,[/\b(role|roles|script|scripts|stage|audience|dramatic|comedic|comic|performance|performances|performers?|live)\b/]) || artsCtx.test(ctx)))return true;
    if(anyTaskMatch(s,directHuman))return true;
    if(educationCtx.test(ctx) && anyTaskMatch(s,educationLive))return true;
    if(serviceCtx.test(ctx) && anyTaskMatch(s,retailService))return true;
    if(anyTaskMatch(s,food))return true;
    if(anyTaskMatch(s,handling))return true;
    if(anyTaskMatch(s,driving))return true;
    if(anyTaskMatch(s,equipment) && !negatives.test(s))return true;
    if(anyTaskMatch(s,sampleLab))return true;
    if(anyTaskMatch(s,housekeeping))return true;
    if(artsCtx.test(ctx) && anyTaskMatch(s,[/\b(ensemble|audition|casting)\b/]))return true;
    return false;
  };

  function effectiveHumanTask(raw,occId){return !!raw[5] || window.isPhysicalActivityTask(raw[0],occId)}
  function hasDisplayedNonZeroScore(v){
    var n=Number(v)||0;
    return Math.abs(Math.round(n*10)/10)>0;
  }
  function occAdjusted(id,source){
    var tasks=TSK[id]||[],si=7,ai=0,sum=0,au=0,ag=0;
    for(var i=0;i<tasks.length;i++){
      var t=tasks[i];
      if(t[6]!==1)continue;
      if(effectiveHumanTask(t,id))continue;
      var a=t[si];
      if(!a||!hasDisplayedNonZeroScore(a[3]))continue;
      ai++;
      sum+=a[3]*t[4]/100;
      au+=a[1];
      ag+=a[2];
    }
    var cv=tasks.length?ai/tasks.length:0;
    if(ai){au/=ai;ag/=ai}else{au=0;ag=0}
    var s=(ai>=2&&cv>=0.101&&Math.abs(sum)>1e-9)?sum:0;
    return {ai:ai,cv:cv,au:au,ag:ag,s:s,ct:s>0?'B':s<0?'R':'N'};
  }
  function occView(o,source){return occAdjusted(o.id,source)}
  function hasClassifiedAiSignal(t){
    return (Number(t.d)||0)>0 || (Number(t.fb)||0)>0 || (Number(t.ti)||0)>0 || (Number(t.v)||0)>0 || (Number(t.l)||0)>0;
  }
  function isScoreEligibleAiTask(t){
    return t.ai===1 && !t.hu && hasDisplayedNonZeroScore(t.sc);
  }
  function taskBucket(t){if(isScoreEligibleAiTask(t))return 0;if(t.ai===1&&t.hu)return 1;return 2}
  function taskHumanHint(t){
    var tilt=(typeof t.rawSc==='number'&&Math.abs(t.rawSc)>0)?t.rawSc:((Number(t.ag)||0)-(Number(t.au)||0))*100;
    return tilt;
  }
  function taskPct(v){
    var n=Number(v)||0,s=n.toFixed(1).replace(/\.0$/,'');
    return s+'%';
  }

  tObj=function(t,sk,occId){
    var o={tk:t[0],im:t[1],rl:t[2],fa:t[3],fw:t[4],origHu:!!t[5],hu:effectiveHumanTask(t,occId),ai:t[6]};
    if(t[6]===1){
      var a=t[7];
      o.e=a[0];o.au=a[1];o.ag=a[2];o.rawSc=a[3];o.sc=o.hu?0:a[3];o.d=a[4];o.fb=a[5];o.ti=a[6];o.v=a[7];o.l=a[8];o.u=a[9];o.ta=Math.max(0,Math.round((Number(o.ti)+Number(o.v)+Number(o.l))*10)/10);
    }else{o.e=0;o.au=0;o.ag=0;o.rawSc=0;o.sc=0;o.d=0;o.fb=0;o.ti=0;o.v=0;o.l=0;o.u=0;o.ta=0}
    return o
  };

  sortTasks=function(tasks,sk,col,dir,occId){
    var parsed=[];for(var i=0;i<tasks.length;i++)parsed.push(tObj(tasks[i],sk,occId));
    parsed.sort(function(a,b){
      var va,vb;
      if(col==='tk'){va=a.tk.toLowerCase();vb=b.tk.toLowerCase();return dir*(va<vb?-1:va>vb?1:0)}
      if(col==='sc'){
        var ba=taskBucket(a),bb=taskBucket(b);
        if(ba!==bb)return ba-bb;
        if(ba===0){if(a.sc!==b.sc)return dir*(a.sc-b.sc)}
        else if(ba===1){va=taskHumanHint(a);vb=taskHumanHint(b);if(va!==vb)return dir*(va-vb)}
        va=a.tk.toLowerCase();vb=b.tk.toLowerCase();return va<vb?-1:va>vb?1:0;
      }
      va=a[col];vb=b[col];return dir*(va-vb)
    });
    return parsed
  };

  buildTaskTable=function(id,sk,sortCol,sortDir){
    var raw=TSK[id]||[];
    if(!raw.length)return'<div class="sct" style="color:var(--t4);margin-top:12px">No task data.</div>';
    var tasks=sortTasks(raw,sk,sortCol,sortDir,id);
    var aiCount=0,eligibleAiCount=0,humanAiCount=0;
    for(var i=0;i<tasks.length;i++){
      if(tasks[i].ai)aiCount++;
      if(tasks[i].ai&&tasks[i].hu)humanAiCount++;
      if(isScoreEligibleAiTask(tasks[i]))eligibleAiCount++;
    }
    var h='<div class="sct">All Tasks ('+tasks.length+' total, '+eligibleAiCount+' scored AI tasks)</div>';
    h+='<div class="scs">Interaction values show % of total interactions per task. Freq Wt% = share of this occupation\'s total frequency weight. Sorting the AI impact score now groups tasks as scored high → scored low → human interaction / physical activity → no impact. The count above reflects only tasks with a non-zero displayed AI score.</div>';
    h+='<div style="background:var(--s1);border:1px solid var(--b1);border-radius:var(--r);padding:10px 14px;margin-bottom:14px;font-size:.76rem;color:var(--t3);line-height:1.5"><span style="color:var(--amb);font-weight:700">[human / physical]</span> = Task requires face-to-face interaction, embodied performance, physical presence, or manual physical activity (for example patient care, classroom teaching, coaching, live acting, cooking, driving, operating machinery, repair/install work, or materials handling). These tasks can still show Claude interaction patterns, but their AI impact score is forced to <strong style="color:var(--t1)">0</strong> and they are sorted separately because the task itself cannot be completed by AI end-to-end.</div>';
    h+='<div style="overflow-x:auto;border:1px solid var(--b1);border-radius:var(--r)"><table class="tt"><thead>';
    h+='<tr><th colspan="5" style="border-right:1px solid var(--b2)">Task Details</th>';
    h+='<th colspan="2" style="border-right:1px solid var(--b2)">Scores</th>';
    h+='<th colspan="3" class="cg-auto" style="border-right:1px solid var(--b2);text-align:center">Automation (Dir + FB)</th>';
    h+='<th colspan="4" class="cg-aug" style="border-right:1px solid var(--b2);text-align:center">Augmentation (TI + Val + Lrn)</th>';
    h+='<th>Other</th></tr><tr>';
    var cols=[
      ['tk','Task','O*NET task description.',''],
      ['im','Imp','Importance (1-5).',''],
      ['rl','Rel','Relevance (0-100).',''],
      ['fa','Freq','How often performed.',''],
      ['fw','FW%','Share of occupation frequency weight.|border-right:1px solid var(--b2)'],
      ['sc','Score','Task score for chat data. Human interaction / physical activity tasks are set to 0 and sorted after scored tasks.|'],
      ['au','A/A%','Visual: red=automation, green=augmentation.|border-right:1px solid var(--b2)'],
      ['d','Dir%','Directive %. Automation.|cg-auto'],
      ['fb','FB%','Feedback Loop %. Automation.|cg-auto'],
      ['au','Tot Auto%','Total automation (Directive + Feedback Loop).|cg-auto|border-right:1px solid var(--b2)'],
      ['ti','TI%','Task Iteration %. Augmentation.|cg-aug'],
      ['v','Val%','Validation %. Augmentation.|cg-aug'],
      ['l','Lrn%','Learning %. Augmentation.|cg-aug'],
      ['ta','Tot Aug%','Total augmentation (TI + Validation + Learning).|cg-aug|border-right:1px solid var(--b2)'],
      ['u','Unc%','Unclassified %.']
    ];
    for(var ci=0;ci<cols.length;ci++){
      var c=cols[ci],parts=c[2].split('|'),desc=parts[0],extra='',cls2='';
      for(var p=1;p<parts.length;p++){if(parts[p].indexOf('cg-')===0)cls2=' '+parts[p];else extra+=parts[p]+';'}
      var isSorted=c[0]===sortCol,arrow=isSorted?(sortDir===1?' &#9650;':' &#9660;'):' &#8597;';
      h+='<th class="'+(isSorted?'sorted':'')+cls2+'" style="cursor:pointer;'+(extra||'')+'" onclick="tsort(\''+c[0]+'\')">';
      h+=tipDown(c[1]+'<span class="sa">'+arrow+'</span>',desc);
      h+='</th>'
    }
    h+='</tr></thead><tbody>';
    for(var j=0;j<tasks.length;j++){
      var t=tasks[j],isAI=t.ai===1,rowCls=!isAI?'no-ai-row':(t.hu?'human-row':''),hfl=t.hu?'<span class="hf">[human / physical]</span>':'';
      h+='<tr class="'+rowCls+'"><td class="tx">'+esc(t.tk)+hfl+'</td>';
      h+='<td class="m">'+t.im+'</td><td class="m">'+t.rl+'</td>';
      h+='<td class="fl">'+fql(t.fa)+'</td>';
      h+='<td class="m" style="border-right:1px solid var(--b2)">'+t.fw+'%</td>';
      if(isAI){
        h+='<td class="m '+cls(t.sc)+'">'+(Math.round(t.sc*10)/10).toFixed(1)+'</td>';
        h+='<td style="border-right:1px solid var(--b2)"><div style="display:flex;height:7px;border-radius:4px;overflow:hidden;min-width:50px"><div style="width:'+pct(t.au)+';background:var(--red)"></div><div style="width:'+pct(t.ag)+';background:var(--grn)"></div></div></td>';
        h+='<td class="m n">'+taskPct(t.d)+'</td><td class="m n">'+taskPct(t.fb)+'</td>';
        h+='<td class="m n" style="border-right:1px solid var(--b2);font-weight:600">'+pct(t.au)+'</td>';
        h+='<td class="m p">'+taskPct(t.ti)+'</td><td class="m p">'+taskPct(t.v)+'</td>';
        h+='<td class="m p">'+taskPct(t.l)+'</td>';
        h+='<td class="m p" style="border-right:1px solid var(--b2);font-weight:600">'+taskPct(t.ta)+'</td>';
        h+='<td class="m z">'+taskPct(t.u)+'</td>'
      }else{h+='<td class="m z" colspan="10" style="text-align:center;font-style:italic">No AI interaction data</td>'}
      h+='</tr>'
    }
    h+='</tbody></table></div>';
    return h
  };

  buildDetail=function(id){
    var o=null;for(var i=0;i<OCC.length;i++){if(OCC[i].id===id){o=OCC[i];break}}
    if(!o)return'';curId=id;
    var s=dsrc,d=occView(o,s);
    var h='<button class="x" id="xb">&times;</button>';
    h+='<div class="dt">'+esc(o.n)+'</div>';
    h+='<div class="dc">'+o.id+' &middot; '+o.t+' total tasks</div>';
    h+=buildSocDescBox(o.id,'BLS/SOC job description');
    h+='<div class="dw"><span>Data source:</span><span class="grp-badge">Chat only</span></div>';
    h+='<div class="sc-row">';
    h+='<div class="sc-box"><div class="lb">Score ('+SL[s]+')</div><div class="vl '+cls(d.s)+'">'+f2(d.s)+'</div><div class="mt"><span class="bg '+d.ct+'" style="font-size:.6rem;padding:1px 7px">'+CL[d.ct]+'</span></div></div>';
    var detailTasks=sortTasks(TSK[id]||[],s,tSort,tSortDir,id),eligibleAiCount=0;
    for(var k=0;k<detailTasks.length;k++){if(isScoreEligibleAiTask(detailTasks[k]))eligibleAiCount++}
    var eligibleCoverage=o.t?eligibleAiCount/o.t:0;
    h+='<div class="sc-box"><div class="lb">AI Coverage</div><div class="vl" style="font-size:1.4rem">'+eligibleAiCount+' <span style="font-size:.9rem;color:var(--t3)">/ '+o.t+'</span></div><div class="mt">'+pct(eligibleCoverage)+' coverage</div></div>';
    h+='<div class="sc-box"><div class="lb">Automation vs Augmentation</div><div style="margin-top:8px"><div class="br"><div class="bl">Auto</div><div class="bt"><div class="bfa" style="width:'+pct(d.au)+'"></div></div><div class="bv n">'+pct(d.au)+'</div></div><div class="br"><div class="bl">Aug</div><div class="bt"><div class="bfg" style="width:'+pct(d.ag)+'"></div></div><div class="bv p">'+pct(d.ag)+'</div></div></div></div>';
    h+='</div>';
    h+='<div id="ta">'+buildTaskTable(id,dsrc,tSort,tSortDir)+'</div>';
    return h
  };

  buildLSDetail=function(id){
    var o=LSM[id];
    if(!o)return'';
    lsCurId=id;
    var h='<button class="x" id="xb">&times;</button>';
    h+='<div class="dt">'+esc(o.n)+'</div>';
    h+='<div class="dc">'+o.id+' &middot; '+(LSGL[o.g]||o.g)+'</div>';
    h+=buildSocDescBox(o.id,'BLS/SOC job description');
    h+='<div class="sc-row">';
    h+='<div class="sc-box"><div class="lb">Composite Score</div><div class="vl">'+scoreChip(o.c,true)+'</div><div class="mt">Equal-weight average of available pillars</div></div>';
    h+='<div class="sc-box"><div class="lb">Projected Employment Score</div><div class="vl">'+scoreChip(o.ps,true)+'</div><div class="mt">From 2024–2034 projected employment CAGR</div></div>';
    h+='<div class="sc-box"><div class="lb">Wage Score</div><div class="vl">'+scoreChip(o.ws,true)+'</div><div class="mt">From actual wage CAGR</div></div>';
    h+='<div class="sc-box"><div class="lb">Actual Employment Score</div><div class="vl">'+scoreChip(o.es,true)+'</div><div class="mt">From actual employment CAGR</div></div>';
    h+='</div>';
    h+='<div class="sc-row">';
    h+='<div class="sc-box"><div class="lb">Projected Employment CAGR</div><div class="vl '+cls(nil(o.pc)?0:o.pc)+'">'+fmtPct2(o.pc)+'</div><div class="mt">2024–2034 BLS projection</div></div>';
    h+='<div class="sc-box"><div class="lb">Wage CAGR Used</div><div class="vl '+cls(nil(o.wc)?0:o.wc)+'">'+fmtPct2(o.wc)+'</div><div class="mt">Window: '+(o.wb?o.wb.replace(/-/g,'–'):'N/A')+'</div></div>';
    h+='<div class="sc-box"><div class="lb">Actual Employment CAGR Used</div><div class="vl '+cls(nil(o.ec)?0:o.ec)+'">'+fmtPct2(o.ec)+'</div><div class="mt">Window: '+(o.eb?o.eb.replace(/-/g,'–'):'N/A')+'</div></div>';
    h+='<div class="sc-box"><div class="lb">Score Coverage</div><div class="vl" style="font-size:1.05rem;line-height:1.45;font-family:inherit">'+grpBadge(o.g)+'</div><div class="mt">Workbook SOC level for this row</div></div>';
    h+='</div>';
    if(nil(o.ps))h+='<div class="inline-note">Projected employment fields are blank for this occupation code in the workbook’s projection match, so the projected employment score and composite score are also blank.</div>';
    h+='<div class="sct">Actual Wage and Employment History</div>';
    h+='<div class="scs">These are the 2019–2024 values carried into the dashboard from the workbook. The wage score uses the annual wage series; the actual employment score uses the employment series.</div>';
    h+='<div style="overflow-x:auto;border:1px solid var(--b1);border-radius:var(--r);margin-bottom:16px"><table class="tt"><thead><tr><th>Year</th><th>Mean Annual Wage</th><th>Employment</th></tr></thead><tbody>';
    for(var yr=2019;yr<=2024;yr++){var idx=yr-2019;h+='<tr><td class="m">'+yr+'</td><td class="m">'+fmtMoney0(o.wa[idx])+'</td><td class="m">'+fmtInt(o.em[idx])+'</td></tr>'}
    h+='</tbody></table></div>';
    h+='<div class="sct">Projected Employment CAGR</div>';
    h+='<div class="scs">This drill-down now shows only the projected employment CAGR from the workbook’s BLS Employment Projections source.</div>';
    h+='<div class="kv">';
    h+=lsMetricRow('Projected employment CAGR, 2024–2034',fmtPct2(o.pc));
    h+='</div>';
    h+='<div class="inline-note">The workbook keeps only the fields needed here. Any special BLS markers in the history series (for example, <span class="m">*</span> or <span class="m">**</span>) are carried through unchanged rather than inferred.</div>';
    return h;
  };

  stats=function(){
    var b=0,r=0,n=0;
    for(var i=0;i<OCC.length;i++){var c=occView(OCC[i],src).ct;if(c==='B')b++;else if(c==='R')r++;else n++}
    document.getElementById('sts').innerHTML='<div class="st"><div class="d g"></div><b>'+b+'</b><span>Augmented</span></div><div class="st"><div class="d r"></div><b>'+r+'</b><span>At Risk</span></div><div class="st"><div class="d y"></div><b>'+n+'</b><span>Neutral</span></div><div class="st" style="margin-left:auto"><span>Mode:</span> <b>Chat only</b></div>'
  };

  render=function(){
    renderMainTh();
    var list=OCC.slice();
    if(qry){var q=qry.toLowerCase();list=list.filter(function(o){return o.n.toLowerCase().indexOf(q)>=0||o.id.toLowerCase().indexOf(q)>=0})}
    if(cat!=='all')list=list.filter(function(o){return occView(o,src).ct===cat});
    if(srt==='aug'){list.sort(function(a,b){return occView(b,src).s-occView(a,src).s})}
    else if(srt==='risk'){list.sort(function(a,b){return occView(a,src).s-occView(b,src).s})}
    else if(srt==='az'){list.sort(function(a,b){return a.n.localeCompare(b.n)})}
    else{
      var sk=mSort,dir=mSortDir;
      list.sort(function(a,b){
        var da=occView(a,src),db=occView(b,src),va,vb;
        if(sk==='n'){va=a.n.toLowerCase();vb=b.n.toLowerCase();return dir*(va<vb?-1:va>vb?1:0)}
        else if(sk==='ct'){va=da.ct;vb=db.ct;return dir*(va<vb?-1:va>vb?1:0)}
        else if(sk==='ai'){va=da.ai;vb=db.ai;return dir*(va-vb)}
        else{va=da[sk];vb=db[sk];return dir*(va-vb)}
      });
    }
    document.getElementById('cnt').textContent=list.length+' occupations';
    var h='';
    for(var i=0;i<list.length;i++){
      var o=list[i],d=occView(o,src);
      h+='<tr data-id="'+o.id+'"><td class="tn">'+esc(o.n)+'</td><td class="m '+cls(d.s)+'">'+f2(d.s)+'</td><td><span class="bg '+d.ct+'">'+CL[d.ct]+'</span></td><td class="m">'+d.ai+' <span style="color:var(--t4)">/</span> '+o.t+'</td><td class="m">'+pct(d.cv)+'</td><td class="m n">'+pct(d.au)+'</td><td class="m p">'+pct(d.ag)+'</td></tr>'
    }
    document.getElementById('tb').innerHTML=h;stats()
  };

  buildSummaryData=function(){
    var pts=[];
    for(var i=0;i<OCC.length;i++){
      var o=OCC[i],l=lsForOcc(o.id);
      if(!l||nil(l.c))continue;
      var d=occView(o,src);
      if(nil(d.s))continue;
      pts.push({id:o.id,n:o.n,base:baseSoc(o.id),x:d.s,y:l.c,auto:d.au,aug:d.ag,cat:d.ct,lab:l});
    }
    var xs=[],ys=[];
    for(var j=0;j<pts.length;j++){xs.push(pts[j].x);ys.push(pts[j].y)}
    xs.sort(function(a,b){return a-b}); ys.sort(function(a,b){return a-b});
    for(var k=0;k<pts.length;k++){
      pts[k].xp=pctRankSorted(xs,pts[k].x);
      pts[k].yp=pctRankSorted(ys,pts[k].y);
      pts[k].benefit=pts[k].x>0?(pts[k].xp+pts[k].yp):-999;
      pts[k].suffer=pts[k].x<0?((1-pts[k].xp)+(1-pts[k].yp)):-999;
    }
    var benefit=pts.filter(function(p){return p.x>0}).slice().sort(function(a,b){return b.benefit-a.benefit||b.x-a.x||b.y-a.y}).slice(0,20);
    var suffer=pts.filter(function(p){return p.x<0}).slice().sort(function(a,b){return b.suffer-a.suffer||a.x-b.x||a.y-b.y}).slice(0,20);
    var marks={};
    for(var bi=0;bi<benefit.length;bi++)marks[benefit[bi].id]={kind:'benefit',rank:bi+1};
    for(var si=0;si<suffer.length;si++)marks[suffer[si].id]={kind:'suffer',rank:si+1};
    return {points:pts,benefit:benefit,suffer:suffer,marks:marks};
  };

  renderSummary=function(){
    var svg=document.getElementById('quadSvg');
    if(!svg)return;
    syncSourceButtons();
    var data=buildSummaryData();
    document.getElementById('sumNote').textContent=data.points.length.toLocaleString()+' occupations are plotted because they have both an AI score for '+SL[src]+' and a composite labor shortage score. Labels are shown next to the 20 strongest AI tailwinds and the 20 strongest AI headwinds, ranked by combined percentile across the two axes.';
    document.getElementById('sumBenefit').innerHTML=makeSummaryList(data.benefit,'benefit');
    document.getElementById('sumSuffer').innerHTML=makeSummaryList(data.suffer,'suffer');
    var W=1200,H=620,L=92,R=1108,T=34,B=542,PW=R-L,PH=B-T;
    var absRaw=1;
    for(var i=0;i<data.points.length;i++)absRaw=Math.max(absRaw,Math.abs(data.points[i].x));
    var absX=Math.ceil(absRaw*1.1); if(absX<5)absX=5;
    var xMin=-absX,xMax=absX,yMin=1,yMax=5;
    function xScale(v){return L+(v-xMin)/(xMax-xMin)*PW}
    function yScale(v){return T+(yMax-v)/(yMax-yMin)*PH}
    var x0=xScale(0),y3=yScale(3);
    function axisLabel(v){var av=Math.abs(v),s=av>=10?String(Math.round(v)):String(Math.round(v*10)/10);return s.replace(/\.0$/,'')}
    function escAttr(s){return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
    function place(items,top,bottom,gap){
      items=items.slice().sort(function(a,b){return a.cy-b.cy});
      for(var i=0;i<items.length;i++)items[i].ly=Math.max(top,Math.min(bottom,items[i].cy));
      for(var j=1;j<items.length;j++)if(items[j].ly<items[j-1].ly+gap)items[j].ly=items[j-1].ly+gap;
      if(items.length&&items[items.length-1].ly>bottom){
        items[items.length-1].ly=bottom;
        for(var k=items.length-2;k>=0;k--)if(items[k].ly>items[k+1].ly-gap)items[k].ly=items[k+1].ly-gap;
        if(items[0].ly<top){
          items[0].ly=top;
          for(var m=1;m<items.length;m++)if(items[m].ly<items[m-1].ly+gap)items[m].ly=items[m-1].ly+gap;
        }
      }
      return items;
    }
    function labelSpec(p,kind){
      var txt=trimLabel(p.n,24),est=Math.max(40,txt.length*5.1),x,anchor;
      if(kind==='benefit'){
        x=p.cx+8; anchor='start';
        if(x+est>R-4){x=p.cx-8;anchor='end'}
      }else{
        x=p.cx-8; anchor='end';
        if(x-est<L+4){x=p.cx+8;anchor='start'}
      }
      return {text:txt,x:x,anchor:anchor};
    }
    var h='';
    h+='<rect x="0" y="0" width="'+W+'" height="'+H+'" fill="transparent"/>';
    h+='<rect x="'+L+'" y="'+T+'" width="'+(x0-L)+'" height="'+(y3-T)+'" fill="rgba(251,191,36,.04)"/>';
    h+='<rect x="'+x0+'" y="'+T+'" width="'+(R-x0)+'" height="'+(y3-T)+'" fill="rgba(52,211,153,.05)"/>';
    h+='<rect x="'+L+'" y="'+y3+'" width="'+(x0-L)+'" height="'+(B-y3)+'" fill="rgba(248,113,113,.05)"/>';
    h+='<rect x="'+x0+'" y="'+y3+'" width="'+(R-x0)+'" height="'+(B-y3)+'" fill="rgba(76,154,255,.04)"/>';
    for(var y=1;y<=5;y++){var yy=yScale(y);h+='<line x1="'+L+'" y1="'+yy+'" x2="'+R+'" y2="'+yy+'" stroke="rgba(255,255,255,.07)" stroke-width="1"/>';h+='<text x="'+(L-12)+'" y="'+(yy+4)+'" fill="var(--t4)" font-size="12" text-anchor="end">'+y+'</text>'}
    var xticks=[xMin,xMin/2,0,xMax/2,xMax];
    for(var xt=0;xt<xticks.length;xt++){var xv=xticks[xt],xx=xScale(xv);h+='<line x1="'+xx+'" y1="'+T+'" x2="'+xx+'" y2="'+B+'" stroke="rgba(255,255,255,.05)" stroke-width="1"/>';h+='<text x="'+xx+'" y="'+(B+22)+'" fill="var(--t4)" font-size="12" text-anchor="middle">'+axisLabel(xv)+'</text>'}
    h+='<line x1="'+L+'" y1="'+y3+'" x2="'+R+'" y2="'+y3+'" stroke="rgba(255,255,255,.18)" stroke-width="1.4"/>';
    h+='<line x1="'+x0+'" y1="'+T+'" x2="'+x0+'" y2="'+B+'" stroke="rgba(255,255,255,.18)" stroke-width="1.4"/>';
    h+='<rect x="'+L+'" y="'+T+'" width="'+PW+'" height="'+PH+'" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="1"/>';
    h+='<text x="'+(L+16)+'" y="'+(T+18)+'" fill="rgba(251,191,36,.9)" font-size="12" font-weight="700">High shortage, automation risk</text>';
    h+='<text x="'+(R-16)+'" y="'+(T+18)+'" fill="rgba(52,211,153,.95)" font-size="12" font-weight="700" text-anchor="end">Benefit from AI</text>';
    h+='<text x="'+(L+16)+'" y="'+(B-14)+'" fill="rgba(248,113,113,.95)" font-size="12" font-weight="700">Suffer most from AI</text>';
    h+='<text x="'+(R-16)+'" y="'+(B-14)+'" fill="rgba(76,154,255,.95)" font-size="12" font-weight="700" text-anchor="end">AI lift, softer shortage</text>';
    h+='<text x="'+((L+R)/2)+'" y="'+(H-18)+'" fill="var(--t3)" font-size="13" text-anchor="middle">AI augmentation vs. automation score</text>';
    h+='<text x="'+(L+6)+'" y="'+(H-36)+'" fill="var(--red)" font-size="12">More automation risk</text>';
    h+='<text x="'+(R-6)+'" y="'+(H-36)+'" fill="var(--grn)" font-size="12" text-anchor="end">More augmentation gain</text>';
    h+='<text transform="translate(32 '+((T+B)/2)+') rotate(-90)" fill="var(--t3)" font-size="13" text-anchor="middle">Labor shortage composite score</text>';
    for(var pi=0;pi<data.points.length;pi++){
      var p=data.points[pi],mark=data.marks[p.id],cx=xScale(p.x),cy=yScale(p.y),fill=p.x>0?'#34d399':p.x<0?'#f87171':'#a8b8cc',op=mark?.95:.33,r=mark?5.6:3.2;
      p.cx=cx; p.cy=cy;
      h+='<circle class="sum-pt" data-id="'+escAttr(p.id)+'" cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="'+fill+'" fill-opacity="'+op+'" stroke="'+fill+'" stroke-opacity="'+(mark?.55:.18)+'" stroke-width="'+(mark?1.6:1)+'" style="cursor:pointer" />';
    }
    var rightItems=place(data.benefit,T+18,B-8,15),leftItems=place(data.suffer,T+18,B-8,15);
    for(var ri=0;ri<rightItems.length;ri++){
      var rp=rightItems[ri],rs=labelSpec(rp,'benefit');
      h+='<text x="'+rs.x+'" y="'+(rp.ly+3.5)+'" fill="rgba(52,211,153,.98)" font-size="9.25" font-weight="600" text-anchor="'+rs.anchor+'" paint-order="stroke" stroke="rgba(7,9,15,.96)" stroke-width="2.4" stroke-linejoin="round" style="pointer-events:none">'+esc(rs.text)+'</text>';
    }
    for(var li=0;li<leftItems.length;li++){
      var lp=leftItems[li],ls=labelSpec(lp,'suffer');
      h+='<text x="'+ls.x+'" y="'+(lp.ly+3.5)+'" fill="rgba(248,113,113,.98)" font-size="9.25" font-weight="600" text-anchor="'+ls.anchor+'" paint-order="stroke" stroke="rgba(7,9,15,.96)" stroke-width="2.4" stroke-linejoin="round" style="pointer-events:none">'+esc(ls.text)+'</text>';
    }
    svg.innerHTML=h;
    var tipPts=svg.querySelectorAll('.sum-pt');
    for(var qi=0;qi<tipPts.length;qi++){
      tipPts[qi].addEventListener('mousemove',function(ev){var id=this.getAttribute('data-id'),p=null;for(var si=0;si<data.points.length;si++)if(data.points[si].id===id){p=data.points[si];break}if(p)showSumTip(ev,p)});
      tipPts[qi].addEventListener('mouseleave',hideSumTip);
      tipPts[qi].addEventListener('click',function(){detail(this.getAttribute('data-id'))});
    }
  };

  var nav=document.getElementById('nav'),sumBtn=nav?nav.querySelector('[data-v="sum"]'):null;
  if(nav&&sumBtn)nav.insertBefore(sumBtn,nav.firstChild);

  syncSourceButtons();
  render();
  renderLS();
  renderSummary();
  showView((location.hash||'#sum').replace('#',''));
})();
/* ---- end dashboard patch ---- */
})();
