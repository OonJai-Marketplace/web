📖 Oon Jai Marketplace - Complete Website Management Protocol
Welcome! If you are reading this, you are in charge of managing and updating the Oon Jai Marketplace website. Do not worry if you don't know how to code. The website is built like a giant text document. You only need to know how to search for specific words and replace text carefully.

🛡️ THE GOLDEN RULES (Read First!)
Always make a copy. Before you change anything, copy the entire code and paste it into a safe document (like Notepad or a Google Doc) and name it Website_Backup_[Date]. If you make a mistake, you can always paste the backup to fix it.
Never delete punctuation or code tags. Quotes (" or '), commas (,), brackets ([ or {), and tags (like <h1>, <p>, or <br>) hold the website together. Only edit the normal reading words.
Use CTRL + F (or CMD + F on Mac). This is the "Find" shortcut. It is your best friend. Instead of scrolling, press Ctrl + F and type the exact text you want to change.

🔐 PART 1: Management Accounts
(This repository is public. Keep passwords and recovery codes in a password manager, never in these files.)

To manage this website, you will need to log into three different platforms.

1. GitHub (Where the website code lives and gets published)

Website: https://github.com
Email / Username: santos@oonjai.org or marketplace@oonjai.org (both accounts are link)
Password: [Store credentials in your password manager, never in this repository.]

2. Google Account (For the Google Sheet & Apps Script that receives the "Words of Hope" messages)

Link: https://docs.google.com/spreadsheets/d/1ysVHCxagUXUV6gOFXyXkbSNM3XYz6F5RxNKX_DR_YB4/edit?usp=sharing
Email: [ENTER YOUR GOOGLE EMAIL HERE]
Password: [Store credentials in your password manager, never in this repository.]

3. Postimages (Where all the website photos are uploaded and hosted)

Website: https://postimages.org/
Email: [ENTER YOUR POSTIMAGES EMAIL HERE]
Password: [Store credentials in your password manager, never in this repository.]


4. Google Search Console (To track how many people find the website on Google)
Website: https://search.google.com/search-console
Email: [ENTER YOUR GOOGLE EMAIL HERE] (Usually the same as your Google Apps Script account)
Password: [Store credentials in your password manager, never in this repository.]


💻 PART 2: How to Open, Edit, and Save in GitHub
GitHub is where the website code lives. The entire website is built into one single file to make updating and editing as easy as possible for you.

Step 1: Open the Code
Log into GitHub using the credentials in Part 1.
Open the repository named OonJai-Marketplace/web.
Click on the file on the left named index.html.
In the top right corner of the code box, click the Pencil Icon (Edit this file).

Step 2: Make Your Edits
Use the guides in Parts 3 through 7 below to find and replace the text, prices, or links you want to change.

Step 3: Save Your Changes
Once you are done editing, click the green Commit changes... button at the top right. A box will pop up.
Add a description: In the text box, write a short note about what you changed (e.g., "Updated Burger Price" or "Changed Homepage Image").
Click the green Commit changes button inside the popup to save. (If you realize you made a mistake, you can click Cancel instead).

Step 4: Wait for the Update to go Live (The Dot Indicator)
Just because you clicked save does not mean the website updates instantly.

After saving it will bring you back after editing, then refresh the website.
Look beside the index.html file or the repository name (oonjai-marketplace). You will see a small colored dot.
Dark Orange / Dark Red Dot: This means the website is currently processing your changes. It is NOT live yet.
Wait and Refresh: Wait a few seconds or minutes, and refresh the webpage.
Green Checkmark (Success): When the dot turns into a green checkmark, your update is successful! You can now go to the live website and see your changes.
Website like: click the 3 dash in the top left corner, and choose OonJai-Marketplace/web. And you will see the link just under the About section.

📝 PART 3: Master Text Editing Guide (Titles, Descriptions, Footers)
If you want to change the words on the website, press CTRL + F inside index.html and search for the exact text listed below. Carefully erase the old words and type your new words.

A. The Homepage
Search: Welcome to Oon Jai Marketplace (Changes the main giant text)
Search: ✦ Nourishing Body, Mind & Soul ✦ (Changes the small gold text above the title)
Search: Where every meal supports hope, health, and community (Changes the subtitle)
Search: Nourish - Inspire - Connect (Changes the middle section title)
Search: Discover what makes Oon Jai special (Changes the middle section paragraph)
Search: Oon Jai Marketplace is a mission-driven vegetarian (Changes the "About Us" paragraph)

B. The Menu Page
Search: Our Wholesome Menu (Changes the main banner title)
Search: ✦ Fresh & Plant-Based ✦ (Changes the gold banner text)
Search: Mon–Thu: 11:00 – 14:00 (Changes the opening hours)
Search: Select a category to explore our offerings (Changes the instructions above the menu)

C. Words of Hope Page
Search: Words of Hope (Changes the main banner title)
Search: Read uplifting thoughts shared by our guests (Changes the banner subtitle)
Search: Every message shared here has the power (Changes the introduction paragraph)
Search: Message for a Stranger (Changes the title of the submit box)
Search: Leave an encouraging thought or quote (Changes the submit box subtitle)
Search: We are grateful for every word (Changes the text under "Featured Messages")

D. Reviews Page
Search: Share Your Experience (Changes the main banner title)
Search: Hear what our guests are saying (Changes the banner subtitle)
Search: Every review shared here helps us grow (Changes the intro paragraph)
Search: Your feedback helps us grow and continue (Changes the text next to the Google Review button)

E. The Universal Footer & Quote
Search: A single act of kindness throws out roots (Changes the famous quote at the bottom)
Search: — Amelia Earhart (Changes the author of the quote)
Search: Spreading kindness, one meal at a time. (Changes the very bottom copyright text)

🍔 PART 4: Updating the Menu Items and Prices
All the food, prices, and descriptions are stored in a specific list.
How to find it: Press Ctrl + F and search for const menuData = {

You will see items that look like this:

JavaScript


{ id: 'b2', name: 'The Classic', price: 120000, desc: 'Meaty patty, lettuce...' },


To change the name: Change the text inside the single quotes next to name:
To change the price: Change the number next to price:. Do not use commas or text here. Write 125000, NOT '125,000 Kip'.
To change the description: Change the text inside the single quotes next to desc:.

📸 PART 5: Changing Pictures (Carousels & Banners)
Pictures are not uploaded directly to GitHub; they are hosted on Postimages.

How to get a new picture link:

Log in to Postimages.org (Use credentials from Part 1).
Upload your picture.
Copy the "Direct link" (it MUST end in .jpg or .png).

Changing the Main Top Banners:

Press Ctrl + F and search for background-image: url
You will see: url('[https://i.postimg.cc/8PH5RscH/banner.jpg](https://i.postimg.cc/8PH5RscH/banner.jpg)')
Simply replace the link inside the single quotes.

Changing the Photo Carousels (Words of Hope / Reviews):

Press Ctrl + F and search for const hopeImagesData = [ OR const googleReviewPhotosData = [
You will see a list of links wrapped in quotes. Carefully delete an old link inside the quotes, and paste your new link. Always keep the commas , separating the photos.


Changing the 3 Home Page Automatic Slideshows:
Press Ctrl + F and search for HOME TAB CAROUSEL PHOTOS
You will see three lists (homeMenuImages, homeHopeImages, and homeReviewImages).
Each list has 7 blank spots (""). Paste your direct image links inside the quotes. The website will automatically combine them into a smooth background video-like slideshow!


Changing the logo on the website tab


Press Ctrl + F and search for link rel="icon"
You will see: url('https://i.postimg.cc/NFhGYVSd/logo-png.png')
Simply replace the link inside the single quotes.

💬 PART 6: Updating the Written Customer Reviews
How to find it: Press Ctrl + F and search for const customReviewsData = [

You will see lines like this:


{ text: "Absolutely delicious!...", name: "Sarah V.", stars: "★★★★★" },


Change the text inside the quotes for text:, name:, and stars: as needed. Make sure you don't delete the { } brackets or the commas at the end of the line!

🔗 PART 7: Updating Links (Delivery Apps & Contact Info)
To update Delivery Apps (FoodPanda, E-GetS, etc):

Press Ctrl + F and search for Food Panda (or the specific app name).
You will see: <a href="[https://www.foodpanda.la/en/](https://www.foodpanda.la/en/)..." target="_blank"
Change the web address inside href="YOUR_NEW_LINK_HERE". Leave the target="_blank" alone (that tells it to open in a new tab).

To update WhatsApp & Messenger numbers:

Press Ctrl + F and search for const PHONE_NUMBER
WhatsApp: Put the phone number with the country code, but NO plus signs (+), NO spaces, and NO dashes. (e.g., "8562057048174").
Messenger: Put the username found at the end of your Facebook page link (e.g., "oon.jai.laos").

To update spreadsheet/Appscript link:


spreadsheet/Appscript
Open spreadsheet (named Stranger’s Message) (or if you choose to make a new spreadsheet)
Copy and paste the script on this link :https://drive.google.com/drive/folders/1FZRtwGQ548Dol5D3oyqsqH01ppHfmfDp?usp=sharing (as long that your under Oon Jai company account and Jonathan did not delete it it’s accessible)
Click deploy (do not run), and choose new development.
Executed by your email
And “Who has access” is “Anyone”
Deploy and copy URL link.

Github.com
Open index.html in GitHub and click the Pencil icon to edit.
Press Ctrl + F and search for this exact phrase: const WEB_APP_URL
Carefully delete the old link inside the quotation marks and paste your new link.
Crucial Rule: Do not delete the quotation marks "" or the semicolon ; at the very end of the line! It must look like "YOUR_NEW_LINK_HERE";
Check by sending a sample message if it will be saved on the table.

⚙️ PART 8: Google Apps Script Protocol (Words of Hope Form)
The "Message for a Stranger" form sends text to a Google Sheet. If you ever change the Google Sheet (like moving it to a new email account), you must update the script.

Step 1: Open the Script

Log into Google (using the credentials in Part 1) and open the Google Sheet where messages are saved.
In the top menu, click Extensions > Apps Script.
Step 2: Redeploying the Script (CRITICAL STEP)
If you edit the script, saving it is not enough. You must create a "New Version".

In the top right corner, click the blue Deploy button.
Select Manage deployments.
Click the Pencil Icon (Edit) next to your active deployment.
Under the Version dropdown menu, you MUST select New version (Do not leave it on an old version, or it will fail).
Ensure "Execute as" is set to Me.
Ensure "Who has access" is set to Anyone.
Click Deploy.
Step 3: Connect the New Script to the Website

After clicking Deploy, Google gives you a Web App URL. Click "Copy".
Open your website code in GitHub (index.html).
Press Ctrl + F and search for const WEB_APP_URL
You will see: const WEB_APP_URL = "[https://script.google.com/macros/s/.../exec](https://script.google.com/macros/s/.../exec)";
Erase the old link and paste your newly copied link inside the quotation marks. Save and Commit (See Part 2).
🛠️ PART 9: Advanced Customizations (Colors, Limits, Sizes, and Speeds)
If you need to change structural elements, colors, or speeds, search for these exact phrases.
A. Changing the "20 to 30 Words" Limit (Words of Hope)
To change this limit (for example, to 10-50 words), you must change it in three places so the code and the text match:
The Display Text: Search for 0 / 20-30 words (There are 3 places this appears). Change the text to your new numbers (e.g., 0 / 10-50 words).
The Placeholder Text: Search for (20–30 words).... Update this text.
The Math Logic: Search for wordCount < 20. Change the 20 to your new minimum. Then search for wordCount > 30 and change the 30 to your new maximum. Update the error messages right below those math rules to match!
B. Adjusting Image Box Sizes (16:9 Aspect Ratio)
If you want to change the shape of the photo boxes (for example, to a square 1/1 or standard 4/3 ratio), you must change the aspect-ratio code.
Home Page Sliders: Search for .home-card-slider { and change aspect-ratio: 16/9;
Words of Hope / Photo Carousels: Search for .carousel-container { and change aspect-ratio: 16/9;
Vertical Written Reviews: Search for .reviews-vertical-wrapper { and change aspect-ratio: 16/9;
C. Changing Scrolling & Fading Speeds
Home Page Image Fading Speed: Search for }, 3500), delayOffset); Change 3500 to a higher number (slower) or lower number (faster). (1000 = 1 second).
Words of Hope / Review Photo Auto-Scroll: Search for the 4000 millisecond values passed to startAutoPlay in syncAnimations and the carousel controls. Change 4000 to your desired speed (e.g., 5000 for 5 seconds).
Vertical Written Reviews Scroll Speed: Search for }, 35); in syncAnimations. Change 35. (Higher number = Slower scroll. 50 is very slow, 15 is fast).
D. Changing the Extra Add-On Price
If a customer exceeds their included veggies or proteins, they are charged an extra fee.
The Math Logic: Search for const EXTRA_ADDON_PRICE = 7000;. Change 7000 to your new price.
The Display Text: Search for (+7,000 Kip each). Change the text so the customer knows the correct price!
E. Changing Website Colors (Theme)
All the main website colors are stored together at the very top of the CSS file.
Search for: :root { You will see lines of code with "Hex Codes" (like #4ade80). You can use a website like colorpicker.me to find a new Hex Code, and paste it carefully. Do not delete the semicolon ; at the end.
--bg-dark: Main dark background.
--card-bg: The color of the review boxes and menu cards.
--accent-green: The main highlight color used for buttons, active tabs, titles, and stars. Change this if you want the website to be a different primary color.
--text-bright: Color of the main text.
--wa-color: The exact green used for the WhatsApp button.
--msgr-color: The exact blue used for the Messenger button.

📈 PART 10: Google Search Console (SEO & Visibility)
Google Search Console is the tool that tells Google your website exists. It also lets you see exactly how many people are clicking on your website from Google Search, and what words they are typing to find you!
A. How to Check Your Website Traffic:
Log into Google Search Console (using the credentials in Part 1).
Look at the menu on the left and click Performance.
Here, you can see a graph of how many times your website appeared in Google Search, how many people clicked it, and what exact phrases they searched for (like "Vientiane vegan food").
B. Forcing Google to Update (Requesting Indexing): Normally, Google's robots will automatically scan the website every few weeks to check for new prices or new menu items. You do not need to do this section or anything for small daily updates.
However, if you make a MASSIVE change (like completely renaming the restaurant, or changing the main SEO description at the top of the code), you can "force" Google to read the website immediately so the search results update faster.
Log into Google Search Console.
In the gray menu on the left, click the magnifying glass icon for URL Inspection.
Paste the exact website link ([https://oonjai-marketplace.github.io/web/](https://oonjai-marketplace.github.io/web/)) into the search bar at the top of the screen and press Enter.
Click the text button that says REQUEST INDEXING.
Wait a minute for it to test the link, and Google will put you in the priority queue to update your search results within a few days!


💡 Troubleshooting Cheat Sheet
The page is completely white/broken! You probably deleted a quote ", a comma ,, or a bracket } by accident. Look at the last thing you edited and check the punctuation. Paste your backup code to fix it.
A photo isn't loading! Check the Postimages link. It must end in .jpg or .png. If it doesn't, you copied the wrong link from Postimages.
The Add to Cart button isn't working! Check the prices in menuData. Did you put a comma in the number? (e.g. 120,000). Remove the comma so it is 120000.
The website isn't updating after I clicked save! Go back to GitHub and look for the colored dot (See Part 2, Step 4). If it's orange, you just need to wait a few more minutes until it turns green.
Messages aren't going to the Google Sheet! Did you deploy a "New Version" in Google Apps script? Go back to Part 8, Step 2 and make sure you selected "New Version".



🧪 Developer verification (October 2026)

The published site still uses only index.html; no build step is required. Node.js 20 or newer is needed only for the regression tests.

Run `npm ci`, then `npx playwright install chromium`, then `npm test`. The tests serve the local page and intercept external requests: no orders or Words of Hope messages are sent. To test WebKit on a supported machine, install it with `npx playwright install --with-deps webkit` and run `BROWSER=webkit npm test`.

The basket is saved in sessionStorage for the current browser tab and restored after refresh or returning from checkout. Saved carts expire after 24 hours and their prices are recalculated from the current menu. If browser storage is blocked, ordering remains available for the current page visit. Closing the browser tab may clear its saved basket.

Messenger checkout displays the order text and actual clipboard result before enabling a directly tapped m.me chat link on every device. It does not route iPhone users to the Facebook profile page. If native sharing is supported, Share order opens the system share sheet; the customer chooses Messenger if offered and selects the restaurant. Neither flow can guarantee that iOS opens the installed Messenger app or that a message was sent. Manual copy, retry, and recipient instructions remain available. WhatsApp checkout pre-fills the message; the customer still sends it.

Words of Hope uses an external Google Apps Script deployment that is not included in this repository. Its no-cors response cannot confirm whether the spreadsheet saved the submission, so the website keeps the draft and reports that limitation. Confirmed delivery requires a readable response and server-side duplicate protection in that separate service.

Safari release verification (2026-10-16): the browser suite also covers WebKit with iPhone 13, iPhone landscape, and iPhone SE touch profiles. Modal scrolling restores the original page position, touch controls have larger hit areas, and form text remains at least 16px on touch screens. Clipboard timeout/cancellation and share-sheet cancellation preserve the order. Native Messenger installation, iOS app associations, and actual delivery require a physical-device check and are not simulated by WebKit.
