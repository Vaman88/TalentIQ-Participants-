const path = require('path');
const fs = require('fs');
const pptxgen = require(path.join(process.env.TEMP, 'talentiq-deck-builder', 'node_modules', 'pptxgenjs'));

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'TalentIQ';
pptx.subject = 'Career fair check-in presentation';
pptx.title = 'TalentIQ | J.B. Hunt career fair presentation';
pptx.company = 'TalentIQ';
pptx.lang = 'en-US';
pptx.theme = { headFontFace: 'Montserrat', bodyFontFace: 'Inter', lang: 'en-US' };

const C = { ink:'211F20', yellow:'FEDB00', white:'FFFFFF', soft:'F5F5F6', line:'D9DADC', muted:'68686B', light:'D2D2D3', card:'2D2B2C' };
const S = pptx.ShapeType;
const SW = 13.333, SH = 7.5;

function rect(slide,x,y,w,h,fill,lineFill=fill,lineWidth=0){ slide.addShape(S.rect,{x,y,w,h,rectRadius:0,line:{color:lineFill,width:lineWidth},fill:{color:fill}}); }
function stroke(slide,x,y,w,h,color=C.line,width=1){ slide.addShape(S.line,{x,y,w,h,line:{color,width}}); }
function txt(slide,value,x,y,w,h,size=16,color=C.ink,bold=false,extra={}){
  slide.addText(value,{x,y,w,h,margin:0,breakLine:false,fontFace:extra.fontFace||'Inter',fontSize:size,color,bold,
    valign:extra.valign||'mid',align:extra.align||'left',charSpacing:extra.charSpacing||0,
    italic:extra.italic||false,transparency:0,fit:'shrink',...extra});
}
function base(dark=false, number=null){
  const slide=pptx.addSlide(); slide.background={color:dark?C.ink:C.white};
  rect(slide,0,7.44,SW,.06,C.yellow);
  if(number!==null){
    rect(slide,.72,.45,1.02,.31,C.yellow);
    txt(slide,'J.B. HUNT',.76,.48,.92,.23,12,C.ink,true,{fontFace:'Montserrat',italic:true,align:'center'});
    txt(slide,'TalentIQ',1.86,.48,1.18,.24,12,dark?C.white:C.ink,true,{fontFace:'Montserrat'});
    txt(slide,`${String(number).padStart(2,'0')} / 08`,11.81,.49,.79,.20,10,dark?'AAAAAA':C.muted,true,{fontFace:'Montserrat',align:'right',charSpacing:2});
  }
  return slide;
}
function tag(slide,label,x,y,dark=false){rect(slide,x,y+.12,.2,.055,C.yellow);txt(slide,label.toUpperCase(),x+.3,y,3,.30,9,dark?C.yellow:C.ink,true,{charSpacing:1.5});}
function title(slide,value,x,y,w,h,dark=false,size=42){txt(slide,value,x,y,w,h,size,dark?C.white:C.ink,true,{fontFace:'Montserrat',breakLine:false});}
function body(slide,value,x,y,w,h,dark=false,size=14){txt(slide,value,x,y,w,h,size,dark?C.light:'555555',false,{valign:'top'});}

