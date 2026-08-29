import express from 'express';
import path from 'path';
import {fileURLToPath} from 'url';
import fs from 'fs';

const __filename=fileURLToPath(import.meta.url); const __dirname=path.dirname(__filename);
const app=express(); const PORT=Number(process.env.PORT||3000);
app.use(express.json());

type Facility={id:string,name:string,district:string,type:string,phone:string,distanceKm:number};
type Medicine={id:string,name:string,generic:string,facilityId:string,facilityName:string,quantity:number,minStock:number,batch:string,expiry:string,updatedAt:string};
type Bed={id:string,facilityId:string,facilityName:string,category:string,total:number,available:number,updatedAt:string};
type Blood={id:string,facilityId:string,facilityName:string,group:string,units:number,updatedAt:string};
type Referral={id:string,patient:string,fromFacility:string,specialty:string,urgency:string,recommendedFacility:string,reason:string,status:string,createdAt:string};
interface DB{facilities:Facility[];medicines:Medicine[];beds:Bed[];blood:Blood[];organs:{id:string;type:string;available:number;location:string;status:string}[];referrals:Referral[]}
const dataFile=path.join(__dirname,'server','data.json'); fs.mkdirSync(path.dirname(dataFile),{recursive:true});
const seed:DB={
 facilities:[
  {id:'f1',name:'Government District Hospital, Thanjavur',district:'Thanjavur',type:'District Hospital',phone:'04362-230001',distanceKm:8},
  {id:'f2',name:'Government PHC, Papanasam',district:'Thanjavur',type:'PHC',phone:'04374-222101',distanceKm:14},
  {id:'f3',name:'Government Medical College Hospital',district:'Thanjavur',type:'Medical College',phone:'04362-264001',distanceKm:11},
  {id:'f4',name:'Government PHC, Orathanadu',district:'Thanjavur',type:'PHC',phone:'04374-282201',distanceKm:22}
 ],
 medicines:[
  {id:'m1',name:'Paracetamol 500mg',generic:'Paracetamol',facilityId:'f2',facilityName:'Government PHC, Papanasam',quantity:240,minStock:50,batch:'PCM-PAP-26A',expiry:'2027-05-31',updatedAt:new Date().toISOString()},
  {id:'m2',name:'Insulin Regular 100IU',generic:'Human insulin',facilityId:'f1',facilityName:'Government District Hospital, Thanjavur',quantity:18,minStock:10,batch:'INS-THJ-26B',expiry:'2027-01-31',updatedAt:new Date().toISOString()},
  {id:'m3',name:'Amoxicillin 500mg',generic:'Amoxicillin',facilityId:'f4',facilityName:'Government PHC, Orathanadu',quantity:82,minStock:25,batch:'AMX-ORA-26C',expiry:'2027-08-31',updatedAt:new Date().toISOString()},
  {id:'m4',name:'ORS Sachet',generic:'Oral rehydration salts',facilityId:'f3',facilityName:'Government Medical College Hospital',quantity:310,minStock:80,batch:'ORS-GMCH-26D',expiry:'2027-11-30',updatedAt:new Date().toISOString()}
 ],
 beds:[
  {id:'b1',facilityId:'f1',facilityName:'Government District Hospital, Thanjavur',category:'General',total:180,available:72,updatedAt:new Date().toISOString()},
  {id:'b2',facilityId:'f1',facilityName:'Government District Hospital, Thanjavur',category:'ICU',total:24,available:5,updatedAt:new Date().toISOString()},
  {id:'b3',facilityId:'f3',facilityName:'Government Medical College Hospital',category:'General',total:240,available:94,updatedAt:new Date().toISOString()},
  {id:'b4',facilityId:'f3',facilityName:'Government Medical College Hospital',category:'ICU',total:30,available:9,updatedAt:new Date().toISOString()}
 ],
 blood:[
  {id:'bl1',facilityId:'f1',facilityName:'Government District Hospital, Thanjavur',group:'O+',units:42,updatedAt:new Date().toISOString()},
  {id:'bl2',facilityId:'f1',facilityName:'Government District Hospital, Thanjavur',group:'O-',units:8,updatedAt:new Date().toISOString()},
  {id:'bl3',facilityId:'f3',facilityName:'Government Medical College Hospital',group:'A+',units:37,updatedAt:new Date().toISOString()},
  {id:'bl4',facilityId:'f2',facilityName:'Government PHC, Papanasam',group:'B+',units:12,updatedAt:new Date().toISOString()}
 ],
 organs:[{id:'o1',type:'Kidney',available:2,location:'Thanjavur District',status:'Verified'},{id:'o2',type:'Liver',available:1,location:'Thanjavur District',status:'Verified'},{id:'o3',type:'Cornea',available:4,location:'Tamil Nadu Registry',status:'Verified'}],
 referrals:[]
};
function load():DB{try{if(fs.existsSync(dataFile))return JSON.parse(fs.readFileSync(dataFile,'utf8'));}catch{} fs.writeFileSync(dataFile,JSON.stringify(seed,null,2)); return seed;}
let db=load(); const save=()=>fs.writeFileSync(dataFile,JSON.stringify(db,null,2));
const ok=(res:any,data:any)=>res.json({success:true,data});
app.get('/api/health',(_,res)=>ok(res,{status:'ok',version:'5.0.0',aiProvider:'local',geminiRequired:false}));
app.get('/api/facilities',(_,res)=>ok(res,db.facilities));
app.get('/api/medicines',(req,res)=>{const q=String(req.query.q||'').toLowerCase(); ok(res,db.medicines.filter(m=>!q||[m.name,m.generic,m.facilityName].join(' ').toLowerCase().includes(q)));});
app.get('/api/beds',(req,res)=>{const cat=String(req.query.category||''); ok(res,db.beds.filter(b=>!cat||b.category===cat));});
app.get('/api/blood',(req,res)=>{const g=String(req.query.group||''); ok(res,db.blood.filter(b=>!g||b.group===g));});
app.get('/api/organs',(_,res)=>ok(res,db.organs));
app.get('/api/referrals',(_,res)=>ok(res,db.referrals));
app.post('/api/pharmacy/medicines',(req,res)=>{const {name,generic,facilityId,quantity,minStock,batch,expiry}=req.body||{}; const f=db.facilities.find(x=>x.id===facilityId); if(!name||!generic||!f||!Number.isFinite(Number(quantity))||Number(quantity)<0)return res.status(400).json({success:false,error:'Valid medicine, facility and quantity are required.'}); const item:Medicine={id:'m'+Date.now(),name:String(name),generic:String(generic),facilityId:f.id,facilityName:f.name,quantity:Number(quantity),minStock:Number(minStock||0),batch:String(batch||'N/A'),expiry:String(expiry||''),updatedAt:new Date().toISOString()}; db.medicines.unshift(item); save(); ok(res,item);});
app.patch('/api/pharmacy/medicines/:id',(req,res)=>{const m=db.medicines.find(x=>x.id===req.params.id); if(!m)return res.status(404).json({success:false,error:'Medicine not found'}); Object.assign(m,{quantity:Number(req.body.quantity),minStock:Number(req.body.minStock),updatedAt:new Date().toISOString()}); save(); ok(res,m);});
app.post('/api/referrals',(req,res)=>{const {patient,fromFacility,specialty,urgency,notes}=req.body||{}; if(!patient||!fromFacility||!specialty||!urgency)return res.status(400).json({success:false,error:'Patient, origin, specialty and urgency are required.'}); const origin=db.facilities.find(f=>f.id===fromFacility); const candidates=db.facilities.filter(f=>f.id!==fromFacility).map(f=>{const icu=db.beds.filter(b=>b.facilityId===f.id&&b.category==='ICU').reduce((n,b)=>n+b.available,0); const gen=db.beds.filter(b=>b.facilityId===f.id&&b.category==='General').reduce((n,b)=>n+b.available,0); const specialtyFit=(specialty==='Emergency'&&f.type!=='PHC')?25:(specialty==='Cardiology'&&f.type==='Medical College'?30:(specialty==='General Medicine'?20:10)); const bedFit=urgency==='Critical'?icu*4:(icu*2+gen); const distancePenalty=f.distanceKm*1.5; return {f,score:50+specialtyFit+bedFit-distancePenalty};}).sort((a,b)=>b.score-a.score); const best=candidates[0]; const reason=`${urgency} ${specialty} referral: ${best.f.name} ranked highest using facility capability, available beds and distance.`; const r:Referral={id:'r'+Date.now(),patient:String(patient),fromFacility:origin?.name||fromFacility,specialty:String(specialty),urgency:String(urgency),recommendedFacility:best.f.name,reason,status:'Recommended',createdAt:new Date().toISOString()}; db.referrals.unshift(r); save(); ok(res,{...r,score:Math.round(best.score),distanceKm:best.f.distanceKm});});
app.get('/api/stats',(_,res)=>ok(res,{facilities:db.facilities.length,medicines:db.medicines.reduce((n,m)=>n+m.quantity,0),beds:db.beds.reduce((n,b)=>n+b.available,0),icu:db.beds.filter(b=>b.category==='ICU').reduce((n,b)=>n+b.available,0),blood:db.blood.reduce((n,b)=>n+b.units,0),referrals:db.referrals.length}));
app.use(express.static(path.join(__dirname,'dist'))); app.get('*',(req,res)=>{if(req.path.startsWith('/api/'))return res.status(404).json({success:false,error:'API route not found'}); res.sendFile(path.join(__dirname,'dist','index.html'));});
app.listen(PORT,'0.0.0.0',()=>console.log(`REVIVE 5.0 running on http://localhost:${PORT}`));
