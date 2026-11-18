"""Refresh Accounting inside a previously signed Hub asset bundle.
Other workspace assets stay byte-identical. Verify the input APK's signer first.
"""
import argparse, json, re, zipfile
from pathlib import Path
from shutil import copy2
from urllib.parse import urlsplit
p=argparse.ArgumentParser()
p.add_argument('--base-apk',type=Path,required=True)
p.add_argument('--accounting',type=Path,required=True)
p.add_argument('--out',type=Path,required=True)
a=p.parse_args();a.out.mkdir(parents=True,exist_ok=False)
with zipfile.ZipFile(a.base_apk) as z:
    for name in z.namelist():
        if name.startswith('assets/') and not name.endswith('/'):
            target=(a.out/name[7:]).resolve()
            if not target.is_relative_to(a.out.resolve()):raise ValueError('Invalid asset path')
            target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(z.read(name))
dst=a.out/'accounting'
paths={f.relative_to(dst) for f in dst.rglob('*') if f.is_file()}
worker=(a.accounting/'phone-sw.js').read_text()
paths.update(Path(urlsplit(v).path) for v in re.findall(r'"([^"]+)"',worker.split('const FILES=[')[1].split('];')[0]))
for folder in ('scripts','styles'):
    paths.update(f.relative_to(a.accounting) for f in (a.accounting/folder).glob('*') if f.is_file())
for path in paths:
    src=a.accounting/path
    if src.is_file():
        (dst/path).parent.mkdir(parents=True,exist_ok=True);copy2(src,dst/path)
for name in ('phone.html','scan.html'):
    f=dst/name;f.write_text(f.read_text().replace("if(!phone){const u=new URL('desktop.html'","if(false){const u=new URL('desktop.html'"))
f=dst/'scripts/phone-runtime14242.js'
f.write_text(f.read_text().replace('if(window.ReceiptNative214?.available){S.shellReady=true;',"if(location.hostname==='accounting.oonjai.invalid'||window.ReceiptNative214?.available){S.shellReady=true;"))
adapter=(a.accounting/'mobile/connected-accounting/src/pending-scan.mjs').read_text().replace('export function pendingScan','function pendingScan')+'\n'+(Path(__file__).parent/'receipt-native.js').read_text()
(dst/'scripts/workspace-receipt-native477.js').write_text(adapter)
for f in dst.glob('*.html'):
    s=f.read_text()
    s=re.sub(r'(<head\b[^>]*>)',r"\1<script>if(location.hostname.endsWith('.oonjai.invalid'))delete Navigator.prototype.serviceWorker;</script>",s,count=1,flags=re.I)
    s=s.replace('<script src="scripts/workspace-receipt-native477.js"></script>','')
    f.write_text(s.replace('</head>','<script src="scripts/workspace-receipt-native477.js"></script></head>'))
# Keep the earlier native home design; the menu opens the current public update page.
f=a.out/'hub/hub-app.js';s=f.read_text().replace("if(installedHub)document.querySelector('#download-app').hidden=true;","document.querySelector('#download-app').hidden=false;document.querySelector('#download-app').onclick=()=>location.assign('/update');")
f.write_text(s)
print('Accounting',json.loads((dst/'release-version.json').read_text())['version'],'staged; other workspaces preserved')
