module.exports=`
const cloud=window.testCloud ||= JSON.parse(localStorage.getItem('test-cloud')||'{}');
window.testConnected=true;const subs=window.testSubs ||= [];const callbacks=window.testAuthCallbacks ||= [];
const snap=v=>({val:()=>v===undefined?null:structuredClone(v)});
const notify=p=>subs.filter(s=>s.p===p).forEach(s=>s.cb(snap(cloud[p])));
const persist=()=>localStorage.setItem('test-cloud',JSON.stringify(cloud));
export const initializeApp=()=>({}),getAuth=()=>({}),getDatabase=()=>({});
export const browserSessionPersistence={},setPersistence=async()=>{};
export const onAuthStateChanged=(auth,cb)=>{callbacks.push(cb);queueMicrotask(()=>cb(localStorage.getItem('test-user')?{uid:'rodrigo'}:null))};
export class GoogleAuthProvider{}
export const signInWithPopup=async()=>{localStorage.setItem('test-user','yes');callbacks.forEach(cb=>cb({uid:'rodrigo'}))};
export const signOut=async()=>{localStorage.removeItem('test-user');callbacks.forEach(cb=>cb(null))};
export const ref=(db,p='')=>({p});
export const get=async r=>snap(cloud[r.p]);
export const set=async(r,v)=>{cloud[r.p]=structuredClone(v);persist();notify(r.p)};
export const update=async(r,v)=>{Object.assign(cloud,structuredClone(v));persist()};
export const serverTimestamp=()=>Date.now();
window.testSaveWaiters=[];window.testReleaseSave=()=>window.testSaveWaiters.shift()?.();
export const runTransaction=async(r,fn)=>{if(r.p.startsWith('farms/')){if(window.testHoldSaves)await new Promise(resolve=>window.testSaveWaiters.push(resolve));if(window.testDenySave){const e=Error('Permission denied');e.code='PERMISSION_DENIED';throw e;}}if(r.p.startsWith('farms/')&&window.testFailMaxretry){window.testFailMaxretry--;const e=Error('maxretry');e.code='database/maxretry';throw e;}const result=fn(cloud[r.p]||null);if(result===undefined)return {committed:false,snapshot:snap(cloud[r.p])};cloud[r.p]=structuredClone(result);persist();notify(r.p);return {committed:true,snapshot:snap(result)}};
export const onValue=(r,cb)=>{const s={p:r.p,cb};subs.push(s);queueMicrotask(()=>cb(snap(r.p==='.info/connected'?window.testConnected:cloud[r.p])));return ()=>subs.splice(subs.indexOf(s),1)};
window.testReplaceSession=()=>{cloud['sessions/rodrigo']='other-device';persist();notify('sessions/rodrigo')};
window.testDisconnect=()=>{window.testConnected=false;subs.filter(s=>s.p==='.info/connected').forEach(s=>s.cb(snap(false)))};
window.testReconnect=()=>{window.testConnected=true;subs.filter(s=>s.p==='.info/connected').forEach(s=>s.cb(snap(true)))};
export const query=r=>r,orderByKey=()=>{},limitToFirst=()=>{},startAfter=()=>{};
`;
