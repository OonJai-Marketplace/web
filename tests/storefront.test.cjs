const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const playwright = require('playwright');

let browser, server, baseURL;
before(async () => {
  server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(fs.readFileSync(path.join(__dirname, '../index.html')));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  baseURL = `http://127.0.0.1:${server.address().port}`;
  browser = await playwright[process.env.BROWSER || 'chromium'].launch({
    headless: true,
    ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {})
  });
});
after(async () => {
  await browser?.close();
  await new Promise(resolve => server?.close(resolve));
});

async function visit(t, { mobile = false, device, init, hash = '' } = {}) {
  const context = await browser.newContext({
    viewport: mobile ? { width: 390, height: 844 } : { width: 1366, height: 900 },
    hasTouch: mobile,
    ...(device ? playwright.devices[device] : {}),
    reducedMotion: 'reduce'
  });
  t.after(() => context.close());
  const page = await context.newPage();
  page.setDefaultTimeout(4000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  // Exercise only the local UI. Never send orders or messages to live services.
  await page.route('**/*', route => {
    if (route.request().url().startsWith(baseURL)) return route.continue();
    return route.fulfill({ status: 200, contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"/>' });
  });
  if (init) await page.addInitScript(init);
  await page.goto(baseURL + '/' + hash);
  await page.evaluate(() => document.getElementById('swipeHint').remove());
  return { page, errors };
}

test('all four tabs and eight menu categories render without runtime errors', async t => {
  const { page, errors } = await visit(t);
  for (const tab of ['menu', 'hope', 'review', 'home']) {
    await page.locator(`.nav-tab[data-tab="${tab}"]`).click();
    assert.equal(await page.locator('.tab-pane.active').getAttribute('id'), `tab-${tab}`);
  }
  await page.evaluate(() => App.switchMainTab('menu'));
  for (const [category, count] of Object.entries({ burgers: 5, sandwiches: 5, texmex: 3, pasta: 4, bowl: 4, smoothies: 5, refreshers: 4, wellness: 4 })) {
    await page.locator(`[data-category="${category}"]`).click();
    assert.equal(await page.locator('.product-card').count(), count);
  }
  assert.deepEqual(errors, []);
});

test('custom sauce limit works through the real checkbox event handler', async t => {
  const { page, errors } = await visit(t);
  await page.evaluate(() => App.openCustomModal('bowl', 'bw4'));
  await page.locator('input[name="custSauce"]').nth(0).check();
  await page.locator('input[name="custSauce"]').nth(1).check({ force: true }).catch(() => {});
  assert.deepEqual(errors, []);
  assert.equal(await page.locator('input[name="custSauce"]:checked').count(), 1);
  assert.equal(await page.locator('#notificationModal').isVisible(), true);
});

test('mobile basket is visible and closable from every main tab', async t => {
  const { page } = await visit(t, { mobile: true });
  for (const tab of ['home', 'menu', 'hope', 'review']) {
    await page.evaluate(tab => App.switchMainTab(tab), tab);
    await page.locator('#floatingCartBtn').click();
    assert.equal(await page.locator('#cartSection').isVisible(), true, `basket on ${tab}`);
    await page.locator('.cart-close-btn').click();
    assert.equal(await page.locator('body').evaluate(el => el.classList.contains('modal-open')), false);
  }
});

test('cart survives refresh, including choices, add-on prices, and order type', async t => {
  const { page, errors } = await visit(t);
  await page.evaluate(() => {
    App.switchMainTab('menu');
    App.addMenuItemToCart('burgers', 'b2');
    App.addMenuItemToCart('burgers', 'b2');
    document.querySelector('[name="orderType"][value="Pick-Up"]').click();
    App.openCustomModal('bowl', 'bw4');
    for (const [name, count] of [['custSauce', 1], ['custVeggie', 4], ['custProtein', 2]]) {
      [...document.querySelectorAll(`[name="${name}"]`)].slice(0, count).forEach(el => el.click());
    }
  });
  await page.locator('#customModalSubmitBtn').click();
  await page.locator('#btnNotifProceed').click();
  await page.waitForFunction(() => !document.getElementById('customModal').classList.contains('active'));
  assert.equal(await page.locator('#totalPrice').innerText(), '353,000 Kip');
  await page.reload();
  assert.equal(await page.locator('#totalPrice').innerText(), '353,000 Kip');
  assert.equal(await page.locator('#cartCount').innerText(), '(3 items)');
  assert.equal(await page.locator('[name="orderType"][value="Pick-Up"]').isChecked(), true);
  await page.locator('.cart-item-edit-btn').click();
  assert.equal(await page.locator('[name="custVeggie"]:checked').count(), 4);
  assert.equal(await page.locator('[name="custProtein"]:checked').count(), 2);
  assert.deepEqual(errors, []);
});

test('storage denial does not prevent menu, form, or navigation initialization', async t => {
  const { page, errors } = await visit(t, { init: () => {
    for (const method of ['getItem', 'setItem', 'removeItem']) {
      Storage.prototype[method] = () => { throw new DOMException('Blocked', 'SecurityError'); };
    }
  } });
  await page.locator('.nav-tab[data-tab="menu"]').click();
  assert.equal(await page.locator('.product-card').count(), 5);
  await page.evaluate(() => App.switchMainTab('hope'));
  await page.locator('#message').fill('one two three');
  assert.equal(await page.locator('#wordCounter').innerText(), '3 / 20-30 words');
  assert.deepEqual(errors, []);
});

test('explicit URL tab takes precedence over an earlier saved tab', async t => {
  const { page } = await visit(t, { hash: '#hope', init: () => sessionStorage.setItem('oonjai_active_tab', 'menu') });
  assert.equal(await page.locator('.tab-pane.active').getAttribute('id'), 'tab-hope');
  await page.evaluate(() => { location.hash = '#review'; });
  await page.waitForFunction(() => document.getElementById('tab-review').classList.contains('active'));
});

test('dismissed confirmation settles once and returns focus to customization', async t => {
  const { page } = await visit(t);
  await page.evaluate(() => {
    App.openCustomModal('bowl', 'bw4');
    window.confirmResults = [];
    App.triggerConfirm('Continue?', 'Confirm', value => window.confirmResults.push(value));
  });
  await page.keyboard.press('Escape');
  assert.deepEqual(await page.evaluate(() => window.confirmResults), [false]);
  assert.equal(await page.locator('#customModal').isVisible(), true);
  assert.equal(await page.evaluate(() => !!document.activeElement.closest('#customModal')), true);
});

test('mobile-to-desktop resize clears basket scroll lock', async t => {
  const { page } = await visit(t, { mobile: true });
  await page.evaluate(() => { App.switchMainTab('menu'); App.scrollToBasket(); });
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.waitForFunction(() => !document.body.classList.contains('modal-open'));
});

test('short-screen gallery keeps its close and order controls reachable', async t => {
  const { page } = await visit(t, { mobile: true });
  await page.setViewportSize({ width: 667, height: 375 });
  await page.evaluate(() => App.openGallery('burgers', 'b2'));
  const box = await page.locator('.gallery-modal-box').boundingBox();
  assert.ok(box.y >= 0 && box.y + box.height <= 375, JSON.stringify(box));
  await page.locator('.gallery-close-btn').click({ trial: true });
  await page.locator('#galleryActionContainer button').click();
  assert.equal(await page.locator('#floatingCartBadge').innerText(), '1');
});

test('opaque form response does not claim confirmed receipt or erase the draft', async t => {
  const { page } = await visit(t, { init: () => {
    window.fetch = async () => ({ type: 'opaque', status: 0, ok: false });
  } });
  await page.evaluate(() => App.switchMainTab('hope'));
  const message = 'May you find courage and peace today knowing that every small act of kindness brings hope and light to someone nearby.';
  await page.locator('#message').fill(message);
  await page.locator('#submitBtn').click();
  await page.waitForFunction(() => !document.getElementById('submitBtn').disabled);
  assert.match(await page.locator('#statusMsg').innerText(), /cannot confirm/i);
  assert.equal(await page.locator('#message').inputValue(), message);
});

test('failed clipboard copy leaves a selectable order and never claims success', async t => {
  const { page } = await visit(t, { init: () => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: async () => { throw new Error('denied'); } } });
    document.execCommand = () => false;
  } });
  await page.evaluate(() => {
    App.switchMainTab('menu');
    App.addMenuItemToCart('burgers', 'b2');
    document.querySelector('[name="orderType"]').click();
    App.executeMessenger();
  });
  await page.waitForFunction(() => document.querySelector('#openMessengerLink[href]'));
  assert.match(await page.locator('#messengerOrderText').inputValue(), /The Classic.*120,000 Kip/);
  assert.match(await page.locator('#notifMessage').innerText(), /copy.*manually/i);
  assert.ok(page.url().startsWith(baseURL));
});

