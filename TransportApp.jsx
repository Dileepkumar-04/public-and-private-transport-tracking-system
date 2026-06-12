import { useState, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────
const BUSES = [
  { id:"KA01-F-1234", route:"Majestic → Electronic City", stops:["Majestic","Silk Board","HSR Layout","Electronic City"], time:55, price:45, type:"AC Express", seats:12, capacity:40, color:"#6366f1",
    location:{ lat:12.9716, lon:77.5946, stop:"Majestic" }, crowd:78, nextArrival:8 },
  { id:"KA01-G-5678", route:"Majestic → Electronic City", stops:["Majestic","KR Puram","Hoskote","Electronic City"], time:75, price:30, type:"Ordinary", seats:5, capacity:60, color:"#f59e0b",
    location:{ lat:12.9279, lon:77.6271, stop:"Silk Board" }, crowd:92, nextArrival:3 },
  { id:"KA01-H-9012", route:"Shivajinagar → Whitefield", stops:["Shivajinagar","Ulsoor","Marathahalli","Whitefield"], time:40, price:35, type:"Volvo", seats:20, capacity:45, color:"#10b981",
    location:{ lat:12.9850, lon:77.6101, stop:"Shivajinagar" }, crowd:45, nextArrival:12 },
  { id:"KA01-J-3456", route:"Shivajinagar → Whitefield", stops:["Shivajinagar","Indiranagar","Domlur","Whitefield"], time:50, price:55, type:"AC Express", seats:3, capacity:40, color:"#6366f1",
    location:{ lat:12.9719, lon:77.6412, stop:"Indiranagar" }, crowd:96, nextArrival:2 },
  { id:"KA01-K-7890", route:"KSR → Yelahanka", stops:["KSR Station","Yeshwanthpur","Hebbal","Yelahanka"], time:35, price:25, type:"Ordinary", seats:18, capacity:60, color:"#f59e0b",
    location:{ lat:12.9767, lon:77.5713, stop:"KSR Station" }, crowd:30, nextArrival:18 },
  { id:"KA01-L-2345", route:"KSR → Yelahanka", stops:["KSR Station","Malleshwaram","RT Nagar","Yelahanka"], time:45, price:40, type:"Volvo", seats:8, capacity:45, color:"#10b981",
    location:{ lat:13.0012, lon:77.5880, stop:"Hebbal" }, crowd:62, nextArrival:6 },
];
const CITY_POINTS = ["Majestic","Shivajinagar","KSR Station","Electronic City","Whitefield","Yelahanka","Indiranagar","Koramangala","Hebbal","Marathahalli","HSR Layout","Silk Board"];
const QUICK_SPOTS = ["MG Road","Koramangala","Whitefield","Electronic City","Hebbal","Indiranagar","Marathahalli","JP Nagar"];

function haversine(a,b,c,d){const R=6371,t=x=>x*Math.PI/180,dL=t(c-a),dO=t(d-b),e=Math.sin(dL/2)**2+Math.cos(t(a))*Math.cos(t(c))*Math.sin(dO/2)**2;return R*2*Math.atan2(Math.sqrt(e),Math.sqrt(1-e));}
async function geocode(q){const r=await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q+", Bengaluru, India")}&limit=1`,{headers:{"Accept-Language":"en"}});const d=await r.json();if(!d.length)throw new Error("Location not found — try a more specific name");return{lat:parseFloat(d[0].lat),lon:parseFloat(d[0].lon),name:d[0].display_name.split(",").slice(0,2).join(", ")};}

function crowdLabel(pct){if(pct>=90)return{label:"Very Crowded",color:"#ef4444",bg:"rgba(239,68,68,0.12)"};if(pct>=70)return{label:"Crowded",color:"#f97316",bg:"rgba(249,115,22,0.12)"};if(pct>=40)return{label:"Moderate",color:"#f59e0b",bg:"rgba(245,158,11,0.12)"};return{label:"Comfortable",color:"#10b981",bg:"rgba(16,185,129,0.12)"};}

// ─────────────────────────────────────────────────────────────────
// GLOBAL CSS
// ─────────────────────────────────────────────────────────────────
const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Plus Jakarta Sans',sans-serif;}
.tt-input{width:100%;background:rgba(255,255,255,0.07);border:1.5px solid rgba(255,255,255,0.12);border-radius:12px;padding:14px 16px 14px 44px;color:white;font-size:0.95rem;font-family:'Plus Jakarta Sans',sans-serif;outline:none;transition:border 0.2s;}
.tt-input::placeholder{color:rgba(255,255,255,0.35);}
.tt-input:focus{border-color:rgba(139,92,246,0.7);background:rgba(139,92,246,0.08);}
.tt-input-light{width:100%;background:#f8f7ff;border:1.5px solid #ede9fe;border-radius:10px;padding:11px 14px 11px 40px;color:#1e1b4b;font-size:0.9rem;font-family:'Plus Jakarta Sans',sans-serif;outline:none;transition:border 0.2s;}
.tt-input-light::placeholder{color:#a78bfa;}
.tt-input-light:focus{border-color:#8b5cf6;background:#faf5ff;}
.tt-btn-primary{background:linear-gradient(135deg,#7c3aed,#6366f1);color:white;border:none;border-radius:12px;padding:14px 28px;font-size:1rem;font-weight:700;font-family:'Plus Jakarta Sans',sans-serif;cursor:pointer;transition:all 0.2s;letter-spacing:-0.2px;}
.tt-btn-primary:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(99,102,241,0.4);}
.tt-btn-primary:disabled{background:#4b5563;cursor:not-allowed;transform:none;box-shadow:none;}
.tt-chip{padding:7px 16px;background:rgba(139,92,246,0.12);border:1px solid rgba(139,92,246,0.25);border-radius:24px;color:#a78bfa;font-size:0.82rem;font-weight:600;cursor:pointer;transition:all 0.15s;white-space:nowrap;font-family:'Plus Jakarta Sans',sans-serif;}
.tt-chip:hover{background:rgba(139,92,246,0.22);color:#c4b5fd;}
.bcard{background:white;border-radius:16px;border-left:4px solid #ccc;box-shadow:0 2px 12px rgba(0,0,0,0.07);margin-bottom:1rem;padding:1.1rem 1.4rem;transition:all 0.2s;}
.bcard:hover{box-shadow:0 6px 24px rgba(0,0,0,0.12);transform:translateY(-2px);}
.vcard{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:1.25rem 1.4rem;transition:all 0.2s;}
.vcard:hover{background:rgba(255,255,255,0.07);border-color:rgba(139,92,246,0.35);transform:translateX(4px);}
.fadein{animation:fadein 0.45s ease forwards;}
@keyframes fadein{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.spin{animation:spin 1s linear infinite;}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
.blink{animation:blink 1s step-end infinite;}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
.ping{animation:ping 1.4s ease-in-out infinite;}
@keyframes ping{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.5);opacity:0}}
.slide-up{animation:slideup 0.4s cubic-bezier(.16,1,.3,1) forwards;}
@keyframes slideup{from{opacity:0;transform:translateY(32px)}to{opacity:1;transform:none}}
select.tt-input-light{appearance:none;}
::-webkit-scrollbar{width:4px;height:4px;}
::-webkit-scrollbar-thumb{background:rgba(139,92,246,0.3);border-radius:4px;}
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);z-index:100;display:flex;align-items:flex-end;justify-content:center;}
.modal-box{background:white;border-radius:24px 24px 0 0;padding:2rem;width:100%;max-width:500px;max-height:90vh;overflow-y:auto;}
.tab-btn{flex:1;padding:10px;border:none;background:transparent;font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:0.85rem;cursor:pointer;border-bottom:2px solid transparent;color:#9ca3af;transition:all 0.2s;}
.tab-btn.active{color:#6366f1;border-bottom-color:#6366f1;}
.progress-bar{height:6px;border-radius:3px;background:#e5e7eb;overflow:hidden;}
.progress-fill{height:100%;border-radius:3px;transition:width 0.6s ease;}
`;
function InjectStyles(){useEffect(()=>{const el=document.createElement("style");el.textContent=CSS;document.head.appendChild(el);return()=>document.head.removeChild(el);},[]);return null;}

