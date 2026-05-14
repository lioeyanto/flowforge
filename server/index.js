import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
const app = express();
const PORT = process.env.PORT || 4000;
app.use(cors());
app.use(express.json());

const store = { workflows: new Map(), instances: new Map(), webhooks: new Map() };
store.workflows.set('wf-001', {
  id:'wf-001',name:'Business Trip Request',description:'Multi-level travel approval',category:'Finance',status:'active',version:'1.2',
  nodes:[
    {id:'n1',type:'start',label:'Trip Request Form',config:{formFields:[{id:'f1',label:'Destination',type:'text',key:'destination',required:true},{id:'f2',label:'Travel Dates',type:'text',key:'dates',required:true},{id:'f3',label:'Purpose',type:'textarea',key:'purpose',required:true},{id:'f4',label:'Estimated Cost',type:'currency',key:'estimated_cost',required:true}]}},
    {id:'n2',type:'approval',label:'Direct Superior Approval',config:{approver:'direct_superior',deadline:2}},
    {id:'n3',type:'approval',label:'Finance & Accounting',config:{approver:'finance_staff',deadline:3}},
    {id:'n4',type:'condition',label:'Amount > Budget?',config:{field:'estimated_cost',operator:'>',value:'5000000'}},
    {id:'n5',type:'approval',label:'CEO Approval',config:{approver:'ceo',deadline:5}},
    {id:'n6',type:'end',label:'Trip Approved',config:{finalStatus:'approved'}}
  ],
  edges:[{id:'e1',source:'n1',target:'n2'},{id:'e2',source:'n2',target:'n3',label:'Approved'},{id:'e3',source:'n3',target:'n4',label:'Budget Check'},{id:'e4',source:'n4',target:'n5',label:'Over Budget'},{id:'e5',source:'n4',target:'n6',label:'Within Budget'},{id:'e6',source:'n5',target:'n6',label:'CEO Approved'}],
  instanceCount:47,pendingCount:3,createdAt:new Date('2024-01-15').toISOString(),updatedAt:new Date('2024-03-01').toISOString()
});

const auth = (req,res,next) => { if (!req.headers.authorization?.startsWith('Bearer ')) return res.status(401).json({error:'Unauthorized'}); next(); };

app.get('/api/health', (req,res) => res.json({status:'ok',version:'1.0.0'}));

