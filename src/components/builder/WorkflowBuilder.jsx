import React,{useState,useRef,useCallback,useEffect}from 'react';
import{useNavigate,useParams}from 'react-router-dom';
import{v4 as uuidv4}from 'uuid';
import{Save,Play,ArrowLeft,X,Eye,ZoomIn,ZoomOut,Maximize2,GitBranch,CheckSquare,GitMerge,Zap,Flag,Globe,Bell,AlignCenter,ChevronRight,Settings}from 'lucide-react';
import{useApp}from '../../context/AppContext.jsx';
import NodePanel from './NodePanel.jsx';
import NodeConfigPanel from './NodeConfigPanel.jsx';
import WorkflowSettings from './WorkflowSettings.jsx';
import '../../styles/builder.css';

export const NODE_TYPES={
  start:{label:'Start / Form',icon:Flag,color:'var(--node-start)',bg:'rgba(52,211,153,0.12)',desc:'Initiator fills a form'},
  approval:{label:'Approval Step',icon:CheckSquare,color:'var(--node-approval)',bg:'rgba(56,189,248,0.12)',desc:'Requires someone to approve'},
  condition:{label:'Condition / Branch',icon:GitMerge,color:'var(--node-condition)',bg:'rgba(251,191,36,0.12)',desc:'Branch based on a value'},
  action:{label:'Action / Notify',icon:Zap,color:'var(--node-action)',bg:'rgba(129,140,248,0.12)',desc:'Automated action or email'},
  api:{label:'API Call',icon:Globe,color:'var(--node-api)',bg:'rgba(251,146,60,0.12)',desc:'Call external endpoint'},
  notification:{label:'Notification',icon:Bell,color:'var(--node-notification)',bg:'rgba(167,139,250,0.12)',desc:'Send notifications'},
  end:{label:'End',icon:AlignCenter,color:'var(--node-end)',bg:'rgba(248,113,113,0.12)',desc:'Workflow ends here'},
};

const GRID=20;
const snap=v=>Math.round(v/GRID)*GRID;

