"use client";
import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
export default function Home() {
  const picker=useRef<HTMLInputElement>(null);
  const [files,setFiles]=useState<File[]>([]);
  const [busy,setBusy]=useState(false);
  const [progress,setProgress]=useState(0);
  const [result,setResult]=useState<{code:string;expiresAt:number}|null>(null);
  const [code,setCode]=useState("");
  const [error,setError]=useState("");
  const [checking,setChecking]=useState(false);
  const fmt=(n:number)=>n<1048576?`${(n/1024).toFixed(1)} KB`:n<1073741824?`${(n/1048576).toFixed(1)} MB`:`${(n/1073741824).toFixed(2)} GB`;
  function choose(list:FileList|null){if(list){setFiles(Array.from(list));setResult(null);setError("");setProgress(0);}}
  async function send(){
    if(!files.length||busy)return;
    setBusy(true);setError("");setResult(null);setProgress(0);
    try{
      const init=await fetch("/api/transfers",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({count:files.length})});
      const start=await init.json();if(!init.ok)throw new Error(start.error||"Could not start transfer.");
      for(let i=0;i<files.length;i++){
        const file=files[i];
        const safeName=file.name.replace(/[\\/]/g,"_").replace(/[\u0000-\u001f]/g,"").slice(0,180)||"file";
        await upload(`flashdrop/${start.transferId}/${String(i).padStart(2,"0")}-${safeName}`,file,{
          access:"public",handleUploadUrl:"/api/upload",
          clientPayload:JSON.stringify({transferId:start.transferId,code:start.code,expiresAt:start.expiresAt,index:i,name:file.name})
        });
        setProgress(Math.round((i+1)/files.length*100));
      }
      const done=await fetch(`/api/transfers/${start.transferId}/complete`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({expectedCount:files.length})});
      const final=await done.json();if(!done.ok)throw new Error(final.error||"Could not finish transfer.");
      setResult({code:start.code,expiresAt:start.expiresAt});setFiles([]);if(picker.current)picker.current.value="";
    }catch(e){setError(e instanceof Error?e.message:"Upload failed.");}
    finally{setBusy(false);}
  }
  async function receive(){
    if(code.length!==6){setError("Enter all 6 digits.");return;}
    setChecking(true);setError("");
    try{
      const r=await fetch(`/api/transfers/${code}`);const data=await r.json();if(!r.ok)throw new Error(data.error||"Code not found.");
      if(data.files.length===1)window.location.href=data.files[0].url;
      else data.files.forEach((f:{url:string},i:number)=>window.setTimeout(()=>window.open(f.url,"_blank","noopener,noreferrer"),i*400));
    }catch(e){setError(e instanceof Error?e.message:"Could not find transfer.");}
    finally{setChecking(false);}
  }
  return <main className="shell">
    <nav className="nav"><a className="brand" href="#"><span className="logo">F</span> FlashDrop</a><span className="nav-note">SIMPLE FILE TRANSFER</span></nav>
    <section className="hero"><div className="eyebrow"><span className="pulse"/> NO ACCOUNT NEEDED</div><h1>Send big files.<br/><span>Keep it simple.</span></h1><p className="subtitle">Upload your files, get a 6-digit code, and share it with anyone.</p></section>
    <section className="panels">
      <div className="panel"><div className="panel-head"><div><div className="step">01 / SEND</div><h2>Upload files</h2></div><span className="round-icon">↑</span></div>
        <button className="dropzone" onClick={()=>picker.current?.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();choose(e.dataTransfer.files);}}><span className="upload-icon">↥</span><strong>Choose files to upload</strong><span>or drag and drop them here</span><small>Multiple files supported · up to 20 per transfer</small></button>
        <input ref={picker} type="file" multiple hidden onChange={e=>choose(e.target.files)}/>
        {files.length>0&&<div className="file-list"><div className="file-summary">{files.length} file(s) · {fmt(files.reduce((a,f)=>a+f.size,0))}</div>{files.map((f,i)=><div className="file-row" key={i}><span className="file-symbol">▧</span><span className="file-name">{f.name}</span><span className="file-size">{fmt(f.size)}</span></div>)}</div>}
        {busy&&<div className="progress-wrap"><div className="progress-label"><span>Uploading files…</span><b>{progress}%</b></div><div className="track"><div className="bar" style={{width:`${progress}%`}}/></div></div>}
        <button className="primary" disabled={!files.length||busy} onClick={send}>{busy?"Uploading…":"Submit files"} <span>→</span></button><p className="fine">Transfers expire after 7 days. Storage limits apply.</p>
        {result&&<div className="success"><div className="success-title">Your transfer is ready</div><div className="code">{result.code}</div><p>Share this code. Expires {new Date(result.expiresAt).toLocaleString()}.</p><button className="copy" onClick={()=>navigator.clipboard.writeText(result.code)}>Copy code</button></div>}
      </div>
      <div className="panel receive"><div className="panel-head"><div><div className="step">02 / RECEIVE</div><h2>Get files</h2></div><span className="round-icon">↓</span></div>
        <div className="receive-art"><div className="art-card"><span>▤</span><i>•••</i></div><div className="art-card art-card-back"><span>▧</span><i>•••</i></div><div className="art-arrow">↓</div></div>
        <label className="input-label" htmlFor="code">Enter your 6-digit code</label><input id="code" className="code-input" inputMode="numeric" maxLength={6} placeholder="000 000" value={code} onChange={e=>{setCode(e.target.value.replace(/\D/g,"").slice(0,6));setError("");}}/>
        <button className="secondary" disabled={checking} onClick={receive}>{checking?"Checking…":"Find my files"} <span>→</span></button><p className="fine">No sign-up. Just enter the code you received.</p>
      </div>
    </section>
    {error&&<div className="error" role="alert">{error}</div>}
    <footer><span>© {new Date().getFullYear()} FlashDrop</span><span>TRANSFER WITH EASE</span></footer>
  </main>;
}
