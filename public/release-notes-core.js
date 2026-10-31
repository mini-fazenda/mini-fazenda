/* Uma exibição automática por versão; o recibo acompanha o save da conta. */
(function(root){
 class ReleaseNotesState{
  constructor(saved){this.restore(saved)}
  restore(saved){this.seenVersion=typeof saved?.seenVersion==='string'?saved.seenVersion.slice(0,100):'';}
  capture(){return {seenVersion:this.seenVersion};}
  pending(version){return typeof version==='string'&&!!version&&this.seenVersion!==version;}
  seen(version){if(!this.pending(version))return false;this.seenVersion=version;return true;}
 }
 root.MFReleaseNotesState=ReleaseNotesState;
})(globalThis);
