"use client";

import { useState, useEffect, useRef } from "react";

const PHASES = [
  { key:"preparation", label:"Préparation", icon:"📋", color:"#6366f1", duree:5 },
  { key:"ouverture",   label:"Ouverture",   icon:"⚖️", color:"var(--gold)", duree:5 },
  { key:"accusation",  label:"Accusation",  icon:"⚔️", color:"#ef4444", duree:10 },
  { key:"defense",     label:"Défense",     icon:"🛡️", color:"#22c55e", duree:10 },
  { key:"temoins",     label:"Témoins",     icon:"👥", color:"#f97316", duree:10 },
  { key:"requisitoire",label:"Réquisitoire",icon:"📢", color:"#ef4444", duree:5 },
  { key:"plaidoirie",  label:"Plaidoirie",  icon:"🎤", color:"#22c55e", duree:10 },
  { key:"delibere",    label:"Délibéré",    icon:"🔨", color:"#a855f7", duree:5 },
];

function pad(n:number) { return String(n).padStart(2,"0"); }
function fmtTime(s:number) { return `${pad(Math.floor(s/60))}:${pad(s%60)}`; }

export default function MinuteurPage() {
  const [phase, setPhase] = useState(0);
  const [dureeMin, setDureeMin] = useState(PHASES[0].duree);
  const [seconds, setSeconds] = useState(PHASES[0].duree*60);
  const [running, setRunning] = useState(false);
  const [ended, setEnded] = useState(false);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [log, setLog] = useState<{phase:string;duree:number;ts:string}[]>([]);
  const [customMode, setCustomMode] = useState(false);
  const [customMin, setCustomMin] = useState(5);
  const [totalAudience, setTotalAudience] = useState(60);
  const [audienceElapsed, setAudienceElapsed] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout|null>(null);
  const totalRef = useRef<NodeJS.Timeout|null>(null);

  const currentPhase = PHASES[phase];
  const pct = Math.max(0, seconds / (dureeMin*60)) * 100;
  const audiencePct = Math.min(100, (audienceElapsed / (totalAudience*60)) * 100);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            setRunning(false);
            setEnded(true);
            clearInterval(intervalRef.current!);
            return 0;
          }
          return s - 1;
        });
        setTotalElapsed(t => t+1);
        setAudienceElapsed(t => t+1);
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  function startPhase(idx:number, min?:number) {
    const d = min ?? PHASES[idx].duree;
    setPhase(idx);
    setDureeMin(d);
    setSeconds(d*60);
    setRunning(false);
    setEnded(false);
  }

  function toggleTimer() {
    if (ended) return;
    setRunning(r => !r);
  }

  function nextPhase() {
    if (phase < PHASES.length-1) {
      setLog(l=>[...l,{phase:currentPhase.label,duree:Math.round(totalElapsed/60),ts:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}]);
      startPhase(phase+1);
    }
  }

  function reset() {
    setRunning(false);
    setEnded(false);
    setSeconds(dureeMin*60);
  }

  function fullReset() {
    setRunning(false); setEnded(false); setPhase(0);
    setDureeMin(PHASES[0].duree); setSeconds(PHASES[0].duree*60);
    setTotalElapsed(0); setAudienceElapsed(0); setLog([]);
  }

  // Couleur du timer selon temps restant
  const timerColor = ended ? "var(--danger)"
    : pct > 50 ? currentPhase.color
    : pct > 20 ? "var(--warning)"
    : "var(--danger)";

  return (
    <div className="page-container">
      <a className="back-link" href="/audiences">← Audiences</a>

      <div className="page-header">
        <div>
          <h1 className="page-title">Minuteur d'audience</h1>
          <p className="page-subtitle">Gestion du temps en procès RP</p>
          <div className="gold-line" />
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:"1.5rem" }}>

        {/* ─── TIMER PRINCIPAL ─── */}
        <div style={{ display:"flex", flexDirection:"column", gap:"1.25rem" }}>

          {/* Chrono */}
          <div className="card" style={{ textAlign:"center", padding:"2.5rem 2rem", borderColor:ended?"rgba(239,68,68,0.4)":"var(--border)" }}>
            {/* Phase actuelle */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"0.625rem", marginBottom:"1.5rem" }}>
              <span style={{ fontSize:"1.5rem" }}>{currentPhase.icon}</span>
              <span style={{ fontFamily:"'Cinzel',serif", fontSize:"1rem", color:currentPhase.color, letterSpacing:"0.15em", fontWeight:600 }}>
                {currentPhase.label.toUpperCase()}
              </span>
            </div>

            {/* Cercle progressif */}
            <div style={{ position:"relative", display:"inline-flex", alignItems:"center", justifyContent:"center", marginBottom:"2rem" }}>
              <svg width={220} height={220} style={{ transform:"rotate(-90deg)" }}>
                <circle cx={110} cy={110} r={100} fill="none" stroke="var(--border)" strokeWidth={8} />
                <circle cx={110} cy={110} r={100} fill="none"
                  stroke={timerColor} strokeWidth={8}
                  strokeDasharray={`${2*Math.PI*100}`}
                  strokeDashoffset={`${2*Math.PI*100*(1-pct/100)}`}
                  strokeLinecap="round"
                  style={{ transition:"stroke-dashoffset 1s linear, stroke 0.5s" }}
                />
              </svg>
              <div style={{ position:"absolute", textAlign:"center" }}>
                <div style={{
                  fontFamily:"'Playfair Display',serif", fontSize:"3rem", fontWeight:900,
                  color:timerColor, lineHeight:1, transition:"color 0.5s",
                }}>{fmtTime(seconds)}</div>
                <div style={{ fontSize:"0.75rem", color:"var(--text-dim)", marginTop:"0.35rem" }}>
                  {dureeMin} min · {ended?"⏰ TERMINÉ":running?"En cours…":"En pause"}
                </div>
              </div>
            </div>

            {/* Contrôles */}
            <div style={{ display:"flex", gap:"0.75rem", justifyContent:"center", flexWrap:"wrap" }}>
              <button className="btn btn-ghost" onClick={reset} style={{ minWidth:80 }}>↺ Reset</button>
              <button
                onClick={toggleTimer}
                disabled={ended}
                style={{
                  padding:"0.875rem 2.5rem", borderRadius:"var(--radius)", cursor:ended?"not-allowed":"pointer",
                  fontFamily:"'Inter',sans-serif", fontWeight:700, fontSize:"1rem",
                  background:running?"rgba(239,68,68,0.15)":currentPhase.color+"20",
                  border:`2px solid ${running?"var(--danger)":currentPhase.color}`,
                  color:running?"var(--danger)":currentPhase.color,
                  transition:"all 0.15s", opacity:ended?0.4:1,
                }}
              >{running?"⏸ Pause":"▶ Lancer"}</button>
              {phase < PHASES.length-1 && (
                <button className="btn btn-outline" onClick={nextPhase} style={{ minWidth:120 }}>
                  Phase suivante →
                </button>
              )}
            </div>
          </div>

          {/* Phases */}
          <div className="card">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
              <div className="section-title">Phases de l'audience</div>
              <label style={{ display:"flex", alignItems:"center", gap:"0.4rem", fontSize:"0.78rem", color:"var(--text-muted)", cursor:"pointer" }}>
                <input type="checkbox" checked={customMode} onChange={e=>setCustomMode(e.target.checked)} style={{ width:"auto" }} />
                Durées personnalisées
              </label>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.5rem" }}>
              {PHASES.map((p,i) => (
                <button key={p.key} onClick={()=>startPhase(i, customMode?customMin:p.duree)}
                  style={{
                    display:"flex", alignItems:"center", gap:"0.625rem",
                    padding:"0.6rem 0.875rem", borderRadius:"var(--radius)",
                    background: phase===i ? p.color+"18" : "var(--surface)",
                    border:`1px solid ${phase===i ? p.color+"50" : "var(--border)"}`,
                    cursor:"pointer", fontFamily:"'Inter',sans-serif", transition:"all 0.12s",
                    textAlign:"left",
                  }}>
                  <span style={{ fontSize:"1rem", flexShrink:0 }}>{p.icon}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:"0.78rem", fontWeight:phase===i?700:400, color:phase===i?p.color:"var(--text-muted)",
                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.label}</div>
                    <div style={{ fontSize:"0.65rem", color:"var(--text-dim)" }}>
                      {customMode ? `${customMin} min custom` : `${p.duree} min`}
                    </div>
                  </div>
                  {phase===i && <span style={{ fontSize:"0.65rem", color:p.color }}>●</span>}
                </button>
              ))}
            </div>
            {customMode && (
              <div className="form-group" style={{ marginTop:"0.875rem" }}>
                <label>Durée personnalisée (minutes)</label>
                <input type="number" min={1} max={120} value={customMin}
                  onChange={e=>setCustomMin(Number(e.target.value))} style={{ width:120 }} />
              </div>
            )}
          </div>
        </div>

        {/* ─── SIDEBAR DROITE ─── */}
        <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>

          {/* Durée totale audience */}
          <div className="card">
            <div className="section-title" style={{ marginBottom:"0.875rem" }}>Durée totale audience</div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.825rem", marginBottom:"0.625rem" }}>
              <span style={{ color:"var(--text-muted)" }}>Écoulé</span>
              <span style={{ fontWeight:600, color:"var(--gold)" }}>{fmtTime(audienceElapsed)}</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.825rem", marginBottom:"0.875rem" }}>
              <span style={{ color:"var(--text-muted)" }}>Budget total</span>
              <input type="number" min={10} max={240} value={totalAudience}
                onChange={e=>setTotalAudience(Number(e.target.value))}
                style={{ width:70, textAlign:"right", padding:"0.2rem 0.4rem", fontSize:"0.8rem" }} />
              <span style={{ color:"var(--text-dim)", fontSize:"0.75rem" }}>min</span>
            </div>
            <div style={{ height:6, background:"var(--border)", borderRadius:3, overflow:"hidden" }}>
              <div style={{
                height:"100%", borderRadius:3, transition:"width 1s linear",
                width:`${Math.min(100,audiencePct)}%`,
                background: audiencePct<70 ? "var(--success)" : audiencePct<90 ? "var(--warning)" : "var(--danger)",
              }} />
            </div>
            <div style={{ fontSize:"0.7rem", color:"var(--text-dim)", marginTop:"0.35rem", textAlign:"right" }}>
              {Math.max(0,totalAudience*60-audienceElapsed)>0 ? `${fmtTime(Math.max(0,totalAudience*60-audienceElapsed))} restant` : "⏰ Budget dépassé"}
            </div>
          </div>

          {/* Log des phases */}
          {log.length > 0 && (
            <div className="card">
              <div className="section-title" style={{ marginBottom:"0.875rem" }}>Phases complétées</div>
              <div style={{ display:"flex", flexDirection:"column", gap:"0.375rem" }}>
                {log.map((l,i) => (
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", fontSize:"0.78rem",
                    padding:"0.35rem 0", borderBottom:"1px solid var(--border)" }}>
                    <span style={{ color:"var(--text-muted)" }}>{l.phase}</span>
                    <span style={{ color:"var(--text-dim)" }}>~{l.duree} min · {l.ts}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reset total */}
          <button className="btn btn-outline" onClick={fullReset} style={{ width:"100%", justifyContent:"center" }}>
            ↺ Nouvelle audience
          </button>
        </div>
      </div>
    </div>
  );
}
