#!/usr/bin/env bash
# Usage: build.sh <Accounting> <Restaurant> <Wellness> <empty-assets-dir>
# Requires Android SDK 35, JDK 17+ and Gradle 8.14.x. Sign with the retained Hub key.
set -eu
src=$(cd "$(dirname "$0")" && pwd)
python3 "$src/bundle.py" --accounting "$1" --restaurant "$2" --wellness "$3" --out "$4"
OJM_WORKSPACE_ASSETS=$(realpath "$4") gradle -p "$src" :app:assembleRelease
