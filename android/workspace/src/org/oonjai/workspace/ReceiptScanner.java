package org.oonjai.workspace;

import android.app.Activity;
import android.content.Intent;
import android.content.IntentSender;
import android.net.Uri;
import android.util.Base64;
import android.webkit.WebView;
import androidx.webkit.JavaScriptReplyProxy;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;
import com.google.mlkit.vision.documentscanner.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.json.*;

/** Explicit scan requests only; the bridge is restricted to Accounting's main frame. */
final class ReceiptScanner {
 static final int SCAN=477;
 private final Activity activity;
 private final ExecutorService files=Executors.newSingleThreadExecutor();
 private JSONObject activeCall;
 private JavaScriptReplyProxy activeReply;
 private boolean scanning=false;
 private final ReceiptStorage storage;
 ReceiptScanner(Activity activity,WebView page){
  this.activity=activity;storage=new ReceiptStorage(activity);
  if(!WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER))return;
  WebViewCompat.addWebMessageListener(page,"OonJaiScanner477",Collections.singleton("https://accounting.oonjai.invalid"),(view,message,origin,main,reply)->{
   if(!main||!"https://accounting.oonjai.invalid".equals(origin.toString()))return;
   JSONObject call;try{call=new JSONObject(message.getData());}catch(Exception ignored){return;}
   try{String action=call.getString("action");
    if(action.equals("scan")){start(call,reply);return;}
    if(action.equals("pickDirectory")){storage.pick(call,(result,error)->answer(reply,call,result,error));return;}
    if(action.equals("openConnection")){Uri target=Uri.parse(call.getString("url"));if(!"https".equals(target.getScheme())||!"accounts.google.com".equals(target.getHost()))throw new IOException("Invalid Google authorization address.");activity.startActivity(new Intent(Intent.ACTION_VIEW,target));answer(reply,call,new JSONObject(),null);return;}
    files.execute(()->{try{answer(reply,call,perform(action,call),null);}catch(Exception e){answer(reply,call,null,e.getMessage());}});
   }catch(Exception e){answer(reply,call,null,e.getMessage());}
  });
 }
 private void answer(JavaScriptReplyProxy reply,JSONObject call,Object value,String error){
  try{JSONObject result=new JSONObject().put("id",call.getString("id"));if(error==null)result.put("result",value);else result.put("error",error);
   activity.runOnUiThread(()->{if(!activity.isDestroyed())reply.postMessage(result.toString());});
  }catch(Exception ignored){}
 }
 private File folder(String id)throws Exception{
  if(!id.matches("[0-9a-fA-F-]{36}"))throw new IOException("Invalid scan recovery reference.");
  File dir=new File(activity.getNoBackupFilesDir(),"receipt-scans/"+id);if(!dir.isDirectory()&&!dir.mkdirs())throw new IOException("Cannot protect scanned pages on this phone.");return dir;
 }
 private JSONArray read(File path)throws Exception{return new JSONArray(new String(java.nio.file.Files.readAllBytes(path.toPath()),StandardCharsets.UTF_8));}
 private void write(File path,JSONArray value)throws Exception{
  File temp=new File(path.getParentFile(),path.getName()+".part");try(FileOutputStream out=new FileOutputStream(temp)){out.write(value.toString().getBytes(StandardCharsets.UTF_8));out.getFD().sync();}
  if(!temp.renameTo(path))throw new IOException("Could not save the scan recovery record.");
 }
 private JSONArray protect(File dir,JSONArray sources)throws Exception{
  JSONArray pages=new JSONArray();for(int i=0;i<sources.length();i++){
   File page=new File(dir,i+".jpg"),temp=new File(dir,i+".part");
   if(!page.isFile()){
    try(InputStream input=activity.getContentResolver().openInputStream(Uri.parse(sources.getString(i)));FileOutputStream output=new FileOutputStream(temp)){
     if(input==null)throw new IOException("Cannot read a returned page.");byte[] buffer=new byte[65536];int n;while((n=input.read(buffer))!=-1)output.write(buffer,0,n);output.getFD().sync();
    }
    if(!temp.renameTo(page))throw new IOException("Cannot retain the scanned page. Retry import.");
   }pages.put(Uri.fromFile(page).toString());
  }write(new File(dir,"result.json"),pages);return pages;
 }
 private Object perform(String action,JSONObject call)throws Exception{
  if(storage.supports(action))return storage.perform(action,call);
  if(action.equals("upload")){
   java.net.URL url=new java.net.URL(call.getString("url"));
   if(!"https".equals(url.getProtocol())||!"www.googleapis.com".equals(url.getHost())||url.getPort()!=-1||url.getUserInfo()!=null||!url.getPath().matches("/upload/drive/v3/files(?:/[A-Za-z0-9_-]+)?")||url.getQuery()==null||!url.getQuery().contains("upload_id="))throw new IOException("Invalid Drive upload session.");
   String range=call.getString("range");if(!range.matches("bytes (?:[0-9]+-[0-9]+|\\*)/[0-9]+"))throw new IOException("Invalid upload range.");
   byte[] bytes=Base64.decode(call.getString("data"),Base64.DEFAULT);if(bytes.length>4*1024*1024)throw new IOException("Upload chunk is too large.");
   java.net.HttpURLConnection connection=(java.net.HttpURLConnection)url.openConnection();connection.setInstanceFollowRedirects(false);connection.setConnectTimeout(30000);connection.setReadTimeout(60000);connection.setRequestMethod("PUT");connection.setRequestProperty("Content-Range",range);connection.setRequestProperty("Content-Type","application/pdf");connection.setDoOutput(true);connection.setFixedLengthStreamingMode(bytes.length);
   try{try(OutputStream out=connection.getOutputStream()){out.write(bytes);}return new JSONObject().put("status",connection.getResponseCode()).put("range",connection.getHeaderField("Range"));}finally{connection.disconnect();}
  }
  String id=call.getString("requestId");File dir=folder(id);
  if(action.equals("recover")){
   File result=new File(dir,"result.json"),sources=new File(dir,"sources.json");
   return new JSONObject().put("requestId",id).put("scannedImages",result.isFile()?read(result):sources.isFile()?protect(dir,read(sources)):new JSONArray());
  }
  if(action.equals("readPage")){
   int index=call.getInt("index");if(index<0)throw new IOException("Invalid page.");
   File result=new File(dir,"result.json");if(!result.isFile()||index>=read(result).length())throw new IOException("Page not found.");
   return Base64.encodeToString(java.nio.file.Files.readAllBytes(new File(dir,index+".jpg").toPath()),Base64.NO_WRAP);
  }
  if(action.equals("finish")){
   File result=new File(dir,"result.json");if(!result.isFile()){if(!new File(dir,"sources.json").exists())return new JSONObject();throw new IOException("Returned scans are not ready.");}
   JSONArray a=call.getJSONArray("acknowledged"),pages=read(result);for(int i=0;i<pages.length();i++){boolean found=false;for(int j=0;j<a.length();j++)if(a.getInt(j)==i)found=true;if(!found)throw new IOException("Protect every page before finishing.");}
   File[] children=dir.listFiles();if(children!=null)for(File child:children)if(child.isFile())child.delete();dir.delete();
   return new JSONObject();
  }
  throw new IOException("Unsupported scanner request.");
 }
 private void start(JSONObject call,JavaScriptReplyProxy reply)throws Exception{
  if(scanning){answer(reply,call,null,"The document scanner is already open.");return;}
  String id=call.getString("requestId");File dir=folder(id);
  if(new File(dir,"sources.json").exists()||new File(dir,"result.json").exists()){answer(reply,call,null,"Recover the returned pages before scanning again.");return;}
  activity.getPreferences(Activity.MODE_PRIVATE).edit().putString("receiptScan477",id).commit();
  scanning=true;activeCall=call;activeReply=reply;
  GmsDocumentScannerOptions.Builder options=new GmsDocumentScannerOptions.Builder().setGalleryImportAllowed(true).setResultFormats(GmsDocumentScannerOptions.RESULT_FORMAT_JPEG).setScannerMode(GmsDocumentScannerOptions.SCANNER_MODE_FULL);
  if(call.optBoolean("singlePage"))options.setPageLimit(1);
  GmsDocumentScanning.getClient(options.build()).getStartScanIntent(activity).addOnSuccessListener(sender->{
   try{activity.startIntentSenderForResult(sender,SCAN,null,0,0,0);}catch(IntentSender.SendIntentException e){failed(e.getMessage());}
  }).addOnFailureListener(e->failed("Google document scanner could not open. Check Google Play services and internet for its first setup. "+e.getMessage()));
 }
 private void failed(String error){scanning=false;if(activeReply!=null)answer(activeReply,activeCall,null,error);activeCall=null;activeReply=null;}
 void close(){files.shutdown();activeCall=null;activeReply=null;}
 boolean result(int code,int result,Intent data){
  if(storage.result(code,result,data))return true;
  if(code!=SCAN)return false;scanning=false;
  final JSONObject call=activeCall;final JavaScriptReplyProxy reply=activeReply;activeCall=null;activeReply=null;
  final String id=activity.getPreferences(Activity.MODE_PRIVATE).getString("receiptScan477","");
  if(result==Activity.RESULT_CANCELED){try{if(reply!=null)answer(reply,call,new JSONObject().put("cancelled",true),null);}catch(JSONException ignored){}return true;}
  GmsDocumentScanningResult scan=data==null?null:GmsDocumentScanningResult.fromActivityResultIntent(data);
  if(result!=Activity.RESULT_OK||scan==null||scan.getPages()==null){if(reply!=null)answer(reply,call,null,"The document scanner returned no pages.");return true;}
  files.execute(()->{try{
   File dir=folder(id);JSONArray sources=new JSONArray();for(GmsDocumentScanningResult.Page p:scan.getPages())sources.put(p.getImageUri().toString());write(new File(dir,"sources.json"),sources);
   JSONObject value=new JSONObject().put("requestId",id).put("scannedImages",protect(dir,sources));if(reply!=null)answer(reply,call,value,null);
  }catch(Exception e){if(reply!=null)answer(reply,call,null,e.getMessage());}});return true;
 }
}