test('basket quantities and WhatsApp checkout include exact prices without sending an order', async t => {
  const { page, errors } = await visit(t);
  let checkout;
  await page.route('https://api.whatsapp.com/**', route => {
    checkout = new URL(route.request().url());
    return route.abort();
  });
  await page.evaluate(() => {
    App.switchMainTab('menu');
    App.handleCheckout('wa');
  });
  assert.match(await page.locator('#notifMessage').innerText(), /basket is empty/i);
  await page.evaluate(() => {
    App.closeNotification();
    App.addMenuItemToCart('burgers', 'b2');
    App.addMenuItemToCart('smoothies', 'sm5');
    App.incrementCartItem(0);
    App.decrementCartItem(0);
    App.handleCheckout('wa');
  });
  assert.equal(await page.locator('#totalPrice').innerText(), '190,000 Kip');
  await page.locator('#notifMessage button').filter({ hasText: 'Pick-Up' }).click();
  assert.equal(checkout.searchParams.get('phone'), '8562057048174');
  const message = checkout.searchParams.get('text');
  assert.match(message, /Type: Pick-Up/);
  assert.match(message, /Reese's Cup/);
  assert.match(message, /Total: 190,000 Kip/);
  assert.deepEqual(errors, []);
});

test('custom confirmation cancellation, repeated add clicks, editing, and removal preserve totals', async t => {
  const { page, errors } = await visit(t);
  await page.evaluate(() => {
    App.switchMainTab('menu');
    App.openCustomModal('bowl', 'bw4');
    document.querySelector('[name="custSauce"]').click();
    window.pendingAdd = App.addCustomItemToCart();
    App.addCustomItemToCart();
    App.closeNotification();
  });
  await page.evaluate(() => window.pendingAdd);
  assert.equal(await page.locator('#floatingCartBadge').innerText(), '0');
  await page.locator('#customModalSubmitBtn').click();
  await page.locator('#btnNotifProceed').click();
  await page.waitForFunction(() => document.getElementById('floatingCartBadge').innerText === '1');
  await page.locator('.cart-item-edit-btn').click();
  await page.evaluate(() => {
    [...document.querySelectorAll('[name="custVeggie"]')].slice(0, 4).forEach(el => el.click());
    [...document.querySelectorAll('[name="custProtein"]')].slice(0, 1).forEach(el => el.click());
  });
  await page.locator('#customModalSubmitBtn').click();
  await page.locator('#btnNotifProceed').click();
  await page.waitForFunction(() => document.getElementById('totalPrice').innerText === '106,000 Kip');
  assert.equal(await page.locator('#floatingCartBadge').innerText(), '1');
  await page.evaluate(() => App.decrementCartItem(0));
  assert.equal(await page.locator('#totalPrice').innerText(), '0 Kip');
  assert.deepEqual(errors, []);
});

test('wellness combo choices survive editing without adding a second item', async t => {
  const { page, errors } = await visit(t);
  await page.evaluate(() => {
    App.switchMainTab('menu'); App.openCustomModal('bowl', 'bw1');
    document.querySelector('[name="custWellness"][value="Red Heart"]').click();
    for (const [name, count] of [['custSauce', 2], ['custVeggie', 4], ['custProtein', 2]]) {
      [...document.querySelectorAll(`[name="${name}"]`)].slice(0, count).forEach(el => el.click());
    }
  });
  await page.locator('#customModalSubmitBtn').click();
  await page.locator('.cart-item-edit-btn').click();
  assert.equal(await page.locator('[name="custWellness"]:checked').inputValue(), 'Red Heart');
  await page.locator('[name="custWellness"][value="Heartwarmer"]').check();
  await page.locator('#customModalSubmitBtn').click();
  assert.equal(await page.locator('#totalPrice').innerText(), '160,000 Kip');
  assert.equal(await page.locator('#cartCount').innerText(), '(1 item)');
  assert.match(await page.locator('#cartItems').innerText(), /Heartwarmer/);
  assert.deepEqual(errors, []);
});

test('tampered saved-cart prices and markup are rebuilt from the menu', async t => {
  const { page, errors } = await visit(t, { init: () => sessionStorage.setItem('oonjai_cart_v1', JSON.stringify({
    savedAt: Date.now(), items: [
      { id: 'b2', category: 'burgers', qty: 2, price: 1, name: '<img onerror="alert(1)">', subtext: '<script>bad</script>' },
      { id: 'bw4', category: 'bowl', qty: 1, choices: { sauces: ['not a sauce'], veggies: [], proteins: [] } },
      { id: 'b3', category: 'burgers', qty: -1 }
    ]
  })) });
  assert.equal(await page.locator('#floatingCartBadge').innerText(), '2');
  assert.equal(await page.locator('#totalPrice').innerText(), '240,000 Kip');
  assert.equal(await page.locator('#cartItems img, #cartItems script').count(), 0);
  assert.deepEqual(errors, []);
});

test('invalid and expired saved carts do not break startup', async t => {
  const { page, errors } = await visit(t, { init: () => sessionStorage.setItem('oonjai_cart_v1', '{broken') });
  assert.equal(await page.locator('#floatingCartBadge').innerText(), '0');
  const expired = await visit(t, { init: () => sessionStorage.setItem('oonjai_cart_v1', JSON.stringify({
    savedAt: Date.now() - 86400001, items: [{ id: 'b2', category: 'burgers', qty: 2 }]
  })) });
  assert.equal(await expired.page.locator('#floatingCartBadge').innerText(), '0');
  assert.deepEqual([...errors, ...expired.errors], []);
});

test('form validates length, times out, and prevents concurrent duplicate submissions', async t => {
  const { page } = await visit(t, { init: () => {
    window.fetchCount = 0;
    window.fetch = (url, options) => {
      window.fetchCount++;
      return new Promise((resolve, reject) => options.signal.addEventListener('abort', () => reject(new DOMException('Timed out', 'AbortError'))));
    };
  } });
  await page.clock.install();
  await page.evaluate(() => App.switchMainTab('hope'));
  await page.locator('#message').fill('too short');
  await page.locator('#submitBtn').click();
  assert.equal(await page.evaluate(() => window.fetchCount), 0);
  await page.locator('#message').fill(Array(31).fill('hope').join(' '));
  await page.locator('#submitBtn').click();
  assert.equal(await page.evaluate(() => window.fetchCount), 0);
  await page.locator('#message').fill(Array(20).fill('hope').join(' '));
  await page.locator('#submitBtn').click();
  await page.evaluate(() => document.getElementById('customForm').dispatchEvent(new Event('submit', { cancelable: true })));
  assert.equal(await page.evaluate(() => window.fetchCount), 1);
  await page.clock.fastForward(20001);
  assert.match(await page.locator('#statusMsg').innerText(), /timed out/i);
  assert.equal(await page.locator('#submitBtn').isDisabled(), false);
  assert.equal((await page.locator('#message').inputValue()).split(' ').length, 20);
});

test('Messenger waits for copying and gives iPad a direct native conversation link', async t => {
  const { page } = await visit(t, { init: () => {
    Object.defineProperty(navigator, 'userAgent', { value: 'iPad' });
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: text => {
      window.copiedText = text;
      return new Promise(resolve => { window.resolveCopy = resolve; });
    } } });
  } });
  await page.evaluate(() => {
    App.addMenuItemToCart('burgers', 'b2');
    document.querySelector('[name="orderType"]').checked = true;
    App.executeMessenger();
  });
  assert.match(await page.locator('#copyOrderStatus').innerText(), /Copying/);
  await page.evaluate(() => window.resolveCopy());
  assert.match(await page.locator('#copyOrderStatus').innerText(), /Order copied/);
  assert.equal(await page.locator('#notifMessage a').getAttribute('href'), 'https://m.me/oon.jai.laos');
  assert.equal(await page.locator('#notifMessage a').getAttribute('target'), '_self');
  assert.equal(await page.locator('#notifMessage a').getAttribute('onclick'), null);
  assert.match(await page.evaluate(() => window.copiedText), /120,000 Kip/);
});

