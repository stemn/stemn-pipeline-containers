#!/bin/sh

# Clean
rm -rf dist
mkdir dist

# Copy non-ts files from source
rsync -am  ./src/* ./dist --exclude '*.ts'

# Link node_modules into dist
ln -s ../node_modules ./dist/node_modules

# Build typescript
yarn tsc
