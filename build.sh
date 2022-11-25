#!/usr/bin/env bash

# Activate last Emscripten version.
emsdk install 3.1.26
emsdk activate 3.1.26

# Clone codec2
git clone https://github.com/drowe67/codec2.git
cd codec2
git checkout 67f31bce663caef85abb5dd2df62fb996b246c05

# Apply patched changes.
git apply ../codec2.patch
cd ..

# Build codec 2
mkdir -p build_wasm
cd build_wasm
emcmake cmake ../codec2
emmake make c2enc c2dec

# Copy built artifacts into build/
cd ..
mkdir -p build/
cp build_wasm/src/c2dec.js build
cp build_wasm/src/c2dec.wasm build
cp build_wasm/src/c2enc.js build
cp build_wasm/src/c2enc.wasm build