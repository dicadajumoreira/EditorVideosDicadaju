#!/bin/bash
set -e
mkdir -p dist
cp *.html netlify.toml sitemap.xml robots.txt dist/
cp -r css js assets dist/
cp -r netlify dist/
echo "Build OK"
ls dist/
