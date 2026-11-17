"""Stage the shipped client files. Inputs are checked-out public application releases."""
import argparse
from pathlib import Path
from shutil import copy2
from urllib.parse import urlsplit
import re

parser = argparse.ArgumentParser()
for name in ('accounting', 'restaurant', 'wellness', 'out'):
    parser.add_argument('--'+name, type=Path, required=True)
args = parser.parse_args()
out = args.out
out.mkdir(parents=True, exist_ok=False)

def stage(src, area, patterns):
    for pattern in patterns:
        for file in src.glob(pattern):
            if file.is_file() and not file.is_symlink():
                target = out / area / file.relative_to(src)
                target.parent.mkdir(parents=True, exist_ok=True)
                copy2(file, target)

# Accounting's own phone shell defines the shipping dependency list.
a = args.accounting
worker = (a/'phone-sw.js').read_text()
paths = [urlsplit(p).path for p in re.findall(r'"([^"]+)"', worker.split('const FILES=[')[1].split('];')[0])]
for path in paths:
    if not (a/path).is_file():
        raise ValueError('Missing phone dependency: '+path)
stage(a, 'accounting', paths+['scripts/phone-tools14242.js','assets/logo.png','assets/vendor/document-detector213/*','release-version.json','data/release-notes.json','data/calendar-news.json','assets/brand/*','scripts/*.js','styles/*.css','assets/vendor/document14285/*'])
# On Android tablets the Hub opens the own-account phone client, too.
for name in ('phone.html','scan.html'):
    p=out/'accounting'/name
    s=p.read_text()
    s=s.replace("if(!phone){const u=new URL('desktop.html'", "if(false){const u=new URL('desktop.html'")
    p.write_text(s)
p=out/'accounting/scripts/phone-runtime14242.js'
s=p.read_text()
marker="if(window.ReceiptNative214?.available){S.shellReady=true;"
if marker not in s: raise ValueError('Review installed-shell readiness for this Accounting release')
p.write_text(s.replace(marker,"if(location.hostname==='accounting.oonjai.invalid'||window.ReceiptNative214?.available){S.shellReady=true;"))

stage(Path(__file__).resolve().parents[2]/'hub','hr',['leave.html','leave.js','gateway.css','lang.js'])
stage(args.restaurant,'restaurant',['index.html','manifest.webmanifest','pos/**/*','back-office/**/*','kitchen/**/*','public-restaurant/**/*','assets/**/*','scripts/**/*','styles/**/*','vendor/**/*'])
stage(args.restaurant,'customer',['public-restaurant/**/*','assets/app-icons/*','styles/promotions146.css','scripts/supabase-config.js','scripts/public-menu-rules131.js','scripts/promotion-kit146.js','vendor/**/*'])
stage(args.wellness,'wellness',['*.html','*.js','*.css','*.webmanifest','version.json','vendor/**/*','assets/**/*'])
# Installed pages already have an offline asset store. Browser service workers
# would cache old application code and could hide a subsequent APK update.
for page in out.rglob('*.html'):
    s=page.read_text()
    s=re.sub(r'(<head\b[^>]*>)',r"\1<script>if(location.hostname.endsWith('.oonjai.invalid'))delete Navigator.prototype.serviceWorker;</script>",s,count=1,flags=re.I)
    page.write_text(s)
