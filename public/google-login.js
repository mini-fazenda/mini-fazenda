/* Popup iniciado diretamente pelo toque. Não redirecionar em hospedagem externa ao Firebase. */
export function googleLoginError(error){
 const code=error?.code||'',storage=/missing initial state|sessionStorage/i.test(error?.message||'');
 if(storage||['auth/popup-blocked','auth/operation-not-supported-in-this-environment','auth/web-storage-unsupported','auth/missing-initial-state'].includes(code))return {help:true,message:'Não foi possível concluir o login neste navegador. No iPhone, abra o jogo diretamente no Safari e permita a janela de login. Se abriu pelo WhatsApp, use a opção de abrir no navegador.'};
 const messages={'auth/unauthorized-domain':'Este domínio não está autorizado no Firebase.','auth/popup-closed-by-user':'Login cancelado. Toque em Entrar com Google para tentar novamente.','auth/network-request-failed':'Falha de rede ao abrir o Google. Confira sua conexão e tente novamente.','auth/cancelled-popup-request':'Já existe uma tentativa de login em andamento.'};
 return {help:false,message:messages[code]||'Não foi possível entrar com Google. Tente novamente.'};
}
export function createGoogleLogin({sdk,auth,button,report}){let busy=false;return async function(){if(busy)return false;busy=true;button.disabled=true;
 try{await sdk.signInWithPopup(auth,new sdk.GoogleAuthProvider());return true;}
 catch(error){report(googleLoginError(error));return false;}
 finally{busy=false;button.disabled=false;}
};}
