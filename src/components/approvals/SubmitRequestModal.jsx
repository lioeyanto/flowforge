import React,{useState}from 'react';
import{X,Send,ChevronRight}from 'lucide-react';
import{useApp}from '../../context/AppContext.jsx';
export default function SubmitRequestModal({onClose}){
  const{state,dispatch,toast}=useApp();
  const[step,setStep]=useState(1);const[sel,setSel]=useState(null);const[form,setForm]=useState({});const[loading,setLoading]=useState(false);
  const active=state.workflows.filter(w=>w.status==='active');
  const startNode=sel?.nodes?.find(n=>n.type==='start');
  const fields=startNode?.config?.formFields||[];
  const handleSubmit=async()=>{
    if(!sel)return;setLoading(true);await new Promise(r=>setTimeout(r,600));
    const firstApproval=sel.nodes?.find(n=>n.type==='approval');
    dispatch({type:'CREATE_INSTANCE',payload:{workflowId:sel.id,workflowName:sel.name,title:sel.name+' \u2014 '+state.user.name,initiator:state.user.name,initiatorEmail:state.user.email,status:'pending',currentStep:firstApproval?.label||'Review',currentStepIndex:1,totalSteps:sel.nodes?.filter(n=>n.type!=='end').length||1,formData:form,history:[{step:'Submitted',actor:state.user.name,action:'Submitted',timestamp:new Date().toISOString()}],priority:'normal'}});
    toast('Request submitted!','success');setLoading(false);onClose();
  };
  return(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel glass-card slide-in" onClick={e=>e.stopPropagation()} style={{maxWidth:540}}>
        <div className="modal-header">
          <div><h3 className="panel-title"><Send size={16}/>Submit New Request</h3><div style={{fontSize:12,color:'var(--text-muted)',marginTop:4}}>Step {step} of 2: {step===1?'Select Workflow':'Fill Request Form'}</div></div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={16}/></button>
        </div>
        <div className="modal-body">
          {step===1
            ?<div>
              <p style={{color:'var(--text-muted)',fontSize:13,marginBottom:16}}>Choose a workflow template:</p>
              {active.length===0?<div style={{textAlign:'center',padding:'24px',color:'var(--text-muted)'}}>No active workflows. Publish a workflow first.</div>
              :active.map(wf=>(
                <div key={wf.id} className={'submit-workflow-item '+(sel?.id===wf.id?'selected':'')} onClick={()=>setSel(wf)}>
                  <div className="submit-wf-info"><div className="submit-wf-name">{wf.name}</div><div className="submit-wf-desc">{wf.description}</div><div className="submit-wf-meta"><span className="badge badge-neutral">{wf.category}</span><span style={{fontSize:11,color:'var(--text-muted)'}}>{wf.nodes?.filter(n=>n.type==='approval').length||0} approval steps</span></div></div>
                  <ChevronRight size={16} style={{color:sel?.id===wf.id?'var(--accent-primary)':'var(--text-muted)'}}/>
                </div>
              ))}
            </div>
            :<div>
              <div style={{background:'var(--bg-elevated)',borderRadius:'var(--radius-md)',padding:'10px 14px',marginBottom:16,fontSize:13}}><strong>{sel.name}</strong></div>
              {fields.length===0?<p style={{color:'var(--text-muted)',fontSize:13}}>No form fields. You can submit directly.</p>
              :fields.map(field=>(
                <div key={field.id} className="config-field">
                  <label className="config-label">{field.label}{field.required&&<span style={{color:'var(--accent-danger)'}}> *</span>}</label>
                  {field.type==='textarea'?<textarea className="input" rows="3" value={form[field.key]||''} onChange={e=>setForm(d=>({...d,[field.key]:e.target.value}))} style={{resize:'vertical'}}/>
                  :field.type==='select'?<select className="input" value={form[field.key]||''} onChange={e=>setForm(d=>({...d,[field.key]:e.target.value}))}><option value="">Select...</option>{(field.options||'').split(',').map(o=>o.trim()).filter(Boolean).map(o=><option key={o} value={o}>{o}</option>)}</select>
                  :<input className="input" type={field.type==='currency'?'number':field.type} value={form[field.key]||''} onChange={e=>setForm(d=>({...d,[field.key]:e.target.value}))}/>}
                </div>
              ))}
            </div>
          }
        </div>
        <div className="modal-footer">
          {step===2&&<button className="btn btn-ghost" onClick={()=>setStep(1)}>Back</button>}
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          {step===1?<button className="btn btn-primary" disabled={!sel} onClick={()=>setStep(2)}>Next<ChevronRight size={15}/></button>
          :<button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>{loading?<><span className="spinner"/>Submitting...</>:<><Send size={15}/>Submit Request</>}</button>}
        </div>
      </div>
    </div>
  );
}
