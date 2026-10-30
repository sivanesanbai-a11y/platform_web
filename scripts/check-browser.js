try {
  require('puppeteer');
  console.log('puppeteer installed');
} catch (e) {
  try {
    require('playwright');
    console.log('playwright installed');
  } catch(e2) {
    console.log('neither');
  }
}