test('carousels start at the first real image and support previous, next, and dots', async t => {
  const { page } = await visit(t);
  await page.evaluate(() => App.switchMainTab('hope'));
  assert.equal(await page.locator('#hopeCarouselTrack').evaluate(el => el.scrollLeft), 0);
  await page.locator('#hopeCarouselDots button').nth(2).click();
  await page.waitForFunction(() => Math.round(document.getElementById('hopeCarouselTrack').scrollLeft / document.getElementById('hopeCarouselTrack').clientWidth) === 2);
  await page.evaluate(() => App.goToSlide('hopeCarouselTrack', 0));
  await page.waitForFunction(() => document.getElementById('hopeCarouselTrack').scrollLeft === 0);
  await page.evaluate(() => App.scrollCarousel('hopeCarouselTrack', -1));
  await page.waitForFunction(() => Math.round(document.getElementById('hopeCarouselTrack').scrollLeft / document.getElementById('hopeCarouselTrack').clientWidth) === 9);
  await page.evaluate(() => App.scrollCarousel('hopeCarouselTrack', 1));
  await page.waitForFunction(() => document.getElementById('hopeCarouselTrack').scrollLeft === 0);
});

test('keyboard navigation, browser Back, and modal focus stay usable', async t => {
  const { page } = await visit(t);
  await page.locator('#nav-home').focus();
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('.tab-pane.active').getAttribute('id'), 'tab-menu');
  await page.locator('#nav-hope').click();
  await page.goBack();
  assert.equal(await page.locator('.tab-pane.active').getAttribute('id'), 'tab-menu');
  await page.locator('.product-image').first().focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('#galleryModal').isVisible(), true);
  await page.keyboard.press('Shift+Tab');
  assert.equal(await page.evaluate(() => !!document.activeElement.closest('#galleryModal')), true);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#galleryModal').isVisible(), false);
  assert.equal(await page.evaluate(() => document.activeElement.matches('.product-image')), true);
});

