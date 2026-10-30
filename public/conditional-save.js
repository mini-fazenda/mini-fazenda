// Alternativa ao limite de retries do SDK: compare-and-swap com ETag do RTDB.
// O servidor continua verificando autenticação, sessão e revisão nas regras existentes.
function error(code){return Object.assign(new Error(code),{code});}
export function isMaxRetry(e){return /(?:^|\/)maxretry$/i.test(String(e?.code||e?.message||''));}
export async function conditionalSave({databaseURL,uid,collection='farms',getToken,update,active,fetchImpl=globalThis.fetch,timeoutMs=10000}){
 if(!['farms','publicFarms'].includes(collection))throw error('save/invalid-collection');
 const base=new URL(databaseURL);base.pathname=base.pathname.replace(/\/$/,'')+'/'+collection+'/'+encodeURIComponent(uid)+'.json';
 let token=await getToken(false),renewed=false;
 async function request(options){
  for(;;){
   if(!active())throw error('save/session-ended');
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
   let response;
   try{
    const url=new URL(base);url.searchParams.set('auth',token);
    response=await fetchImpl(url.href,{...options,cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',signal:controller.signal});
    // Inclua a leitura da resposta no limite de tempo. Nunca registre URL/token.
    const value=await response.json();
    if(response.status===401&&!renewed){renewed=true;token=await getToken(true);continue;}
    if(![200,412].includes(response.status))throw error(response.status===401||response.status===403?'PERMISSION_DENIED':'save/http-'+response.status);
    return {response,value};
   }catch(e){if(e?.code)throw e;throw error(controller.signal.aborted?'save/timeout':'save/network-error');}
   finally{clearTimeout(timer);}
  }
 }
 const {response,value:current}=await request({method:'GET',headers:{'X-Firebase-ETag':'true'}});
 if(!active())throw error('save/session-ended');
 const next=update(current);
 if(next===undefined)return {committed:false,snapshot:{val:()=>current}};
 const etag=response.headers.get('ETag');if(!etag)throw error('save/missing-etag');
 const {response:written,value}=await request({method:'PUT',headers:{'Content-Type':'application/json','If-Match':etag},body:JSON.stringify(next)});
 return {committed:written.status===200,snapshot:{val:()=>value}};
}
