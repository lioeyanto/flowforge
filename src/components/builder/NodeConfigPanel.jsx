import React,{useState,useEffect}from 'react';
import{X,Trash2,Plus,Minus}from 'lucide-react';
import{NODE_TYPES}from './WorkflowBuilder.jsx';
const APPROVERS=[{value:'direct_superior',label:'Direct Superior'},{value:'dept_head',label:'Department Head'},{value:'finance_staff',label:'Finance Staff'},{value:'hr_staff',label:'HR Staff'},{value:'cfo',label:'CFO'},{value:'ceo',label:'CEO'},{value:'specific_user',label:'Specific User'},{value:'role',label:'By Role'}];
const OPERATORS=[{value:'>',label:'Greater than (>)'},{value:'<',label:'Less than (<)'},{value:'>=',label:'Greater or equal'},{value:'<=',label:'Less or equal'},{value:'==',label:'Equal to'},{value:'!=',label:'Not equal'},{value:'contains',label:'Contains'}];
const FIELD_TYPES=[{value:'text',label:'Text'},{value:'number',label:'Number'},{value:'date',label:'Date'},{value:'select',label:'Dropdown'},{value:'textarea',label:'Text Area'},{value:'file',label:'File Upload'},{value:'currency',label:'Currency'},{value:'email',label:'Email'}];
export default function NodeConfigPanel({node,edges,onUpdate,onUpdateEdge,onClose,onDelete,nodes}){
  const td=NODE_TYPES[node.type]||NODE_TYPES.action;const Icon=td.icon;
  const[label,setLabel]=useState(node.label);
  const[config,setConfig]=useState(node.config||{});
  const[formFields,setFormFields]=useState(node.config?.formFields||[]);
  const out=edges.filter(e=>e.source===node.id);
  useEffect(()=>{setLabel(node.label);setConfig(node.config||{});setFormFields(node.config?.formFields||[]);},[node.id]);
  const upd=(key,val)=>{const nc={...config,[key]:val};setConfig(nc);onUpdate(node.id,{label,config:{...nc,formFields}});};
  const addField=()=>{const nf=[...formFields,{id:'f'+Date.now(),label:'New Field',type:'text',required:true,key:'field_'+(formFields.length+1)}];setFormFields(nf);onUpdate(node.id,{label,config:{...config,formFields:nf}});};
  const updField=(idx,upds)=>{const nf=formFields.map((f,i)=>i===idx?{...f,...upds}:f);setFormFields(nf);onUpdate(node.id,{label,config:{...config,formFields:nf}});};
  const delField=(idx)=>{const nf=formFields.filter((_,i)=>i!==idx);setFormFields(nf);onUpdate(node.id,{label,config:{...config,formFields:nf}});};
  return(
    <div className="config-panel slide-in">
      <div className="config-header">
        <div className="config-node-type" style={{color:td.color}}><div className="config-node-icon" style={{background:td.bg}}><Icon size={16}/></div>{td.label}</div>
        <div style={{display:'flex',gap:4}}>
          <button className="btn btn-danger btn-icon btn-sm" onClick={onDelete}><Trash2 size={14}/></button>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={16}/></button>
        </div>
      </div>
      <div className="config-body">
        <div className="config-field">
          <label className="config-label">Node Label</label>
          <input className="input" value={label} onChange={e=>setLabel(e.target.value)} onBlur={()=>onUpdate(node.id,{label,config:{...config,formFields}})} placeholder="Enter node label..."/>
        </div>
        {node.type==='start'&&(
          <div className="config-section">
            <div className="config-section-title">Form Fields</div>
            {formFields.map((field,idx)=>(
              <div key={field.id} className="form-field-row">
                <div className="form-field-header"><span className="form-field-num">Field {idx+1}</span><button className="btn btn-ghost btn-icon btn-sm" onClick={()=>delField(idx)}><Minus size={12}/></button></div>
                <input className="input" style={{marginBottom:6}} placeholder="Field label" value={field.label} onChange={e=>updField(idx,{label:e.target.value,key:e.target.value.toLowerCase().replace(/\s+/g,'_')})}/>
                <div style={{display:'grid',gridTemplateColumns:'1fr auto',gap:6}}>
                  <select className="input" value={field.type} onChange={e=>updField(idx,{type:e.target.value})}>{FIELD_TYPES.map(ft=><option key={ft.value} value={ft.value}>{ft.label}</option>)}</select>
                  <div className={'checkbox-custom '+(field.required?'checked':'')} onClick={()=>updField(idx,{required:!field.required})}>{field.required&&<svg width="10" height="10" viewBox="0 0 10 10"><polyline points="2,5 4,8 8,2" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>}</div>
                </div>
              </div>
            ))}
            <button className="btn btn-secondary btn-sm" style={{width:'100%',marginTop:8}} onClick={addField}><Plus size={14}/>Add Field</button>
          </div>
        )}
        {node.type==='approval'&&(
          <div className="config-section">
            <div className="config-section-title">Approval Settings</div>
            <div className="config-field"><label className="config-label">Approver</label><select className="input" value={config.approver||''} onChange={e=>upd('approver',e.target.value)}><option value="">Select approver...</option>{APPROVERS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
            {config.approver==='specific_user'&&<div className="config-field"><label className="config-label">User Email</label><input className="input" placeholder="user@company.com" value={config.approverEmail||''} onChange={e=>upd('approverEmail',e.target.value)}/></div>}
            <div className="config-field"><label className="config-label">Deadline (days)</label><input className="input" type="number" min="1" max="30" value={config.deadline||3} onChange={e=>upd('deadline',parseInt(e.target.value))}/></div>
            <div className="config-field"><label className="config-label">On Approve Label</label><input className="input" value={config.action_approve||'Approved'} onChange={e=>upd('action_approve',e.target.value)}/></div>
            <div className="config-field"><label className="config-label">On Reject Label</label><input className="input" value={config.action_reject||'Rejected'} onChange={e=>upd('action_reject',e.target.value)}/></div>
            <div className="config-field"><label className="config-label">Send Reminder</label><div className="toggle-row"><span>Remind before deadline</span><div className={'toggle '+(config.reminder?'on':'')} onClick={()=>upd('reminder',!config.reminder)}/></div></div>
            <div className="config-field"><label className="config-label">Allow Delegation</label><div className="toggle-row"><span>Approver can delegate</span><div className={'toggle '+(config.delegation?'on':'')} onClick={()=>upd('delegation',!config.delegation)}/></div></div>
          </div>
        )}
        {node.type==='condition'&&(
          <div className="config-section">
            <div className="config-section-title">Condition Settings</div>
            <div className="config-field"><label className="config-label">Field Key</label><input className="input" placeholder="e.g. estimated_cost" value={config.field||''} onChange={e=>upd('field',e.target.value)}/></div>
            <div className="config-field"><label className="config-label">Operator</label><select className="input" value={config.operator||'>'} onChange={e=>upd('operator',e.target.value)}>{OPERATORS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
            <div className="config-field"><label className="config-label">Value</label><input className="input" placeholder="e.g. 5000000" value={config.value||''} onChange={e=>upd('value',e.target.value)}/></div>
            <div className="config-field"><label className="config-label">True Branch Label</label><input className="input" value={config.trueLabel||'Yes'} onChange={e=>upd('trueLabel',e.target.value)}/></div>
            <div className="config-field"><label className="config-label">False Branch Label</label><input className="input" value={config.falseLabel||'No'} onChange={e=>upd('falseLabel',e.target.value)}/></div>
          </div>
        )}
        {node.type==='api'&&(
          <div className="config-section">
            <div className="config-section-title">API Call Settings</div>
            <div className="config-field"><label className="config-label">Endpoint URL</label><input className="input" placeholder="https://api.example.com/endpoint" value={config.endpoint||''} onChange={e=>upd('endpoint',e.target.value)}/></div>
            <div className="config-field"><label className="config-label">Method</label><select className="input" value={config.method||'POST'} onChange={e=>upd('method',e.target.value)}>{['GET','POST','PUT','PATCH','DELETE'].map(m=><option key={m} value={m}>{m}</option>)}</select></div>
            <div className="config-field"><label className="config-label">Request Body (JSON)</label><textarea className="input" rows="4" placeholder='{"field":"{{formData.field}}"}' value={config.bodyTemplate||''} onChange={e=>upd('bodyTemplate',e.target.value)} style={{resize:'vertical',fontFamily:'monospace',fontSize:12}}/></div>
            <div className="config-field"><label className="config-label">On Failure</label><select className="input" value={config.onFailure||'retry'} onChange={e=>upd('onFailure',e.target.value)}><option value="retry">Retry 3 times</option><option value="stop">Stop workflow</option><option value="continue">Continue anyway</option></select></div>
          </div>
        )}
        {(node.type==='action'||node.type==='notification')&&(
          <div className="config-section">
            <div className="config-section-title">Action Settings</div>
            <div className="config-field"><label className="config-label">Action Type</label><select className="input" value={config.action||'email'} onChange={e=>upd('action',e.target.value)}><option value="email">Send Email</option><option value="sms">Send SMS</option><option value="webhook">Webhook</option><option value="slack">Slack</option><option value="teams">Teams</option></select></div>
            <div className="config-field"><label className="config-label">Recipient</label><input className="input" placeholder="{{initiator.email}}" value={config.recipient||''} onChange={e=>upd('recipient',e.target.value)}/></div>
            <div className="config-field"><label className="config-label">Subject</label><input className="input" placeholder="Workflow Update: {{workflow.name}}" value={config.subject||''} onChange={e=>upd('subject',e.target.value)}/></div>
            <div className="config-field"><label className="config-label">Message Template</label><textarea className="input" rows="3" value={config.template||''} onChange={e=>upd('template',e.target.value)} style={{resize:'vertical',fontSize:12}}/></div>
          </div>
        )}
        {node.type==='end'&&(
          <div className="config-section">
            <div className="config-section-title">End Settings</div>
            <div className="config-field"><label className="config-label">Final Status</label><select className="input" value={config.finalStatus||'approved'} onChange={e=>upd('finalStatus',e.target.value)}><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="completed">Completed</option></select></div>
            <div className="config-field"><label className="config-label">Completion Message</label><textarea className="input" rows="3" value={config.completionMessage||''} onChange={e=>upd('completionMessage',e.target.value)} style={{resize:'vertical'}}/></div>
            <div className="config-field"><label className="config-label">Notify Initiator</label><div className="toggle-row"><span>Send completion email</span><div className={'toggle '+(config.notifyOnEnd!==false?'on':'')} onClick={()=>upd('notifyOnEnd',!config.notifyOnEnd)}/></div></div>
          </div>
        )}
        {out.length>0&&(
          <div className="config-section">
            <div className="config-section-title">Connection Labels</div>
            {out.map(edge=>{const tn=nodes.find(n=>n.id===edge.target);return(<div key={edge.id} className="config-field"><label className="config-label">to {tn?.label||edge.target}</label><input className="input" placeholder="Label (Approved, Yes, No...)" value={edge.label||''} onChange={e=>onUpdateEdge(edge.id,e.target.value)}/></div>);})}
          </div>
        )}
      </div>
    </div>
  );
}
