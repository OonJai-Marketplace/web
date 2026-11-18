package org.oonjai.workspace;
import android.app.Activity;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.provider.DocumentsContract;
import android.os.storage.StorageManager;
import android.os.storage.StorageVolume;
import android.util.Base64;
import androidx.core.content.FileProvider;
import org.json.*;
import java.io.*;
import java.security.MessageDigest;
import java.util.UUID;

final class ReceiptStorage {
 private final Activity activity;
 interface Reply {void answer(JSONObject result,String error);}
 private Reply picker;
 ReceiptStorage(Activity activity){this.activity=activity;}
 boolean supports(String action){return action.equals("checkDirectory")||action.equals("createDirectory")||action.equals("writePDF")||action.equals("sharePDF");}
 private Uri root(String value)throws Exception{
  Uri tree=Uri.parse(value);if(!"content".equals(tree.getScheme())||!DocumentsContract.isTreeUri(tree))throw new IOException("Choose a folder again.");
  return DocumentsContract.buildDocumentUriUsingTree(tree,DocumentsContract.isDocumentUri(activity,tree)?DocumentsContract.getDocumentId(tree):DocumentsContract.getTreeDocumentId(tree));
 }
 private String hash(Uri uri)throws Exception{
  MessageDigest digest=MessageDigest.getInstance("SHA-256");try(InputStream input=activity.getContentResolver().openInputStream(uri)){if(input==null)throw new IOException("Cannot verify the saved PDF.");byte[] buffer=new byte[65536];int n;while((n=input.read(buffer))!=-1)digest.update(buffer,0,n);}
  StringBuilder out=new StringBuilder();for(byte b:digest.digest())out.append(String.format("%02x",b));return out.toString();
 }
 private String folderName(Uri document)throws Exception{
  try(Cursor c=activity.getContentResolver().query(document,new String[]{DocumentsContract.Document.COLUMN_DISPLAY_NAME,DocumentsContract.Document.COLUMN_FLAGS},null,null,null)){
   if(c==null||!c.moveToFirst()||(c.getInt(1)&DocumentsContract.Document.FLAG_DIR_SUPPORTS_CREATE)==0)throw new IOException("This folder is unavailable or read-only. Choose it again.");
   String id=DocumentsContract.getDocumentId(document);return id.contains(":")?id.replace("primary:","Phone / ").replace(":"," / "):c.getString(0);
  }
 }
 void pick(JSONObject call,Reply reply)throws Exception{
  if(picker!=null)throw new IOException("The folder picker is already open.");
  JSONObject folder=call.getJSONObject("folder");Intent intent=new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
  if(Build.VERSION.SDK_INT>=29&&!folder.has("id")){
   StorageManager manager=(StorageManager)activity.getSystemService(Activity.STORAGE_SERVICE);
   if("local".equals(folder.optString("kind")))intent=manager.getPrimaryStorageVolume().createOpenDocumentTreeIntent();
   else if("sd".equals(folder.optString("kind")))for(StorageVolume volume:manager.getStorageVolumes())if(volume.isRemovable()&&android.os.Environment.MEDIA_MOUNTED.equals(volume.getState())){intent=volume.createOpenDocumentTreeIntent();break;}
  }
  intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION|Intent.FLAG_GRANT_WRITE_URI_PERMISSION|Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION|Intent.FLAG_GRANT_PREFIX_URI_PERMISSION);
  if(folder.has("id"))intent.putExtra(DocumentsContract.EXTRA_INITIAL_URI,Uri.parse(folder.getString("id")));
  picker=reply;try{activity.startActivityForResult(intent,478);}catch(Exception e){picker=null;throw e;}
 }
 boolean result(int code,int status,Intent data){
  if(code!=478)return false;Reply reply=picker;picker=null;if(reply==null)return true;
  try{if(status!=Activity.RESULT_OK||data==null){reply.answer(new JSONObject().put("cancelled",true),null);return true;}
   Uri uri=data.getData();if(uri==null)throw new IOException("No folder selected.");
   activity.getContentResolver().takePersistableUriPermission(uri,data.getFlags()&(Intent.FLAG_GRANT_READ_URI_PERMISSION|Intent.FLAG_GRANT_WRITE_URI_PERMISSION));
   reply.answer(new JSONObject().put("id",uri.toString()).put("name",folderName(root(uri.toString()))),null);
  }catch(Exception e){reply.answer(null,e.getMessage());}return true;
 }
 Object perform(String action,JSONObject call)throws Exception{
  if(action.equals("sharePDF")){
   String name=call.getString("name");validName(name);File folder=new File(activity.getCacheDir(),"receipt-exports/"+UUID.randomUUID());if(!folder.mkdirs())throw new IOException("Cannot prepare the PDF to share.");
   File file=new File(folder,name);try(FileOutputStream out=new FileOutputStream(file)){out.write(Base64.decode(call.getString("data"),Base64.DEFAULT));out.getFD().sync();}
   Uri uri=FileProvider.getUriForFile(activity,"org.oonjai.workspace.receipts",file);
   activity.runOnUiThread(()->activity.startActivity(Intent.createChooser(new Intent(Intent.ACTION_SEND).setType("application/pdf").putExtra(Intent.EXTRA_STREAM,uri).addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION),null)));
   return new JSONObject();
  }
  Uri parent=root(call.getJSONObject("folder").getString("id"));
  if(action.equals("checkDirectory"))return new JSONObject().put("name",folderName(parent));
  if(action.equals("createDirectory")){
   String name=call.getString("name").trim();if(name.isEmpty()||(name.indexOf('/')>=0||name.indexOf(92)>=0||name.chars().anyMatch(c->c<32)))throw new IOException("Enter a folder name without slashes.");
   Uri made=DocumentsContract.createDocument(activity.getContentResolver(),parent,DocumentsContract.Document.MIME_TYPE_DIR,name);if(made==null)throw new IOException("Folder creation failed.");return new JSONObject().put("id",made.toString()).put("name",folderName(made));
  }
  if(!action.equals("writePDF"))throw new IOException("Unsupported storage action.");
  String name=call.getString("name"),expected=call.getString("sha256");validName(name);if(!expected.matches("[0-9a-f]{64}"))throw new IOException("Invalid PDF checksum.");folderName(parent);
  Uri children=DocumentsContract.buildChildDocumentsUriUsingTree(parent,DocumentsContract.getDocumentId(parent));
  try(Cursor c=activity.getContentResolver().query(children,new String[]{DocumentsContract.Document.COLUMN_DOCUMENT_ID,DocumentsContract.Document.COLUMN_DISPLAY_NAME},null,null,null)){
   while(c!=null&&c.moveToNext())if(name.equals(c.getString(1))){Uri existing=DocumentsContract.buildDocumentUriUsingTree(parent,c.getString(0));if(!expected.equals(hash(existing)))throw new IOException("That filename already exists with different contents. Change the PDF name.");return new JSONObject().put("uri",existing.toString()).put("sha256",expected).put("verified",true);}
  }
  Uri created=null;try{
   created=DocumentsContract.createDocument(activity.getContentResolver(),parent,"application/pdf",".pending-"+UUID.randomUUID()+".pdf");if(created==null)throw new IOException("Cannot create a PDF in this folder.");
   try(OutputStream out=activity.getContentResolver().openOutputStream(created,"w")){if(out==null)throw new IOException("The destination is not writable.");out.write(Base64.decode(call.getString("data"),Base64.DEFAULT));out.flush();}
   if(!expected.equals(hash(created)))throw new IOException("The saved PDF did not pass verification. Your draft is retained.");
   Uri saved=DocumentsContract.renameDocument(activity.getContentResolver(),created,name);if(saved==null)throw new IOException("The PDF could not be named. Choose a different folder.");created=null;return new JSONObject().put("uri",saved.toString()).put("sha256",expected).put("verified",true);
  }finally{if(created!=null)try{DocumentsContract.deleteDocument(activity.getContentResolver(),created);}catch(Exception ignored){}}
 }
 private void validName(String name)throws IOException{if(!name.toLowerCase().endsWith(".pdf")||name.length()>180||(name.indexOf('/')>=0||name.indexOf(92)>=0||name.chars().anyMatch(c->c<32)))throw new IOException("Invalid PDF filename.");}
}