test('phone, tablet, and desktop layouts fit the viewport on all tabs', async t => {
  const { page, errors } = await visit(t);
  for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1024, height: 768 }, { width: 1366, height: 900 }]) {
    await page.setViewportSize(viewport);
    for (const tab of ['home', 'menu', 'hope', 'review']) {
      await page.evaluate(tab => App.switchMainTab(tab), tab);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${tab} at ${viewport.width}px`);
    }
  }
  assert.deepEqual(errors, []);
});

test('iPhone retains the reading position after opening and closing nested dialogs', async t => {
  const { page, errors } = await visit(t, { device: 'iPhone 13' });
  await page.evaluate(() => { App.switchMainTab('menu'); window.scrollTo(0, 600); });
  const before = await page.evaluate(() => scrollY);
  assert.ok(before > 300);
  await page.locator('#floatingCartBtn').tap();
  await page.evaluate(() => App.handleCheckout('wa'));
  await page.locator('#notifAlertAction button').tap();
  await page.locator('.cart-close-btn').tap();
  assert.equal(await page.evaluate(() => scrollY), before);
  assert.deepEqual(errors, []);
});

test('iPhone touch checkout and customization work in portrait and landscape', async t => {
  for (const device of ['iPhone 13', 'iPhone 13 landscape', 'iPhone SE']) {
    const { page, errors } = await visit(t, { device });
    await page.locator('.bottom-nav-tab[data-tab="menu"]').tap();
    await page.locator('[data-category="bowl"]').tap();
    await page.locator('.product-card').filter({ hasText: 'Mini Pack' }).locator('button').tap();
    await page.locator('[name="custSauce"]').first().tap();
    await page.locator('[name="custVeggie"]').first().tap();
    await page.locator('[name="custProtein"]').first().tap();
    await page.locator('#customModalSubmitBtn').tap();
    await page.locator('#btnNotifProceed').tap();
    await page.locator('#floatingCartBtn').tap();
    await page.locator('#cartSection .btn-msgr').tap();
    await page.locator('#notifMessage button').filter({ hasText: 'Pick-Up' }).tap();
    await page.waitForFunction(() => document.querySelector('#openMessengerLink[href]'));
    assert.match(await page.locator('#messengerOrderText').inputValue(), /Mini Pack.*99,000 Kip/);
    assert.equal(await page.locator('#notifMessage a').getAttribute('href'), 'https://m.me/oon.jai.laos');
    assert.deepEqual(errors, [], device);
  }
});

test('touch-screen form text and modal controls are large enough to use without zoom', async t => {
  const { page } = await visit(t, { device: 'iPhone 13' });
  await page.locator('.bottom-nav-tab[data-tab="hope"]').tap();
  for (const selector of ['#message', '#name']) {
    assert.ok(await page.locator(selector).evaluate(el => parseFloat(getComputedStyle(el).fontSize) >= 16), selector);
  }
  await page.evaluate(() => App.openCustomModal('bowl', 'bw4'));
  assert.ok((await page.locator('.option-label').first().boundingBox()).height >= 44);
});

test('native share receives exact order text from a fresh tap without claiming delivery', async t => {
  const { page, errors } = await visit(t, { device: 'iPhone 13', init: () => {
    navigator.canShare = () => true;
    navigator.share = async data => { window.sharedOrder = data; window.shareActivation = navigator.userActivation.isActive; };
  } });
  await page.evaluate(() => {
    App.addMenuItemToCart('burgers', 'b2');
    document.querySelector('[name="orderType"]').checked = true;
    App.executeMessenger();
  });
  await page.locator('#shareOrderBtn').tap();
  assert.equal(await page.evaluate(() => window.shareActivation), true);
  assert.deepEqual(await page.evaluate(() => window.sharedOrder), { text: await page.locator('#messengerOrderText').inputValue() });
  assert.match(await page.locator('#shareOrderStatus').innerText(), /confirm that you sent/);
  assert.equal(await page.locator('#floatingCartBadge').innerText(), '1');
  assert.deepEqual(errors, []);
});

test('canceled or unavailable native sharing preserves the basket and manual copy', async t => {
  const { page, errors } = await visit(t, { device: 'iPhone 13', init: () => {
    navigator.canShare = () => true;
    navigator.share = async () => { throw new DOMException('Canceled', 'AbortError'); };
  } });
  await page.evaluate(() => {
    App.addMenuItemToCart('burgers', 'b2');
    document.querySelector('[name="orderType"]').checked = true;
    App.executeMessenger();
  });
  await page.locator('#shareOrderBtn').tap();
  assert.match(await page.locator('#shareOrderStatus').innerText(), /canceled/i);
  assert.match(await page.locator('#messengerOrderText').inputValue(), /120,000 Kip/);
  await page.evaluate(() => { navigator.canShare = () => false; App.executeMessenger(); });
  assert.equal(await page.locator('#shareOrderOption').isVisible(), false);
  assert.equal(await page.locator('#floatingCartBadge').innerText(), '1');
  assert.deepEqual(errors, []);
});

test('a stalled clipboard request releases the direct-chat link and manual copy', async t => {
  const { page } = await visit(t, { device: 'iPhone 13', init: () => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => new Promise(() => {}) } });
    document.execCommand = () => false;
  } });
  await page.clock.install();
  await page.evaluate(() => {
    App.addMenuItemToCart('burgers', 'b2');
    document.querySelector('[name="orderType"]').checked = true;
    App.executeMessenger();
  });
  assert.equal(await page.locator('#openMessengerLink').getAttribute('href'), null);
  await page.clock.fastForward(4001);
  assert.equal(await page.locator('#openMessengerLink').getAttribute('href'), 'https://m.me/oon.jai.laos');
  assert.equal(await page.locator('#copyOrderBtn').isDisabled(), false);
  assert.match(await page.locator('#copyOrderStatus').innerText(), /copy.*manually/i);
});