app.get('/api/v1/workflows', auth, (req,res) => {
  let wfs = [...store.workflows.values()];
  if (req.query.status) wfs = wfs.filter(w => w.status === req.query.status);
  if (req.query.category) wfs = wfs.filter(w => w.category === req.query.category);
  res.json({workflows:wfs,total:wfs.length});
});
app.get('/api/v1/workflows/:id', auth, (req,res) => {
  const wf = store.workflows.get(req.params.id);
  if (!wf) return res.status(404).json({error:'Not found'});
  res.json(wf);
});
app.post('/api/v1/workflows', auth, (req,res) => {
  const {name,description,category,nodes,edges} = req.body;
  if (!name) return res.status(400).json({error:'name required'});
  const id = 'wf-'+uuidv4().slice(0,8);
  const wf = {id,name,description,category,status:'draft',version:'1.0',nodes:nodes||[],edges:edges||[],instanceCount:0,pendingCount:0,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
  store.workflows.set(id,wf);
  res.status(201).json({success:true,workflow:wf});
});
app.put('/api/v1/workflows/:id', auth, (req,res) => {
  const wf = store.workflows.get(req.params.id);
  if (!wf) return res.status(404).json({error:'Not found'});
  const updated = {...wf,...req.body,id:wf.id,updatedAt:new Date().toISOString()};
  store.workflows.set(wf.id,updated);
  res.json({success:true,workflow:updated});
});

app.post('/api/v1/workflows/:workflowId/submit', auth, async (req,res) => {
  const wf = store.workflows.get(req.params.workflowId);
  if (!wf) return res.status(404).json({error:'Workflow not found'});
  if (wf.status !== 'active') return res.status(400).json({error:'Workflow not active'});
  const {initiator,formData,priority='normal',externalRef} = req.body;
  if (!initiator?.name || !initiator?.email) return res.status(400).json({error:'initiator.name and email required'});
  const firstApproval = wf.nodes?.find(n => n.type === 'approval');
  const totalSteps = wf.nodes?.filter(n => n.type !== 'end').length || 1;
  const inst = {
    id:'inst-'+uuidv4().slice(0,8),workflowId:wf.id,workflowName:wf.name,
    title:wf.name+' - '+initiator.name,initiator,formData:formData||{},
    status:'pending',currentStep:firstApproval?.label||'Review',currentStepIndex:1,totalSteps,priority,externalRef,
    history:[{step:'Submitted',actor:initiator.name,action:'Submitted',timestamp:new Date().toISOString()}],
    createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()
  };
  inst.trackingUrl = 'http://localhost:3000/approvals/'+inst.id;
  store.instances.set(inst.id,inst);
  store.workflows.set(wf.id,{...wf,instanceCount:(wf.instanceCount||0)+1,pendingCount:(wf.pendingCount||0)+1});
  res.status(201).json({success:true,instance:{id:inst.id,status:inst.status,currentStep:inst.currentStep,totalSteps,trackingUrl:inst.trackingUrl,createdAt:inst.createdAt}});
});

app.get('/api/v1/instances', auth, (req,res) => {
  let insts = [...store.instances.values()];
  if (req.query.workflowId) insts = insts.filter(i => i.workflowId === req.query.workflowId);
  if (req.query.status) insts = insts.filter(i => i.status === req.query.status);
  if (req.query.initiatorEmail) insts = insts.filter(i => i.initiator?.email === req.query.initiatorEmail);
  insts.sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  res.json({instances:insts,total:insts.length});
});
app.get('/api/v1/instances/:id', auth, (req,res) => {
  const inst = store.instances.get(req.params.id);
  if (!inst) return res.status(404).json({error:'Not found'});
  res.json({...inst,progressPercent:Math.round(inst.currentStepIndex/inst.totalSteps*100)});
});
app.post('/api/v1/instances/:id/approve', auth, async (req,res) => {
  const inst = store.instances.get(req.params.id);
  if (!inst) return res.status(404).json({error:'Not found'});
  if (inst.status !== 'pending') return res.status(400).json({error:'Instance already '+inst.status});
  const {action,actor,note} = req.body;
  if (!['approve','reject'].includes(action)) return res.status(400).json({error:'action must be approve or reject'});
  const isLast = inst.currentStepIndex >= inst.totalSteps;
  const newStatus = action === 'reject' ? 'rejected' : (isLast ? 'approved' : 'pending');
  const newIdx = action === 'approve' && !isLast ? inst.currentStepIndex+1 : inst.currentStepIndex;
  const updated = {
    ...inst,status:newStatus,currentStepIndex:newIdx,
    currentStep:action==='approve'&&!isLast?'Step '+newIdx:inst.currentStep,
    history:[...inst.history,{step:inst.currentStep,actor:actor?.name||'System',action:action==='approve'?'Approved':'Rejected',note,timestamp:new Date().toISOString()}],
    updatedAt:new Date().toISOString()
  };
  store.instances.set(inst.id,updated);
  res.json({success:true,instance:{id:updated.id,status:updated.status,currentStep:updated.currentStep,currentStepIndex:updated.currentStepIndex,totalSteps:updated.totalSteps}});
});

app.post('/api/v1/webhooks', auth, (req,res) => {
  const {url,events,workflowId,secret} = req.body;
  if (!url || !events?.length) return res.status(400).json({error:'url and events required'});
  const id = 'wh-'+uuidv4().slice(0,8);
  store.webhooks.set(id,{id,url,events,workflowId,secret,status:'active',createdAt:new Date().toISOString()});
  res.status(201).json({webhookId:id,url,events,status:'active'});
});
app.get('/api/v1/webhooks', auth, (req,res) => {
  res.json({webhooks:[...store.webhooks.values()].map(w=>({...w,secret:undefined}))});
});
app.delete('/api/v1/webhooks/:id', auth, (req,res) => {
  if (!store.webhooks.has(req.params.id)) return res.status(404).json({error:'Not found'});
  store.webhooks.delete(req.params.id);
  res.json({success:true});
});

app.use((err,req,res,next) => { console.error(err); res.status(500).json({error:'Internal server error'}); });

app.listen(PORT, () => {
  console.log('\n🚀 FlowForge API Server');
  console.log('📋 http://localhost:'+PORT+'/api/v1');
  console.log('💡 http://localhost:'+PORT+'/api/health\n');
});