// 01 — Problem
{
  const s=base(true,1); tag(s,'The problem',.72,1.25,true);
  title(s,'Long lines.',.72,1.68,6.2,.72,true,48);
  txt(s,'Lost context.',.72,2.39,6.3,.75,48,C.yellow,true,{fontFace:'Montserrat'});
  body(s,'At busy career fairs, candidates wait to check in while recruiters try to remember dozens of short conversations.',.72,3.27,5.45,.76,true,15);
  stroke(s,.72,4.18,5.48,0,'555555');
  const pains=[['01','Lines slow the first hello.','Manual check-in creates long waits at the booth.'],['02','Names blur together.','Interviewers may forget who they spoke with.'],['03','Details disappear.','There is no clear record of what was discussed or what comes next.']];
  pains.forEach((p,i)=>{let y=4.34+i*.78;txt(s,p[0],.72,y,.36,.28,13,C.yellow,true,{fontFace:'Montserrat'});txt(s,p[1],1.17,y,4.95,.28,13,C.white,true,{fontFace:'Montserrat'});body(s,p[2],1.17,y+.29,4.95,.34,true,10.5);stroke(s,.72,y+.68,5.48,0,'555555');});
  rect(s,7.05,1.7,5.45,4.82,'292728','4F4E4F',1);txt(s,'AT CHECK-IN',7.4,2.02,2.3,.22,10,'C6C5C6',true,{charSpacing:1.5});
  for(let i=0;i<5;i++){let x=7.55+i*.53; s.addShape(S.ellipse,{x:x+.12,y:2.82,w:.23,h:.23,line:{color:C.white,width:0},fill:{color:C.white,transparency:i*17}});rect(s,x+.06,3.08,.35,.42,C.white);}
  stroke(s,10.13,3.39,1.0,0,C.yellow,2);rect(s,11.17,2.93,.92,.6,C.ink,C.yellow,2);txt(s,'CHECK\nIN',11.27,3.05,.72,.34,10,C.yellow,true,{fontFace:'Montserrat',align:'center'});
  rect(s,7.41,3.91,.05,.45,C.yellow);txt(s,'A slow start creates a longer wait.',7.6,3.96,4.5,.34,15,C.white,true,{fontFace:'Montserrat'});
  stroke(s,7.41,4.83,4.7,0,'555555');txt(s,'AFTER THE CONVERSATION',7.41,5.05,3.7,.23,10,'C6C5C6',true,{charSpacing:1.1});
  ['Who was it?','What did we discuss?','What next?'].forEach((v,i)=>{const xx=[7.41,8.84,10.73][i],ww=[1.31,1.77,1.25][i];rect(s,xx,5.55,ww,.46,'292728','898889',.7);txt(s,v,xx+.09,5.68,ww-.18,.18,9.4,C.white,false);});
}

// 02 — Solution
{
  const s=base(false,2); tag(s,'The solution',.72,1.22);
  title(s,'One record from check-in\nto follow-up.',.72,1.65,9.7,1.21,false,42);
  body(s,'TalentIQ connects candidate details, resumes, and recruiter context so a conversation does not end when the fair does.',.72,2.92,8.8,.55,false,15);
  const cards=[['01','Quick\ncheck-in','Candidate enters details and uploads a resume.',true],['02','One\nsource','Supabase stores the response and resume together.',false],['03','Recruiter\nlog','Notes and follow-up decisions stay with the profile.',false],['04','Voice\nfiltering','Find people by the topics discussed.',false]];
  cards.forEach((c,i)=>{let x=.72+i*3.11;let bg=i===0?C.ink:C.soft;rect(s,x,4.00,2.48,2.24,bg);rect(s,x,4.00,2.48,.07,i===0?C.yellow:(i===1?C.ink:'9B9B9E'));txt(s,c[0],x+.22,4.29,.36,.28,12,i===0?C.yellow:'777777',true,{fontFace:'Montserrat'});txt(s,c[1],x+.22,4.80,2.03,.67,21,i===0?C.white:C.ink,true,{fontFace:'Montserrat'});body(s,c[2],x+.22,5.54,2.00,.50,i===0,10.2);if(i<3)txt(s,'→',x+2.59,4.91,.39,.36,26,C.ink,false,{align:'center'});});
  stroke(s,.72,6.56,11.9,0,C.line);rect(s,.72,6.79,1.1,.29,C.yellow);txt(s,'LIVE TODAY',.78,6.84,.98,.16,8.5,C.ink,true);txt(s,'Check-in + Supabase',1.93,6.82,2.45,.20,10,C.ink,true);txt(s,'NEXT PHASE',9.67,6.82,1.15,.20,9,C.ink,true);txt(s,'Conversation logs + voice filtering',10.78,6.82,1.78,.20,8.3,C.ink,true);
}

// 03 — Check-in + Supabase
{
  const s=base(false,3);tag(s,'Live check-in',.72,1.10);title(s,'Check in once. Save it right.',.72,1.50,10.8,.58,false,39);body(s,'The candidate screen captures the essentials; the server stores a validated response and resume in Supabase.',.72,2.19,10.6,.43,false,14);
  const image=path.resolve('assets/checkin-screen-for-slides.png');s.addImage({path:image,x:.78,y:2.92,w:6.15,h:4.05});
  rect(s,7.35,2.92,.41,.07,C.yellow);txt(s,'From screen to Supabase',7.87,2.78,4.5,.33,17,C.ink,true,{fontFace:'Montserrat'});
  [['Candidate response','responses','Name, email, university, major, and UTC check-in time.'],['Resume file','resumes','PDF or DOCX, up to 8 MB, saved with candidate metadata.']].forEach((v,i)=>{let y=3.43+i*1.42;rect(s,7.35,y,5.18,1.17,C.white,C.line,.8);rect(s,7.35,y,.06,1.17,C.yellow);txt(s,v[0],7.64,y+.19,2.96,.26,17,C.ink,true,{fontFace:'Montserrat'});rect(s,11.34,y+.19,.91,.28,C.soft);txt(s,v[1],11.4,y+.25,.82,.14,9,C.ink,false,{fontFace:'Consolas'});body(s,v[2],7.64,y+.62,4.54,.39,false,11.2);});
  ['Required fields','Server validation','Confirmation screen'].forEach((v,i)=>{let x=7.35+[0,1.71,3.47][i];rect(s,x,6.36,[1.58,1.61,1.71][i],.35,C.soft,C.line,.5);txt(s,v,x+.08,6.46,[1.42,1.45,1.55][i],.14,8.8,C.ink,true);});
}

