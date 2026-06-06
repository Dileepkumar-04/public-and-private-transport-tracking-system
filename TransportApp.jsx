import { useState, useEffect } from "react";

// ── Data ─────────────────────────────────────────────────────────
const BUSES = [
  { id: "KA01-F-1234", route: "Majestic → Electronic City", stops: ["Majestic", "Silk Board", "HSR Layout", "Electronic City"], time: 55, price: 45, type: "AC Express", seats: 12, color: "#6366f1" },
  { id: "KA01-G-5678", route: "Majestic → Electronic City", stops: ["Majestic", "KR Puram", "Hoskote", "Electronic City"], time: 75, price: 30, type: "Ordinary", seats: 5, color: "#f59e0b" },
  { id: "KA01-H-9012", route: "Shivajinagar → Whitefield", stops: ["Shivajinagar", "Ulsoor", "Marathahalli", "Whitefield"], time: 40, price: 35, type: "Volvo", seats: 20, color: "#10b981" },
  { id: "KA01-J-3456", route: "Shivajinagar → Whitefield", stops: ["Shivajinagar", "Indiranagar", "Domlur", "Whitefield"], time: 50, price: 55, type: "AC Express", seats: 3, color: "#6366f1" },
  { id: "KA01-K-7890", route: "KSR → Yelahanka", stops: ["KSR Station", "Yeshwanthpur", "Hebbal", "Yelahanka"], time: 35, price: 25, type: "Ordinary", seats: 18, color: "#f59e0b" },
  { id: "KA01-L-2345", route: "KSR → Yelahanka", stops: ["KSR Station", "Malleshwaram", "RT Nagar", "Yelahanka"], time: 45, price: 40, type: "Volvo", seats: 8, color: "#10b981" },
];
const CITY_POINTS = ["Majestic", "Shivajinagar", "KSR Station", "Electronic City", "Whitefield", "Yelahanka", "Indiranagar", "Koramangala", "Hebbal", "Marathahalli", "HSR Layout", "Silk Board"];
const QUICK_SPOTS = ["MG Road", "Koramangala", "Whitefield", "Electronic City", "Hebbal", "Indiranagar", "Marathahalli", "JP Nagar"];

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371, toR = d => d * Math.PI / 180;
  const dLat = toR(lat2 - lat1), dLon = toR(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toR(lat1))*Math.cos(toR(lat2))*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
async function geocode(q) {
  const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q+", Bengaluru, India")}&limit=1`, { headers: { "Accept-Language": "en" } });
  const d = await r.json();
  if (!d.length) throw new Error("Location not found — try a more specific name");
  return { lat: parseFloat(d[0].lat), lon: parseFloat(d[0].lon), name: d[0].display_name.split(",").slice(0,2).join(", ") };
}

// ── Global styles injected once ──────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Plus Jakarta Sans', sans-serif; }
  .tt-input { width:100%; background:rgba(255,255,255,0.07); border:1.5px solid rgba(255,255,255,0.12); border-radius:12px; padding:14px 16px 14px 44px; color:white; font-size:0.95rem; font-family:'Plus Jakarta Sans',sans-serif; outline:none; transition:border 0.2s; }
  .tt-input::placeholder { color:rgba(255,255,255,0.35); }
  .tt-input:focus { border-color:rgba(139,92,246,0.7); background:rgba(139,92,246,0.08); }
  .tt-input-light { width:100%; background:#f8f7ff; border:1.5px solid #ede9fe; border-radius:10px; padding:11px 14px 11px 40px; color:#1e1b4b; font-size:0.9rem; font-family:'Plus Jakarta Sans',sans-serif; outline:none; transition:border 0.2s; }
  .tt-input-light::placeholder { color:#a78bfa; }
  .tt-input-light:focus { border-color:#8b5cf6; background:#faf5ff; }
  .tt-btn-primary { background:linear-gradient(135deg,#7c3aed,#6366f1); color:white; border:none; border-radius:12px; padding:14px 28px; font-size:1rem; font-weight:700; font-family:'Plus Jakarta Sans',sans-serif; cursor:pointer; transition:all 0.2s; letter-spacing:-0.2px; }
  .tt-btn-primary:hover { transform:translateY(-1px); box-shadow:0 8px 24px rgba(99,102,241,0.4); }
  .tt-btn-primary:active { transform:none; }
  .tt-btn-primary:disabled { background:#4b5563; cursor:not-allowed; transform:none; box-shadow:none; }
  .tt-chip { padding:7px 16px; background:rgba(139,92,246,0.12); border:1px solid rgba(139,92,246,0.25); border-radius:24px; color:#a78bfa; font-size:0.82rem; font-weight:600; cursor:pointer; transition:all 0.15s; white-space:nowrap; font-family:'Plus Jakarta Sans',sans-serif; }
  .tt-chip:hover { background:rgba(139,92,246,0.22); color:#c4b5fd; border-color:rgba(139,92,246,0.5); }
  .vcard { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:1.25rem 1.4rem; transition:all 0.2s; cursor:default; }
  .vcard:hover { background:rgba(255,255,255,0.07); border-color:rgba(139,92,246,0.35); transform:translateX(4px); }
  .pulse { animation: pulse 1.8s ease-in-out infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
  .fadein { animation: fadein 0.5s ease forwards; }
  @keyframes fadein { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
  .spin { animation: spin 1s linear infinite; }
  @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  .blink { animation: blink 1s step-end infinite; }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
  select.tt-input-light { appearance:none; }
  ::-webkit-scrollbar { width:4px; height:4px; }
  ::-webkit-scrollbar-track { background:transparent; }
  ::-webkit-scrollbar-thumb { background:rgba(139,92,246,0.3); border-radius:4px; }
`;

function InjectStyles() {
  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = CSS;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);
  return null;
}

