import React from 'react';
import{CheckCircle,AlertCircle,Info,AlertTriangle,X}from 'lucide-react';
import{useApp}from '../context/AppContext.jsx';
const icons={success:CheckCircle,error:AlertCircle,info:Info,warning:AlertTriangle};
const colors={success:'var(--accent-success)',error:'var(--accent-danger)',info:'var(--accent-primary)',warning:'var(--accent-warning)'};
export default function ToastContainer(){
  const{state,dispatch}=useApp();
  return(
    <div className="toast-container">
      {state.toasts.map(toast=>{
        const Icon=icons[toast.type]||Info;
        return(
          <div key={toast.id} className={'toast '+toast.type}>
            <Icon size={16} style={{color:colors[toast.type],flexShrink:0}}/>
            <span style={{fontSize:13,color:'var(--text-primary)'}}>{toast.message}</span>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={()=>dispatch({type:'REMOVE_TOAST',payload:toast.id})} style={{marginLeft:'auto',flexShrink:0}}><X size={14}/></button>
          </div>
        );
      })}
    </div>
  );
}