// 04 — Backend
{
  const s=base(true,4);tag(s,'Built backend',.72,1.09,true);title(s,'A clean path from submit\nto saved record.',.72,1.48,10.7,1.2,true,41);body(s,'The server action checks the submission before any candidate record is committed.',.72,2.85,10.2,.44,true,15);
  const steps=[['01','Validate\ndetails','Required fields, email shape, file type, signature, and 8 MB limit.'],['02','Stamp\nthe visit','Capture the check-in instant in UTC for a consistent event record.'],['03','Store\nthe resume','Upload to the Supabase resumes bucket with candidate metadata.'],['04','Write\nthe response','Insert the candidate row, then show check-in confirmation.']];
  steps.forEach((v,i)=>{let x=.72+i*3.08;rect(s,x,3.72,2.89,2.55,C.card);rect(s,x,3.72,2.89,.07,C.yellow);txt(s,v[0],x+.21,3.97,.5,.30,14,C.yellow,true,{fontFace:'Montserrat'});txt(s,v[1],x+.21,4.51,2.42,.73,20,C.white,true,{fontFace:'Montserrat'});body(s,v[2],x+.21,5.40,2.44,.66,true,10.5);});
  rect(s,.72,6.59,11.9,.49,C.ink,'666666',.8);rect(s,.91,6.70,1.49,.28,C.yellow);txt(s,'FAILURE HANDLING',.99,6.78,1.34,.12,8.4,C.ink,true);txt(s,'If the database insert fails, the uploaded resume is removed so records stay in sync.',2.59,6.74,9.36,.23,11,C.light,false);
}

// 05 — Dashboard with logs
{
  const s=base(false,5);tag(s,'Recruiter workspace',.72,1.01);title(s,'Every conversation has a trail.',.72,1.38,9.4,.56,false,37);body(s,'A dashboard concept that keeps candidate profiles, discussion details, and follow-up actions together.',.72,2.05,10.6,.41,false,14);rect(s,10.75,1.38,1.83,.32,C.yellow);txt(s,'NEXT PHASE CONCEPT',10.85,1.48,1.63,.13,8.4,C.ink,true,{charSpacing:.7});
  rect(s,.72,2.66,11.88,4.36,C.white,'CFD0D2',.9);rect(s,.72,2.66,11.88,.44,C.ink);txt(s,'TalentIQ / Recruiter dashboard',.94,2.77,5.5,.20,13,C.white,true,{fontFace:'Montserrat'});txt(s,'CONCEPT VIEW',11.17,2.79,1.18,.16,9,C.yellow,true,{align:'right',charSpacing:1});
  stroke(s,4.04,3.1,0,3.92,C.line);stroke(s,8.45,3.1,0,3.92,C.line);
  txt(s,'Candidates',.94,3.30,2.7,.25,15,C.ink,true,{fontFace:'Montserrat'});rect(s,.94,3.72,2.84,.38,C.soft,'AAAAAA',.7);txt(s,'Search candidates or notes',1.05,3.82,2.62,.14,9,C.muted);
  [['Alex Morgan','UNT · Computer Science'],['Riley Santos','Supply chain · Analytics'],['Jordan Lee','Operations · Business']].forEach((v,i)=>{let y=4.22+i*.63;rect(s,.94,y,2.84,.55,i===0?'FFFCE5':C.white,C.line,.6);if(i===0)rect(s,.94,y,.05,.55,C.yellow);txt(s,v[0],1.09,y+.10,2.5,.20,10.5,C.ink,true);txt(s,v[1],1.09,y+.34,2.5,.12,8,C.muted);});
  txt(s,'Candidate profile',4.27,3.30,3.7,.25,15,C.ink,true,{fontFace:'Montserrat'});txt(s,'Alex Morgan',4.27,3.79,3.65,.33,21,C.ink,true,{fontFace:'Montserrat'});txt(s,'Checked in 10:38 AM · Resume on file',4.27,4.19,3.77,.18,9.5,C.muted);
  ['Python','Forecasting','Inventory'].forEach((v,i)=>{let x=4.27+[0,.87,2.16][i];rect(s,x,4.57,[.77,1.2,1.02][i],.33,'FFF1A8');txt(s,v,x+.08,4.67,[.62,1.04,.86][i],.12,8.7,C.ink,true);});stroke(s,4.27,5.18,3.82,0,C.line);txt(s,'Conversation summary',4.27,5.40,3.79,.24,14,C.ink,true,{fontFace:'Montserrat'});body(s,'Discussed a Python inventory forecasting project, interest in fleet analytics, and internship availability.',4.27,5.78,3.76,.78,false,11.5);
  txt(s,'Conversation log',8.70,3.30,3.55,.25,15,C.ink,true,{fontFace:'Montserrat'});stroke(s,8.91,3.77,0,2.8,C.yellow,2);[['10:42 AM','Met at the booth','Introduced operations and analytics opportunities.'],['10:46 AM','Discussed project work','Candidate explained forecasting model and data tools.'],['10:49 AM','Follow-up marked','Recruiter saved profile for an analytics interview.']].forEach((v,i)=>{let y=3.77+i*.91;s.addShape(S.ellipse,{x:8.83,y:y+.03,w:.16,h:.16,fill:{color:C.yellow},line:{color:C.yellow,width:0}});txt(s,v[0],9.13,y,2.8,.16,8.7,C.muted,true);txt(s,v[1],9.13,y+.23,3.12,.20,11,C.ink,true);body(s,v[2],9.13,y+.48,3.08,.39,false,9.2);});
}

