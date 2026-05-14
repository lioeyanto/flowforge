import React,{useState}from 'react';
import{useNavigate,useParams}from 'react-router-dom';
import{ArrowLeft,CheckCircle,XCircle,Clock,User,Calendar,MessageSquare,ChevronRight,GitBranch,Activity,AlertTriangle}from 'lucide-react';
import{useApp}from '../../context/AppContext.jsx';
import{format,formatDistanceToNow}from 'date-fns';
export default function InstanceDetail(){
  const{id}=useParams();const navigate=useNavigate();const{state,dispatch,toast}=useApp();
  const[note,setNote]=useState('');const[loading,setLoading]=useState(null);
  const inst=state.instances.find(i=>i.id===id);
  if(!inst)return(<div style={{textAlign:'center',padding:'60px 20px'}}><AlertTriangle size={48} strokeWidth={1} style={{color:'var(--text-muted)',marginBottom:16}}/><h3 style={{color:'var(--text-secondary)',marginBottom:8}}>Instance not found</h3><button className="btn btn-primary" onClick={()=>navigate('/approvals')}>Back to Approvals</button></div>);
  const wf=state.workflows.find(w=>w.id===inst.workflowId);
  const handleAction=async(action)=>{
    setLoading(action);await new Promise(r=>setTimeout(r,800));
    const newHist=[...inst.history,{step:inst.currentStep,actor:state.user.name,action:action==='approve'?'Approved':'Rejected',timestamp:new Date().toISOString(),note:note||undefined}];
    const isLast=inst.currentStepIndex>=inst.totalSteps;
    dispatch({type:'UPDATE_INSTANCE',payload:{...inst,status:action==='reject'?'rejected':(isLast?'approved':'pending'),currentStepIndex:action==='approve'&&!isLast?inst.currentStepIndex+1:inst.currentStepIndex,currentStep:action==='approve'&&!isLast?'Step '+(inst.currentStepIndex+1):inst.currentStep,history:newHist,updatedAt:new Date().toISOString()}});
    toast(action==='approve'?'Request approved!':'Request rejected',action==='approve'?'success':'info');
    setNote('');setLoading(null);
  };
  const prog=Math.round((inst.currentStepIndex/inst.totalSteps)*100);const isPending=inst.status==='pending';
  return(
    <div className="instance-detail fade-in">
      <button className="btn btn-ghost btn-sm" onClick={()=>navigate('/approvals')} style={{marginBottom:20}}><ArrowLeft size={16}/>Back to Approvals</button>
      <div className="detail-layout">
        <div className="detail-main">
          <div className="detail-header-card glass-card">
            <div className="detail-title-row"><h1 className="detail-title">{inst.title}</h1><span className={'badge badge-'+(inst.status==='approved'?'success':inst.status==='rejected'?'danger':'warning')+' badge-lg'}>{inst.status}</span></div>
            <div className="detail-meta-row"><span><User size={13}/>{inst.initiator}</span><span><GitBranch size={13}/>{inst.workflowName}</span><span><Calendar size={13}/>Submitted {formatDistanceToNow(new Date(inst.createdAt),{addSuffix:true})}</span></div>
            <div className="detail-progress">
              <div className="detail-progress-header"><span>Current: <strong>{inst.currentStep}</strong></span><span>Step {inst.currentStepIndex} / {inst.totalSteps}</span></div>
              <div className="progress-bar" style={{height:6,marginTop:8}}><div className="progress-fill" style={{width:prog+'%'}}/></div>
            </div>
            <div className="step-pills">
              {(wf?.nodes||[]).map((node,i)=>{const isCur=inst.currentStepIndex===i+1&&isPending;const isDone=inst.currentStepIndex>i+1||inst.status==='approved';
                return(<React.Fragment key={node.id}><div className={'step-pill '+(isDone?'done':'')+(isCur?' current':'')}>{isDone?<CheckCircle size={12}/>:isCur?<Clock size={12}/>:<span>{i+1}</span>}<span className="step-pill-label">{node.label}</span></div>{i<(wf?.nodes?.length||0)-1&&<ChevronRight size={14} className="step-arrow"/>}</React.Fragment>);
              })}
            </div>
          </div>
          <div className="detail-card glass-card">
            <h3 className="detail-section-title">Request Details</h3>
            <div className="form-data-grid">{Object.entries(inst.formData||{}).map(([k,v])=>(
              <div key={k} className="form-data-item"><div className="form-data-key">{k.replace(/_/g,' ').replace(/\b\w/g,l=>l.toUpperCase())}</div><div className="form-data-value">{v}</div></div>
            ))}</div>
          </div>
          {isPending&&(
            <div className="detail-card glass-card">
              <h3 className="detail-section-title">Your Action</h3>
              <textarea className="input" rows="3" placeholder="Add a note (optional)..." value={note} onChange={e=>setNote(e.target.value)} style={{resize:'vertical',marginBottom:12}}/>
              <div className="action-buttons">
                <button className="btn btn-danger btn-lg" onClick={()=>handleAction('reject')} disabled={!!loading}>{loading==='reject'?<><span className="spinner"/>Rejecting...</>:<><XCircle size={18}/>Reject</>}</button>
                <button className="btn btn-primary btn-lg" onClick={()=>handleAction('approve')} disabled={!!loading} style={{flex:1}}>{loading==='approve'?<><span className="spinner"/>Approving...</>:<><CheckCircle size={18}/>Approve</>}</button>
              </div>
            </div>
          )}
        </div>
        <div className="detail-sidebar">
          <div className="detail-card glass-card">
            <h3 className="detail-section-title"><Activity size={14}/>Activity Timeline</h3>
            <div className="timeline">
              {inst.history.map((e,i)=>(
                <div key={i} className="timeline-item">
                  <div className={'timeline-dot '+(e.action==='Approved'?'success':e.action==='Rejected'?'danger':'neutral')}/>
                  <div className="timeline-line"/>
                  <div className="timeline-content">
                    <div className="timeline-header"><span className="timeline-actor">{e.actor}</span><span className="timeline-action">{e.action}</span></div>
                    <div className="timeline-step">{e.step}</div>
                    {e.note&&<div className="timeline-note"><MessageSquare size={11}/>{e.note}</div>}
                    <div className="timeline-time">{format(new Date(e.timestamp),'dd MMM yyyy, HH:mm')}</div>
                  </div>
                </div>
              ))}
              {isPending&&<div className="timeline-item"><div className="timeline-dot warning pulse"/><div className="timeline-content"><div className="timeline-header"><span className="timeline-actor">Waiting for approval</span></div><div className="timeline-step">{inst.currentStep}</div></div></div>}
            </div>
          </div>
          <div className="detail-card glass-card">
            <h3 className="detail-section-title">Instance Info</h3>
            <div className="info-rows">
              <div className="info-row"><span>Instance ID</span><span className="info-val mono">{inst.id}</span></div>
              <div className="info-row"><span>Workflow</span><span className="info-val">{inst.workflowName}</span></div>
              <div className="info-row"><span>Priority</span><span className={'badge badge-'+(inst.priority==='high'?'danger':'neutral')}>{inst.priority||'normal'}</span></div>
              <div className="info-row"><span>Created</span><span className="info-val">{format(new Date(inst.createdAt),'dd MMM yyyy')}</span></div>
              <div className="info-row"><span>Updated</span><span className="info-val">{format(new Date(inst.updatedAt),'dd MMM yyyy')}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