export default function WorkflowBuilder(){
  const{id}=useParams();const navigate=useNavigate();const{state,dispatch,toast}=useApp();
  const existing=id&&id!=='new'?state.workflows.find(w=>w.id===id):null;
  const[wfMeta,setWfMeta]=useState({id:existing?.id||'wf-'+uuidv4().slice(0,8),name:existing?.name||'Untitled Workflow',description:existing?.description||'',category:existing?.category||'Operations',status:existing?.status||'draft',version:existing?.version||'1.0'});
  const[nodes,setNodes]=useState(existing?.nodes||[]);
  const[edges,setEdges]=useState(existing?.edges||[]);
  const[selectedId,setSelectedId]=useState(null);
  const[zoom,setZoom]=useState(1);
  const[pan,setPan]=useState({x:40,y:40});
  const[isPanning,setIsPanning]=useState(false);
  const[panStart,setPanStart]=useState(null);
  const[draggingNode,setDraggingNode]=useState(null);
  const[dragOffset,setDragOffset]=useState({x:0,y:0});
  const[connectingFrom,setConnectingFrom]=useState(null);
  const[mousePos,setMousePos]=useState({x:0,y:0});
  const[showSettings,setShowSettings]=useState(false);
  const[showPreview,setShowPreview]=useState(false);
  const canvasRef=useRef(null);const svgRef=useRef(null);
  const selectedNode=nodes.find(n=>n.id===selectedId);

  const addNode=useCallback((type,x,y)=>{
    const n={id:'n-'+uuidv4().slice(0,8),type,label:NODE_TYPES[type]?.label||type,x:snap(x),y:snap(y),config:{}};
    setNodes(prev=>[...prev,n]);setSelectedId(n.id);toast(NODE_TYPES[type]?.label+' added','success');return n;
  },[toast]);

  const handleCanvasDrop=useCallback((e)=>{
    e.preventDefault();const type=e.dataTransfer.getData('nodeType');if(!type)return;
    const rect=canvasRef.current.getBoundingClientRect();
    addNode(type,(e.clientX-rect.left-pan.x)/zoom,(e.clientY-rect.top-pan.y)/zoom);
  },[pan,zoom,addNode]);

  const startDragNode=useCallback((e,nodeId)=>{
    e.stopPropagation();if(connectingFrom)return;
    const node=nodes.find(n=>n.id===nodeId);
    setDraggingNode(nodeId);setSelectedId(nodeId);
    setDragOffset({x:e.clientX/zoom-node.x,y:e.clientY/zoom-node.y});
  },[nodes,zoom,connectingFrom]);

  const startPan=useCallback((e)=>{
    if(e.target!==canvasRef.current&&e.target!==svgRef.current)return;
    setIsPanning(true);setPanStart({x:e.clientX-pan.x,y:e.clientY-pan.y});setSelectedId(null);
  },[pan]);

  const onMouseMove=useCallback((e)=>{
    const rect=canvasRef.current?.getBoundingClientRect();
    if(rect)setMousePos({x:(e.clientX-rect.left-pan.x)/zoom,y:(e.clientY-rect.top-pan.y)/zoom});
    if(draggingNode)setNodes(prev=>prev.map(n=>n.id===draggingNode?{...n,x:snap(e.clientX/zoom-dragOffset.x),y:snap(e.clientY/zoom-dragOffset.y)}:n));
    else if(isPanning&&panStart)setPan({x:e.clientX-panStart.x,y:e.clientY-panStart.y});
  },[draggingNode,isPanning,panStart,dragOffset,zoom,pan]);

  const onMouseUp=useCallback(()=>{setDraggingNode(null);setIsPanning(false);},[]);

  const startConnect=useCallback((e,nodeId)=>{e.stopPropagation();e.preventDefault();setConnectingFrom(nodeId);},[]);

  const finishConnect=useCallback((targetId)=>{
    if(!connectingFrom||connectingFrom===targetId){setConnectingFrom(null);return;}
    if(!edges.find(e=>e.source===connectingFrom&&e.target===targetId))
      setEdges(prev=>[...prev,{id:'e-'+uuidv4().slice(0,8),source:connectingFrom,target:targetId,label:''}]);
    setConnectingFrom(null);
  },[connectingFrom,edges]);

  const deleteNode=useCallback((nodeId)=>{
    setNodes(prev=>prev.filter(n=>n.id!==nodeId));
    setEdges(prev=>prev.filter(e=>e.source!==nodeId&&e.target!==nodeId));
    if(selectedId===nodeId)setSelectedId(null);toast('Node removed','info');
  },[selectedId,toast]);

  const deleteEdge=useCallback((edgeId)=>setEdges(prev=>prev.filter(e=>e.id!==edgeId)),[]);
  const updateNodeConfig=useCallback((nodeId,config)=>setNodes(prev=>prev.map(n=>n.id===nodeId?{...n,...config}:n)),[]);
  const updateEdge=useCallback((edgeId,label)=>setEdges(prev=>prev.map(e=>e.id===edgeId?{...e,label}:e)),[]);

  const handleSave=useCallback(()=>{
    dispatch({type:'SAVE_WORKFLOW',payload:{...wfMeta,nodes,edges,instanceCount:existing?.instanceCount||0,pendingCount:existing?.pendingCount||0}});
    toast('Workflow saved!','success');
  },[dispatch,wfMeta,nodes,edges,existing,toast]);

  const handlePublish=useCallback(()=>{
    const updated={...wfMeta,status:'active'};setWfMeta(updated);
    dispatch({type:'SAVE_WORKFLOW',payload:{...updated,nodes,edges,instanceCount:existing?.instanceCount||0,pendingCount:existing?.pendingCount||0}});
    toast('Workflow published!','success');
  },[dispatch,wfMeta,nodes,edges,existing,toast]);

  const fitView=useCallback(()=>{
    if(!nodes.length)return;
    const minX=Math.min(...nodes.map(n=>n.x));const minY=Math.min(...nodes.map(n=>n.y));
    const maxX=Math.max(...nodes.map(n=>n.x+180));const maxY=Math.max(...nodes.map(n=>n.y+80));
    const rect=canvasRef.current?.getBoundingClientRect();if(!rect)return;
    const z=Math.min((rect.width-80)/(maxX-minX||1),(rect.height-80)/(maxY-minY||1),1.2);
    setZoom(z);setPan({x:40-minX*z,y:40-minY*z});
  },[nodes]);

  const getEdgePath=(src,tgt)=>{
    const s=nodes.find(n=>n.id===src);const t=nodes.find(n=>n.id===tgt);if(!s||!t)return'';
    const sx=s.x+180,sy=s.y+40,tx=t.x,ty=t.y+40,cx=(sx+tx)/2;
    return'M '+sx+' '+sy+' C '+cx+' '+sy+', '+cx+' '+ty+', '+tx+' '+ty;
  };

  const handleWheel=useCallback((e)=>{e.preventDefault();setZoom(z=>Math.min(Math.max(z*(e.deltaY>0?0.9:1.1),0.3),2));},[]);
  useEffect(()=>{const el=canvasRef.current;if(el)el.addEventListener('wheel',handleWheel,{passive:false});return()=>{if(el)el.removeEventListener('wheel',handleWheel);};},[handleWheel]);

  return(
    <div className="builder-layout">
      <div className="builder-header">
        <button className="btn btn-ghost btn-sm" onClick={()=>navigate('/dashboard')}><ArrowLeft size={16}/>Back</button>
        <div className="builder-title-wrap">
          <input className="builder-title-input" value={wfMeta.name} onChange={e=>setWfMeta(m=>({...m,name:e.target.value}))} placeholder="Workflow name..."/>
          <span className={'badge badge-'+(wfMeta.status==='active'?'success':'neutral')}>{wfMeta.status}</span>
        </div>
        <div className="builder-actions">
          <button className="btn btn-ghost btn-sm" onClick={()=>setShowPreview(!showPreview)}><Eye size={15}/>Preview</button>
          <button className="btn btn-ghost btn-sm" onClick={()=>setShowSettings(true)}><Settings size={15}/>Settings</button>
          <button className="btn btn-secondary btn-sm" onClick={handleSave}><Save size={15}/>Save</button>
          <button className="btn btn-primary btn-sm" onClick={handlePublish}><Play size={15}/>Publish</button>
        </div>
      </div>
      <div className="builder-body">
        <NodePanel onAddNode={addNode} canvasRef={canvasRef} pan={pan} zoom={zoom}/>
        <div className={'canvas-wrap '+(connectingFrom?'connecting':'')} ref={canvasRef}
          onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
          onMouseDown={startPan} onDrop={handleCanvasDrop} onDragOver={e=>e.preventDefault()}
          onClick={()=>connectingFrom&&setConnectingFrom(null)}>
          <div className="zoom-controls">
            <button className="btn btn-ghost btn-icon" onClick={()=>setZoom(z=>Math.min(z+0.1,2))}><ZoomIn size={16}/></button>
            <span className="zoom-label">{Math.round(zoom*100)}%</span>
            <button className="btn btn-ghost btn-icon" onClick={()=>setZoom(z=>Math.max(z-0.1,0.3))}><ZoomOut size={16}/></button>
            <div className="zoom-sep"/>
            <button className="btn btn-ghost btn-icon" onClick={fitView}><Maximize2 size={16}/></button>
          </div>
          {nodes.length===0&&<div className="canvas-empty"><GitBranch size={48} strokeWidth={1}/><h3>Start building your workflow</h3><p>Drag nodes from the left panel onto the canvas</p></div>}
          <svg ref={svgRef} className="canvas-svg" width={3000} height={2000} style={{transform:'translate('+pan.x+'px,'+pan.y+'px) scale('+zoom+')',transformOrigin:'0 0'}}>
            <defs>
              <marker id="arr" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0,10 3.5,0 7" fill="var(--border-default)"/></marker>
              <marker id="arr2" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0,10 3.5,0 7" fill="var(--accent-primary)"/></marker>
              <pattern id="grid" width={GRID} height={GRID} patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="0.8" fill="rgba(148,163,184,0.08)"/></pattern>
            </defs>
            <rect width={3000} height={2000} fill="url(#grid)"/>
            {edges.map(edge=>{
              const path=getEdgePath(edge.source,edge.target);
              const sn=nodes.find(n=>n.id===edge.source);const tn=nodes.find(n=>n.id===edge.target);
              if(!sn||!tn||!path)return null;
              const midX=(sn.x+180+tn.x)/2;const midY=(sn.y+40+tn.y+40)/2;
              return(<g key={edge.id} className="edge-group">
                <path d={path} fill="none" stroke="var(--border-default)" strokeWidth="2" markerEnd="url(#arr)" className="edge-path"/>
                <path d={path} fill="none" stroke="transparent" strokeWidth="12" onClick={()=>deleteEdge(edge.id)} style={{cursor:'pointer'}}/>
                {edge.label&&<g><rect x={midX-30} y={midY-10} width={60} height={20} rx="4" fill="var(--bg-elevated)" stroke="var(--border-subtle)" strokeWidth="1"/><text x={midX} y={midY+4} textAnchor="middle" fontSize="10" fill="var(--text-muted)">{edge.label}</text></g>}
              </g>);
            })}
            {connectingFrom&&(()=>{const sn=nodes.find(n=>n.id===connectingFrom);if(!sn)return null;
              return<path d={'M '+(sn.x+180)+' '+(sn.y+40)+' C '+((sn.x+180+mousePos.x)/2)+' '+(sn.y+40)+', '+((sn.x+180+mousePos.x)/2)+' '+mousePos.y+', '+mousePos.x+' '+mousePos.y} fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeDasharray="6 3" markerEnd="url(#arr2)" style={{pointerEvents:'none'}}/>;
            })()}
            {nodes.map(node=>{
              const td=NODE_TYPES[node.type]||NODE_TYPES.action;const Icon=td.icon;const isSel=selectedId===node.id;
              return(<g key={node.id} className={'node-group '+(isSel?'selected':'')} transform={'translate('+node.x+','+node.y+')'}
                onMouseDown={e=>startDragNode(e,node.id)}
                onClick={e=>{e.stopPropagation();setSelectedId(node.id);if(connectingFrom)finishConnect(node.id);}}
                style={{cursor:draggingNode===node.id?'grabbing':'grab'}}>
                {isSel&&<rect x="-4" y="-4" width="188" height="88" rx="14" fill="none" stroke={td.color} strokeWidth="2" opacity="0.6" strokeDasharray="6 3"/>}
                <rect x="0" y="0" width="180" height="80" rx="12" fill="var(--bg-elevated)" stroke={isSel?td.color:'var(--border-subtle)'} strokeWidth={isSel?2:1}/>
                <rect x="0" y="0" width="4" height="80" rx="2" fill={td.color}/>
                <rect x="12" y="12" width="32" height="32" rx="8" fill={td.bg}/>
                <foreignObject x="20" y="20" width="16" height="16"><Icon size={16} color={td.color} strokeWidth={2} xmlns="http://www.w3.org/2000/svg"/></foreignObject>
                <text x="52" y="24" fontSize="10" fontWeight="600" fill="var(--text-muted)" fontFamily="DM Sans,sans-serif">{td.label.toUpperCase()}</text>
                <foreignObject x="52" y="30" width="118" height="36"><div xmlns="http://www.w3.org/1999/xhtml" style={{fontSize:13,fontWeight:700,color:'var(--text-primary)',fontFamily:'Syne,sans-serif',lineHeight:1.3,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>{node.label}</div></foreignObject>
                <g transform="translate(172,32)" onMouseDown={e=>{e.stopPropagation();startConnect(e,node.id);}} style={{cursor:'crosshair'}}>
                  <circle cx="0" cy="8" r="10" fill="transparent"/>
                  <circle cx="0" cy="8" r="5" fill={td.color} opacity="0.8"/>
                </g>
                {isSel&&<g transform="translate(160,-4)" onClick={e=>{e.stopPropagation();deleteNode(node.id);}} style={{cursor:'pointer'}}>
                  <circle cx="8" cy="8" r="9" fill="var(--accent-danger)" opacity="0.9"/>
                  <foreignObject x="2" y="2" width="12" height="12"><X size={12} color="white" xmlns="http://www.w3.org/2000/svg"/></foreignObject>
                </g>}
                <text x="158" y="72" fontSize="10" fill="var(--text-muted)" textAnchor="end" fontFamily="DM Sans,sans-serif">#{nodes.indexOf(node)+1}</text>
              </g>);
            })}
          </svg>
        </div>
        {selectedNode&&<NodeConfigPanel node={selectedNode} edges={edges} onUpdate={updateNodeConfig} onUpdateEdge={updateEdge} onClose={()=>setSelectedId(null)} onDelete={()=>deleteNode(selectedId)} nodes={nodes}/>}
      </div>
      {showSettings&&<WorkflowSettings meta={wfMeta} onSave={meta=>{setWfMeta(meta);setShowSettings(false);toast('Settings saved','success');}} onClose={()=>setShowSettings(false)}/>}
      {showPreview&&(
        <div className="preview-overlay" onClick={()=>setShowPreview(false)}>
          <div className="preview-panel glass-card" onClick={e=>e.stopPropagation()}>
            <div className="preview-header"><h3 className="panel-title"><Eye size={16}/>Workflow Preview</h3><button className="btn btn-ghost btn-icon btn-sm" onClick={()=>setShowPreview(false)}><X size={16}/></button></div>
            <div className="preview-meta"><strong>{wfMeta.name}</strong><span className={'badge badge-'+(wfMeta.status==='active'?'success':'neutral')}>{wfMeta.status}</span></div>
            <div className="preview-steps">
              {nodes.map((node,i)=>{const td=NODE_TYPES[node.type]||NODE_TYPES.action;const Icon=td.icon;const out=edges.filter(e=>e.source===node.id);
                return(<div key={node.id} className="preview-step">
                  <div className="preview-step-icon" style={{background:td.bg,color:td.color}}><Icon size={16}/></div>
                  <div className="preview-step-content">
                    <div className="preview-step-type" style={{color:td.color}}>{td.label}</div>
                    <div className="preview-step-label">{node.label}</div>
                    {node.config?.approver&&<div className="preview-step-meta">Approver: {node.config.approver}</div>}
                    {node.config?.deadline&&<div className="preview-step-meta">Deadline: {node.config.deadline} days</div>}
                    {out.length>0&&<div className="preview-step-transitions">{out.map(e=>{const t=nodes.find(n=>n.id===e.target);return t?<span key={e.id} className="preview-transition"><ChevronRight size={11}/>{e.label||'Next'}: {t.label}</span>:null;})}</div>}
                  </div>
                  <div className="preview-step-num">Step {i+1}</div>
                </div>);
              })}
              {nodes.length===0&&<p style={{color:'var(--text-muted)',textAlign:'center',padding:'24px 0'}}>No nodes yet.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