// ─────────────────────────────────────────────────────────────────
// SVG MAP  (shared by both modes)
// ─────────────────────────────────────────────────────────────────
function RouteMap({from,to,busMarkers=[],vehiclePos=null}){
  if(!from||!to)return null;
  const W=600,H=210,P=52;
  const allLats=[from.lat,to.lat,...busMarkers.map(b=>b.lat),(vehiclePos?.lat)||null].filter(Boolean);
  const allLons=[from.lon,to.lon,...busMarkers.map(b=>b.lon),(vehiclePos?.lon)||null].filter(Boolean);
  const latSpan=Math.max(Math.max(...allLats)-Math.min(...allLats),0.018);
  const lonSpan=Math.max(Math.max(...allLons)-Math.min(...allLons),0.018);
  const minLat=Math.min(...allLats)-latSpan*0.15;
  const minLon=Math.min(...allLons)-lonSpan*0.15;
  const toX=lon=>P+((lon-minLon)/(lonSpan*1.3))*(W-2*P);
  const toY=lat=>H-P-((lat-minLat)/(latSpan*1.3))*(H-2*P);
  const fx=toX(from.lon),fy=toY(from.lat),tx=toX(to.lon),ty=toY(to.lat);
  const cx=(fx+tx)/2,cy=Math.min(fy,ty)-28;
  const t2=0.5;
  const midX=(1-t2)**2*fx+2*(1-t2)*t2*cx+t2**2*tx;
  const midY=(1-t2)**2*fy+2*(1-t2)*t2*cy+t2**2*ty;
  return(
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",display:"block"}}>
      <defs>
        <radialGradient id="gF"><stop offset="0%" stopColor="#34d399" stopOpacity="0.35"/><stop offset="100%" stopColor="#34d399" stopOpacity="0"/></radialGradient>
        <radialGradient id="gT"><stop offset="0%" stopColor="#f87171" stopOpacity="0.35"/><stop offset="100%" stopColor="#f87171" stopOpacity="0"/></radialGradient>
        <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#34d399"/><stop offset="100%" stopColor="#f87171"/></linearGradient>
      </defs>
      {Array.from({length:5},(_,i)=>Array.from({length:11},(_,j)=>(
        <circle key={`${i}${j}`} cx={j*(W/10)} cy={i*(H/4)} r="1" fill="rgba(255,255,255,0.05)"/>
      )))}
      <circle cx={fx} cy={fy} r="26" fill="url(#gF)"/>
      <circle cx={tx} cy={ty} r="26" fill="url(#gT)"/>
      <path d={`M ${fx} ${fy} Q ${cx} ${cy} ${tx} ${ty}`} stroke="rgba(139,92,246,0.15)" strokeWidth="9" fill="none" strokeLinecap="round"/>
      <path d={`M ${fx} ${fy} Q ${cx} ${cy} ${tx} ${ty}`} stroke="url(#rg)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeDasharray="7 4"/>
      {/* vehicle at midpoint or custom pos */}
      {vehiclePos?(()=>{const vx=toX(vehiclePos.lon),vy=toY(vehiclePos.lat);return(<><circle cx={vx} cy={vy} r="16" fill="#1e1b4b" stroke="#8b5cf6" strokeWidth="2"/><text x={vx} y={vy+5} textAnchor="middle" fontSize="14">🚗</text></>);})():(
        <><circle cx={midX} cy={midY} r="14" fill="#1e1b4b" stroke="rgba(139,92,246,0.6)" strokeWidth="1.5"/><text x={midX} y={midY+5} textAnchor="middle" fontSize="13">🚗</text></>
      )}
      {/* bus markers */}
      {busMarkers.map((b,i)=>{const bx=toX(b.lon),by=toY(b.lat);return(
        <g key={i}><circle cx={bx} cy={by} r="12" fill={b.color} opacity="0.9"/><text x={bx} y={by+4} textAnchor="middle" fontSize="11">🚌</text></g>
      );})}
      {/* FROM pin */}
      <circle cx={fx} cy={fy} r="8" fill="#34d399"/><circle cx={fx} cy={fy} r="4" fill="white"/>
      <rect x={fx+12} y={fy-14} width={Math.min(from.name.length*5.5+14,148)} height="19" rx="5" fill="rgba(52,211,153,0.18)" stroke="rgba(52,211,153,0.4)" strokeWidth="1"/>
      <text x={fx+19} y={fy+0} fontSize="10" fill="#6ee7b7" fontWeight="700" fontFamily="'Plus Jakarta Sans',sans-serif">{from.name.length>24?from.name.slice(0,24)+"…":from.name}</text>
      {/* TO pin */}
      <circle cx={tx} cy={ty} r="8" fill="#f87171"/><circle cx={tx} cy={ty} r="4" fill="white"/>
      {(()=>{const lw=Math.min(to.name.length*5.5+14,148);return(<>
        <rect x={tx-lw-12} y={ty+4} width={lw} height="19" rx="5" fill="rgba(248,113,113,0.18)" stroke="rgba(248,113,113,0.4)" strokeWidth="1"/>
        <text x={tx-lw-5} y={ty+17} fontSize="10" fill="#fca5a5" fontWeight="700" fontFamily="'Plus Jakarta Sans',sans-serif">{to.name.length>24?to.name.slice(0,24)+"…":to.name}</text>
      </>);})()} 
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────
// TICKET BOOKING MODAL
// ─────────────────────────────────────────────────────────────────
function BookingModal({bus,onClose,onConfirm}){
  const [qty,setQty]=useState(1);
  const [name,setName]=useState("");
  const [phone,setPhone]=useState("");
  const [step,setStep]=useState(1);// 1=form 2=confirm 3=done
  const [tid,setTid]=useState("");
  const total=bus.price*qty;
  const confirm=()=>{if(!name.trim()||!phone.trim())return;const id="TT"+Math.random().toString(36).slice(2,8).toUpperCase();setTid(id);setStep(3);onConfirm&&onConfirm({bus,qty,total,tid:id,name});};
  return(
    <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div className="modal-box slide-up">
        {step<3&&<>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.5rem"}}>
            <div>
              <p style={{fontSize:"0.72rem",fontWeight:"700",color:"#6366f1",letterSpacing:"0.06em"}}>BOOK TICKET</p>
              <h2 style={{fontWeight:"800",fontSize:"1.2rem",color:"#1e1b4b"}}>{bus.id}</h2>
              <p style={{fontSize:"0.82rem",color:"#6b7280",marginTop:"2px"}}>{bus.route}</p>
            </div>
            <button onClick={onClose} style={{background:"#f3f4f6",border:"none",borderRadius:"50%",width:"36px",height:"36px",cursor:"pointer",fontSize:"1.1rem"}}>×</button>
          </div>
          {step===1&&<>
            <div style={{background:"#f8f7ff",borderRadius:"12px",padding:"1rem",marginBottom:"1rem"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:"0.5rem"}}>
                <span style={{fontSize:"0.82rem",color:"#6b7280"}}>Base fare</span>
                <span style={{fontWeight:"700",color:"#1e1b4b"}}>₹{bus.price}</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:"0.5rem"}}>
                <span style={{fontSize:"0.82rem",color:"#6b7280"}}>Type</span>
                <span style={{fontWeight:"700",color:"#6366f1"}}>{bus.type}</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <span style={{fontSize:"0.82rem",color:"#6b7280"}}>Available seats</span>
                <span style={{fontWeight:"700",color:bus.seats<=5?"#ef4444":"#10b981"}}>{bus.seats}</span>
              </div>
            </div>
            <label style={{fontSize:"0.8rem",fontWeight:"700",color:"#374151",display:"block",marginBottom:"6px"}}>PASSENGER NAME</label>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Full name" className="tt-input-light" style={{paddingLeft:"14px",marginBottom:"0.75rem"}}/>
            <label style={{fontSize:"0.8rem",fontWeight:"700",color:"#374151",display:"block",marginBottom:"6px"}}>PHONE NUMBER</label>
            <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="10-digit mobile" className="tt-input-light" style={{paddingLeft:"14px",marginBottom:"0.75rem"}}/>
            <label style={{fontSize:"0.8rem",fontWeight:"700",color:"#374151",display:"block",marginBottom:"6px"}}>NUMBER OF TICKETS</label>
            <div style={{display:"flex",alignItems:"center",gap:"1rem",marginBottom:"1.25rem"}}>
              <button onClick={()=>setQty(Math.max(1,qty-1))} style={{width:"36px",height:"36px",borderRadius:"50%",border:"1.5px solid #e5e7eb",background:"white",fontSize:"1.2rem",cursor:"pointer",fontWeight:"700"}}>−</button>
              <span style={{fontWeight:"800",fontSize:"1.3rem",color:"#1e1b4b",minWidth:"24px",textAlign:"center"}}>{qty}</span>
              <button onClick={()=>setQty(Math.min(bus.seats,qty+1))} style={{width:"36px",height:"36px",borderRadius:"50%",border:"1.5px solid #e5e7eb",background:"white",fontSize:"1.2rem",cursor:"pointer",fontWeight:"700"}}>+</button>
              <div style={{flex:1,textAlign:"right"}}>
                <div style={{fontSize:"1.4rem",fontWeight:"800",color:"#6366f1"}}>₹{total}</div>
                <div style={{fontSize:"0.72rem",color:"#9ca3af"}}>total</div>
              </div>
            </div>
            <button onClick={()=>{if(name&&phone)setStep(2);}} style={{width:"100%",padding:"13px",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"white",border:"none",borderRadius:"12px",fontWeight:"700",fontSize:"0.95rem",cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Review Booking →</button>
          </>}
          {step===2&&<>
            <div style={{background:"#f8f7ff",borderRadius:"12px",padding:"1.1rem",marginBottom:"1rem"}}>
              {[["Passenger",name],["Phone",phone],["Route",bus.route],["Bus",bus.id],["Tickets",qty],["Total",`₹${total}`]].map(([k,v])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #ede9fe"}}>
                  <span style={{fontSize:"0.82rem",color:"#6b7280"}}>{k}</span>
                  <span style={{fontWeight:"700",color:"#1e1b4b",fontSize:"0.88rem"}}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:"10px"}}>
              <button onClick={()=>setStep(1)} style={{flex:1,padding:"13px",background:"#f3f4f6",border:"none",borderRadius:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>← Edit</button>
              <button onClick={confirm} style={{flex:2,padding:"13px",background:"linear-gradient(135deg,#10b981,#059669)",color:"white",border:"none",borderRadius:"12px",fontWeight:"700",fontSize:"0.95rem",cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Confirm & Pay ₹{total}</button>
            </div>
          </>}
        </>}
        {step===3&&(
          <div style={{textAlign:"center",padding:"1rem 0 0.5rem"}}>
            <div style={{width:"72px",height:"72px",borderRadius:"50%",background:"linear-gradient(135deg,#10b981,#059669)",margin:"0 auto 1.25rem",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"2rem"}}>✓</div>
            <h2 style={{fontWeight:"800",fontSize:"1.3rem",color:"#1e1b4b",marginBottom:"0.4rem"}}>Booking Confirmed!</h2>
            <p style={{color:"#6b7280",fontSize:"0.9rem",marginBottom:"1.5rem"}}>Your ticket is ready</p>
            <div style={{background:"linear-gradient(135deg,#1e1b4b,#312e81)",borderRadius:"16px",padding:"1.4rem",marginBottom:"1.25rem",textAlign:"left"}}>
              <div style={{fontSize:"0.68rem",color:"rgba(255,255,255,0.5)",letterSpacing:"0.1em",marginBottom:"4px"}}>BOOKING ID</div>
              <div style={{fontSize:"1.6rem",fontWeight:"800",color:"white",letterSpacing:"0.05em",marginBottom:"1rem"}}>{tid}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
                {[["Passenger",name],["Bus",bus.id],["Tickets",qty+" seat(s)"],["Amount","₹"+total]].map(([k,v])=>(
                  <div key={k}><div style={{fontSize:"0.68rem",color:"rgba(255,255,255,0.4)"}}>{k}</div><div style={{fontWeight:"700",color:"white",fontSize:"0.88rem"}}>{v}</div></div>
                ))}
              </div>
            </div>
            <button onClick={onClose} style={{width:"100%",padding:"13px",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"white",border:"none",borderRadius:"12px",fontWeight:"700",fontSize:"0.95rem",cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// CROWD BAR
// ─────────────────────────────────────────────────────────────────
function CrowdBar({pct}){
  const {label,color}=crowdLabel(pct);
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}>
        <span style={{fontSize:"0.72rem",color:"#9ca3af"}}>👥 Crowd</span>
        <span style={{fontSize:"0.72rem",fontWeight:"700",color}}>{label} ({pct}%)</span>
      </div>
      <div className="progress-bar"><div className="progress-fill" style={{width:`${pct}%`,background:color}}/></div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// PUBLIC SEARCH PAGE
// ─────────────────────────────────────────────────────────────────
function PublicSearchPage({user,onBack}){
  const [from,setFrom]=useState("");
  const [to,setTo]=useState("");
  const [results,setResults]=useState(null);
  const [sortBy,setSortBy]=useState("time");// time|price|crowd
  const [filterType,setFilterType]=useState("All");
  const [bookingBus,setBookingBus]=useState(null);
  const [bookedIds,setBookedIds]=useState([]);
  const [tab,setTab]=useState("search");// search|map

  const search=()=>{
    if(!from||!to)return;
    const found=BUSES.filter(b=>b.stops.some(s=>s.toLowerCase().includes(from.toLowerCase()))&&b.stops.some(s=>s.toLowerCase().includes(to.toLowerCase())));
    setResults(found);
  };

  const sorted=results?[...results].filter(b=>filterType==="All"||b.type===filterType).sort((a,b)=>{
    if(sortBy==="price")return a.price-b.price;
    if(sortBy==="crowd")return a.crowd-b.crowd;
    return a.time-b.time;
  }):null;

  const mapBuses=sorted?sorted.map(b=>({lat:b.location.lat,lon:b.location.lon,color:b.color})):[];

  // from/to coords for map (approximate based on stops)
  const STOP_COORDS={
    "Majestic":{lat:12.9767,lon:77.5713},"Shivajinagar":{lat:12.9850,lon:77.6101},
    "KSR Station":{lat:12.9767,lon:77.5713},"Electronic City":{lat:12.8406,lon:77.6770},
    "Whitefield":{lat:12.9698,lon:77.7500},"Yelahanka":{lat:13.1007,lon:77.5963},
    "Indiranagar":{lat:12.9784,lon:77.6408},"Koramangala":{lat:12.9352,lon:77.6245},
    "Hebbal":{lat:13.0350,lon:77.5970},"Marathahalli":{lat:12.9591,lon:77.6972},
    "HSR Layout":{lat:12.9116,lon:77.6474},"Silk Board":{lat:12.9172,lon:77.6225},
  };
  const fromCoord=STOP_COORDS[from]||null;
  const toCoord=STOP_COORDS[to]||null;

  return(
    <div style={{minHeight:"100vh",background:"#f0f4ff",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#1d4ed8,#4f46e5)",padding:"1.25rem 1.5rem 0",color:"white"}}>
        <div style={{maxWidth:"740px",margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1.1rem"}}>
            <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
              <button onClick={onBack} style={{background:"rgba(255,255,255,0.18)",border:"none",color:"white",borderRadius:"8px",padding:"7px 14px",cursor:"pointer",fontSize:"0.84rem",fontWeight:"600",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>← Home</button>
              <span style={{fontWeight:"800",fontSize:"1rem"}}>{user.mode==="driver"?`Driver — ${user.busNo}`:"Public Bus Finder"}</span>
            </div>
            <span style={{fontSize:"0.72rem",background:"rgba(255,255,255,0.15)",borderRadius:"20px",padding:"4px 12px",fontWeight:"600"}}>{user.mode==="driver"?"🚌 On Duty":"🧍 Passenger"}</span>
          </div>
          {/* Search bar */}
          <div style={{background:"white",borderRadius:"14px 14px 0 0",padding:"1.1rem 1.25rem 0"}}>
            <div style={{display:"flex",gap:"8px",alignItems:"flex-end",flexWrap:"wrap",paddingBottom:"0"}}>
              <div style={{flex:1,minWidth:"120px"}}>
                <label style={{fontSize:"0.7rem",fontWeight:"700",color:"#6366f1",display:"block",marginBottom:"5px",letterSpacing:"0.06em"}}>FROM</label>
                <select value={from} onChange={e=>setFrom(e.target.value)} className="tt-input-light" style={{paddingLeft:"10px"}}>
                  <option value="">Select stop</option>{CITY_POINTS.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div style={{paddingBottom:"8px",color:"#9ca3af",fontSize:"1rem"}}>⇄</div>
              <div style={{flex:1,minWidth:"120px"}}>
                <label style={{fontSize:"0.7rem",fontWeight:"700",color:"#ef4444",display:"block",marginBottom:"5px",letterSpacing:"0.06em"}}>TO</label>
                <select value={to} onChange={e=>setTo(e.target.value)} className="tt-input-light" style={{paddingLeft:"10px"}}>
                  <option value="">Select stop</option>{CITY_POINTS.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <button onClick={search} style={{padding:"11px 22px",background:"linear-gradient(135deg,#4f46e5,#3b82f6)",color:"white",border:"none",borderRadius:"10px",fontWeight:"700",cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:"0.9rem",marginBottom:"0px"}}>Search 🔍</button>
            </div>
            {/* Tabs */}
            <div style={{display:"flex",marginTop:"0.75rem",borderTop:"1px solid #f3f4f6"}}>
              {["search","map"].map(t=>(
                <button key={t} className={`tab-btn${tab===t?" active":""}`} onClick={()=>setTab(t)} style={{textTransform:"capitalize"}}>{t==="search"?"🔍 Results":"🗺️ Map View"}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{maxWidth:"740px",margin:"0 auto",padding:"1rem 1.5rem 3rem"}}>

        {/* Map View */}
        {tab==="map"&&sorted&&fromCoord&&toCoord&&(
          <div className="fadein" style={{background:"rgba(13,11,30,0.95)",borderRadius:"16px",overflow:"hidden",marginBottom:"1rem",border:"1px solid rgba(139,92,246,0.2)"}}>
            <div style={{padding:"0.75rem 1rem",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:"0.75rem",color:"rgba(255,255,255,0.5)",fontWeight:"700",letterSpacing:"0.06em"}}>LIVE BUS LOCATIONS</span>
              <span style={{fontSize:"0.72rem",color:"#a78bfa"}}>{sorted.length} bus{sorted.length!==1?"es":""} on route</span>
            </div>
            <RouteMap from={{...fromCoord,name:from}} to={{...toCoord,name:to}} busMarkers={mapBuses}/>
            <div style={{padding:"0.75rem 1rem",display:"flex",gap:"16px",flexWrap:"wrap"}}>
              {sorted.map(b=>(
                <div key={b.id} style={{display:"flex",alignItems:"center",gap:"6px"}}>
                  <div style={{width:"8px",height:"8px",borderRadius:"50%",background:b.color}}/>
                  <span style={{fontSize:"0.72rem",color:"rgba(255,255,255,0.6)",fontWeight:"600"}}>{b.id.split("-").slice(-1)[0]}</span>
                  <span style={{fontSize:"0.68rem",color:"rgba(255,255,255,0.35)"}}>{b.location.stop}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab==="map"&&(!sorted||!fromCoord||!toCoord)&&(
          <div style={{textAlign:"center",padding:"3rem",color:"#9ca3af"}}>
            <div style={{fontSize:"2.5rem",marginBottom:"0.75rem"}}>🗺️</div>
            <p style={{fontWeight:"700",color:"#374151"}}>Search for a route first</p>
            <p style={{fontSize:"0.85rem",marginTop:"4px"}}>Select stops and hit Search to see live bus locations</p>
          </div>
        )}

        {/* Results */}
        {tab==="search"&&<>
          {/* Sort & Filter bar */}
          {sorted&&<div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"0.75rem",alignItems:"center"}}>
            <span style={{fontSize:"0.72rem",fontWeight:"700",color:"#6b7280",letterSpacing:"0.06em"}}>SORT:</span>
            {[["time","⏱ Time"],["crowd","👥 Crowd"],...(user.mode==="passenger"?[["price","💰 Price ↑"]]:[] )].map(([k,lbl])=>(
              <button key={k} onClick={()=>setSortBy(k)} style={{padding:"5px 12px",border:`1.5px solid ${sortBy===k?"#6366f1":"#e5e7eb"}`,borderRadius:"20px",background:sortBy===k?"#eef2ff":"white",color:sortBy===k?"#6366f1":"#6b7280",fontWeight:"700",fontSize:"0.78rem",cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{lbl}</button>
            ))}
            <span style={{fontSize:"0.72rem",fontWeight:"700",color:"#6b7280",letterSpacing:"0.06em",marginLeft:"4px"}}>TYPE:</span>
            {["All","AC Express","Volvo","Ordinary"].map(t=>(
              <button key={t} onClick={()=>setFilterType(t)} style={{padding:"5px 12px",border:`1.5px solid ${filterType===t?"#6366f1":"#e5e7eb"}`,borderRadius:"20px",background:filterType===t?"#eef2ff":"white",color:filterType===t?"#6366f1":"#6b7280",fontWeight:"700",fontSize:"0.78rem",cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{t}</button>
            ))}
          </div>}

          {sorted&&sorted.length===0&&<div style={{background:"white",borderRadius:"16px",padding:"2.5rem",textAlign:"center",color:"#6b7280"}}><div style={{fontSize:"2.5rem",marginBottom:"0.75rem"}}>🚌</div><p style={{fontWeight:"700"}}>No buses match filters</p></div>}

          {sorted&&sorted.map((bus,i)=>(
            <div key={bus.id} className="bcard fadein" style={{borderLeftColor:bus.color,animationDelay:`${i*0.07}s`}}>
              {/* Header row */}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:"8px",marginBottom:"0.75rem"}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:"7px",marginBottom:"3px"}}>
                    <span style={{fontWeight:"800",fontSize:"0.95rem",color:"#1e1b4b"}}>{bus.id}</span>
                    <TypeBadge type={bus.type}/>
                    {bookedIds.includes(bus.id)&&<span style={{fontSize:"0.68rem",background:"#dcfce7",color:"#16a34a",borderRadius:"20px",padding:"2px 8px",fontWeight:"700"}}>✓ Booked</span>}
                  </div>
                  <p style={{fontSize:"0.82rem",color:"#6b7280"}}>{bus.route}</p>
                </div>
                {/* Price only for passengers */}
                {user.mode==="passenger"&&(
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:"1.35rem",fontWeight:"800",color:"#1e1b4b"}}>₹{bus.price}</div>
                    <div style={{fontSize:"0.7rem",color:"#9ca3af"}}>per ticket</div>
                  </div>
                )}
                {/* Passenger count for drivers */}
                {user.mode==="driver"&&(()=>{
                  const onboard=Math.round((bus.crowd/100)*bus.capacity);
                  const {color:cc}=crowdLabel(bus.crowd);
                  return(
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:"1.35rem",fontWeight:"800",color:cc}}>{onboard}<span style={{fontSize:"0.7rem",fontWeight:"600",color:"#9ca3af"}}>/{bus.capacity}</span></div>
                      <div style={{fontSize:"0.7rem",color:"#9ca3af"}}>passengers</div>
                    </div>
                  );
                })()}
              </div>

              {/* Stats row — driver sees passenger count instead of seats */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"8px",marginBottom:"0.85rem"}}>
                <MiniStat icon="⏱" label="Travel" value={`${bus.time}m`}/>
                {user.mode==="driver"
                  ? <MiniStat icon="👥" label="On Board" value={Math.round((bus.crowd/100)*bus.capacity)} color={crowdLabel(bus.crowd).color}/>
                  : <MiniStat icon="💺" label="Seats Left" value={bus.seats} color={bus.seats<=5?"#ef4444":bus.seats<=10?"#f97316":"#10b981"}/>
                }
                <MiniStat icon="🛑" label="Stops" value={bus.stops.length}/>
                <MiniStat icon="🕐" label="Arrives" value={`${bus.nextArrival}m`} color="#6366f1"/>
              </div>

              {/* Driver: detailed passenger population panel */}
              {user.mode==="driver"&&(()=>{
                const onboard=Math.round((bus.crowd/100)*bus.capacity);
                const standing=Math.max(0,onboard-Math.round(bus.capacity*0.7));
                const seated=onboard-standing;
                const {label:cl,color:cc,bg:cbg}=crowdLabel(bus.crowd);
                return(
                  <div style={{background:cbg,border:`1px solid ${cc}30`,borderRadius:"10px",padding:"10px 12px",marginBottom:"0.85rem"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
                      <span style={{fontSize:"0.78rem",fontWeight:"700",color:"#374151"}}>🧍 Passenger Population</span>
                      <span style={{fontSize:"0.72rem",fontWeight:"800",color:cc,background:`${cc}18`,padding:"2px 9px",borderRadius:"20px"}}>{cl}</span>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px",marginBottom:"8px"}}>
                      {[["Total",onboard,cc],["Seated",seated,"#6366f1"],["Standing",standing,standing>0?"#f97316":"#9ca3af"]].map(([k,v,c])=>(
                        <div key={k} style={{background:"rgba(255,255,255,0.7)",borderRadius:"7px",padding:"6px 8px",textAlign:"center"}}>
                          <div style={{fontWeight:"800",fontSize:"1rem",color:c}}>{v}</div>
                          <div style={{fontSize:"0.65rem",color:"#6b7280"}}>{k}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}>
                      <span style={{fontSize:"0.68rem",color:"#6b7280"}}>Occupancy</span>
                      <span style={{fontSize:"0.68rem",fontWeight:"700",color:cc}}>{bus.crowd}% of {bus.capacity} capacity</span>
                    </div>
                    <div className="progress-bar"><div className="progress-fill" style={{width:`${bus.crowd}%`,background:cc}}/></div>
                  </div>
                );
              })()}

              {/* Passenger: crowd bar only */}
              {user.mode==="passenger"&&<div style={{marginBottom:"0.85rem"}}><CrowdBar pct={bus.crowd}/></div>}

              {/* Location badge */}
              <div style={{background:"#f8f7ff",borderRadius:"8px",padding:"7px 10px",marginBottom:"0.85rem",display:"flex",alignItems:"center",gap:"8px"}}>
                <span style={{fontSize:"0.9rem"}} className="ping">📍</span>
                <div>
                  <span style={{fontSize:"0.75rem",fontWeight:"700",color:"#6366f1"}}>Current location: </span>
                  <span style={{fontSize:"0.75rem",color:"#374151",fontWeight:"600"}}>{bus.location.stop}</span>
                </div>
                <div style={{marginLeft:"auto",fontSize:"0.7rem",color:"#9ca3af"}}>
                  {bus.location.lat.toFixed(4)}, {bus.location.lon.toFixed(4)}
                </div>
              </div>

              {/* Predicted arrival */}
              <div style={{background:"linear-gradient(135deg,rgba(99,102,241,0.06),rgba(139,92,246,0.06))",borderRadius:"8px",padding:"7px 10px",marginBottom:"0.85rem",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:"0.78rem",fontWeight:"600",color:"#374151"}}>🚌 Predicted arrival at {to||"destination"}</span>
                <span style={{fontWeight:"800",color:"#6366f1",fontSize:"0.9rem"}}>{bus.time} min</span>
              </div>

              {/* Actions */}
              <div style={{display:"flex",gap:"8px",justifyContent:"space-between",alignItems:"center"}}>
                <StopTimeline stops={bus.stops} color={bus.color}/>
                {user.mode!=="driver"&&(
                  <button onClick={()=>setBookingBus(bus)} style={{padding:"9px 20px",background:`linear-gradient(135deg,${bus.color},${bus.color}cc)`,color:"white",border:"none",borderRadius:"10px",fontWeight:"700",fontSize:"0.83rem",cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",whiteSpace:"nowrap",boxShadow:`0 4px 12px ${bus.color}40`}}>Book 🎫</button>
                )}
                {user.mode==="driver"&&<span style={{fontSize:"0.82rem",color:"#16a34a",fontWeight:"700"}}>✅ Active</span>}
              </div>
            </div>
          ))}

          {!sorted&&(
            <div style={{textAlign:"center",padding:"3rem 1rem",color:"#9ca3af"}}>
              <div style={{fontSize:"3rem",marginBottom:"1rem"}}>🔍</div>
              <p style={{fontWeight:"700",color:"#374151",fontSize:"1rem"}}>Select stops and search</p>
              <p style={{fontSize:"0.85rem",marginTop:"4px"}}>Try: Majestic → Electronic City</p>
              {/* Price comparison — passengers only */}
              {user.mode==="passenger"&&(
              <div style={{marginTop:"2rem",background:"white",borderRadius:"14px",padding:"1.25rem",textAlign:"left"}}>
                <p style={{fontWeight:"800",color:"#1e1b4b",marginBottom:"0.75rem",fontSize:"0.9rem"}}>💰 Price Comparison (all routes)</p>
                {[...BUSES].sort((a,b)=>a.price-b.price).map(b=>(
                  <div key={b.id} style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"8px"}}>
                    <div style={{width:"6px",height:"6px",borderRadius:"50%",background:b.color,flexShrink:0}}/>
                    <span style={{fontSize:"0.8rem",color:"#374151",flex:1,fontWeight:"600"}}>{b.id}</span>
                    <TypeBadge type={b.type}/>
                    <span style={{fontWeight:"800",color:"#1e1b4b",fontSize:"0.9rem"}}>₹{b.price}</span>
                  </div>
                ))}
              </div>
              )}
              {/* Crowd overview — drivers only */}
              {user.mode==="driver"&&(
              <div style={{marginTop:"2rem",background:"white",borderRadius:"14px",padding:"1.25rem",textAlign:"left"}}>
                <p style={{fontWeight:"800",color:"#1e1b4b",marginBottom:"0.75rem",fontSize:"0.9rem"}}>👥 Fleet Crowd Overview</p>
                {[...BUSES].sort((a,b)=>b.crowd-a.crowd).map(b=>{
                  const onboard=Math.round((b.crowd/100)*b.capacity);
                  const {label:cl,color:cc}=crowdLabel(b.crowd);
                  return(
                    <div key={b.id} style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"10px"}}>
                      <div style={{width:"6px",height:"38px",borderRadius:"3px",background:cc,flexShrink:0}}/>
                      <div style={{flex:1}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:"3px"}}>
                          <span style={{fontSize:"0.8rem",color:"#374151",fontWeight:"700"}}>{b.id}</span>
                          <span style={{fontSize:"0.78rem",fontWeight:"800",color:cc}}>{onboard}/{b.capacity} 👥</span>
                        </div>
                        <div className="progress-bar"><div className="progress-fill" style={{width:`${b.crowd}%`,background:cc}}/></div>
                        <span style={{fontSize:"0.65rem",color:cc,fontWeight:"600"}}>{cl}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              )}
            </div>
          )}
        </>}
      </div>

      {bookingBus&&<BookingModal bus={bookingBus} onClose={()=>setBookingBus(null)} onConfirm={({bus})=>{setBookedIds(p=>[...p,bus.id]);setBookingBus(null);}}/>}
    </div>
  );
}

function MiniStat({icon,label,value,color}){
  return(
    <div style={{background:"#f8fafc",borderRadius:"8px",padding:"7px 8px",textAlign:"center"}}>
      <div style={{fontSize:"0.65rem",color:"#9ca3af",marginBottom:"2px"}}>{icon} {label}</div>
      <div style={{fontWeight:"800",fontSize:"0.88rem",color:color||"#1e1b4b"}}>{value}</div>
    </div>
  );
}

function TypeBadge({type}){
  const m={
    "AC Express":{bg:"#eff6ff",color:"#1d4ed8"},
    "Ordinary":{bg:"#fff7ed",color:"#c2410c"},
    "Volvo":{bg:"#f5f3ff",color:"#6d28d9"},
  }[type]||{bg:"#f3f4f6",color:"#374151"};
  return <span style={{fontSize:"0.68rem",fontWeight:"700",padding:"2px 8px",borderRadius:"20px",background:m.bg,color:m.color}}>{type}</span>;
}

function StopTimeline({stops,color}){
  return(
    <div style={{display:"flex",alignItems:"center",overflowX:"auto",maxWidth:"220px"}}>
      {stops.map((s,i)=>(
        <div key={s} style={{display:"flex",alignItems:"center"}}>
          <div style={{textAlign:"center",minWidth:"52px"}}>
            <div style={{width:"7px",height:"7px",borderRadius:"50%",background:i===0||i===stops.length-1?color:"#d1d5db",margin:"0 auto 2px",border:`1.5px solid ${color}`}}/>
            <div style={{fontSize:"0.6rem",color:i===0||i===stops.length-1?"#374151":"#9ca3af",fontWeight:i===0||i===stops.length-1?"700":"400",lineHeight:1.2}}>{s.split(" ")[0]}</div>
          </div>
          {i<stops.length-1&&<div style={{width:"14px",height:"1.5px",background:"#e5e7eb",flexShrink:0,marginBottom:"10px"}}/>}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// PRIVATE TRIP PAGE  (with live location tracking)
// ─────────────────────────────────────────────────────────────────
function PrivateTripPage({user,onBack}){
  const [fromText,setFromText]=useState("");
  const [toText,setToText]=useState("");
  const [fromLoc,setFromLoc]=useState(null);
  const [toLoc,setToLoc]=useState(null);
  const [loading,setLoading]=useState(false);
  const [locating,setLocating]=useState(false);
  const [err,setErr]=useState("");
  const [result,setResult]=useState(null);
  const [bookedVehicle,setBookedVehicle]=useState(null);
  const [tracking,setTracking]=useState(false);
  const [vehiclePos,setVehiclePos]=useState(null);
  const [eta,setEta]=useState(null);
  const [elapsed,setElapsed]=useState(0);
  const trackRef=useRef(null);
  const startRef=useRef(null);

  // Simulate vehicle moving from -> to
  const startTracking=useCallback((res)=>{
    if(!res)return;
    setTracking(true);
    startRef.current=Date.now();
    setElapsed(0);
    const totalSec=res.vehicles.find(v=>v.type===bookedVehicle)?.time*60||1800;
    setEta(res.vehicles.find(v=>v.type===bookedVehicle)?.time||30);
    trackRef.current=setInterval(()=>{
      const el=Math.floor((Date.now()-startRef.current)/1000);
      setElapsed(el);
      const frac=Math.min(el/totalSec,1);
      // interpolate lat/lon
      const lat=res.from.lat+(res.to.lat-res.from.lat)*frac;
      const lon=res.from.lon+(res.to.lon-res.from.lon)*frac;
      const remMin=Math.max(Math.round((totalSec-el)/60),0);
      setVehiclePos({lat,lon});
      setEta(remMin);
      if(frac>=1){clearInterval(trackRef.current);setTracking(false);}
    },2000);
  },[bookedVehicle]);

  useEffect(()=>()=>{if(trackRef.current)clearInterval(trackRef.current);},[]);

  const useMyLocation=()=>{
    if(!navigator.geolocation){setErr("Geolocation not supported");return;}
    setLocating(true);setErr("");
    navigator.geolocation.getCurrentPosition(async pos=>{
      try{const{latitude:lat,longitude:lon}=pos.coords;
        const r=await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,{headers:{"Accept-Language":"en"}});
        const d=await r.json();
        const name=d.address?[d.address.road||d.address.suburb||"Your location",d.address.city_district||d.address.city||""].filter(Boolean).join(", "):"Current location";
        setFromText(name);setFromLoc({lat,lon,name});
      }catch{setErr("Could not resolve your address");}
      setLocating(false);
    },()=>{setErr("Location permission denied");setLocating(false);});
  };

  const handleSearch=async()=>{
    if(!fromText.trim()||!toText.trim()){setErr("Enter both locations");return;}
    setLoading(true);setErr("");setResult(null);setBookedVehicle(null);setTracking(false);setVehiclePos(null);
    if(trackRef.current)clearInterval(trackRef.current);
    try{
      const[f,t]=await Promise.all([
        fromLoc&&fromText===fromLoc.name?Promise.resolve(fromLoc):geocode(fromText),
        toLoc&&toText===toLoc.name?Promise.resolve(toLoc):geocode(toText),
      ]);
      setFromLoc(f);setToLoc(t);
      const dist=haversine(f.lat,f.lon,t.lat,t.lon);
      const vehicles=[
        {type:"Hatchback",tag:"Economy",icon:"🚗",speed:32,rate:12,capacity:4,ac:false,color:"#6366f1",accent:"#818cf8"},
        {type:"Sedan",tag:"Comfort",icon:"🚙",speed:30,rate:16,capacity:4,ac:true,color:"#8b5cf6",accent:"#a78bfa"},
        {type:"SUV",tag:"Premium",icon:"🚐",speed:28,rate:22,capacity:7,ac:true,color:"#06b6d4",accent:"#22d3ee"},
        {type:"Mini Bus",tag:"Group",icon:"🚌",speed:24,rate:28,capacity:14,ac:true,color:"#10b981",accent:"#34d399"},
      ].map(v=>({...v,time:Math.round((dist/v.speed)*60),fare:Math.round(dist*v.rate)}));
      setResult({from:f,to:t,dist:Math.round(dist*10)/10,vehicles});
    }catch(e){setErr(e.message);}
    setLoading(false);
  };

  const swap=()=>{setFromText(toText);setToText(fromText);setFromLoc(toLoc);setToLoc(fromLoc);};

  return(
    <div style={{minHeight:"100vh",background:"#0d0b1e",fontFamily:"'Plus Jakarta Sans',sans-serif",color:"white"}}>

      {/* Header */}
      <div style={{background:"linear-gradient(160deg,#13102b 0%,#1a1040 60%,#0d0b1e 100%)",padding:"0 0 2rem",borderBottom:"1px solid rgba(139,92,246,0.15)"}}>
        <div style={{padding:"1.25rem 1.5rem 0",display:"flex",justifyContent:"space-between",alignItems:"center",maxWidth:"720px",margin:"0 auto"}}>
          <button onClick={onBack} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"#c4b5fd",borderRadius:"10px",padding:"8px 16px",cursor:"pointer",fontSize:"0.85rem",fontWeight:"600",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>← Home</button>
          <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
            <div style={{width:"32px",height:"32px",borderRadius:"50%",background:"linear-gradient(135deg,#7c3aed,#6366f1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.85rem",fontWeight:"800"}}>{user.email[0].toUpperCase()}</div>
            <span style={{fontSize:"0.88rem",color:"#a78bfa",fontWeight:"600"}}>{user.email.split("@")[0]}</span>
          </div>
        </div>

        <div style={{textAlign:"center",padding:"2rem 1.5rem 1.5rem",maxWidth:"720px",margin:"0 auto"}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:"8px",background:"rgba(139,92,246,0.1)",border:"1px solid rgba(139,92,246,0.25)",borderRadius:"24px",padding:"6px 16px",marginBottom:"1rem",fontSize:"0.75rem",color:"#a78bfa",fontWeight:"700",letterSpacing:"0.05em"}}>
            <span style={{width:"6px",height:"6px",borderRadius:"50%",background:"#a78bfa",display:"inline-block"}} className="blink"/>
            LIVE ROUTE PLANNER
          </div>
          <h1 style={{fontSize:"1.8rem",fontWeight:"800",letterSpacing:"-0.5px",lineHeight:1.2,marginBottom:"0.4rem"}}>
            Where are you <span style={{background:"linear-gradient(90deg,#a78bfa,#60a5fa,#34d399)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>headed?</span>
          </h1>
        </div>

        {/* Search card */}
        <div style={{maxWidth:"660px",margin:"0 auto",padding:"0 1.5rem"}}>
          <div style={{background:"rgba(255,255,255,0.04)",backdropFilter:"blur(20px)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"20px",padding:"1.4rem",boxShadow:"0 24px 64px rgba(0,0,0,0.4)"}}>
            <div style={{marginBottom:"0.7rem"}}>
              <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"7px"}}>
                <div style={{width:"8px",height:"8px",borderRadius:"50%",background:"#34d399"}}/>
                <span style={{fontSize:"0.7rem",fontWeight:"700",color:"#34d399",letterSpacing:"0.08em"}}>FROM</span>
              </div>
              <div style={{display:"flex",gap:"8px"}}>
                <div style={{position:"relative",flex:1}}>
                  <span style={{position:"absolute",left:"14px",top:"50%",transform:"translateY(-50%)",fontSize:"1rem",pointerEvents:"none"}}>📍</span>
                  <input className="tt-input" value={fromText} onChange={e=>{setFromText(e.target.value);setFromLoc(null);}} onKeyDown={e=>e.key==="Enter"&&handleSearch()} placeholder="e.g. Koramangala 5th Block"/>
                </div>
                <button onClick={useMyLocation} title="Use GPS" style={{padding:"0 15px",background:"rgba(52,211,153,0.1)",border:"1.5px solid rgba(52,211,153,0.25)",borderRadius:"12px",cursor:"pointer",fontSize:"1.1rem",color:"#34d399",flexShrink:0}}>
                  {locating?<span className="spin" style={{display:"inline-block"}}>⏳</span>:"📡"}
                </button>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:"12px",margin:"0.35rem 0"}}>
              <div style={{flex:1,height:"1px",background:"rgba(255,255,255,0.07)"}}/>
              <button onClick={swap} style={{width:"30px",height:"30px",borderRadius:"50%",background:"rgba(139,92,246,0.15)",border:"1px solid rgba(139,92,246,0.3)",color:"#a78bfa",cursor:"pointer",fontSize:"0.9rem",display:"flex",alignItems:"center",justifyContent:"center"}}>⇅</button>
              <div style={{flex:1,height:"1px",background:"rgba(255,255,255,0.07)"}}/>
            </div>
            <div style={{marginBottom:"1rem"}}>
              <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"7px"}}>
                <div style={{width:"8px",height:"8px",borderRadius:"50%",background:"#f87171"}}/>
                <span style={{fontSize:"0.7rem",fontWeight:"700",color:"#f87171",letterSpacing:"0.08em"}}>TO</span>
              </div>
              <div style={{position:"relative"}}>
                <span style={{position:"absolute",left:"14px",top:"50%",transform:"translateY(-50%)",fontSize:"1rem",pointerEvents:"none"}}>🏁</span>
                <input className="tt-input" value={toText} onChange={e=>{setToText(e.target.value);setToLoc(null);}} onKeyDown={e=>e.key==="Enter"&&handleSearch()} placeholder="e.g. Whitefield IT Park"/>
              </div>
            </div>
            {err&&<div style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.25)",borderRadius:"10px",padding:"9px 13px",marginBottom:"1rem",fontSize:"0.84rem",color:"#fca5a5",display:"flex",gap:"8px"}}>⚠️ {err}</div>}
            <button className="tt-btn-primary" onClick={handleSearch} disabled={loading} style={{width:"100%"}}>
              {loading?<span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"10px"}}><span className="spin" style={{display:"inline-block",width:"16px",height:"16px",borderRadius:"50%",border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"white"}}/>Finding route…</span>:"Get Route & Travel Time →"}
            </button>
            {!result&&!loading&&(
              <div style={{marginTop:"0.9rem"}}>
                <p style={{fontSize:"0.7rem",color:"rgba(255,255,255,0.3)",marginBottom:"7px",fontWeight:"600",letterSpacing:"0.05em"}}>QUICK SPOTS</p>
                <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
                  {QUICK_SPOTS.map(s=><button key={s} className="tt-chip" onClick={()=>{if(!fromText)setFromText(s);else setToText(s);}}>{s}</button>)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      <div style={{maxWidth:"660px",margin:"0 auto",padding:"1.5rem 1.5rem 4rem"}}>

        {loading&&<div style={{textAlign:"center",padding:"3rem 0"}}>
          <div style={{width:"44px",height:"44px",borderRadius:"50%",border:"3px solid rgba(139,92,246,0.2)",borderTopColor:"#8b5cf6",margin:"0 auto 1rem"}} className="spin"/>
          <p style={{color:"#a78bfa",fontWeight:"600"}}>Locating addresses…</p>
        </div>}

        {result&&!loading&&<div className="fadein">

          {/* Live tracking panel */}
          {bookedVehicle&&(
            <div style={{background:tracking?"rgba(16,185,129,0.08)":"rgba(99,102,241,0.08)",border:`1px solid ${tracking?"rgba(16,185,129,0.3)":"rgba(99,102,241,0.25)"}`,borderRadius:"16px",padding:"1.1rem 1.25rem",marginBottom:"1rem"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.75rem"}}>
                <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
                  <div style={{width:"10px",height:"10px",borderRadius:"50%",background:tracking?"#10b981":"#6366f1"}} className={tracking?"ping":""}/>
                  <span style={{fontWeight:"700",color:tracking?"#34d399":"#a78bfa",fontSize:"0.9rem"}}>
                    {tracking?"🚗 En Route — Live Tracking":"📍 Tracking Ready"}
                  </span>
                </div>
                {tracking&&<span style={{fontWeight:"800",color:"#34d399",fontSize:"1rem"}}>ETA: {eta} min</span>}
              </div>

              {tracking&&vehiclePos&&(
                <div style={{marginBottom:"0.75rem"}}>
                  <div style={{background:"rgba(13,11,30,0.8)",borderRadius:"12px",overflow:"hidden"}}>
                    <RouteMap from={result.from} to={result.to} vehiclePos={vehiclePos}/>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",marginTop:"8px"}}>
                    <span style={{fontSize:"0.75rem",color:"rgba(255,255,255,0.4)"}}>📍 {vehiclePos.lat.toFixed(5)}, {vehiclePos.lon.toFixed(5)}</span>
                    <span style={{fontSize:"0.75rem",color:"rgba(255,255,255,0.4)"}}>Elapsed: {Math.floor(elapsed/60)}m {elapsed%60}s</span>
                  </div>
                  {/* Progress bar */}
                  <div style={{marginTop:"8px"}}>
                    <div className="progress-bar" style={{background:"rgba(255,255,255,0.1)"}}>
                      <div className="progress-fill" style={{width:`${Math.min((elapsed/(result.vehicles.find(v=>v.type===bookedVehicle)?.time*60||1800))*100,100)}%`,background:"linear-gradient(90deg,#34d399,#10b981)"}}/>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",marginTop:"4px"}}>
                      <span style={{fontSize:"0.68rem",color:"#34d399",fontWeight:"600"}}>{result.from.name.split(",")[0]}</span>
                      <span style={{fontSize:"0.68rem",color:"#f87171",fontWeight:"600"}}>{result.to.name.split(",")[0]}</span>
                    </div>
                  </div>
                </div>
              )}

              {!tracking&&<button onClick={()=>startTracking(result)} style={{width:"100%",padding:"10px",background:"linear-gradient(135deg,#10b981,#059669)",color:"white",border:"none",borderRadius:"10px",fontWeight:"700",fontSize:"0.9rem",cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                🚗 Start Live Tracking
              </button>}
            </div>
          )}

          {/* Map */}
          {!tracking&&<div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"20px",overflow:"hidden",marginBottom:"1rem"}}>
            <div style={{padding:"0.75rem 1.1rem 0",display:"flex",justifyContent:"space-between"}}>
              <span style={{fontSize:"0.72rem",color:"rgba(255,255,255,0.4)",fontWeight:"700",letterSpacing:"0.06em"}}>ROUTE OVERVIEW</span>
              <span style={{fontSize:"0.75rem",color:"#a78bfa",fontWeight:"700"}}>{result.dist} km</span>
            </div>
            <RouteMap from={result.from} to={result.to}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:"8px",padding:"0.6rem 1.1rem 0.9rem",alignItems:"center"}}>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:"5px",marginBottom:"2px"}}><div style={{width:"7px",height:"7px",borderRadius:"50%",background:"#34d399"}}/><span style={{fontSize:"0.66rem",color:"#34d399",fontWeight:"700"}}>FROM</span></div>
                <p style={{fontSize:"0.82rem",color:"white",fontWeight:"600",lineHeight:1.3}}>{result.from.name}</p>
                <p style={{fontSize:"0.67rem",color:"rgba(255,255,255,0.3)",marginTop:"2px",fontFamily:"monospace"}}>{result.from.lat.toFixed(4)}, {result.from.lon.toFixed(4)}</p>
              </div>
              <div style={{width:"28px",height:"28px",borderRadius:"50%",background:"rgba(139,92,246,0.15)",border:"1px solid rgba(139,92,246,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.85rem",flexShrink:0}}>→</div>
              <div style={{textAlign:"right"}}>
                <div style={{display:"flex",alignItems:"center",gap:"5px",marginBottom:"2px",justifyContent:"flex-end"}}><span style={{fontSize:"0.66rem",color:"#f87171",fontWeight:"700"}}>TO</span><div style={{width:"7px",height:"7px",borderRadius:"50%",background:"#f87171"}}/></div>
                <p style={{fontSize:"0.82rem",color:"white",fontWeight:"600",lineHeight:1.3}}>{result.to.name}</p>
                <p style={{fontSize:"0.67rem",color:"rgba(255,255,255,0.3)",marginTop:"2px",fontFamily:"monospace"}}>{result.to.lat.toFixed(4)}, {result.to.lon.toFixed(4)}</p>
              </div>
            </div>
          </div>}

          {/* Stats */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"10px",marginBottom:"1rem"}}>
            {[{label:"Distance",value:`${result.dist} km`,icon:"📏"},{label:"Fastest",value:`${result.vehicles[0].time} min`,icon:"⚡"},{label:"Traffic",value:"Moderate",icon:"🚦"}].map(s=>(
              <div key={s.label} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"12px",padding:"0.85rem",textAlign:"center"}}>
                <div style={{fontSize:"1.2rem",marginBottom:"3px"}}>{s.icon}</div>
                <div style={{fontWeight:"800",fontSize:"0.95rem"}}>{s.value}</div>
                <div style={{fontSize:"0.65rem",color:"rgba(255,255,255,0.35)",marginTop:"1px"}}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Vehicle cards */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.6rem"}}>
            <p style={{fontSize:"0.72rem",color:"rgba(255,255,255,0.4)",fontWeight:"700",letterSpacing:"0.07em"}}>AVAILABLE VEHICLES</p>
            <p style={{fontSize:"0.7rem",color:"rgba(255,255,255,0.25)"}}>sorted by speed</p>
          </div>

          {result.vehicles.map((v,i)=>(
            <div key={v.type} className="vcard fadein" style={{marginBottom:"10px",animationDelay:`${i*0.07}s`,borderLeft:`3px solid ${bookedVehicle===v.type?v.color:"transparent"}`}}>
              <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
                <div style={{width:"50px",height:"50px",borderRadius:"13px",background:`rgba(99,102,241,0.1)`,border:"1px solid rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.5rem",flexShrink:0}}>{v.icon}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:"7px",marginBottom:"4px"}}>
                    <span style={{fontWeight:"800",fontSize:"0.92rem"}}>{v.type}</span>
                    <span style={{fontSize:"0.65rem",padding:"2px 7px",borderRadius:"20px",background:`rgba(99,102,241,0.15)`,color:v.accent,fontWeight:"700"}}>{v.tag}</span>
                    {v.ac&&<span style={{fontSize:"0.65rem",padding:"2px 7px",borderRadius:"20px",background:"rgba(6,182,212,0.1)",color:"#22d3ee",fontWeight:"700"}}>AC</span>}
                  </div>
                  <div style={{display:"flex",gap:"12px",fontSize:"0.75rem",color:"rgba(255,255,255,0.4)"}}>
                    <span>⏱ {v.time}m</span><span>👥 {v.capacity}</span><span>₹{v.rate}/km</span>
                  </div>
                  {/* ETA bar */}
                  <div style={{marginTop:"6px"}}>
                    <div className="progress-bar" style={{background:"rgba(255,255,255,0.08)"}}>
                      <div className="progress-fill" style={{width:`${100-Math.min((v.time/90)*100,90)}%`,background:v.color}}/>
                    </div>
                  </div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontSize:"1.2rem",fontWeight:"800",letterSpacing:"-0.5px"}}>₹{v.fare}</div>
                  <div style={{fontSize:"0.65rem",color:"rgba(255,255,255,0.3)",marginBottom:"7px"}}>total</div>
                  <button onClick={()=>setBookedVehicle(bookedVehicle===v.type?null:v.type)}
                    style={{padding:"6px 15px",background:bookedVehicle===v.type?`rgba(99,102,241,0.2)`:v.color,border:bookedVehicle===v.type?`1px solid ${v.color}`:"none",borderRadius:"9px",color:bookedVehicle===v.type?v.accent:"white",fontWeight:"700",fontSize:"0.78rem",cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                    {bookedVehicle===v.type?"✓ Selected":"Select"}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {bookedVehicle&&!tracking&&(
            <div className="fadein" style={{marginTop:"0.75rem",background:"rgba(16,185,129,0.08)",border:"1px solid rgba(16,185,129,0.25)",borderRadius:"13px",padding:"0.9rem 1.1rem",display:"flex",alignItems:"center",gap:"10px"}}>
              <span style={{fontSize:"1.1rem"}}>✅</span>
              <div>
                <p style={{fontWeight:"700",color:"#34d399",fontSize:"0.88rem"}}>{bookedVehicle} selected · ₹{result.vehicles.find(v=>v.type===bookedVehicle)?.fare}</p>
                <p style={{color:"rgba(255,255,255,0.4)",fontSize:"0.78rem",marginTop:"2px"}}>Click "Start Live Tracking" above to begin your journey</p>
              </div>
            </div>
          )}
          {tracking&&eta===0&&(
            <div className="fadein" style={{marginTop:"0.75rem",background:"rgba(99,102,241,0.1)",border:"1px solid rgba(99,102,241,0.3)",borderRadius:"13px",padding:"1rem 1.1rem",textAlign:"center"}}>
              <div style={{fontSize:"2rem",marginBottom:"8px"}}>🎉</div>
              <p style={{fontWeight:"800",color:"#a78bfa",fontSize:"1rem"}}>You have arrived!</p>
              <p style={{color:"rgba(255,255,255,0.4)",fontSize:"0.82rem",marginTop:"4px"}}>{result.to.name}</p>
            </div>
          )}
        </div>}

        {!result&&!loading&&(
          <div style={{textAlign:"center",padding:"3rem 1rem"}}>
            <div style={{width:"72px",height:"72px",borderRadius:"20px",background:"rgba(139,92,246,0.1)",border:"1px solid rgba(139,92,246,0.2)",margin:"0 auto 1.25rem",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"2rem"}}>🗺️</div>
            <p style={{color:"rgba(255,255,255,0.6)",fontWeight:"700",fontSize:"0.95rem",marginBottom:"5px"}}>Plan your private trip</p>
            <p style={{color:"rgba(255,255,255,0.25)",fontSize:"0.85rem"}}>Enter any two locations in Bengaluru</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// AUTH PAGES
// ─────────────────────────────────────────────────────────────────
function AuthLayout({onBack,title,subtitle,color,light,children}){
  return(
    <div style={{minHeight:"100vh",background:light?"#faf5ff":"#0d0b1e",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"2rem",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
      <div style={{width:"100%",maxWidth:"420px"}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:light?"#7c3aed":"#a78bfa",cursor:"pointer",fontSize:"0.88rem",fontWeight:"600",marginBottom:"1.5rem",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>← Back</button>
        <div style={{background:light?"white":"rgba(255,255,255,0.04)",backdropFilter:"blur(20px)",border:`1px solid ${light?"#ede9fe":"rgba(255,255,255,0.1)"}`,borderRadius:"20px",padding:"2.2rem",boxShadow:light?"0 8px 32px rgba(109,40,217,0.1)":"0 24px 64px rgba(0,0,0,0.5)"}}>
          <div style={{width:"40px",height:"5px",background:color,borderRadius:"3px",marginBottom:"1.4rem"}}/>
          <h1 style={{fontSize:"1.5rem",fontWeight:"800",color:light?"#1e1b4b":"white",marginBottom:"0.35rem",letterSpacing:"-0.3px"}}>{title}</h1>
          <p style={{color:light?"#6b7280":"rgba(255,255,255,0.4)",marginBottom:"1.8rem",fontSize:"0.9rem"}}>{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

function AuthInput({label,type,value,onChange,placeholder,icon,dark}){
  return(
    <div style={{marginBottom:"1rem"}}>
      <label style={{display:"block",fontSize:"0.78rem",fontWeight:"700",color:dark?"rgba(255,255,255,0.5)":"#374151",marginBottom:"7px",letterSpacing:"0.04em"}}>{label}</label>
      <div style={{position:"relative"}}>
        <span style={{position:"absolute",left:"13px",top:"50%",transform:"translateY(-50%)",fontSize:"1rem",pointerEvents:"none"}}>{icon}</span>
        <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} className={dark?"tt-input":"tt-input-light"} style={{paddingLeft:"40px"}}/>
      </div>
    </div>
  );
}

function PrivateLoginPage({onBack,onLogin}){
  const[email,setEmail]=useState("");const[pass,setPass]=useState("");const[err,setErr]=useState("");
  const handle=()=>{if(!email||!pass){setErr("Fill all fields");return;}if(!email.includes("@")){setErr("Invalid email");return;}onLogin({email,mode:"private"});};
  return(
    <AuthLayout onBack={onBack} title="Private Fleet Login" subtitle="Access your company fleet dashboard" color="#8b5cf6" dark>
      <AuthInput label="WORK EMAIL" type="email" value={email} onChange={setEmail} placeholder="you@company.com" icon="✉️" dark/>
      <AuthInput label="PASSWORD" type="password" value={pass} onChange={setPass} placeholder="••••••••" icon="🔒" dark/>
      {err&&<p style={{color:"#fca5a5",fontSize:"0.84rem",margin:"0 0 1rem"}}>⚠️ {err}</p>}
      <button className="tt-btn-primary" onClick={handle} style={{width:"100%"}}>Sign In →</button>
    </AuthLayout>
  );
}

function PublicRolePage({onBack,onRole}){
  return(
    <AuthLayout onBack={onBack} title="Public Transport" subtitle="Who are you today?" color="#3b82f6" light>
      <div style={{display:"flex",gap:"12px"}}>
        {[{icon:"🚌",label:"Driver",sub:"Bus number + PIN",color:"#f97316",role:"driver"},{icon:"🧍",label:"Passenger",sub:"Email + password",color:"#3b82f6",role:"passenger"}].map(r=>(
          <div key={r.role} onClick={()=>onRole(r.role)} style={{flex:1,border:`2px solid #e5e7eb`,borderRadius:"14px",padding:"1.4rem 1rem",textAlign:"center",cursor:"pointer",background:"white",transition:"all 0.2s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=r.color;e.currentTarget.style.background=r.color+"0d";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="#e5e7eb";e.currentTarget.style.background="white";}}>
            <div style={{fontSize:"1.9rem",marginBottom:"0.5rem"}}>{r.icon}</div>
            <div style={{fontWeight:"800",color:"#1e1b4b"}}>{r.label}</div>
            <div style={{color:"#6b7280",fontSize:"0.78rem",marginTop:"3px"}}>{r.sub}</div>
          </div>
        ))}
      </div>
    </AuthLayout>
  );
}

function DriverLoginPage({onBack,onLogin}){
  const[busNo,setBusNo]=useState("");const[pin,setPin]=useState("");const[err,setErr]=useState("");
  const handle=()=>{
    if(!busNo||!pin){setErr("Fill all fields");return;}
    const m=BUSES.find(b=>b.id.toLowerCase()===busNo.toLowerCase());
    if(!m){setErr("Bus not found. Try: KA01-F-1234");return;}
    onLogin({busNo:m.id,bus:m,mode:"driver"});
  };
  return(
    <AuthLayout onBack={onBack} title="Driver Login" subtitle="Enter your bus number and PIN" color="#f97316" light>
      <AuthInput label="BUS NUMBER" type="text" value={busNo} onChange={setBusNo} placeholder="e.g. KA01-F-1234" icon="🚌"/>
      <AuthInput label="DRIVER PIN" type="password" value={pin} onChange={setPin} placeholder="••••" icon="🔑"/>
      {err&&<p style={{color:"#dc2626",fontSize:"0.84rem",margin:"0 0 1rem"}}>⚠️ {err}</p>}
      <button onClick={handle} style={{width:"100%",padding:"13px",background:"linear-gradient(135deg,#ea580c,#f97316)",color:"white",border:"none",borderRadius:"12px",fontWeight:"700",fontSize:"0.9rem",cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Login as Driver →</button>
      <p style={{fontSize:"0.73rem",color:"#9ca3af",textAlign:"center",marginTop:"0.75rem"}}>Demo: KA01-F-1234 · KA01-G-5678 · KA01-H-9012</p>
    </AuthLayout>
  );
}

function PassengerLoginPage({onBack,onLogin}){
  const[email,setEmail]=useState("");const[pass,setPass]=useState("");const[err,setErr]=useState("");
  const handle=()=>{if(!email||!pass){setErr("Fill all fields");return;}if(!email.includes("@")){setErr("Invalid email");return;}onLogin({email,mode:"passenger"});};
  return(
    <AuthLayout onBack={onBack} title="Passenger Login" subtitle="Track buses and book tickets" color="#3b82f6" light>
      <AuthInput label="EMAIL" type="email" value={email} onChange={setEmail} placeholder="you@example.com" icon="✉️"/>
      <AuthInput label="PASSWORD" type="password" value={pass} onChange={setPass} placeholder="••••••••" icon="🔒"/>
      {err&&<p style={{color:"#dc2626",fontSize:"0.84rem",margin:"0 0 1rem"}}>⚠️ {err}</p>}
      <button onClick={handle} style={{width:"100%",padding:"13px",background:"linear-gradient(135deg,#1d4ed8,#3b82f6)",color:"white",border:"none",borderRadius:"12px",fontWeight:"700",fontSize:"0.9rem",cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Sign In →</button>
    </AuthLayout>
  );
}

// ─────────────────────────────────────────────────────────────────
// HOME
// ─────────────────────────────────────────────────────────────────
function HomePage({onSelect}){
  return(
    <div style={{minHeight:"100vh",background:"#0d0b1e",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Plus Jakarta Sans',sans-serif",padding:"2rem",overflow:"hidden",position:"relative"}}>
      <div style={{position:"absolute",width:"500px",height:"500px",borderRadius:"50%",background:"radial-gradient(circle,rgba(99,102,241,0.12) 0%,transparent 70%)",top:"-100px",left:"-100px",pointerEvents:"none"}}/>
      <div style={{position:"absolute",width:"400px",height:"400px",borderRadius:"50%",background:"radial-gradient(circle,rgba(139,92,246,0.1) 0%,transparent 70%)",bottom:"-50px",right:"-50px",pointerEvents:"none"}}/>
      <div style={{textAlign:"center",marginBottom:"3rem",position:"relative"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:"8px",background:"rgba(139,92,246,0.1)",border:"1px solid rgba(139,92,246,0.25)",borderRadius:"24px",padding:"6px 16px",marginBottom:"1.25rem",fontSize:"0.75rem",color:"#a78bfa",fontWeight:"700",letterSpacing:"0.06em"}}>
          🚦 BENGALURU TRANSIT
        </div>
        <h1 style={{fontSize:"2.8rem",fontWeight:"800",color:"white",margin:"0 0 0.75rem",letterSpacing:"-1.5px",lineHeight:1.1}}>
          Track every ride.<br/>
          <span style={{background:"linear-gradient(90deg,#a78bfa,#60a5fa,#34d399)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Public or private.</span>
        </h1>
        <p style={{color:"rgba(255,255,255,0.4)",fontSize:"0.95rem",margin:0}}>Crowd levels · Live locations · Ticket booking · GPS tracking</p>
      </div>
      <div style={{display:"flex",gap:"1.25rem",flexWrap:"wrap",justifyContent:"center",position:"relative"}}>
        {[
          {title:"Public Transport",sub:"Buses · Crowd · Book Tickets",icon:"🚌",color:"#3b82f6",grad:"linear-gradient(135deg,#1d4ed8,#3b82f6)",key:"public",tags:["Crowd Meter","Live Location","Book Ticket"]},
          {title:"Private Transport",sub:"GPS Tracking · ETA · Live Map",icon:"🚗",color:"#8b5cf6",grad:"linear-gradient(135deg,#7c3aed,#8b5cf6)",key:"private",tags:["GPS Track","Live ETA","Fleet"]},
        ].map(c=>(
          <div key={c.key} onClick={()=>onSelect(c.key)}
            style={{background:"rgba(255,255,255,0.05)",border:"1.5px solid rgba(255,255,255,0.1)",borderRadius:"22px",padding:"2.2rem 1.8rem",cursor:"pointer",width:"250px",textAlign:"center",transition:"all 0.25s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=c.color;e.currentTarget.style.transform="translateY(-6px)";e.currentTarget.style.boxShadow=`0 20px 48px ${c.color}30`;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.1)";e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none";}}>
            <div style={{width:"64px",height:"64px",borderRadius:"18px",background:c.grad,margin:"0 auto 1.1rem",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.9rem",boxShadow:`0 8px 24px ${c.color}40`}}>{c.icon}</div>
            <h2 style={{color:"white",fontSize:"1.1rem",fontWeight:"800",margin:"0 0 0.35rem"}}>{c.title}</h2>
            <p style={{color:"rgba(255,255,255,0.4)",fontSize:"0.82rem",margin:"0 0 1rem"}}>{c.sub}</p>
            <div style={{display:"flex",gap:"5px",flexWrap:"wrap",justifyContent:"center"}}>
              {c.tags.map(t=><span key={t} style={{fontSize:"0.65rem",padding:"3px 8px",background:`${c.color}20`,border:`1px solid ${c.color}40`,borderRadius:"20px",color:c.color,fontWeight:"700"}}>{t}</span>)}
            </div>
            <div style={{marginTop:"1.4rem",background:c.grad,borderRadius:"10px",padding:"11px",color:"white",fontWeight:"700",fontSize:"0.88rem"}}>Get Started →</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────────────────────────
export default function App(){
  const[screen,setScreen]=useState("home");
  const[mode,setMode]=useState(null);
  const[role,setRole]=useState(null);
  const[user,setUser]=useState(null);
  const reset=()=>{setScreen("home");setMode(null);setRole(null);setUser(null);};
  return(<>
    <InjectStyles/>
    {screen==="home"&&<HomePage onSelect={m=>{setMode(m);setScreen("auth");}}/>}
    {screen==="auth"&&mode==="private"&&<PrivateLoginPage onBack={()=>setScreen("home")} onLogin={u=>{setUser(u);setScreen("private-trip");}}/>}
    {screen==="auth"&&mode==="public"&&!role&&<PublicRolePage onBack={()=>setScreen("home")} onRole={r=>setRole(r)}/>}
    {screen==="auth"&&mode==="public"&&role==="driver"&&<DriverLoginPage onBack={()=>setRole(null)} onLogin={u=>{setUser(u);setScreen("public-search");}}/>}
    {screen==="auth"&&mode==="public"&&role==="passenger"&&<PassengerLoginPage onBack={()=>setRole(null)} onLogin={u=>{setUser(u);setScreen("public-search");}}/>}
    {screen==="private-trip"&&<PrivateTripPage user={user} onBack={reset}/>}
    {screen==="public-search"&&<PublicSearchPage user={user} onBack={reset}/>}
  </>);
}
