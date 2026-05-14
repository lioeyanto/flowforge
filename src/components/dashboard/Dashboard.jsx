import React,{useState}from 'react';
import{useNavigate}from 'react-router-dom';
import{Plus,GitBranch,CheckSquare,Clock,ArrowRight,Edit,Trash2,Copy,MoreVertical,Search,Activity,Zap,Users}from 'lucide-react';
import{useApp}from '../../context/AppContext.jsx';
import{formatDistanceToNow}from 'date-fns';
import '../../styles/dashboard.css';
const catColors={Finance:{bg:'rgba(251,191,36,0.1)',color:'#fbbf24',border:'rgba(251,191,36,0.25)'},Procurement:{bg:'rgba(129,140,248,0.1)',color:'#818cf8',border:'rgba(129,140,248,0.25)'},HR:{bg:'rgba(52,211,153,0.1)',color:'#34d399',border:'rgba(52,211,153,0.25)'},Operations:{bg:'rgba(251,146,60,0.1)',color:'#fb923c',border:'rgba(251,146,60,0.25)'},IT:{bg:'rgba(56,189,248,0.1)',color:'#38bdf8',border:'rgba(56,189,248,0.25)'}};
export default function Dashboard(){
  const{state,dispatch,toast}=useApp();const navigate=useNavigate();
  const[search,setSearch]=useState('');const[filterCat,setFilterCat]=useState('All');const[openMenu,setOpenMenu]=useState(null);
  const pending=state.instances.filter(i=>i.status==='pending').length;
  const approved=state.instances.filter(i=>i.status==='approved').length;
  const activeWf=state.workflows.filter(w=>w.status==='active').length;
  const categories=['All',...new Set(state.workflows.map(w=>w.category))];
  const filtered=state.workflows.filter(w=>(w.name.toLowerCase().includes(search.toLowerCase()))&&(filterCat==='All'||w.category===filterCat));
  const recent=[...state.instances].sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt)).slice(0,5);
  return(
    <div className="dashboard">
      <div className="dashboard-header fade-in">
        <div><h1 className="page-title">Dashboard</h1><p className="page-subtitle">Manage your workflow approvals</p></div>
        <button className="btn btn-primary btn-lg" onClick={()=>navigate('/builder/new')}><Plus size={18}/>New Workflow</button>
      </div>
      <div className="stats-grid fade-in-delay-1">
        {[{label:'Active Workflows',value:activeWf,icon:GitBranch,color:'var(--accent-primary)',sub:state.workflows.length+' total'},{label:'Pending Approvals',value:pending,icon:Clock,color:'var(--accent-warning)',sub:'awaiting action'},{label:'Total Submissions',value:state.instances.length,icon:Activity,color:'var(--accent-secondary)',sub:'all time'},{label:'Approved',value:approved,icon:CheckSquare,color:'var(--accent-success)',sub:(state.instances.length>0?Math.round(approved/state.instances.length*100):0)+'% rate'}].map(({label,value,icon:Icon,color,sub})=>(
          <div key={label} className="stat-card glass-card"><div className="stat-icon" style={{background:color+'18',color}}><Icon size={20}/></div><div className="stat-value">{value}</div><div className="stat-label">{label}</div><div className="stat-sub">{sub}</div></div>
        ))}
      </div>
      <div className="dashboard-body">
        <div className="workflows-section fade-in-delay-2">
          <div className="section-header">
            <h2 className="section-title">Workflows</h2>
            <div className="section-controls">
              <div className="search-wrap"><Search size={14} className="search-icon"/><input className="input search-input" placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
              <div className="filter-tabs">{categories.map(c=><button key={c} className={'filter-tab '+(filterCat===c?'active':'')} onClick={()=>setFilterCat(c)}>{c}</button>)}</div>
            </div>
          </div>
          <div className="workflow-cards">
            <button className="workflow-card new-card" onClick={()=>navigate('/builder/new')}><div className="new-card-icon"><Plus size={24}/></div><span>Create New Workflow</span><p>Design your approval flow visually</p></button>
            {filtered.map(wf=>{const cs=catColors[wf.category]||catColors.IT;return(
              <div key={wf.id} className="workflow-card" onClick={()=>navigate('/builder/'+wf.id)}>
                <div className="wf-card-top">
                  <div className="wf-cat-badge" style={{background:cs.bg,color:cs.color,border:'1px solid '+cs.border}}>{wf.category}</div>
                  <div className="wf-card-menu" onClick={e=>{e.stopPropagation();setOpenMenu(openMenu===wf.id?null:wf.id);}}>
                    <MoreVertical size={16}/>
                    {openMenu===wf.id&&<div className="dropdown-menu">
                      <button onClick={e=>{e.stopPropagation();navigate('/builder/'+wf.id);setOpenMenu(null);}}><Edit size={14}/>Edit</button>
                      <button onClick={e=>{e.stopPropagation();dispatch({type:'SAVE_WORKFLOW',payload:{...wf,id:'wf-'+Date.now(),name:wf.name+' (Copy)',status:'draft'}});toast('Duplicated','success');setOpenMenu(null);}}><Copy size={14}/>Duplicate</button>
                      <div className="dropdown-divider"/>
                      <button className="danger" onClick={e=>{e.stopPropagation();dispatch({type:'DELETE_WORKFLOW',payload:wf.id});toast('Deleted','success');setOpenMenu(null);}}><Trash2 size={14}/>Delete</button>
                    </div>}
                  </div>
                </div>
                <h3 className="wf-name">{wf.name}</h3><p className="wf-desc">{wf.description}</p>
                <div className="wf-meta"><span><GitBranch size={12}/>{wf.nodes?.length||0} nodes</span><span><Users size={12}/>{wf.instanceCount} runs</span><span><Clock size={12}/>v{wf.version}</span></div>
                <div className="wf-footer"><span className={'badge badge-'+(wf.status==='active'?'success':'neutral')}>{wf.status}</span>{wf.pendingCount>0&&<span className="badge badge-warning">{wf.pendingCount} pending</span>}</div>
              </div>
            );})}
          </div>
        </div>
        <div className="right-panel fade-in-delay-3">
          <div className="panel-card glass-card">
            <div className="panel-header"><h3 className="panel-title"><Activity size={16}/>Recent Activity</h3><button className="btn btn-ghost btn-sm" onClick={()=>navigate('/approvals')}>View all<ArrowRight size={13}/></button></div>
            <div className="activity-list">{recent.map(inst=>(
              <div key={inst.id} className="activity-item" onClick={()=>navigate('/approvals/'+inst.id)}>
                <div className={'activity-dot '+(inst.status==='approved'?'success':inst.status==='rejected'?'danger':'warning')}/>
                <div className="activity-content"><div className="activity-title">{inst.title}</div><div className="activity-meta"><span>{inst.currentStep}</span><span>•</span><span>{formatDistanceToNow(new Date(inst.updatedAt),{addSuffix:true})}</span></div></div>
                <span className={'badge badge-'+(inst.status==='approved'?'success':inst.status==='rejected'?'danger':'warning')} style={{fontSize:10}}>{inst.status}</span>
              </div>
            ))}</div>
          </div>
          <div className="panel-card glass-card">
            <div className="panel-header"><h3 className="panel-title"><Zap size={16}/>Quick Start</h3></div>
            <div className="quickstart-list">{[{label:'Business Trip Request',desc:'Multi-level travel approval',cat:'Finance'},{label:'Purchase Order',desc:'Procurement flow',cat:'Procurement'},{label:'Leave Request',desc:'HR leave management',cat:'HR'},{label:'IT Access Request',desc:'System access approval',cat:'IT'}].map(t=>{const cs=catColors[t.cat]||catColors.IT;return(<button key={t.label} className="quickstart-item" onClick={()=>navigate('/builder/new')}><div className="quickstart-dot" style={{background:cs.color}}/><div><div className="quickstart-label">{t.label}</div><div className="quickstart-desc">{t.desc}</div></div><ArrowRight size={14} className="quickstart-arrow"/></button>);})}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
