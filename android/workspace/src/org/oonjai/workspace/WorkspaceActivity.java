package org.oonjai.workspace;

import android.Manifest;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.*;
import android.widget.*;
import java.io.*;
import java.util.Locale;

public final class WorkspaceActivity extends Activity {
    private String area, host;
    private WebView page;
    private PermissionRequest cameraRequest;
    private ValueCallback<Uri[]> fileResult;

    @Override protected void onCreate(Bundle state) {
        super.onCreate(state);
        area = getIntent().getStringExtra("workspace");
        String title, start;
        if ("accounting".equals(area)) { title="Accounting"; start="phone.html"; }
        else if ("restaurant".equals(area)) { title="Restaurant"; start="index.html"; }
        else if ("wellness".equals(area)) { title="Wellness"; start="index.html"; }
        else if ("customer".equals(area)) { title="Customer Website"; start="public-restaurant/index.html"; }
        else { finish(); return; }
        host = area + ".oonjai.invalid";
        LinearLayout view = new LinearLayout(this);
        view.setOrientation(LinearLayout.VERTICAL);
        view.setBackgroundColor(HubActivity.GREEN);
        HubActivity.fitSystemBars(view);
        LinearLayout bar = new LinearLayout(this);
        bar.setGravity(android.view.Gravity.CENTER_VERTICAL);
        Button home = new Button(this, null, android.R.attr.borderlessButtonStyle);
        home.setText("‹  Hub");
        home.setAllCaps(false);
        home.setTextColor(HubActivity.CREAM);
        home.setOnClickListener(v -> finish());
        bar.addView(home);
        TextView name = new TextView(this);
        name.setText(title);
        name.setTextSize(18);
        name.setTextColor(HubActivity.CREAM);
        bar.addView(name);
        view.addView(bar);
        page = new WebView(this);
        view.addView(page, new LinearLayout.LayoutParams(-1,0,1));
        setContentView(view);
        WebSettings settings = page.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        page.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (local(uri)) return asset(uri);
                if (uri.getHost()!=null && uri.getHost().endsWith(".oonjai.invalid")) return missing();
                return super.shouldInterceptRequest(v, request);
            }
            @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (local(uri)) return false;
                if (!request.isForMainFrame()) return true;
                if ("oonjai-marketplace.github.io".equals(uri.getHost()) && "/web/hub/".equals(uri.getPath())) finish();
                else if (request.hasGesture() && ("https".equals(uri.getScheme()) || "tel".equals(uri.getScheme()) || "mailto".equals(uri.getScheme()))) {
                    try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); }
                    catch (ActivityNotFoundException ignored) { Toast.makeText(WorkspaceActivity.this,"No app can open this link.",Toast.LENGTH_SHORT).show(); }
                }
                return true;
            }
        });
        page.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileResult!=null) fileResult.onReceiveValue(null);
                fileResult = callback;
                try { startActivityForResult(params.createIntent(), 18); }
                catch (ActivityNotFoundException err) { fileResult=null; callback.onReceiveValue(null); }
                return true;
            }
            @Override public void onPermissionRequest(PermissionRequest request) {
                if (!local(request.getOrigin()) || !java.util.Arrays.asList(request.getResources()).contains(PermissionRequest.RESOURCE_VIDEO_CAPTURE)) { request.deny(); return; }
                if (checkSelfPermission(Manifest.permission.CAMERA)==PackageManager.PERMISSION_GRANTED) {
                    request.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE}); return;
                }
                if (cameraRequest!=null) { request.deny(); return; }
                cameraRequest=request;
                requestPermissions(new String[]{Manifest.permission.CAMERA},19);
            }
            @Override public void onPermissionRequestCanceled(PermissionRequest request) {
                if(cameraRequest==request) cameraRequest=null;
            }
        });
        if (state==null || page.restoreState(state)==null) page.loadUrl("https://"+host+"/"+start);
    }

    private boolean local(Uri uri) {
        return "https".equals(uri.getScheme()) && host.equals(uri.getHost()) && uri.getPort()==-1 && uri.getUserInfo()==null;
    }
    private WebResourceResponse asset(Uri uri) {
        String path=uri.getPath();
        if(path==null || path.contains("..") || path.contains("\\") || path.indexOf(0)>=0) return missing();
        if(path.endsWith("/")) path+="index.html";
        try {
            InputStream file=getAssets().open(area+path);
            String ext=MimeTypeMap.getFileExtensionFromUrl("https://local"+path).toLowerCase(Locale.ROOT);
            String type=MimeTypeMap.getSingleton().getMimeTypeFromExtension(ext);
            if(ext.equals("js")||ext.equals("mjs")) type="text/javascript";
            if(ext.equals("wasm")) type="application/wasm";
            if(ext.equals("json")||ext.equals("webmanifest")) type="application/json";
            if(ext.equals("css")) type="text/css";
            return new WebResourceResponse(type==null?"application/octet-stream":type, null, file);
        } catch(IOException ex) { return missing(); }
    }
    private WebResourceResponse missing() {
        return new WebResourceResponse("text/plain","UTF-8",404,"Not Found",null,new ByteArrayInputStream(new byte[0]));
    }
    @Override public void onRequestPermissionsResult(int code,String[] perms,int[] results) {
        super.onRequestPermissionsResult(code,perms,results);
        if(code==19 && cameraRequest!=null) {
            if(results.length>0 && results[0]==PackageManager.PERMISSION_GRANTED) cameraRequest.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});
            else cameraRequest.deny();
            cameraRequest=null;
        }
    }
    @Override protected void onActivityResult(int code,int result,Intent data) {
        super.onActivityResult(code,result,data);
        if(code==18 && fileResult!=null) {
            fileResult.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result,data)); fileResult=null;
        }
    }
    @Override public void onBackPressed() { if(page!=null && page.canGoBack()) page.goBack(); else super.onBackPressed(); }
    @Override protected void onSaveInstanceState(Bundle out) { super.onSaveInstanceState(out); if(page!=null)page.saveState(out); }
    @Override protected void onDestroy() { if(page!=null){page.stopLoading();page.destroy();} super.onDestroy(); }
}