// 06 — Voice filtering
{
  const s=base(true,6);rect(s,.72,1.44,1.84,.33,C.yellow);txt(s,'NEXT PHASE CONCEPT',.83,1.54,1.61,.13,8.5,C.ink,true,{charSpacing:.8});title(s,'Search by',.72,2.04,5.1,.59,true,42);txt(s,'what was said.',.72,2.67,5.9,.66,42,C.yellow,true,{fontFace:'Montserrat'});body(s,'With consent, recruiters can capture or dictate conversation notes. Transcription and topic filters make those discussions searchable later.',.72,3.58,5.34,.91,true,15);
  txt(s,'Voice note  →  Transcript  →  Topic filter  →  Candidate',.72,4.88,5.8,.35,12,C.white,true);
  rect(s,6.83,1.46,5.75,5.54,'292728','696768',.8);txt(s,'VOICE FILTERING SYSTEM',7.19,1.86,4.83,.20,10,C.light,true,{charSpacing:1.4});
  const wave=[.19,.37,.58,.32,.69,.43,.25,.63,.38,.20,.48,.28,.15];wave.forEach((h,i)=>rect(s,8.13+i*.22,2.47+(0.69-h)/2,.06,h,C.yellow));
  rect(s,7.19,3.52,5.03,.73,C.white);txt(s,'VOICE QUERY',7.41,3.61,2.01,.14,8.5,C.muted,true,{charSpacing:1});txt(s,'“Who discussed fleet analytics?”',7.41,3.84,4.53,.25,15,C.ink,true,{fontFace:'Montserrat'});
  stroke(s,7.19,4.68,.37,0,C.yellow,2);rect(s,7.71,4.39,4.51,1.09,'373536');rect(s,7.71,4.39,.05,1.09,C.yellow);txt(s,'Alex Morgan',7.98,4.62,3.74,.27,14,C.white,true,{fontFace:'Montserrat'});body(s,'Matched in conversation log: Python forecasting and interest in fleet analytics.',7.98,4.98,3.84,.35,true,9.7);
  stroke(s,7.19,6.25,5.03,0,'656364');body(s,'Recruiters review the transcript and the original candidate record before follow-up.',7.19,6.45,5.0,.34,true,10.4);
}

// 07 and 08 — Interludes
{const s=base(true);txt(s,'Demo',3.2,2.55,6.95,1.70,93,C.yellow,true,{fontFace:'Montserrat',align:'center'});}
{const s=base(false);txt(s,'Thank you.',2.50,2.68,8.35,1.55,75,C.ink,true,{fontFace:'Montserrat',align:'center'});}

const out=path.resolve('output/TalentIQ-career-fair-Google-Slides.pptx');
fs.mkdirSync(path.dirname(out),{recursive:true});
pptx.writeFile({fileName:out}).then(()=>console.log(out));
