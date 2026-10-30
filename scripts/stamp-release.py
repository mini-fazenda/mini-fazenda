"""Versione todos os scripts/estilos locais e identifique host/jogo na publicação."""
import json, re, sys
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode
root=Path(sys.argv[1] if len(sys.argv)>1 else 'public')
version=sys.argv[2] if len(sys.argv)>2 else 'local'
if not re.fullmatch(r'[A-Za-z0-9_-]+',version):raise SystemExit('Versão inválida')
def stamped(url):
    if url.startswith(('http:','https:','//','data:','#')):return url
    parts=urlsplit(url)
    if not parts.path.endswith(('.js','.css')):return url
    query=dict(parse_qsl(parts.query));query['v']=version
    return urlunsplit(('', '', parts.path,urlencode(query),parts.fragment))
for path in root.rglob('*'):
    if path.suffix not in ('.html','.js'):continue
    text=path.read_text()
    if path.suffix=='.html':
        text=re.sub(r'(\b(?:src|href)=[\"\'])([^\"\']+)([\"\'])',lambda m:m[1]+stamped(m[2])+m[3],text)
        text=re.sub(r'<script id="mf-release">.*?</script>','',text,flags=re.S)
        if path.name in ('index.html','game.html'):
            marker='<script id="mf-release">window.MF_BUILD_VERSION='+json.dumps(version)+';</script>'
            text=text.replace('<head>','<head>'+marker,1)
    else:
        text=re.sub(r'((?:from\s*|import\s*)[\"\'])(\.{1,2}/[^\"\']+\.js(?:\?[^\"\']*)?)([\"\'])',lambda m:m[1]+stamped(m[2])+m[3],text)
    path.write_text(text)
(root/'release.json').write_text(json.dumps({'version':version}))
