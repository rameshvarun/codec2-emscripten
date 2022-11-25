#!/usr/bin/env bash

# Activate last Emscripten version.
emsdk install 3.1.26
emsdk activate 3.1.26

mkdir -p build_wasm
cd build_wasm
emcmake cmake ../codec2

emmake make c2enc c2dec

cd ..
mkdir -p dist/
cp build_wasm/src/c2dec.js build
cp build_wasm/src/c2dec.wasm build
cp build_wasm/src/c2enc.js build
cp build_wasm/src/c2enc.wasm build