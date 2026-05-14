import React,{useState}from 'react';
import{X,Settings}from 'lucide-react';
const CATS=['Finance','Procurement','HR','Operations','IT','Legal','Marketing','Sales'];
export default function WorkflowSettings({meta,onSave,onClose}){
  const[form,setForm]=useState({...meta});
  const upd=(k,v)=>setForm(f=>({...f,[k]:v}));
  return(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel glass-card slide-in" onClick={e=>e.stopPropagation()}>
        <div className="modal-header"><h3 className="panel-title"><Settings size={16}/>Workflow Settings</h3><button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={16}/></button></div>
        <div className="modal-body">
          <div className="config-field"><label className="config-label">Workflow Name *</label><input className="input" value={form.name} onChange={e=>upd('name',e.target.value)}/></div>
          <div className="config-field"><label className="config-label">Description</label><textarea className="input" rows="3" value={form.description} onChange={e=>upd('description',e.target.value)} style={{resize:'vertical'}}/></div>
          <div className="config-field"><label className="config-label">Category</label><select className="input" value={form.category} onChange={e=>upd('category',e.target.value)}>{CATS.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
          <div className="config-field"><label className="config-label">Version</label><input className="input" value={form.version} onChange={e=>upd('version',e.target.value)}/></div>
          <div className="config-field"><label className="config-label">Status</label><select className="input" value={form.status} onChange={e=>upd('status',e.target.value)}><option value="draft">Draft</option><option value="active">Active</option><option value="archived">Archived</option></select></div>
        </div>
        <div className="modal-footer"><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={()=>onSave(form)}>Save Settings</button></div>
      </div>
    </div>
  );
}
