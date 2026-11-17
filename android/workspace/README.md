# Oon Jai for Android

Version 1.0 uses a native Android home activity and four locally bundled web workspaces. Each workspace has its own HTTPS origin in Android WebView. Workspace HTML, scripts and artwork ship inside the APK. Authentication and cloud records use the services configured by each workspace. Android Back follows workspace history. The Hub button returns directly to the home screen.

The Android package is `org.oonjai.workspace` (Android 8.0 or later). It installs alongside the original URL launcher. Existing browser sessions and unsynced browser drafts belong to their original browser profile. The Accounting area uses the phone web client and web scanner, including on tablets.

## Reproduce version 1.0

Check out these application repositories under OonJai-Marketplace at the following revisions.

| Input | Revision |
| --- | --- |
| Accounting | fd19137b07353be4616ba7425a4233ecaec3fffb |
| Restaurant-Back-Office, including the public storefront | b7c5a6e2aa86ab2cda960e12fbe05eb2f855dbfe |
| Wellness | 0535a17173df02550a94912380fd10706db5e2d3 |

Use a Java 21 JDK, Android SDK Platform 35, Build Tools 35.0.0, Python 3 and zip. Run from this directory with a fresh output directory.

```sh
./build.sh "$ANDROID_HOME/platforms/android-35/android.jar" "$ANDROID_HOME/build-tools/35.0.0" /path/to/Accounting /path/to/Restaurant-Back-Office /path/to/Wellness /tmp/oonjai-build
```

Sign the resulting aligned.apk with Android apksigner. For updates, increment the manifest version code and use the original workspace signing key. Version 1.0 certificate SHA-256 is `81943ff3910c3b57aaa294fb40564288fb03c3284a3a596d57a94aa82622a049`.

The signed version 1.0 APK has SHA-256 `442a282a905e046c452f59642a8edd950882478c790a1e7195f400d86eb32aef`.
