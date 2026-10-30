#!/usr/bin/env python3
"""Materialize the reviewed company export during deployment, never in Git."""
import argparse
import gzip
import hashlib
import io
import json
from pathlib import Path
import re
import tarfile
from urllib.request import Request, urlopen


def require(ok,message):
    if not ok:raise ValueError(message)


def digest(raw):return hashlib.sha256(raw).hexdigest()


def allowed(name):
    return name in {'company-component.json','content/company/catalog.json','company/sitemap.xml','company/robots.txt','assets/company.css','assets/company.js'} or bool(re.fullmatch(r'assets/(?:media|slides|fonts)/[a-z0-9][a-z0-9.-]*\.(?:mp4|vtt|png|woff2|txt|pdf)|company/(?:slides|videos)(?:/[a-z][a-z0-9-]{0,63})?/index\.html|company/slides/[a-z][a-z0-9-]{0,63}\.pdf',name))


def hydrate(site, archive=None):
    require(site.is_dir() and not site.is_symlink(),'invalid site')
    manifest=json.loads((site/'site-manifest.json').read_text())
    require(manifest.get('preview', False) is False,'preview cannot deploy')
    pointer=site/'company-release.json'
    if not pointer.exists():return
    pin=json.loads(pointer.read_text())
    require(set(pin)=={'schema_version','repository','tag','asset','sha256','files'} and pin['schema_version']==1,'invalid company pointer')
    require(pin['repository']=='CascadeAuth/aac-starter-guide' and re.fullmatch(r'company-site-[0-9a-f]{16}',pin['tag']) and pin['asset']=='company-site.tar.gz' and re.fullmatch(r'[0-9a-f]{64}',pin['sha256']),'invalid company destination')
    require(pin['tag']=='company-site-'+pin['sha256'][:16] and len(pin['files'])<=1000 and all(allowed(n) and re.fullmatch(r'[0-9a-f]{64}',h) for n,h in pin['files'].items()),'invalid company inventory')
    require(all(manifest['files'].get(n)==h for n,h in pin['files'].items()),'company pointer differs from reviewed site')
    if archive:
        raw=archive.read_bytes()
    else:
        url='https://github.com/'+pin['repository']+'/releases/download/'+pin['tag']+'/'+pin['asset']
        with urlopen(Request(url,headers={'User-Agent':'AAC-probe/company-deploy/1.0'}),timeout=60) as response:raw=response.read((64<<20)+1)
    require(len(raw)<=64<<20 and digest(raw)==pin['sha256'],'company archive checksum mismatch')
    found={};total=0
    with tarfile.open(fileobj=io.BytesIO(raw),mode='r:gz') as tar:
        for entry in tar:
            require(entry.isfile() and entry.name in pin['files'] and entry.name not in found,'unexpected company archive member')
            total+=entry.size;require(0<=entry.size<=32<<20 and total<=64<<20,'company archive exceeds bound')
            data=tar.extractfile(entry).read(entry.size+1)
            require(len(data)==entry.size and digest(data)==pin['files'][entry.name],'company member checksum mismatch')
            found[entry.name]=data
    require(set(found)==set(pin['files']),'incomplete company archive')
    profiles=json.loads((Path(__file__).resolve().parents[1]/'company-public-profiles.json').read_text())['decks']
    catalog=json.loads(found['content/company/catalog.json'])
    for deck in catalog['decks']:
        ids=[slide['id'] for slide in deck['slides']]
        require(deck['slug'] in profiles and len(ids)==len(profiles[deck['slug']]) and set(ids)==set(profiles[deck['slug']]), 'private investor slides are forbidden in public deployment')
    for name,data in found.items():
        dest=site/name
        require(not any(p.is_symlink() for p in [dest,*dest.parents] if p == site or site in p.parents),'site symlink forbidden')
        dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(data)
    actual={}
    for path in site.rglob('*'):
        require(not path.is_symlink(),'site symlink forbidden')
        if path.is_file() and path.name!='site-manifest.json':actual[path.relative_to(site).as_posix()]=digest(path.read_bytes())
    require(actual==manifest['files'],'hydrated site differs from reviewed snapshot')


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--site',type=Path,required=True);p.add_argument('--archive',type=Path);a=p.parse_args();hydrate(a.site,a.archive)
