#!/bin/bash

set -e;

if ! git diff-files --quiet; then
    echo "ERROR: Can not continue with unstaged changes";
    exit 1;
fi;

if ! git diff-index --quiet --cached HEAD; then
    echo "ERROR: Can not continue with uncommitted changes";
    exit 1;
fi;

npm test;
npm version ${1-patch}

git push;
git push --tags;
npm publish;
