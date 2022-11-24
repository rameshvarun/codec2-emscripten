#!/usr/bin/env bash

mkdir -p build_wasm
cd build_wasm
emcmake cmake ../codec2

emmake make c2enc c2dec

cd ..
mkdir -p dist/
cp build_wasm/src/c2dec.js dist
cp build_wasm/src/c2dec.wasm dist
cp build_wasm/src/c2enc.js dist
cp build_wasm/src/c2enc.wasm dist