import React,{useState}from 'react';
import{useNavigate,useLocation}from 'react-router-dom';
import{LayoutDashboard,GitBranch,CheckSquare,Code2,Menu,X,Zap,Bell,Settings,ChevronRight}from 'lucide-react';
import{useApp}from '../context/AppContext.jsx';
import '../styles/layout.css';
const navItems=[
  {icon:LayoutDashboard,label:'Dashboard',path:'/dashboard'},
  {icon:GitBranch,label:'Workflow Builder',path:'/builder/new'},
  {icon:CheckSquare,label:'Approvals',path:'/approvals'},
  {icon:Code2,label:'API Reference',path:'/api-reference'},
];
export default function Layout({children}){
  const[sidebarOpen,setSidebarOpen]=useState(false);
  const navigate=useNavigate();
  const location=useLocation();
  const{state}=useApp();
  const pendingCount=state.instances.filter(i=>i.status==='pending').length;
  const handleNav=(path)=>{navigate(path);setSidebarOpen(false);};
  return(
    <div className="layout">
      {sidebarOpen&&<div className="sidebar-overlay" onClick={()=>setSidebarOpen(false)}/>}
      <aside className={'sidebar '+(sidebarOpen?'open':'')}>
        <div className="sidebar-logo">
          <div className="logo-icon"><Zap size={18} fill="currentColor"/></div>
          <div className="logo-text"><span className="logo-name">FlowForge</span><span className="logo-sub">Workflow Builder</span></div>
          <button className="btn btn-ghost btn-icon hide-desktop" onClick={()=>setSidebarOpen(false)}><X size={18}/></button>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section-label">Main</div>
          {navItems.map(({icon:Icon,label,path})=>{
            const isActive=path==='/builder/new'?location.pathname.startsWith('/builder'):location.pathname===path;
            const count=label==='Approvals'?pendingCount:null;
            return(
              <button key={path} className={'nav-item '+(isActive?'active':'')} onClick={()=>handleNav(path)}>
                <Icon size={18}/><span>{label}</span>
                {count>0&&<span className="nav-badge">{count}</span>}
                {isActive&&<ChevronRight size={14} className="nav-arrow"/>}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-workflows">
          <div className="nav-section-label">Recent Workflows</div>
          {state.workflows.slice(0,4).map(wf=>(
            <button key={wf.id} className="workflow-quick-item" onClick={()=>handleNav('/builder/'+wf.id)}>
              <span className={'status-dot '+(wf.status==='active'?'active':'inactive')}/>
              <span className="workflow-quick-name">{wf.name}</span>
            </button>
          ))}
        </div>
        <div className="sidebar-bottom">
          <div className="user-card">
            <div className="user-avatar">{state.user.avatar}</div>
            <div className="user-info"><span className="user-name">{state.user.name}</span><span className="user-role">{state.user.role}</span></div>
            <button className="btn btn-ghost btn-icon"><Settings size={15}/></button>
          </div>
        </div>
      </aside>
      <div className="main-wrapper">
        <header className="topbar">
          <button className="btn btn-ghost btn-icon hide-desktop" onClick={()=>setSidebarOpen(true)}><Menu size={20}/></button>
          <div className="topbar-title">{navItems.find(n=>location.pathname.startsWith(n.path==='/builder/new'?'/builder':n.path))?.label||'FlowForge'}</div>
          <div className="topbar-actions">
            <button className="btn btn-ghost btn-icon" style={{position:'relative'}}><Bell size={18}/>{pendingCount>0&&<span className="notif-dot"/>}</button>
          </div>
        </header>
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}