// ── Route Map SVG ─────────────────────────────────────────────────
function RouteMap({ from, to }) {
  if (!from || !to) return null;
  const W = 600, H = 200, P = 48;
  const latSpan = Math.max(Math.abs(to.lat - from.lat), 0.018);
  const lonSpan = Math.max(Math.abs(to.lon - from.lon), 0.018);
  const minLat = Math.min(from.lat, to.lat) - latSpan * 0.1;
  const minLon = Math.min(from.lon, to.lon) - lonSpan * 0.1;
  const toX = lon => P + ((lon - minLon) / (lonSpan * 1.2)) * (W - 2*P);
  const toY = lat => H - P - ((lat - minLat) / (latSpan * 1.2)) * (H - 2*P);
  const fx = toX(from.lon), fy = toY(from.lat);
  const tx = toX(to.lon), ty = toY(to.lat);
  const cx = (fx+tx)/2, cy = Math.min(fy,ty) - 30;

  // midpoint on curve for the car icon
  const t = 0.5;
  const carX = (1-t)**2*fx + 2*(1-t)*t*cx + t**2*tx;
  const carY = (1-t)**2*fy + 2*(1-t)*t*cy + t**2*ty;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", display:"block" }}>
      <defs>
        <radialGradient id="gFrom" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#34d399" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="gTo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f87171" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#f87171" stopOpacity="0"/>
        </radialGradient>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <circle cx="4" cy="4" r="2.5" fill="#818cf8"/>
        </marker>
      </defs>

      {/* Background grid dots */}
      {Array.from({length:6},(_,i)=>Array.from({length:12},(_,j)=>(
        <circle key={`${i}-${j}`} cx={j*(W/11)} cy={i*(H/5)} r="1.2" fill="rgba(255,255,255,0.06)"/>
      )))}

      {/* Glow halos */}
      <circle cx={fx} cy={fy} r="28" fill="url(#gFrom)"/>
      <circle cx={tx} cy={ty} r="28" fill="url(#gTo)"/>

      {/* Route shadow */}
      <path d={`M ${fx} ${fy} Q ${cx} ${cy} ${tx} ${ty}`} stroke="rgba(139,92,246,0.15)" strokeWidth="10" fill="none" strokeLinecap="round"/>
      {/* Route line */}
      <path d={`M ${fx} ${fy} Q ${cx} ${cy} ${tx} ${ty}`} stroke="url(#routeGrad)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeDasharray="6 4"/>

      <defs>
        <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#34d399"/>
          <stop offset="100%" stopColor="#f87171"/>
        </linearGradient>
      </defs>

      {/* Car at midpoint */}
      <circle cx={carX} cy={carY} r="14" fill="#1e1b4b" stroke="rgba(139,92,246,0.6)" strokeWidth="1.5"/>
      <text x={carX} y={carY+5} textAnchor="middle" fontSize="14">🚗</text>

      {/* FROM pin */}
      <circle cx={fx} cy={fy} r="8" fill="#34d399"/>
      <circle cx={fx} cy={fy} r="4" fill="white"/>
      {/* FROM label */}
      <rect x={fx+12} y={fy-14} width={Math.min(from.name.length*5.8+16, 150)} height="20" rx="5" fill="rgba(52,211,153,0.2)" stroke="rgba(52,211,153,0.4)" strokeWidth="1"/>
      <text x={fx+20} y={fy+0} fontSize="10" fill="#6ee7b7" fontWeight="700" fontFamily="'Plus Jakarta Sans',sans-serif">
        {from.name.length > 24 ? from.name.slice(0,24)+"…" : from.name}
      </text>

      {/* TO pin */}
      <circle cx={tx} cy={ty} r="8" fill="#f87171"/>
      <circle cx={tx} cy={ty} r="4" fill="white"/>
      {/* TO label */}
      {(() => { const lw = Math.min(to.name.length*5.8+16, 150); return (
        <>
          <rect x={tx-lw-12} y={ty+4} width={lw} height="20" rx="5" fill="rgba(248,113,113,0.2)" stroke="rgba(248,113,113,0.4)" strokeWidth="1"/>
          <text x={tx-lw-4} y={ty+18} fontSize="10" fill="#fca5a5" fontWeight="700" fontFamily="'Plus Jakarta Sans',sans-serif">
            {to.name.length > 24 ? to.name.slice(0,24)+"…" : to.name}
          </text>
        </>
      );})()}
    </svg>
  );
}

