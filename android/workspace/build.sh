#!/usr/bin/env bash
# Usage: build.sh <platform/android.jar> <build-tools-dir> <Accounting> <Restaurant> <Wellness> <empty-output-dir>
set -eu
src=$(cd "$(dirname "$0")" && pwd)
platform=$(realpath "$1"); tools=$(realpath "$2"); out=$(realpath -m "$6")
mkdir -p "$out"
python3 "$src/bundle.py" --accounting "$3" --restaurant "$4" --wellness "$5" --out "$out/assets"
mkdir -p "$out"/{classes,dex,res/drawable-nodpi}
cp "$src/../../hub/hub-192.png" "$out/res/drawable-nodpi/hub_icon.png"
"$tools/aapt2" compile --dir "$out/res" -o "$out/resources.zip"
"$tools/aapt2" link -I "$platform" --manifest "$src/AndroidManifest.xml" -A "$out/assets" -o "$out/base.apk" "$out/resources.zip"
java -m jdk.compiler/com.sun.tools.javac.Main -source 8 -target 8 -bootclasspath "$tools/core-lambda-stubs.jar:$platform" -d "$out/classes" "$src"/src/org/oonjai/workspace/*.java
"$tools/d8" --lib "$platform" --min-api 26 --output "$out/dex" "$out"/classes/org/oonjai/workspace/*.class
(cd "$out/dex" && zip -q -0 "$out/base.apk" classes.dex)
"$tools/zipalign" -f -p 4 "$out/base.apk" "$out/aligned.apk"
