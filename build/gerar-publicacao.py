#!/usr/bin/env python3
"""Build the v778 web root from the organized source tree.

This generates deployment artifacts; it does NOT restore old source files at repo root.
"""
import json
import pathlib
import shutil
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
DEST = ROOT / "dist"
manifest = json.loads((ROOT / "build/manifesto-runtime-v778.json").read_text(encoding="utf-8"))
if manifest["base"] != "1.0.778":
    sys.exit("Unexpected baseline")
if DEST.exists():
    shutil.rmtree(DEST)
DEST.mkdir()
missing = []
for url_path, source_path in manifest["files"].items():
    src = ROOT / source_path
    if not src.is_file():
        missing.append(source_path)
        continue
    target = DEST / url_path
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(src, target)
if missing:
    shutil.rmtree(DEST)
    sys.exit("Missing source files: " + ", ".join(missing))
for path in ("index.html", "acessar.html", "app-shell.html", "sw.js", "manifest.webmanifest", "CNAME"):
    if not (DEST / path).exists():
        sys.exit("Missing required runtime entry: " + path)
for path in ("tv.html", "tv-controle.html"):
    if (DEST / path).exists():
        sys.exit("Removed TV page was unexpectedly included: " + path)
print(f"Generated {len(manifest['files'])} deployment assets from modular sources into dist/")
print("NOTE: this validates file presence, not runtime behavior or iPhone cache upgrades.")
