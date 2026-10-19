import assert from "node:assert/strict";
import { chromium } from "playwright";

const base=process.env.ORDERKING_PREVIEW_URL;
assert.ok(base?.startsWith("https://"),"Set ORDERKING_PREVIEW_URL to deployed preview.");
const browser=await chromium.launch({channel:"msedge",headless:true});
const results={base,checkedAt:new Date().toISOString(),tests:[]};
try{
  for(const viewport of [{width:390,height:844},{width:1536,height:864}]){
    const page=await browser.newPage({viewport});
    const pageErrors=[];
    page.on("pageerror",(e)=>pageErrors.push(e.message));
    await page.goto(base,{waitUntil:"domcontentloaded",timeout:45000});
    const tabs=page.getByTestId("customer-bottom-nav");
    await tabs.waitFor({timeout:30000});
    const labels=await tabs.locator("a").allTextContents();
    assert.deepEqual(labels.map(x=>x.trim()),["OrderKing","KingPay","ORDERS"]);
    const start=await page.evaluate(()=>{
      const el=document.querySelector('[data-testid="customer-bottom-nav"]')?.closest("nav");
      const bounds=el?.getBoundingClientRect();
      return {position:el?getComputedStyle(el).position:null,offset:bounds?innerHeight-bounds.bottom:null,scrollWidth:document.documentElement.scrollWidth,width:innerWidth,oldNav:document.body.innerText.includes("Orders & Passes")};
    });
    assert.equal(start.position,"fixed");
    assert.equal(start.scrollWidth,start.width,"Horizontal viewport overflow");
    await page.evaluate(()=>window.scrollTo(0,Math.max(400,document.documentElement.scrollHeight-innerHeight)));
    await page.waitForTimeout(300);
    const after=await page.evaluate(()=>{
      const el=document.querySelector('[data-testid="customer-bottom-nav"]')?.closest("nav");
      const r=el?.getBoundingClientRect();return r?innerHeight-r.bottom:null;
    });
    assert.ok(Math.abs(after-start.offset)<2,"Bottom dock moved on scroll");
    await tabs.getByRole("link",{name:"KingPay"}).click();
    await page.waitForURL(/\/kingpay\/?$/,{timeout:30000});
    assert.equal((await page.getByTestId("customer-bottom-nav").locator("a").last().innerText()).trim(),"HISTORY");
    await page.getByTestId("customer-bottom-nav").getByRole("link",{name:"HISTORY"}).click();
    await page.waitForURL(/\/kingpay\/passbook\/?$/,{timeout:30000});
    await page.getByTestId("customer-bottom-nav").getByRole("link",{name:"OrderKing"}).click();
    await page.waitForURL(/\/$/,{timeout:30000});
    assert.equal((await page.getByTestId("customer-bottom-nav").locator("a").last().innerText()).trim(),"ORDERS");
    await page.getByTestId("customer-bottom-nav").getByRole("link",{name:"ORDERS"}).click();
    await page.waitForURL(/\/orders\/?$/,{timeout:30000});
    const body=await page.locator("body").innerText();
    assert.ok(!body.includes("Travel passes"),"Orders page mixes travel");
    assert.ok(!body.includes("Jobs & learning"),"Orders page mixes jobs");
    assert.ok(body.includes("My cart"),"Orders page lacks food cart");
    assert.equal(pageErrors.length,0,"Page JS errors "+pageErrors.join(";"));
    results.tests.push({viewport,pass:true});
    await page.close();
  }
}catch(error){results.error=String(error);process.exitCode=1}
finally{await browser.close();console.log(JSON.stringify(results,null,2))}
