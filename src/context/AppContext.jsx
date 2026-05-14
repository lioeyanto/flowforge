import React,{createContext,useContext,useReducer,useCallback} from 'react';
import {v4 as uuidv4} from 'uuid';
const AppContext=createContext(null);
const sampleWorkflows=[
  {id:'wf-001',name:'Business Trip Request',description:'Workflow for approving employee business trip requests with budget validation',category:'Finance',status:'active',version:'1.2',createdAt:new Date('2024-01-15').toISOString(),updatedAt:new Date('2024-03-01').toISOString(),instanceCount:47,pendingCount:3,
    nodes:[
      {id:'n1',type:'start',label:'Trip Request Form',x:80,y:200,config:{formFields:[
        {id:'f1',label:'Destination',type:'text',key:'destination',required:true},
        {id:'f2',label:'Travel Dates',type:'text',key:'dates',required:true},
        {id:'f3',label:'Purpose',type:'textarea',key:'purpose',required:true},
        {id:'f4',label:'Estimated Cost (IDR)',type:'currency',key:'estimated_cost',required:true}
      ]}},
      {id:'n2',type:'approval',label:'Direct Superior Approval',x:320,y:200,config:{approver:'direct_superior',deadline:2}},
      {id:'n3',type:'approval',label:'Finance & Accounting',x:560,y:200,config:{approver:'finance_staff',deadline:3}},
      {id:'n4',type:'condition',label:'Amount > 5 Juta?',x:800,y:200,config:{field:'estimated_cost',operator:'>',value:'5000000',trueLabel:'Ya - CEO',falseLabel:'Tidak - Approved'}},
      {id:'n5',type:'approval',label:'CEO Approval',x:1040,y:100,config:{approver:'ceo',deadline:5}},
      {id:'n6',type:'end',label:'Trip Approved',x:1040,y:320,config:{finalStatus:'approved'}}
    ],
    edges:[
      {id:'e1',source:'n1',target:'n2',label:'Submit'},{id:'e2',source:'n2',target:'n3',label:'Approved'},
      {id:'e3',source:'n3',target:'n4',label:'Budget Check'},{id:'e4',source:'n4',target:'n5',label:'Over Budget'},
      {id:'e5',source:'n4',target:'n6',label:'Within Budget'},{id:'e6',source:'n5',target:'n6',label:'CEO Approved'}
    ]
  },
  {id:'wf-002',name:'Purchase Order Approval',description:'Multi-level purchase order approval',category:'Procurement',status:'active',version:'2.0',createdAt:new Date('2024-02-10').toISOString(),updatedAt:new Date('2024-03-05').toISOString(),instanceCount:128,pendingCount:12,
    nodes:[
      {id:'n1',type:'start',label:'PO Request',x:80,y:200,config:{formFields:[
        {id:'f1',label:'Vendor',type:'text',key:'vendor',required:true},
        {id:'f2',label:'Amount (IDR)',type:'currency',key:'amount',required:true},
        {id:'f3',label:'Items',type:'textarea',key:'items',required:true}
      ]}},
      {id:'n2',type:'approval',label:'Department Head',x:320,y:200,config:{approver:'dept_head',deadline:2}},
      {id:'n3',type:'condition',label:'Amount > 10 Juta?',x:560,y:200,config:{field:'amount',operator:'>',value:'10000000'}},
      {id:'n4',type:'approval',label:'CFO Approval',x:800,y:100,config:{approver:'cfo',deadline:3}},
      {id:'n5',type:'api',label:'ERP Integration',x:800,y:320,config:{endpoint:'/api/erp/create-po',method:'POST'}},
      {id:'n6',type:'end',label:'PO Created',x:1040,y:200,config:{}}
    ],
    edges:[{id:'e1',source:'n1',target:'n2'},{id:'e2',source:'n2',target:'n3'},
      {id:'e3',source:'n3',target:'n4',label:'Ya'},{id:'e4',source:'n3',target:'n5',label:'Tidak'},
      {id:'e5',source:'n4',target:'n5'},{id:'e6',source:'n5',target:'n6'}]
  },
  {id:'wf-003',name:'Leave Request',description:'Employee leave request with HR approval',category:'HR',status:'draft',version:'1.0',createdAt:new Date('2024-03-01').toISOString(),updatedAt:new Date('2024-03-01').toISOString(),instanceCount:0,pendingCount:0,nodes:[],edges:[]}
];
const sampleInstances=[
  {id:'inst-001',workflowId:'wf-001',workflowName:'Business Trip Request',title:'Business Trip to Jakarta - Budi Santoso',initiator:'Budi Santoso',initiatorEmail:'budi@company.com',status:'pending',currentStep:'Direct Superior Approval',currentStepIndex:1,totalSteps:4,createdAt:new Date(Date.now()-86400000*2).toISOString(),updatedAt:new Date(Date.now()-3600000*5).toISOString(),formData:{destination:'Jakarta',dates:'15-17 Mar 2024',purpose:'Client Meeting',estimated_cost:'3500000'},history:[{step:'Submitted',actor:'Budi Santoso',action:'Submitted',timestamp:new Date(Date.now()-86400000*2).toISOString(),note:'Client meeting PT Maju Bersama'}],priority:'normal'},
  {id:'inst-002',workflowId:'wf-001',workflowName:'Business Trip Request',title:'Business Trip to Singapore - Siti Rahayu',initiator:'Siti Rahayu',initiatorEmail:'siti@company.com',status:'pending',currentStep:'Finance & Accounting',currentStepIndex:2,totalSteps:4,createdAt:new Date(Date.now()-86400000*5).toISOString(),updatedAt:new Date(Date.now()-86400000).toISOString(),formData:{destination:'Singapore',dates:'20-23 Mar 2024',purpose:'Conference',estimated_cost:'8500000'},history:[{step:'Submitted',actor:'Siti Rahayu',action:'Submitted',timestamp:new Date(Date.now()-86400000*5).toISOString()},{step:'Direct Superior Approval',actor:'Ahmad Yusuf',action:'Approved',timestamp:new Date(Date.now()-86400000*3).toISOString(),note:'Disetujui untuk conference'}],priority:'high'},
  {id:'inst-003',workflowId:'wf-002',workflowName:'Purchase Order Approval',title:'PO #2024-089 - Office Equipment',initiator:'Dewi Lestari',initiatorEmail:'dewi@company.com',status:'approved',currentStep:'Completed',currentStepIndex:3,totalSteps:3,createdAt:new Date(Date.now()-86400000*10).toISOString(),updatedAt:new Date(Date.now()-86400000*2).toISOString(),formData:{vendor:'PT Office Supply',amount:'7500000',items:'Laptop, Monitor'},history:[{step:'Submitted',actor:'Dewi Lestari',action:'Submitted',timestamp:new Date(Date.now()-86400000*10).toISOString()},{step:'Department Head',actor:'Rudi Hartono',action:'Approved',timestamp:new Date(Date.now()-86400000*7).toISOString()},{step:'ERP Integration',actor:'System',action:'PO Created',timestamp:new Date(Date.now()-86400000*2).toISOString(),note:'PO created in SAP'}],priority:'normal'}
];
const initialState={workflows:sampleWorkflows,instances:sampleInstances,toasts:[],user:{name:'Admin User',role:'admin',email:'admin@company.com',avatar:'AU'}};
function reducer(state,action){
  switch(action.type){
    case 'SAVE_WORKFLOW':{const exists=state.workflows.find(w=>w.id===action.payload.id);const workflows=exists?state.workflows.map(w=>w.id===action.payload.id?{...action.payload,updatedAt:new Date().toISOString()}:w):[...state.workflows,{...action.payload,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),instanceCount:0,pendingCount:0}];return{...state,workflows};}
    case 'DELETE_WORKFLOW':return{...state,workflows:state.workflows.filter(w=>w.id!==action.payload)};
    case 'CREATE_INSTANCE':{const instance={...action.payload,id:'inst-'+uuidv4().slice(0,8),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};return{...state,instances:[...state.instances,instance]};}
    case 'UPDATE_INSTANCE':return{...state,instances:state.instances.map(i=>i.id===action.payload.id?{...action.payload,updatedAt:new Date().toISOString()}:i)};
    case 'ADD_TOAST':{const toast={id:uuidv4(),...action.payload};return{...state,toasts:[...state.toasts,toast]};}
    case 'REMOVE_TOAST':return{...state,toasts:state.toasts.filter(t=>t.id!==action.payload)};
    default:return state;
  }
}
export function AppProvider({children}){
  const[state,dispatch]=useReducer(reducer,initialState);
  const toast=useCallback((message,type='info')=>{
    const id=uuidv4();
    dispatch({type:'ADD_TOAST',payload:{message,type,id}});
    setTimeout(()=>dispatch({type:'REMOVE_TOAST',payload:id}),4000);
  },[]);
  return <AppContext.Provider value={{state,dispatch,toast}}>{children}</AppContext.Provider>;
}
export const useApp=()=>{const ctx=useContext(AppContext);if(!ctx)throw new Error('useApp must be inside AppProvider');return ctx;};