// ── Private Trip Page ─────────────────────────────────────────────
function PrivateTripPage({ user, onBack }) {
  const [fromText, setFromText] = useState("");
  const [toText, setToText] = useState("");
  const [fromLoc, setFromLoc] = useState(null);
  const [toLoc, setToLoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState(null);
  const [bookedVehicle, setBookedVehicle] = useState(null);

  const useMyLocation = () => {
    if (!navigator.geolocation) { setErr("Geolocation not supported by your browser"); return; }
    setLocating(true); setErr("");
    navigator.geolocation.getCurrentPosition(async pos => {
      try {
        const { latitude: lat, longitude: lon } = pos.coords;
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`, { headers: { "Accept-Language": "en" } });
        const d = await r.json();
        const name = d.address ? [d.address.road || d.address.suburb || "Your location", d.address.city_district || d.address.city || ""].filter(Boolean).join(", ") : "Current location";
        setFromText(name); setFromLoc({ lat, lon, name });
      } catch { setErr("Could not resolve your address"); }
      setLocating(false);
    }, () => { setErr("Location permission denied"); setLocating(false); });
  };

  const handleSearch = async () => {
    if (!fromText.trim() || !toText.trim()) { setErr("Please enter both starting point and destination"); return; }
    setLoading(true); setErr(""); setResult(null); setBookedVehicle(null);
    try {
      const [f, t] = await Promise.all([
        fromLoc && fromText === fromLoc.name ? Promise.resolve(fromLoc) : geocode(fromText),
        toLoc && toText === toLoc.name ? Promise.resolve(toLoc) : geocode(toText),
      ]);
      setFromLoc(f); setToLoc(t);
      const dist = haversine(f.lat, f.lon, t.lat, t.lon);
      const vehicles = [
        { type: "Hatchback", tag: "Economy", icon: "🚗", speed: 32, rate: 12, capacity: 4, ac: false, color: "#6366f1", accent: "#818cf8" },
        { type: "Sedan", tag: "Comfort", icon: "🚙", speed: 30, rate: 16, capacity: 4, ac: true, color: "#8b5cf6", accent: "#a78bfa" },
        { type: "SUV", tag: "Premium", icon: "🚐", speed: 28, rate: 22, capacity: 7, ac: true, color: "#06b6d4", accent: "#22d3ee" },
        { type: "Mini Bus", tag: "Group", icon: "🚌", speed: 24, rate: 28, capacity: 14, ac: true, color: "#10b981", accent: "#34d399" },
      ].map(v => ({ ...v, time: Math.round((dist/v.speed)*60), fare: Math.round(dist*v.rate) }));
      setResult({ from: f, to: t, dist: Math.round(dist*10)/10, vehicles });
    } catch(e) { setErr(e.message); }
    setLoading(false);
  };

  const swap = () => { setFromText(toText); setToText(fromText); setFromLoc(toLoc); setToLoc(fromLoc); };

  return (
    <div style={{ minHeight:"100vh", background:"#0d0b1e", fontFamily:"'Plus Jakarta Sans',sans-serif", color:"white" }}>

      {/* ── Hero header ── */}
      <div style={{ background:"linear-gradient(160deg, #13102b 0%, #1a1040 60%, #0d0b1e 100%)", padding:"0 0 2rem", borderBottom:"1px solid rgba(139,92,246,0.15)" }}>

        {/* Top bar */}
        <div style={{ padding:"1.25rem 1.5rem 0", display:"flex", justifyContent:"space-between", alignItems:"center", maxWidth:"720px", margin:"0 auto" }}>
          <button onClick={onBack} style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", color:"#c4b5fd", borderRadius:"10px", padding:"8px 16px", cursor:"pointer", fontSize:"0.85rem", fontWeight:"600", fontFamily:"'Plus Jakarta Sans',sans-serif", display:"flex", alignItems:"center", gap:"6px" }}>
            <span style={{fontSize:"1rem"}}>←</span> Home
          </button>
          <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
            <div style={{ width:"32px", height:"32px", borderRadius:"50%", background:"linear-gradient(135deg,#7c3aed,#6366f1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.85rem", fontWeight:"800" }}>
              {user.email[0].toUpperCase()}
            </div>
            <span style={{ fontSize:"0.88rem", color:"#a78bfa", fontWeight:"600" }}>{user.email.split("@")[0]}</span>
            <span style={{ fontSize:"0.72rem", background:"rgba(139,92,246,0.2)", border:"1px solid rgba(139,92,246,0.35)", borderRadius:"20px", padding:"3px 10px", color:"#c4b5fd" }}>Fleet</span>
          </div>
        </div>

        {/* Title */}
        <div style={{ textAlign:"center", padding:"2rem 1.5rem 1.5rem", maxWidth:"720px", margin:"0 auto" }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:"8px", background:"rgba(139,92,246,0.1)", border:"1px solid rgba(139,92,246,0.25)", borderRadius:"24px", padding:"6px 16px", marginBottom:"1rem", fontSize:"0.78rem", color:"#a78bfa", fontWeight:"600", letterSpacing:"0.05em" }}>
            <span style={{ width:"6px", height:"6px", borderRadius:"50%", background:"#a78bfa", display:"inline-block" }} className="blink"/>
            LIVE ROUTE PLANNER
          </div>
          <h1 style={{ fontSize:"1.9rem", fontWeight:"800", letterSpacing:"-0.5px", lineHeight:1.2, marginBottom:"0.4rem" }}>
            Where are you<br/>
            <span style={{ background:"linear-gradient(90deg,#a78bfa,#60a5fa)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>headed today?</span>
          </h1>
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:"0.9rem" }}>Enter any address or landmark in Bengaluru</p>
        </div>

        {/* Search card */}
        <div style={{ maxWidth:"660px", margin:"0 auto", padding:"0 1.5rem" }}>
          <div style={{ background:"rgba(255,255,255,0.04)", backdropFilter:"blur(20px)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"20px", padding:"1.5rem", boxShadow:"0 24px 64px rgba(0,0,0,0.4)" }}>

            {/* FROM row */}
            <div style={{ marginBottom:"0.75rem" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"8px" }}>
                <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:"#34d399", flexShrink:0 }}/>
                <span style={{ fontSize:"0.72rem", fontWeight:"700", color:"#34d399", letterSpacing:"0.08em" }}>FROM</span>
              </div>
              <div style={{ position:"relative", display:"flex", gap:"8px" }}>
                <div style={{ position:"relative", flex:1 }}>
                  <span style={{ position:"absolute", left:"14px", top:"50%", transform:"translateY(-50%)", fontSize:"1rem", pointerEvents:"none" }}>📍</span>
                  <input className="tt-input" value={fromText} onChange={e=>{setFromText(e.target.value);setFromLoc(null);}}
                    onKeyDown={e=>e.key==="Enter"&&handleSearch()}
                    placeholder="e.g. Koramangala 5th Block"/>
                </div>
                <button onClick={useMyLocation} title="Use GPS location"
                  style={{ padding:"0 16px", background:"rgba(52,211,153,0.1)", border:"1.5px solid rgba(52,211,153,0.25)", borderRadius:"12px", cursor:"pointer", fontSize:"1.1rem", color:"#34d399", transition:"all 0.2s", flexShrink:0 }}>
                  {locating ? <span className="spin" style={{display:"inline-block"}}>⏳</span> : "📡"}
                </button>
              </div>
            </div>

            {/* Swap divider */}
            <div style={{ display:"flex", alignItems:"center", gap:"12px", margin:"0.4rem 0" }}>
              <div style={{ flex:1, height:"1px", background:"rgba(255,255,255,0.07)" }}/>
              <button onClick={swap}
                style={{ width:"32px", height:"32px", borderRadius:"50%", background:"rgba(139,92,246,0.15)", border:"1px solid rgba(139,92,246,0.3)", color:"#a78bfa", cursor:"pointer", fontSize:"1rem", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.2s", flexShrink:0 }}
                title="Swap locations">⇅</button>
              <div style={{ flex:1, height:"1px", background:"rgba(255,255,255,0.07)" }}/>
            </div>

            {/* TO row */}
            <div style={{ marginBottom:"1rem" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"8px" }}>
                <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:"#f87171", flexShrink:0 }}/>
                <span style={{ fontSize:"0.72rem", fontWeight:"700", color:"#f87171", letterSpacing:"0.08em" }}>TO</span>
              </div>
              <div style={{ position:"relative" }}>
                <span style={{ position:"absolute", left:"14px", top:"50%", transform:"translateY(-50%)", fontSize:"1rem", pointerEvents:"none" }}>🏁</span>
                <input className="tt-input" value={toText} onChange={e=>{setToText(e.target.value);setToLoc(null);}}
                  onKeyDown={e=>e.key==="Enter"&&handleSearch()}
                  placeholder="e.g. Whitefield IT Park"/>
              </div>
            </div>

            {err && (
              <div style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:"10px", padding:"10px 14px", marginBottom:"1rem", fontSize:"0.85rem", color:"#fca5a5", display:"flex", gap:"8px", alignItems:"flex-start" }}>
                <span>⚠️</span><span>{err}</span>
              </div>
            )}

            <button className="tt-btn-primary" onClick={handleSearch} disabled={loading} style={{ width:"100%" }}>
              {loading ? (
                <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"10px" }}>
                  <span className="spin" style={{display:"inline-block",width:"18px",height:"18px",borderRadius:"50%",border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"white"}}/>
                  Finding best route…
                </span>
              ) : "Get Route & Travel Time →"}
            </button>

            {/* Quick chips */}
            {!result && !loading && (
              <div style={{ marginTop:"1rem" }}>
                <p style={{ fontSize:"0.72rem", color:"rgba(255,255,255,0.3)", marginBottom:"8px", fontWeight:"600", letterSpacing:"0.05em" }}>QUICK SPOTS</p>
                <div style={{ display:"flex", flexWrap:"wrap", gap:"6px" }}>
                  {QUICK_SPOTS.map(s => (
                    <button key={s} className="tt-chip" onClick={() => { if(!fromText) setFromText(s); else setToText(s); }}>{s}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Results ── */}
      <div style={{ maxWidth:"660px", margin:"0 auto", padding:"1.5rem 1.5rem 4rem" }}>

        {/* Loading skeleton */}
        {loading && (
          <div style={{ textAlign:"center", padding:"3rem 0" }}>
            <div style={{ width:"48px", height:"48px", borderRadius:"50%", border:"3px solid rgba(139,92,246,0.2)", borderTopColor:"#8b5cf6", margin:"0 auto 1rem" }} className="spin"/>
            <p style={{ color:"#a78bfa", fontWeight:"600" }}>Locating addresses…</p>
            <p style={{ color:"rgba(255,255,255,0.3)", fontSize:"0.85rem", marginTop:"4px" }}>Searching OpenStreetMap</p>
          </div>
        )}

        {result && !loading && (
          <div className="fadein">

            {/* ── Map panel ── */}
            <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"20px", overflow:"hidden", marginBottom:"1rem" }}>
              <div style={{ padding:"1rem 1.25rem 0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:"0.78rem", color:"rgba(255,255,255,0.4)", fontWeight:"600", letterSpacing:"0.06em" }}>ROUTE OVERVIEW</span>
                <span style={{ fontSize:"0.78rem", color:"#a78bfa", fontWeight:"700" }}>{result.dist} km</span>
              </div>
              <RouteMap from={result.from} to={result.to} />

              {/* From / To labels row */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr auto 1fr", gap:"8px", padding:"0.75rem 1.25rem 1rem", alignItems:"center" }}>
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:"6px", marginBottom:"3px" }}>
                    <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:"#34d399" }}/>
                    <span style={{ fontSize:"0.7rem", color:"#34d399", fontWeight:"700", letterSpacing:"0.06em" }}>FROM</span>
                  </div>
                  <p style={{ fontSize:"0.85rem", color:"white", fontWeight:"600", lineHeight:1.3 }}>{result.from.name}</p>
                  <p style={{ fontSize:"0.7rem", color:"rgba(255,255,255,0.3)", marginTop:"2px", fontFamily:"monospace" }}>{result.from.lat.toFixed(4)}, {result.from.lon.toFixed(4)}</p>
                </div>
                <div style={{ width:"32px", height:"32px", borderRadius:"50%", background:"rgba(139,92,246,0.15)", border:"1px solid rgba(139,92,246,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.9rem", flexShrink:0 }}>→</div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"6px", marginBottom:"3px", justifyContent:"flex-end" }}>
                    <span style={{ fontSize:"0.7rem", color:"#f87171", fontWeight:"700", letterSpacing:"0.06em" }}>TO</span>
                    <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:"#f87171" }}/>
                  </div>
                  <p style={{ fontSize:"0.85rem", color:"white", fontWeight:"600", lineHeight:1.3 }}>{result.to.name}</p>
                  <p style={{ fontSize:"0.7rem", color:"rgba(255,255,255,0.3)", marginTop:"2px", fontFamily:"monospace" }}>{result.to.lat.toFixed(4)}, {result.to.lon.toFixed(4)}</p>
                </div>
              </div>
            </div>

            {/* ── Stats row ── */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"10px", marginBottom:"1rem" }}>
              {[
                { label:"Distance", value:`${result.dist} km`, sub:"straight line", icon:"📏", c:"#6366f1" },
                { label:"Fastest", value:`${result.vehicles[0].time} min`, sub:"by hatchback", icon:"⚡", c:"#f59e0b" },
                { label:"Traffic", value:"Moderate", sub:"usual hours", icon:"🚦", c:"#10b981" },
              ].map(s => (
                <div key={s.label} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"14px", padding:"1rem", textAlign:"center" }}>
                  <div style={{ fontSize:"1.3rem", marginBottom:"4px" }}>{s.icon}</div>
                  <div style={{ fontSize:"1rem", fontWeight:"800", color:"white" }}>{s.value}</div>
                  <div style={{ fontSize:"0.7rem", color:"rgba(255,255,255,0.35)", marginTop:"2px" }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* ── Vehicle cards ── */}
            <div style={{ marginBottom:"0.75rem", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <p style={{ fontSize:"0.78rem", color:"rgba(255,255,255,0.4)", fontWeight:"700", letterSpacing:"0.07em" }}>AVAILABLE VEHICLES</p>
              <p style={{ fontSize:"0.75rem", color:"rgba(255,255,255,0.25)" }}>Tap to book</p>
            </div>

            {result.vehicles.map((v, i) => (
              <div key={v.type} className="vcard fadein" style={{ marginBottom:"10px", animationDelay:`${i*0.08}s`, borderLeft: bookedVehicle===v.type ? `3px solid ${v.color}` : "3px solid transparent", transition:"all 0.2s" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"14px" }}>
                  {/* Icon */}
                  <div style={{ width:"52px", height:"52px", borderRadius:"14px", background:`rgba(${v.color==="#6366f1"?"99,102,241":v.color==="#8b5cf6"?"139,92,246":v.color==="#06b6d4"?"6,182,212":"16,185,129"},0.12)`, border:`1px solid rgba(${v.color==="#6366f1"?"99,102,241":v.color==="#8b5cf6"?"139,92,246":v.color==="#06b6d4"?"6,182,212":"16,185,129"},0.25)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.6rem", flexShrink:0 }}>
                    {v.icon}
                  </div>
                  {/* Info */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"4px" }}>
                      <span style={{ fontWeight:"800", fontSize:"0.95rem" }}>{v.type}</span>
                      <span style={{ fontSize:"0.68rem", padding:"2px 8px", borderRadius:"20px", background:`rgba(${v.color==="#6366f1"?"99,102,241":v.color==="#8b5cf6"?"139,92,246":v.color==="#06b6d4"?"6,182,212":"16,185,129"},0.15)`, color:v.accent, fontWeight:"700" }}>{v.tag}</span>
                      {v.ac && <span style={{ fontSize:"0.68rem", padding:"2px 8px", borderRadius:"20px", background:"rgba(6,182,212,0.1)", color:"#22d3ee", fontWeight:"700" }}>AC</span>}
                    </div>
                    <div style={{ display:"flex", gap:"14px", fontSize:"0.78rem", color:"rgba(255,255,255,0.45)" }}>
                      <span>⏱ {v.time} min</span>
                      <span>👥 {v.capacity} seats</span>
                      <span>₹{v.rate}/km</span>
                    </div>
                  </div>
                  {/* Fare + Book */}
                  <div style={{ textAlign:"right", flexShrink:0 }}>
                    <div style={{ fontSize:"1.3rem", fontWeight:"800", letterSpacing:"-0.5px" }}>₹{v.fare}</div>
                    <div style={{ fontSize:"0.7rem", color:"rgba(255,255,255,0.3)", marginBottom:"8px" }}>total fare</div>
                    <button
                      onClick={() => setBookedVehicle(bookedVehicle===v.type ? null : v.type)}
                      style={{ padding:"7px 18px", background: bookedVehicle===v.type ? `rgba(${v.color==="#6366f1"?"99,102,241":v.color==="#8b5cf6"?"139,92,246":v.color==="#06b6d4"?"6,182,212":"16,185,129"},0.2)` : v.color, border: bookedVehicle===v.type ? `1px solid ${v.color}` : "none", borderRadius:"10px", color: bookedVehicle===v.type ? v.accent : "white", fontWeight:"700", fontSize:"0.8rem", cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", transition:"all 0.2s" }}>
                      {bookedVehicle===v.type ? "✓ Booked" : "Book"}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Booked confirmation banner */}
            {bookedVehicle && (
              <div className="fadein" style={{ marginTop:"1rem", background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.3)", borderRadius:"14px", padding:"1rem 1.25rem", display:"flex", alignItems:"center", gap:"12px" }}>
                <div style={{ width:"36px", height:"36px", borderRadius:"50%", background:"rgba(16,185,129,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.1rem" }}>✅</div>
                <div>
                  <p style={{ fontWeight:"700", color:"#34d399", fontSize:"0.9rem" }}>Booking confirmed — {bookedVehicle}</p>
                  <p style={{ color:"rgba(255,255,255,0.4)", fontSize:"0.8rem", marginTop:"2px" }}>Driver will be assigned shortly. ETA shown in app.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!result && !loading && (
          <div style={{ textAlign:"center", padding:"3rem 1rem" }}>
            <div style={{ width:"80px", height:"80px", borderRadius:"24px", background:"rgba(139,92,246,0.1)", border:"1px solid rgba(139,92,246,0.2)", margin:"0 auto 1.5rem", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"2rem" }}>🗺️</div>
            <p style={{ color:"rgba(255,255,255,0.6)", fontWeight:"700", fontSize:"1rem", marginBottom:"6px" }}>Ready to plan your trip</p>
            <p style={{ color:"rgba(255,255,255,0.25)", fontSize:"0.88rem" }}>Enter any two locations above to see routes,<br/>travel time & available vehicles</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Shared Auth ───────────────────────────────────────────────────
function AuthLayout({ onBack, title, subtitle, color, light, children }) {
  const bg = light ? "#faf5ff" : "#0d0b1e";
  const cardBg = light ? "white" : "rgba(255,255,255,0.04)";
  const cardBorder = light ? "#ede9fe" : "rgba(255,255,255,0.1)";
  const titleColor = light ? "#1e1b4b" : "white";
  const subColor = light ? "#6b7280" : "rgba(255,255,255,0.4)";
  return (
    <div style={{ minHeight:"100vh", background:bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"2rem", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
      <div style={{ width:"100%", maxWidth:"420px" }}>
        <button onClick={onBack} style={{ background:"none", border:"none", color: light ? "#7c3aed" : "#a78bfa", cursor:"pointer", fontSize:"0.88rem", fontWeight:"600", marginBottom:"1.5rem", display:"flex", alignItems:"center", gap:"6px", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>← Back</button>
        <div style={{ background:cardBg, backdropFilter:"blur(20px)", border:`1px solid ${cardBorder}`, borderRadius:"20px", padding:"2.2rem", boxShadow: light ? "0 8px 32px rgba(109,40,217,0.1)" : "0 24px 64px rgba(0,0,0,0.5)" }}>
          <div style={{ width:"40px", height:"5px", background:color, borderRadius:"3px", marginBottom:"1.4rem" }}/>
          <h1 style={{ fontSize:"1.55rem", fontWeight:"800", color:titleColor, marginBottom:"0.35rem", letterSpacing:"-0.3px" }}>{title}</h1>
          <p style={{ color:subColor, marginBottom:"1.8rem", fontSize:"0.9rem" }}>{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

function AuthInput({ label, type, value, onChange, placeholder, icon, dark }) {
  return (
    <div style={{ marginBottom:"1rem" }}>
      <label style={{ display:"block", fontSize:"0.82rem", fontWeight:"700", color: dark ? "rgba(255,255,255,0.5)" : "#374151", marginBottom:"7px", letterSpacing:"0.02em" }}>{label}</label>
      <div style={{ position:"relative" }}>
        <span style={{ position:"absolute", left:"13px", top:"50%", transform:"translateY(-50%)", fontSize:"1rem", pointerEvents:"none" }}>{icon}</span>
        {dark ? (
          <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} className="tt-input" style={{ paddingLeft:"40px" }}/>
        ) : (
          <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} className="tt-input-light" style={{ paddingLeft:"40px" }}/>
        )}
      </div>
    </div>
  );
}

function PrivateLoginPage({ onBack, onLogin }) {
  const [email, setEmail] = useState(""); const [pass, setPass] = useState(""); const [err, setErr] = useState("");
  const handle = () => {
    if (!email||!pass){setErr("Please fill in all fields");return;}
    if (!email.includes("@")){setErr("Invalid email address");return;}
    onLogin({ email, mode:"private" });
  };
  return (
    <AuthLayout onBack={onBack} title="Private Fleet Login" subtitle="Access your company fleet dashboard" color="#8b5cf6" dark>
      <AuthInput label="WORK EMAIL" type="email" value={email} onChange={setEmail} placeholder="you@company.com" icon="✉️" dark/>
      <AuthInput label="PASSWORD" type="password" value={pass} onChange={setPass} placeholder="••••••••" icon="🔒" dark/>
      {err && <p style={{ color:"#fca5a5", fontSize:"0.84rem", margin:"0 0 1rem", display:"flex", gap:"6px" }}><span>⚠️</span>{err}</p>}
      <button className="tt-btn-primary" onClick={handle} style={{ width:"100%", marginTop:"0.5rem" }}>Sign In →</button>
    </AuthLayout>
  );
}

function PublicRolePage({ onBack, onRole }) {
  return (
    <AuthLayout onBack={onBack} title="Public Transport" subtitle="Who are you today?" color="#3b82f6" light>
      <div style={{ display:"flex", gap:"12px" }}>
        {[{icon:"🚌",label:"Driver",sub:"Login with bus number",color:"#f97316",role:"driver"},{icon:"🧍",label:"Passenger",sub:"Login with email",color:"#3b82f6",role:"passenger"}].map(r => (
          <RoleBtn key={r.role} {...r} onClick={()=>onRole(r.role)}/>
        ))}
      </div>
    </AuthLayout>
  );
}

function RoleBtn({ icon, label, sub, color, onClick }) {
  const [h, setH] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{ flex:1, border:`2px solid ${h?color:"#e5e7eb"}`, borderRadius:"14px", padding:"1.4rem 1rem", textAlign:"center", cursor:"pointer", transition:"all 0.2s", background: h?`${color}0d`:"white" }}>
      <div style={{ fontSize:"1.9rem", marginBottom:"0.5rem" }}>{icon}</div>
      <div style={{ fontWeight:"800", color:"#1e1b4b", fontSize:"0.95rem" }}>{label}</div>
      <div style={{ color:"#6b7280", fontSize:"0.78rem", marginTop:"4px" }}>{sub}</div>
    </div>
  );
}

function DriverLoginPage({ onBack, onLogin }) {
  const [busNo, setBusNo] = useState(""); const [pin, setPin] = useState(""); const [err, setErr] = useState("");
  const handle = () => {
    if (!busNo||!pin){setErr("Please fill in all fields");return;}
    const matched = BUSES.find(b=>b.id.toLowerCase()===busNo.toLowerCase());
    if (!matched){setErr("Bus not found. Demo: KA01-F-1234");return;}
    onLogin({ busNo:matched.id, bus:matched, mode:"driver" });
  };
  return (
    <AuthLayout onBack={onBack} title="Driver Login" subtitle="Enter your assigned bus number and PIN" color="#f97316" light>
      <AuthInput label="BUS NUMBER" type="text" value={busNo} onChange={setBusNo} placeholder="e.g. KA01-F-1234" icon="🚌"/>
      <AuthInput label="DRIVER PIN" type="password" value={pin} onChange={setPin} placeholder="••••" icon="🔑"/>
      {err && <p style={{ color:"#dc2626", fontSize:"0.84rem", margin:"0 0 1rem" }}>⚠️ {err}</p>}
      <button onClick={handle} style={{ width:"100%", padding:"14px", background:"linear-gradient(135deg,#ea580c,#f97316)", color:"white", border:"none", borderRadius:"12px", fontSize:"0.95rem", fontWeight:"700", cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Login as Driver →</button>
      <p style={{ fontSize:"0.75rem", color:"#9ca3af", textAlign:"center", marginTop:"0.75rem" }}>Demo: KA01-F-1234 · KA01-G-5678 · KA01-H-9012</p>
    </AuthLayout>
  );
}

function PassengerLoginPage({ onBack, onLogin }) {
  const [email, setEmail] = useState(""); const [pass, setPass] = useState(""); const [err, setErr] = useState("");
  const handle = () => {
    if (!email||!pass){setErr("Please fill in all fields");return;}
    if (!email.includes("@")){setErr("Invalid email");return;}
    onLogin({ email, mode:"passenger" });
  };
  return (
    <AuthLayout onBack={onBack} title="Passenger Login" subtitle="Track buses and plan your journey" color="#3b82f6" light>
      <AuthInput label="EMAIL ADDRESS" type="email" value={email} onChange={setEmail} placeholder="you@example.com" icon="✉️"/>
      <AuthInput label="PASSWORD" type="password" value={pass} onChange={setPass} placeholder="••••••••" icon="🔒"/>
      {err && <p style={{ color:"#dc2626", fontSize:"0.84rem", margin:"0 0 1rem" }}>⚠️ {err}</p>}
      <button onClick={handle} style={{ width:"100%", padding:"14px", background:"linear-gradient(135deg,#1d4ed8,#3b82f6)", color:"white", border:"none", borderRadius:"12px", fontSize:"0.95rem", fontWeight:"700", cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Sign In →</button>
    </AuthLayout>
  );
}

// ── Public Search ─────────────────────────────────────────────────
function PublicSearchPage({ user, onBack }) {
  const [from, setFrom] = useState(""); const [to, setTo] = useState(""); const [results, setResults] = useState(null); const [searched, setSearched] = useState(false);
  const search = () => { if (!from||!to) return; setResults(BUSES.filter(b => b.stops.some(s=>s.toLowerCase().includes(from.toLowerCase())) && b.stops.some(s=>s.toLowerCase().includes(to.toLowerCase())))); setSearched(true); };
  const accent = "#3b82f6";
  return (
    <div style={{ minHeight:"100vh", background:"#f1f5f9", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
      <div style={{ background:"linear-gradient(135deg,#1d4ed8,#3b82f6)", padding:"1.5rem 1.5rem 2rem" }}>
        <div style={{ maxWidth:"700px", margin:"0 auto" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1.5rem" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
              <button onClick={onBack} style={{ background:"rgba(255,255,255,0.2)", border:"none", color:"white", borderRadius:"8px", padding:"7px 14px", cursor:"pointer", fontSize:"0.85rem", fontWeight:"600", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>← Home</button>
              <span style={{ fontWeight:"800", color:"white" }}>{user.mode==="driver"?`Driver — ${user.busNo}`:"Find a Bus"}</span>
            </div>
            <span style={{ fontSize:"0.75rem", background:"rgba(255,255,255,0.15)", borderRadius:"20px", padding:"4px 12px", color:"white", fontWeight:"600" }}>{user.mode==="driver"?"🚌 On Duty":"🧍 Passenger"}</span>
          </div>
          <div style={{ background:"white", borderRadius:"16px", padding:"1.25rem", boxShadow:"0 8px 32px rgba(0,0,0,0.15)" }}>
            <div style={{ display:"flex", gap:"10px", alignItems:"flex-end", flexWrap:"wrap" }}>
              <div style={{ flex:1, minWidth:"130px" }}>
                <label style={{ fontSize:"0.72rem", fontWeight:"700", color:"#6b7280", display:"block", marginBottom:"6px", letterSpacing:"0.05em" }}>FROM</label>
                <select value={from} onChange={e=>setFrom(e.target.value)} className="tt-input-light" style={{ paddingLeft:"12px" }}>
                  <option value="">Select stop</option>{CITY_POINTS.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ fontSize:"1.1rem", paddingBottom:"8px", color:"#9ca3af" }}>⇄</div>
              <div style={{ flex:1, minWidth:"130px" }}>
                <label style={{ fontSize:"0.72rem", fontWeight:"700", color:"#6b7280", display:"block", marginBottom:"6px", letterSpacing:"0.05em" }}>TO</label>
                <select value={to} onChange={e=>setTo(e.target.value)} className="tt-input-light" style={{ paddingLeft:"12px" }}>
                  <option value="">Select stop</option>{CITY_POINTS.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <button onClick={search} style={{ padding:"11px 22px", background:"linear-gradient(135deg,#1d4ed8,#3b82f6)", color:"white", border:"none", borderRadius:"10px", fontWeight:"700", cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:"0.9rem" }}>Search</button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:"700px", margin:"1.5rem auto", padding:"0 1.5rem 3rem" }}>
        {user.mode==="driver" && user.bus && !searched && (
          <div style={{ background:"white", borderRadius:"16px", padding:"1.25rem 1.5rem", boxShadow:"0 2px 12px rgba(0,0,0,0.06)", marginBottom:"1rem" }}>
            <p style={{ fontWeight:"800", color:"#1e1b4b", marginBottom:"0.75rem", fontSize:"0.95rem" }}>Your Assigned Bus</p>
            <BusCard bus={user.bus} isDriver/>
          </div>
        )}
        {searched && (results.length===0?(
          <div style={{ background:"white", borderRadius:"16px", padding:"3rem", textAlign:"center", color:"#6b7280" }}>
            <div style={{ fontSize:"2.5rem", marginBottom:"0.75rem" }}>🚌</div>
            <p style={{ fontWeight:"700" }}>No direct buses found</p>
            <p style={{ fontSize:"0.85rem", marginTop:"4px" }}>Try: Majestic → Electronic City</p>
          </div>
        ):[...results].sort((a,b)=>a.time-b.time).map(bus=><BusCard key={bus.id} bus={bus}/>))}
        {!searched && user.mode!=="driver" && (
          <div style={{ textAlign:"center", padding:"3rem 0", color:"#9ca3af" }}>
            <div style={{ fontSize:"2.5rem", marginBottom:"0.75rem" }}>🔍</div>
            <p style={{ fontWeight:"700", color:"#374151" }}>Select stops to find buses</p>
            <p style={{ fontSize:"0.85rem", marginTop:"4px" }}>Try: Majestic → Electronic City</p>
          </div>
        )}
      </div>
    </div>
  );
}

function BusCard({ bus, isDriver }) {
  const [exp, setExp] = useState(false);
  const tc = { "AC Express":{ bg:"#eff6ff", text:"#1d4ed8" }, "Ordinary":{ bg:"#fff7ed", text:"#c2410c" }, "Volvo":{ bg:"#f5f3ff", text:"#6d28d9" } }[bus.type]||{ bg:"#f3f4f6", text:"#374151" };
  const sc = bus.seats<=5?"#dc2626":bus.seats<=10?"#d97706":"#16a34a";
  return (
    <div style={{ background:"white", borderRadius:"14px", padding:"1.1rem 1.4rem", boxShadow:"0 2px 10px rgba(0,0,0,0.06)", marginBottom:"0.75rem", borderLeft:`4px solid ${bus.color}` }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:"0.5rem" }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"3px" }}>
            <span style={{ fontWeight:"800", fontSize:"0.95rem", color:"#111" }}>{bus.id}</span>
            <span style={{ fontSize:"0.72rem", fontWeight:"700", padding:"2px 8px", borderRadius:"20px", background:tc.bg, color:tc.text }}>{bus.type}</span>
          </div>
          <p style={{ margin:0, fontSize:"0.82rem", color:"#6b7280" }}>{bus.route}</p>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:"1.3rem", fontWeight:"800", color:"#111" }}>₹{bus.price}</div>
          <div style={{ fontSize:"0.72rem", color:"#9ca3af" }}>per ticket</div>
        </div>
      </div>
      <div style={{ display:"flex", gap:"1.2rem", marginTop:"0.75rem", flexWrap:"wrap" }}>
        {[["⏱","Travel",`${bus.time} min`,"#111"],["💺","Seats",bus.seats,sc],["🛑","Stops",bus.stops.length,"#111"]].map(([ic,lb,vl,cl])=>(
          <div key={lb}><div style={{ fontSize:"0.68rem", color:"#9ca3af", marginBottom:"2px" }}>{ic} {lb}</div><div style={{ fontWeight:"700", fontSize:"0.9rem", color:cl }}>{vl}</div></div>
        ))}
      </div>
      <div style={{ marginTop:"0.75rem", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <button onClick={()=>setExp(!exp)} style={{ background:"none", border:"none", color:"#6b7280", fontSize:"0.78rem", cursor:"pointer", padding:0, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{exp?"▲ Hide stops":"▼ Show stops"}</button>
        {!isDriver && <button style={{ background:bus.color, color:"white", border:"none", borderRadius:"8px", padding:"7px 16px", fontWeight:"700", cursor:"pointer", fontSize:"0.82rem", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Book Now</button>}
        {isDriver && <span style={{ fontSize:"0.82rem", color:"#16a34a", fontWeight:"700" }}>✅ Active</span>}
      </div>
      {exp && (
        <div style={{ marginTop:"0.75rem", paddingTop:"0.75rem", borderTop:"1px solid #f3f4f6", overflowX:"auto" }}>
          <div style={{ display:"flex" }}>
            {bus.stops.map((s,i)=>(
              <div key={s} style={{ display:"flex", alignItems:"center" }}>
                <div style={{ textAlign:"center", minWidth:"72px" }}>
                  <div style={{ width:"9px", height:"9px", borderRadius:"50%", background:i===0||i===bus.stops.length-1?bus.color:"#d1d5db", margin:"0 auto 3px", border:`2px solid ${bus.color}` }}/>
                  <div style={{ fontSize:"0.68rem", color:i===0||i===bus.stops.length-1?"#111":"#6b7280", fontWeight:i===0||i===bus.stops.length-1?"700":"400" }}>{s}</div>
                </div>
                {i<bus.stops.length-1 && <div style={{ flex:1, height:"2px", background:"#e5e7eb", minWidth:"12px", marginBottom:"12px" }}/>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Home ─────────────────────────────────────────────────────────
function HomePage({ onSelect }) {
  return (
    <div style={{ minHeight:"100vh", background:"#0d0b1e", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"'Plus Jakarta Sans',sans-serif", padding:"2rem", overflow:"hidden", position:"relative" }}>
      {/* Background orbs */}
      <div style={{ position:"absolute", width:"500px", height:"500px", borderRadius:"50%", background:"radial-gradient(circle,rgba(99,102,241,0.12) 0%,transparent 70%)", top:"-100px", left:"-100px", pointerEvents:"none" }}/>
      <div style={{ position:"absolute", width:"400px", height:"400px", borderRadius:"50%", background:"radial-gradient(circle,rgba(139,92,246,0.1) 0%,transparent 70%)", bottom:"-50px", right:"-50px", pointerEvents:"none" }}/>

      <div style={{ textAlign:"center", marginBottom:"3rem", position:"relative" }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:"8px", background:"rgba(139,92,246,0.1)", border:"1px solid rgba(139,92,246,0.25)", borderRadius:"24px", padding:"6px 16px", marginBottom:"1.25rem", fontSize:"0.78rem", color:"#a78bfa", fontWeight:"700", letterSpacing:"0.06em" }}>
          🚦 BENGALURU TRANSIT
        </div>
        <h1 style={{ fontSize:"3rem", fontWeight:"800", color:"white", margin:"0 0 0.75rem", letterSpacing:"-1.5px", lineHeight:1.1 }}>
          Track every ride.<br/>
          <span style={{ background:"linear-gradient(90deg,#a78bfa,#60a5fa,#34d399)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Public or private.</span>
        </h1>
        <p style={{ color:"rgba(255,255,255,0.4)", fontSize:"1rem", margin:0 }}>Real-time tracking for buses & fleet vehicles across the city</p>
      </div>

      <div style={{ display:"flex", gap:"1.25rem", flexWrap:"wrap", justifyContent:"center", position:"relative" }}>
        <HomeCard title="Public Transport" sub="Buses · Routes · Live schedules" icon="🚌" color="#3b82f6" grad="linear-gradient(135deg,#1d4ed8,#3b82f6)" onClick={()=>onSelect("public")} tags={["BMTC","City Bus","Metro"]}/>
        <HomeCard title="Private Transport" sub="Fleet · GPS routing · Fare calc" icon="🚗" color="#8b5cf6" grad="linear-gradient(135deg,#7c3aed,#8b5cf6)" onClick={()=>onSelect("private")} tags={["Sedan","SUV","Mini Bus"]} featured/>
      </div>
    </div>
  );
}

function HomeCard({ title, sub, icon, color, grad, onClick, tags, featured }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ background: hov ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.05)", border:`1.5px solid ${hov?color:"rgba(255,255,255,0.1)"}`, borderRadius:"22px", padding:"2.2rem 1.8rem", cursor:"pointer", transition:"all 0.25s", width:"250px", textAlign:"center", transform: hov?"translateY(-6px)":"none", boxShadow: hov?`0 20px 48px ${color}30`:"none", position:"relative", overflow:"hidden" }}>
      {featured && <div style={{ position:"absolute", top:"14px", right:"14px", fontSize:"0.68rem", background:color, borderRadius:"12px", padding:"3px 10px", color:"white", fontWeight:"700" }}>NEW</div>}
      <div style={{ width:"64px", height:"64px", borderRadius:"18px", background:grad, margin:"0 auto 1.1rem", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.9rem", boxShadow:`0 8px 24px ${color}40` }}>{icon}</div>
      <h2 style={{ color:"white", fontSize:"1.15rem", fontWeight:"800", margin:"0 0 0.35rem", letterSpacing:"-0.3px" }}>{title}</h2>
      <p style={{ color:"rgba(255,255,255,0.4)", fontSize:"0.82rem", margin:"0 0 1.1rem" }}>{sub}</p>
      <div style={{ display:"flex", gap:"5px", flexWrap:"wrap", justifyContent:"center" }}>
        {tags.map(t=><span key={t} style={{ fontSize:"0.68rem", padding:"3px 8px", background:`${color}20`, border:`1px solid ${color}40`, borderRadius:"20px", color:color, fontWeight:"700" }}>{t}</span>)}
      </div>
      <div style={{ marginTop:"1.4rem", background:grad, borderRadius:"10px", padding:"11px", color:"white", fontWeight:"700", fontSize:"0.88rem", boxShadow: hov?`0 4px 16px ${color}50`:"none", transition:"box-shadow 0.2s" }}>Get Started →</div>
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("home");
  const [mode, setMode] = useState(null);
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);
  const reset = () => { setScreen("home"); setMode(null); setRole(null); setUser(null); };

  return (
    <>
      <InjectStyles/>
      {screen==="home" && <HomePage onSelect={m=>{setMode(m);setScreen("auth");}}/>}
      {screen==="auth" && mode==="private" && <PrivateLoginPage onBack={()=>setScreen("home")} onLogin={u=>{setUser(u);setScreen("private-trip");}}/>}
      {screen==="auth" && mode==="public" && !role && <PublicRolePage onBack={()=>setScreen("home")} onRole={r=>setRole(r)}/>}
      {screen==="auth" && mode==="public" && role==="driver" && <DriverLoginPage onBack={()=>setRole(null)} onLogin={u=>{setUser(u);setScreen("public-search");}}/>}
      {screen==="auth" && mode==="public" && role==="passenger" && <PassengerLoginPage onBack={()=>setRole(null)} onLogin={u=>{setUser(u);setScreen("public-search");}}/>}
      {screen==="private-trip" && <PrivateTripPage user={user} onBack={reset}/>}
      {screen==="public-search" && <PublicSearchPage user={user} onBack={reset}/>}
    </>
  );
}
