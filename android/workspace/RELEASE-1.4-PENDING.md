# Native scanner integration — awaiting the retained signing key

The Android source compiles and passes the release build and lint checks. It is
not a published or installable production update. Keep package
`org.oonjai.workspace`, version code 5 and the existing Workspace signing identity.
The available older Hub recovery key does not match the installed Workspace.
Do not distribute a build signed with that older key or ask users to uninstall
an app containing unsaved work.

The installed 1.3 certificate SHA-256 is
`81943ff3910c3b57aaa294fb40564288fb03c3284a3a596d57a94aa82622a049`.
The base 1.3 APK SHA-256 is
`5182956ae8e6019729f6aa6ba0857a49f39033f305e183fdbec767b675984529`.

This change embeds Google's ML Kit document scanner in the existing Accounting
WebView. The bridge accepts only the Accounting main frame's exact HTTPS origin.
Scans retain unchanged JPEGs in app-private recovery storage until Accounting's
encrypted import acknowledges every page. Interrupted imports can resume. Normal
capture has no page cap; retakes request one page. Drive uploads use Android's
HTTPS transport, bounded chunks, the original reserved file ID and checksum
verification in the Accounting client. Phone/SD folder access uses Android's
system picker. Work starts only from explicit actions; no polling was added.

Build with JDK 17+, Android SDK 35 and Gradle 8.14.x. `build.sh` stages full source
checkouts. To preserve the currently installed non-Accounting workspaces, verify
the base APK signature and use:

```sh
python android/workspace/refresh-accounting.py --base-apk /path/to/Oon-Jai-1.3.apk --accounting /path/to/Accounting --out /path/to/new-assets
OJM_WORKSPACE_ASSETS=/path/to/new-assets gradle -p android/workspace :app:assembleRelease
node android/workspace/tests/bridge.cjs /path/to/Accounting
```

Sign the unsigned output only with the retained Workspace key, verify the
certificate against the digest above, then publish a download and update the
Hub download control. Do not publish a download link before that check passes.

Validation: release compilation, Android resource/dex assembly and release lint
passed. Adapter tests cover recovery, raw JPEG import, retakes, account isolation,
cancellation, acknowledgements and upload bytes/range. Accounting batch tests
cover multi-ID PDFs and retry boundaries. Restaurant, Wellness, HR and customer
assets were byte-compared with the base 1.3 package. No physical camera, Android
installation or actual company Drive upload has been verified. Browser preview
was blocked by this environment's preview routing.
