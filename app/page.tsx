"use client";
import { useEffect, useMemo, useRef, useState } from "react";

type Grid = string[][];
const ROWS = 100, COLS = 26;
const colName = (n:number) => { let s=""; while(n>=0){s=String.fromCharCode(n%26+65)+s;n=Math.floor(n/26)-1;} return s; };
const blank = ():Grid => Array.from({length:ROWS},()=>Array(COLS).fill(""));
const key = (s:number,r:number,c:number) => "master-sheets-v1-"+s+"-"+r+"-"+c;

export default function Home(){
 const [sheets,setSheets]=useState<{name:string;data:Grid}[]>([{name:"Sheet1",data:blank()}]);
 const [active,setActive]=useState(0),[selected,setSelected]=useState<[number,number]>([0,0]);
 const [online,setOnline]=useState(true),[ready,setReady]=useState(false);
 const fileRef=useRef<HTMLInputElement>(null);
 useEffect(()=>{
   try { const raw=localStorage.getItem("master-sheets-data"); if(raw){const parsed=JSON.parse(raw);if(Array.isArray(parsed)&&parsed.length){setSheets(parsed);}} } catch {}
   setOnline(navigator.onLine); const on=()=>setOnline(true),off=()=>setOnline(false);
   window.addEventListener("online",on);window.addEventListener("offline",off);setReady(true);
   return()=>{window.removeEventListener("online",on);window.removeEventListener("offline",off)};
 },[]);
 useEffect(()=>{if(ready)try{localStorage.setItem("master-sheets-data",JSON.stringify(sheets));}catch{}},[sheets,ready]);
 const [r,c]=selected;
 const current=sheets[active]||sheets[0];
 const raw=current?.data?.[r]?.[c]||"";
 const evaluate=(value:string,data:Grid):string=>{
   if(!value.startsWith("="))return value;
   const formula=value.slice(1).toUpperCase().replace(/([A-Z]+)([0-9]+)/g,(_,letters,row)=>{
     let n=0;for(const ch of letters)n=n*26+ch.charCodeAt(0)-64;
     return String(Number(data[Number(row)-1]?.[n-1]||0)||0);
   });
   const fn=formula.match(/^(SUM|AVERAGE|MIN|MAX|COUNT)\((.*)\)$/);
   if(fn){const nums=fn[2].split(/[,:]/).map(x=>Number(x.trim())).filter(Number.isFinite);if(!nums.length)return "0";const v=fn[1]==="SUM"?nums.reduce((a,b)=>a+b,0):fn[1]==="AVERAGE"?nums.reduce((a,b)=>a+b,0)/nums.length:fn[1]==="MIN"?Math.min(...nums):fn[1]==="MAX"?Math.max(...nums):nums.length;return String(v);}
   if(!/^[0-9+\-*/(). %]+$/.test(formula))return "#ERROR";
   try { return String(Function('"use strict";return ('+formula+')')()); } catch { return "#ERROR"; }
 };
 const shown=(rr:number,cc:number)=>evaluate(current.data[rr]?.[cc]||"",current.data);
 const update=(value:string)=>setSheets(old=>old.map((sh,i)=>{if(i!==active)return sh;const data=sh.data.map(row=>row.slice());data[r][c]=value;return {...sh,data};}));
 const addSheet=()=>{setSheets(old=>[...old,{name:"Sheet"+(old.length+1),data:blank()}]);setActive(sheets.length);setSelected([0,0]);};
 const exportCSV=()=>{const csv=current.data.map(row=>row.map(v=>'"'+v.replace(/"/g,'""')+'"').join(",")).join("\n");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"}));a.download=current.name+".csv";a.click();URL.revokeObjectURL(a.href);};
 const importCSV=(f:File)=>{const reader=new FileReader();reader.onload=()=>{const lines=String(reader.result||"").replace(/^\uFEFF/,"").split(/\r?\n/);const data=blank();lines.slice(0,ROWS).forEach((line,ri)=>{const vals=line.match(/("(?:[^"]|"")*"|[^,]*)(,|$)/g)||[];vals.slice(0,COLS).forEach((v,ci)=>{data[ri][ci]=v.replace(/,$/,"").replace(/^"|"$/g,"").replace(/""/g,'"');});});setSheets(old=>old.map((sh,i)=>i===active?{...sh,data}:sh));};reader.readAsText(f);};
 const columns=useMemo(()=>Array.from({length:COLS},(_,i)=>colName(i)),[]);
 return <main><header className="top"><div><div className="brand">▦ MASTER SHEETS</div><div className="sub">আপনার নিজের বাংলা স্প্রেডশিট</div></div><div className="actions"><button className="btn" onClick={()=>fileRef.current?.click()}>Import CSV</button><button className="btn primary" onClick={exportCSV}>Export CSV</button><input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={e=>{if(e.target.files?.[0])importCSV(e.target.files[0]);e.currentTarget.value="";}}/></div></header>
 <section className="wrap"><div className="toolbar"><input aria-label="Cell address" value={colName(c)+(r+1)} readOnly/><input className="formula" aria-label="Formula bar" value={raw} onChange={e=>update(e.target.value)} placeholder="মান বা ফর্মুলা লিখুন (যেমন =SUM(A1:A5))"/><span className="status">{online?"● অনলাইন":"● অফলাইন"} · {ready?"ডিভাইসে সেভ হচ্ছে":"লোড হচ্ছে"}</span></div>
 <div className="sheetbox"><table><thead><tr><th></th>{columns.map(x=><th key={x}>{x}</th>)}</tr></thead><tbody>{current.data.map((row,ri)=><tr key={ri}><td>{ri+1}</td>{row.map((value,ci)=><td key={ci} onClick={()=>setSelected([ri,ci])}><input aria-label={colName(ci)+(ri+1)} value={shown(ri,ci)} onFocus={()=>setSelected([ri,ci])} onChange={e=>{setSelected([ri,ci]);setSheets(old=>old.map((sh,i)=>{if(i!==active)return sh;const data=sh.data.map(x=>x.slice());data[ri][ci]=e.target.value;return {...sh,data};}));}} /></td>)}</tr>)}</tbody></table></div>
 <div className="tabs">{sheets.map((sh,i)=><button key={i} className={"tab "+(active===i?"active":"")} onClick={()=>{setActive(i);setSelected([0,0]);}}>{sh.name}</button>)}<button className="tab" onClick={addSheet}>＋ নতুন শিট</button></div>
 <p className="hint">ফর্মুলা: =SUM(A1:A5), =AVERAGE(A1:A5), =MIN(A1:A5), =MAX(A1:A5), =COUNT(A1:A5) · CSV ইমপোর্ট/এক্সপোর্ট · স্বয়ংক্রিয় লোকাল সেভ</p>
 <p className="mobile-note">নোট: এখনকার সংস্করণে ডেটা এই ডিভাইসের ব্রাউজারে অফলাইনে সেভ থাকে। একাধিক ডিভাইসে অনলাইন সিঙ্ক এখনো যুক্ত করা হয়নি।</p></section></main>;
}