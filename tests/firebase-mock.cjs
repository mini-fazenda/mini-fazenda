module.exports=`
const cloud=window.testCloud ||= JSON.parse(localStorage.getItem('test-cloud')||'{}');
window.testConnected=true;const subs=window.testSubs ||= [];const callbacks=window.testAuthCallbacks ||= [];
const snap=v=>({val:()=>v===undefined?null:structuredClone(v)});
const notify=p=>subs.filter(s=>s.p===p).forEach(s=>s.cb(snap(cloud[p])));
const persist=()=>localStorage.setItem('test-cloud',JSON.stringify(cloud));
export const initializeApp=()=>({}),getAuth=()=>({}),getDatabase=()=>({});
export const getIdToken=async()=> 'test-token';
export const browserSessionPersistence={},setPersistence=async()=>{};
export const onAuthStateChanged=(auth,cb)=>{callbacks.push(cb);queueMicrotask(()=>cb(localStorage.getItem('test-user')?{uid:'rodrigo'}:null))};
export class GoogleAuthProvider{}
export const signInWithPopup=async()=>{localStorage.setItem('test-user','yes');callbacks.forEach(cb=>cb({uid:'rodrigo'}))};
export const signOut=async()=>{localStorage.removeItem('test-user');callbacks.forEach(cb=>cb(null))};
export const ref=(db,p='')=>({p});
export const get=async r=>{if(Object.hasOwn(cloud,r.p))return snap(cloud[r.p]);const parts=r.p.split('/');for(let i=parts.length-1;i>0;i--){let value=cloud[parts.slice(0,i).join('/')];if(value===undefined)continue;for(const key of parts.slice(i))value=value?.[key];return snap(value);}return snap(null)};
export const remove=async r=>{delete cloud[r.p];const parts=r.p.split('/');for(let i=parts.length-1;i>0;i--){let value=cloud[parts.slice(0,i).join('/')];for(const key of parts.slice(i,-1))value=value?.[key];if(value)delete value[parts.at(-1)];}persist();notify(r.p);};
export const set=async(r,v)=>{cloud[r.p]=structuredClone(v);persist();notify(r.p)};
export const update=async(r,v)=>{
 const path=Object.keys(v).find(p=>p.startsWith('farms/'));
 if(path){
  if(window.testHoldSaves)await new Promise(resolve=>window.testSaveWaiters.push(resolve));
  const next=v[path],uid=path.split('/')[1];
  if(window.testDenySave||next.sessionId!==cloud['sessions/'+uid]||next.revision!==(cloud[path]?.revision||0)+1){
   const e=Error('Permission denied');e.code='PERMISSION_DENIED';throw e;
  }
  window.testAtomicSaves=(window.testAtomicSaves||0)+1;
 }
 Object.assign(cloud,structuredClone(v));persist();for(const path of Object.keys(v))notify(path);
};
export const serverTimestamp=()=>Date.now();
window.testSaveWaiters=[];window.testReleaseSave=()=>window.testSaveWaiters.shift()?.();
export const runTransaction=async(r,fn)=>{if(r.p.startsWith('publicFarms/')&&window.testFailProjection){window.testFailProjection--;throw Error('projection unavailable');}if(r.p.startsWith('farms/')){if(window.testHoldSaves)await new Promise(resolve=>window.testSaveWaiters.push(resolve));if(window.testDenySave){const e=Error('Permission denied');e.code='PERMISSION_DENIED';throw e;}}if(r.p.startsWith('farms/')&&window.testFailMaxretry){window.testFailMaxretry--;const e=Error('maxretry');e.code='database/maxretry';throw e;}const result=fn(cloud[r.p]||null);if(result===undefined)return {committed:false,snapshot:snap(cloud[r.p])};if(r.p.startsWith('publicFarms/'))(window.testProjectionLog||=[]).push(structuredClone(result));cloud[r.p]=structuredClone(result);persist();notify(r.p);return {committed:true,snapshot:snap(result)}};
export const onValue=(r,cb)=>{const s={p:r.p,cb};subs.push(s);queueMicrotask(()=>cb(snap(r.p==='.info/connected'?window.testConnected:cloud[r.p])));return ()=>subs.splice(subs.indexOf(s),1)};
export const onChildAdded=(r,cb)=>{const seen=new Set();return onValue(r,s=>{for(const [key,value] of Object.entries(s.val()||{})){if(seen.has(key))continue;seen.add(key);cb({...snap(value),key});}})};
window.testReplaceSession=()=>{cloud['sessions/rodrigo']='other-device';persist();notify('sessions/rodrigo')};
window.testDisconnect=()=>{window.testConnected=false;subs.filter(s=>s.p==='.info/connected').forEach(s=>s.cb(snap(false)))};
window.testReconnect=()=>{window.testConnected=true;subs.filter(s=>s.p==='.info/connected').forEach(s=>s.cb(snap(true)))};
const originalFetch=window.fetch.bind(window);
window.testRestWrites=0;window.testRestReads=0;
window.fetch=async(url,options={})=>{
 const u=new URL(url,location.href);if(u.hostname!=='firebase.test')return originalFetch(url,options);
 const path=u.pathname.slice(1,-5),current=cloud[path]||null;
 const etag=JSON.stringify(String(current?.revision||0)+':'+String(current?.saveId||''));
 const reply=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{ETag:etag,'Content-Type':'application/json'}});
 if(options.method==='GET'){window.testRestReads++;return reply(current);}
 if(options.method!=='PUT')throw Error('Unexpected REST method');
 if(window.testHoldSaves)await new Promise(resolve=>window.testSaveWaiters.push(resolve));
 if(window.testDenySave)return reply({error:'denied'},403);
 if(options.headers['If-Match']!==etag)return reply(cloud[path]||null,412);
 const next=JSON.parse(options.body),uid=path.split('/')[1];
 if(next.sessionId!==cloud['sessions/'+uid]||next.revision!==(cloud[path]?.revision||0)+1)return reply({error:'denied'},403);
 cloud[path]=next;persist();notify(path);window.testRestWrites++;
 if(window.testRestLoseReply){window.testRestLoseReply=false;throw Error('lost response');}
 return reply(next);
};
export const query=r=>r,orderByKey=()=>{},limitToFirst=()=>{},startAfter=()=>{};
`;
