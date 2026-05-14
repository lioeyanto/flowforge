import React,{useState}from 'react';
import{Copy,Check,Lock,Zap,GitBranch,Activity,ChevronDown,ChevronRight,Globe}from 'lucide-react';
import{useApp}from '../../context/AppContext.jsx';
import '../../styles/api.css';
const BASE='https://api.flowforge.app/v1';
const MC={GET:{bg:'rgba(52,211,153,0.15)',color:'#34d399',border:'rgba(52,211,153,0.3)'},POST:{bg:'rgba(56,189,248,0.15)',color:'#38bdf8',border:'rgba(56,189,248,0.3)'},PUT:{bg:'rgba(251,191,36,0.15)',color:'#fbbf24',border:'rgba(251,191,36,0.3)'},DELETE:{bg:'rgba(248,113,113,0.15)',color:'#f87171',border:'rgba(248,113,113,0.3)'}};
const EPS=[
  {method:'POST',path:'/workflows/{id}/submit',title:'Submit Workflow Instance',desc:'Submit a new approval request.',group:'Instances',
    example:'curl -X POST "'+BASE+'/workflows/wf-001/submit" \\\n  -H "Authorization: Bearer YOUR_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d \'{"initiator":{"name":"Budi","email":"budi@co.com"},"formData":{"destination":"Jakarta","estimated_cost":"3500000"}}\'',
    response:'{\n  "success": true,\n  "instance": {\n    "id": "inst-abc123",\n    "status": "pending",\n    "currentStep": "Direct Superior Approval",\n    "trackingUrl": "http://localhost:3000/approvals/inst-abc123"\n  }\n}'},
  {method:'GET',path:'/instances/{id}',title:'Get Instance Status',desc:'Retrieve status and full history of a workflow instance.',group:'Instances',
    example:'curl "'+BASE+'/instances/inst-abc123" \\\n  -H "Authorization: Bearer YOUR_KEY"',
    response:'{\n  "id": "inst-abc123",\n  "status": "pending",\n  "currentStep": "Finance & Accounting",\n  "progressPercent": 50,\n  "history": [\n    {"step":"Submitted","actor":"Budi","action":"Submitted"},\n    {"step":"Direct Superior","actor":"Ahmad","action":"Approved"}\n  ]\n}'},
  {method:'GET',path:'/workflows',title:'List All Workflows',desc:'Retrieve all active workflow templates.',group:'Workflows',
    example:'curl "'+BASE+'/workflows?status=active" \\\n  -H "Authorization: Bearer YOUR_KEY"',
    response:'{\n  "workflows": [...],\n  "total": 3\n}'},
  {method:'POST',path:'/instances/{id}/approve',title:'Approve / Reject',desc:'Programmatically approve or reject a workflow step.',group:'Actions',
    example:'curl -X POST "'+BASE+'/instances/inst-abc123/approve" \\\n  -H "Authorization: Bearer YOUR_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d \'{"action":"approve","actor":{"name":"Ahmad","email":"ahmad@co.com"},"note":"Approved"}\'',
    response:'{\n  "success": true,\n  "instance": {\n    "id": "inst-abc123",\n    "status": "pending",\n    "currentStep": "Finance & Accounting"\n  }\n}'},
  {method:'POST',path:'/webhooks',title:'Register Webhook',desc:'Register a URL for real-time event notifications.',group:'Webhooks',
    example:'curl -X POST "'+BASE+'/webhooks" \\\n  -H "Authorization: Bearer YOUR_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d \'{"url":"https://yourapp.com/hook","events":["instance.approved","instance.rejected"]}\'',
    response:'{\n  "webhookId": "wh-xyz789",\n  "status": "active"\n}'},
];
function CopyBtn({text}){
  const[c,setC]=useState(false);
  return<button className="btn btn-ghost btn-sm" style={{fontSize:12,padding:'4px 8px',color:'var(--text-muted)'}} onClick={()=>{navigator.clipboard.writeText(text);setC(true);setTimeout(()=>setC(false),2000);}}>{c?<><Check size={13}/>Copied!</>:<><Copy size={13}/>Copy</>}</button>;
}
function EPCard({ep}){
  const[open,setOpen]=useState(false);const mc=MC[ep.method]||MC.GET;
  return(
    <div className={'endpoint-card '+(open?'open':'')}>
      <div className="endpoint-summary" onClick={()=>setOpen(!open)}>
        <div className="endpoint-method-wrap"><span className="endpoint-method" style={{background:mc.bg,color:mc.color,border:'1px solid '+mc.border}}>{ep.method}</span><code className="endpoint-path">{ep.path}</code></div>
        <div className="endpoint-title">{ep.title}</div>
        {open?<ChevronDown size={16}/>:<ChevronRight size={16}/>}
      </div>
      {open&&<div className="endpoint-body fade-in">
        <p className="endpoint-desc">{ep.desc}</p>
        <div className="code-section"><div className="code-header"><span>Example Request</span><CopyBtn text={ep.example}/></div><pre className="code-block">{ep.example}</pre></div>
        <div className="code-section"><div className="code-header"><span>Example Response</span><span className="badge badge-success" style={{fontSize:10}}>200 OK</span><CopyBtn text={ep.response}/></div><pre className="code-block" style={{color:'var(--accent-primary)'}}>{ep.response}</pre></div>
      </div>}
    </div>
  );
}
export default function APIReference(){
  const{state}=useApp();
  const groups=[...new Set(EPS.map(e=>e.group))];
  return(
    <div className="api-page fade-in">
      <div className="dashboard-header"><div><h1 className="page-title">API Reference</h1><p className="page-subtitle">Integrate FlowForge with your external applications</p></div><div className="api-key-badge"><Lock size={13}/><span>REST API</span><span className="badge badge-success">v1</span></div></div>
      <div className="api-layout">
        <div className="api-main">
          <div className="api-section glass-card">
            <h2 className="api-section-title"><Lock size={16}/>Authentication</h2>
            <p className="api-desc">Semua request memerlukan Bearer token di header Authorization.</p>
            <div className="code-section"><div className="code-header"><span>Base URL</span><CopyBtn text={BASE}/></div><pre className="code-block">{BASE}</pre></div>
            <div className="code-section"><div className="code-header"><span>Authorization Header</span></div><pre className="code-block">Authorization: Bearer YOUR_API_KEY</pre></div>
          </div>
          {groups.map(g=>(
            <div key={g} className="api-section">
              <h2 className="api-section-title">{g==='Instances'?<Activity size={16}/>:g==='Workflows'?<GitBranch size={16}/>:g==='Actions'?<Zap size={16}/>:<Globe size={16}/>}{g}</h2>
              {EPS.filter(e=>e.group===g).map(ep=><EPCard key={ep.path+ep.method} ep={ep}/>)}
            </div>
          ))}
        </div>
        <div className="api-sidebar">
          <div className="api-sidebar-card glass-card">
            <h3 className="panel-title"><Zap size={15}/>Quick Start</h3>
            <div style={{marginTop:12,display:'flex',flexDirection:'column',gap:10}}>{['Get API key dari Settings','Submit request via POST /submit','Track via GET /instances/:id atau webhook'].map((s,i)=><div key={i} style={{display:'flex',gap:10,alignItems:'flex-start'}}><span style={{width:22,height:22,borderRadius:'50%',background:'rgba(56,189,248,0.15)',color:'var(--accent-primary)',fontSize:11,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{i+1}</span><span style={{fontSize:12,color:'var(--text-secondary)'}}>{s}</span></div>)}</div>
          </div>
          <div className="api-sidebar-card glass-card">
            <h3 className="panel-title"><GitBranch size={15}/>Active Workflows</h3>
            <div style={{marginTop:12}}>{state.workflows.filter(w=>w.status==='active').map(wf=>(
              <div key={wf.id} style={{padding:10,background:'var(--bg-elevated)',borderRadius:'var(--radius-md)',marginBottom:6}}>
                <div style={{fontSize:12,fontWeight:600,color:'var(--text-primary)',marginBottom:4}}>{wf.name}</div>
                <code style={{fontSize:10,color:'var(--accent-primary)',background:'var(--bg-base)',padding:'2px 6px',borderRadius:4}}>{wf.id}</code>
              </div>
            ))}</div>
          </div>
          <div className="api-sidebar-card glass-card">
            <h3 className="panel-title">Rate Limits</h3>
            <div style={{marginTop:12,display:'flex',flexDirection:'column',gap:8}}>{[['Requests/min','60'],['Requests/day','10,000'],['Webhooks','10 per org'],['Payload max','5 MB']].map(([k,v])=><div key={k} style={{display:'flex',justifyContent:'space-between',fontSize:12}}><span style={{color:'var(--text-muted)'}}>{k}</span><span style={{fontWeight:600,color:'var(--text-primary)'}}>{v}</span></div>)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
