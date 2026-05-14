import React,{useState}from 'react';
import{NODE_TYPES}from './WorkflowBuilder.jsx';
import{ChevronDown,ChevronRight}from 'lucide-react';
export default function NodePanel({onAddNode,canvasRef,pan,zoom}){
  const[collapsed,setCollapsed]=useState(false);
  const handleDragStart=(e,type)=>{e.dataTransfer.setData('nodeType',type);e.dataTransfer.effectAllowed='copy';};
  const handleClick=(type)=>{
    const rect=canvasRef.current?.getBoundingClientRect();if(!rect)return;
    onAddNode(type,(rect.width/2-pan.x)/zoom-90,(rect.height/2-pan.y)/zoom-40);
  };
  return(
    <div className={'node-panel '+(collapsed?'collapsed':'')}>
      <div className="node-panel-header" onClick={()=>setCollapsed(!collapsed)}>
        <span className="node-panel-title">Node Types</span>
        {collapsed?<ChevronRight size={14}/>:<ChevronDown size={14}/>}
      </div>
      {!collapsed&&(
        <div className="node-palette">
          <p className="node-palette-hint">Drag or click to add</p>
          {Object.entries(NODE_TYPES).map(([type,def])=>{
            const Icon=def.icon;
            return(<div key={type} className="palette-item" draggable onDragStart={e=>handleDragStart(e,type)} onClick={()=>handleClick(type)} title={def.desc}>
              <div className="palette-icon" style={{background:def.bg,color:def.color}}><Icon size={16}/></div>
              <div className="palette-info"><div className="palette-label">{def.label}</div><div className="palette-desc">{def.desc}</div></div>
            </div>);
          })}
          <div className="panel-divider"/>
          <div className="panel-help"><p><strong>Tip:</strong> Drag dari handle kanan node untuk connect. Klik edge untuk hapus.</p></div>
        </div>
      )}
    </div>
  );
}
