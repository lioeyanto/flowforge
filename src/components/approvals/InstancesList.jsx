import React,{useState}from 'react';
import{useNavigate}from 'react-router-dom';
import{Search,Clock,CheckCircle,XCircle,AlertCircle,ChevronRight,User,Calendar,Plus}from 'lucide-react';
import{useApp}from '../../context/AppContext.jsx';
import{formatDistanceToNow}from 'date-fns';
import SubmitRequestModal from './SubmitRequestModal.jsx';
import '../../styles/approvals.css';
const SC={pending:{badge:'warning',icon:Clock,label:'Pending'},approved:{badge:'success',icon:CheckCircle,label:'Approved'},rejected:{badge:'danger',icon:XCircle,label:'Rejected'},draft:{badge:'neutral',icon:AlertCircle,label:'Draft'}};
export default function InstancesList(){
  const{state}=useApp();const navigate=useNavigate();
  const[search,setSearch]=useState('');const[statusFilter,setStatusFilter]=useState('all');const[wfFilter,setWfFilter]=useState('all');const[showSubmit,setShowSubmit]=useState(false);
  const filtered=state.instances.filter(i=>{
    const ms=i.title.toLowerCase().includes(search.toLowerCase())||i.initiator.toLowerCase().includes(search.toLowerCase());
    return ms&&(statusFilter==='all'||i.status===statusFilter)&&(wfFilter==='all'||i.workflowId===wfFilter);
  }).sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt));
  const counts={all:state.instances.length,pending:state.instances.filter(i=>i.status==='pending').length,approved:state.instances.filter(i=>i.status==='approved').length,rejected:state.instances.filter(i=>i.status==='rejected').length};
  return(
    <div className="approvals-page">
      <div className="dashboard-header fade-in">
        <div><h1 className="page-title">Approval Instances</h1><p className="page-subtitle">Track and manage all workflow approval requests</p></div>
        <button className="btn btn-primary" onClick={()=>setShowSubmit(true)}><Plus size={16}/>New Request</button>
      </div>
      <div className="approvals-filters fade-in-delay-1">
        <div className="search-wrap"><Search size={14} className="search-icon"/><input className="input search-input" placeholder="Search requests..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:260}}/></div>
        <div className="filter-tabs">{Object.entries(counts).map(([k,c])=><button key={k} className={'filter-tab '+(statusFilter===k?'active':'')} onClick={()=>setStatusFilter(k)}>{k==='all'?'All':k.charAt(0).toUpperCase()+k.slice(1)}<span className="filter-count">{c}</span></button>)}</div>
        <select className="input" style={{width:180}} value={wfFilter} onChange={e=>setWfFilter(e.target.value)}><option value="all">All Workflows</option>{state.workflows.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</select>
      </div>
      <div className="instances-list fade-in-delay-2">
        {filtered.length===0
          ?<div className="empty-state glass-card"><AlertCircle size={40} strokeWidth={1}/><h3>No requests found</h3><p>No approval requests match your filters.</p><button className="btn btn-primary" onClick={()=>setShowSubmit(true)}>Submit First Request</button></div>
          :filtered.map(inst=>{const sc=SC[inst.status]||SC.pending;const SI=sc.icon;const prog=Math.round((inst.currentStepIndex/inst.totalSteps)*100);return(
            <div key={inst.id} className="instance-card glass-card" onClick={()=>navigate('/approvals/'+inst.id)}>
              <div className="instance-left"><div className={'instance-status-icon status-'+inst.status}><SI size={18}/></div></div>
              <div className="instance-body">
                <div className="instance-top">
                  <div><h3 className="instance-title">{inst.title}</h3><div className="instance-meta"><span><User size={11}/>{inst.initiator}</span><span>•</span><span>{inst.workflowName}</span><span>•</span><span><Calendar size={11}/>{formatDistanceToNow(new Date(inst.createdAt),{addSuffix:true})}</span></div></div>
                  <div className="instance-badges">{inst.priority==='high'&&<span className="badge badge-danger">High Priority</span>}<span className={'badge badge-'+sc.badge}>{sc.label}</span></div>
                </div>
                <div className="instance-step-label"><span>Current: <strong>{inst.currentStep}</strong></span><span>Step {inst.currentStepIndex} of {inst.totalSteps}</span></div>
                <div className="progress-bar"><div className="progress-fill" style={{width:prog+'%'}}/></div>
              </div>
              <div className="instance-action"><ChevronRight size={18}/></div>
            </div>
          );})}
      </div>
      {showSubmit&&<SubmitRequestModal onClose={()=>setShowSubmit(false)}/>}
    </div>
  );
}
