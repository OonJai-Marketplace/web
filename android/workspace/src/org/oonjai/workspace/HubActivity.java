package org.oonjai.workspace;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.widget.*;

public final class HubActivity extends Activity {
    static final int GREEN = 0xff053b2b, CREAM = 0xfffff5d8;
    private LinearLayout column;
    private boolean lao;
    private String label(String en,String lo){return lao?lo:en;}
    private void controls(){
        LinearLayout bar=new LinearLayout(this);
        bar.setGravity(Gravity.END);
        Button lang=new Button(this),more=new Button(this);
        lang.setText(label("ພາສາລາວ","English"));
        lang.setOnClickListener(v->{getSharedPreferences("hub",MODE_PRIVATE).edit().putBoolean("lao",!lao).apply();recreate();});
        more.setText("⋮");more.setContentDescription(label("More options","ຕົວເລືອກ"));
        more.setOnClickListener(v->{
            PopupMenu menu=new PopupMenu(this,more);
            menu.getMenu().add(label("HR · Request leave","ຝ່າຍບຸກຄະລາກອນ · ຂໍລາພັກ")).setOnMenuItemClickListener(i->{startActivity(new Intent(this,WorkspaceActivity.class).putExtra("workspace","hr"));return true;});
            menu.getMenu().add(label("Share Hub link","ແບ່ງປັນລິ້ງ")).setOnMenuItemClickListener(i->{startActivity(Intent.createChooser(new Intent(Intent.ACTION_SEND).setType("text/plain").putExtra(Intent.EXTRA_TEXT,"https://oonjai-marketplace.github.io/web/hub/"),null));return true;});
            menu.show();
        });
        bar.addView(lang);bar.addView(more);column.addView(bar);
    }
    private int dp(float n) { return Math.round(n * getResources().getDisplayMetrics().density); }

    static void fitSystemBars(View view) {
        view.setOnApplyWindowInsetsListener((v, insets) -> {
            v.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(),
                insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
            return insets.consumeSystemWindowInsets();
        });
    }

    @Override protected void onCreate(Bundle state) {
        super.onCreate(state);
        ScrollView scroll = new ScrollView(this);
        scroll.setFillViewport(true);
        scroll.setBackgroundColor(GREEN);
        fitSystemBars(scroll);
        column = new LinearLayout(this);
        column.setOrientation(LinearLayout.VERTICAL);
        column.setPadding(0, dp(8), 0, dp(20));
        scroll.addView(column);
        lao=getSharedPreferences("hub",MODE_PRIVATE).getBoolean("lao","lo".equals(java.util.Locale.getDefault().getLanguage()));
        controls();
        ImageView scene = new ImageView(this);
        scene.setImageResource(getResources().getIdentifier("terrace", "drawable", getPackageName()));
        scene.setScaleType(ImageView.ScaleType.CENTER_CROP);
        column.addView(scene, -1, dp(186));
        heading(label("Welcome to Oon Jai","ຍິນດີຕ້ອນຮັບສູ່ອຸ່ນໃຈ"), 28);
        destination(label("Customer Website","ເວັບໄຊສຳລັບລູກຄ້າ"), "customer", true);
        heading(label("Team workspaces","ພື້ນທີ່ເຮັດວຽກ"), 20);
        destination(label("Restaurant","ຮ້ານອາຫານ"), "restaurant", false);
        destination(label("Wellness","ສຸຂະພາບ"), "wellness", false);
        destination(label("Accounting","ບັນຊີ"), "accounting", false);
        setContentView(scroll);
    }

    private void heading(String label, int size) {
        TextView text = new TextView(this);
        text.setText(label);
        text.setGravity(Gravity.CENTER);
        text.setTypeface(Typeface.SERIF);
        text.setTextColor(CREAM);
        text.setTextSize(size);
        text.setPadding(dp(12), dp(10), dp(12), dp(10));
        column.addView(text);
    }

    private void destination(String label, String id, boolean light) {
        Button button = new Button(this);
        button.setAllCaps(false);
        button.setText(label);
        button.setTextSize(20);
        button.setTextColor(light ? GREEN : CREAM);
        GradientDrawable shape = new GradientDrawable();
        shape.setColor(light ? CREAM : 0xff10583f);
        shape.setCornerRadius(dp(12));
        shape.setStroke(dp(1), 0xff83a88a);
        button.setBackground(new android.graphics.drawable.RippleDrawable(
            android.content.res.ColorStateList.valueOf(0x3386a88b), shape, null));
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(-1, -2);
        params.setMargins(dp(18), dp(4), dp(18), dp(4));
        button.setMinHeight(dp(52));
        button.setOnClickListener(v -> startActivity(new Intent(this, WorkspaceActivity.class).putExtra("workspace", id)));
        column.addView(button, params);
    }
}
