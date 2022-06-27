const {Builder, Browser, By, Key, until} = require('selenium-webdriver');
const {Actions} = require("selenium-webdriver/lib/input");
const JSSoup = require('jssoup').default;
// const btree = require("./btree.js");
// const crypto = require('crypto')
const crypto = require('crypto').webcrypto;
const BTree_ = require('sorted-btree')
const fs = require('fs');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getHash(str, algo = "SHA-256") {
    let strBuf = new TextEncoder().encode(str);
    return crypto.subtle.digest(algo, strBuf)
        .then(hash => {
            // window.hash = hash;
            // here hash is an arrayBuffer,
            // so we'll connvert it to its hex version
            let result = '';
            const view = new DataView(hash);
            for (let i = 0; i < hash.byteLength; i += 4) {
                result += ('00000000' + view.getUint32(i).toString(16)).slice(-8);
            }
            return result;
        });
}

function ln() {
    const e = new Error();
    if (!e.stack) try {
        // IE requires the Error to actually be throw or else the Error's 'stack'
        // property is undefined.
        throw e;
    } catch (e) {
        if (!e.stack) {
            return 0; // IE < 10, likely
        }
    }
    const stack = e.stack.toString().split(/\r\n|\n/);
    // We want our caller's frame. It's index into |stack| depends on the
    // browser and browser version, so we need to search for the second frame:
    const frameRE = /:(\d+):(?:\d+)[^\d]*$/;
    let frame = null;
    do {
        frame = stack.shift();
    } while (!frameRE.exec(frame) && stack.length);
    return frameRE.exec(stack.shift())[1];
}

(async function example(along = 'RUBY|ROR',
                        search = 'ASP\\s*\\.net|node|JavaScript|TypeScript|React|Angular|jquery|\\sJS\\s|\\sVue\\s') {
    // const tree = new BTree()
    // const BTree = BTree_.default({maxNodeSize:21});
    // console.log(typeof(BTree))
    // JSON.parse(fs.readFileSync("./diceSet.json").toString())
    // console.log(`lineNumber ${ln()}`)
    // const browsers = [Browser.CHROME, Browser.EDGE, Browser.FIREFOX];
    const browsers = [Browser.FIREFOX]
    let browserIndex = 0;
    let map = new Map([['I', 0], ['J',0]]);
    for (const s of search.split('|')) {
        map.set(s.toLowerCase().replaceAll("\\s*","").replaceAll("\\s","").replaceAll("\\.", "."), 0);
    }
    let I = 0;
    let J = 0;
    let searchCount = 0;
    let alongCount = 0;
    try {
        map = new Map(JSON.parse(fs.readFileSync("./diceCounters.json").toString()));
        I = map.get('I');
        J = map.get('J');
        searchCount  = map.get('searchCount');
        alongCount = map.get('alongCount');
    }
    catch (e) {
       console.log(e.message);
    }
    let mySet = new Set();
    try {
        mySet = new Set(JSON.parse(fs.readFileSync("./diceSet.json").toString()));
    } catch (e) {
        console.log(e.message);
    }

    let countSpan = undefined;
    let myRe = /((\d+,)?\d+)/
    let patternSearch = new RegExp(`(${search})`, 'ig')
    let patternAlong = new RegExp(`(${along})`, 'ig')
    let pageCountStr = "X";
    let pageCount = 0;
    let driver = null;
    let loop = 0
    let lastPage = 0;
    try {
        while (true) {
            try {
                driver = await new Builder().forBrowser(browsers[browserIndex++ % browsers.length]).build();
                if (J >= 50) {
                    J -= 50;
                } else if (I > 0) {
                    I -= 1
                    J += 50
                } else {
                    I = 0
                    J = 0
                }
                await driver.manage().setTimeouts({pageLoad:200000});
                await driver.get('https://www.dice.com/dashboard/logout');
                let originalWindow = await driver.getWindowHandle();
                await driver.switchTo().newWindow('tab');
                let tabWindow = await driver.getWindowHandle();
                await driver.switchTo().window(originalWindow);
                try {
                    await driver.findElement(By.id('email')).sendKeys('mark.c.oliver@gmail.com', Key.TAB);
                    await sleep(1000);
                    await driver.findElement(By.id('password')).sendKeys('Mco75271', Key.TAB);
                    await sleep(1000);
                    await driver.findElement(By.xpath("//button[@type='submit']")).click();
                    await sleep(1000);
                    try {
                        await driver.wait(until.elementLocated(By.className('navbar-magnifier')), 5000).click();
                    } catch (e) {

                    }
                    await sleep(1000);
                    await driver.wait(until.elementLocated(By.id('typeaheadInput')), 10000).sendKeys(
                        // search.replaceAll("|", " or ").replaceAll('\\s', ''));
                    search.replaceAll("\\s*","").replaceAll("\\s","").replaceAll("\\.", ".").
                                replaceAll("|", " or "));
                    await sleep(1000);
                    await driver.findElement(By.id('google-location-search')).sendKeys("Miami, FL 33199, USA", Key.TAB);
                    await sleep(1000);
                    await driver.findElement(By.id('submitSearch-button')).click();
                    await sleep(3000);
                    try {
                        const cancel = await driver.wait(until.elementLocated(By.className('ng-binding')), 4000);
                        cancel.click()
                    } catch (e) {
                    }
                    await driver.findElement(By.tagName("body")).sendKeys(Key.END);
                    await sleep(1000);
                    const xPath1 = `//*[@id="pageSize_2"]`;
                    const select1 = await driver.wait(until.elementLocated(By.xpath(xPath1)), 2000);
                    try {
                        await driver.actions({bridge: true}).move({
                            x: 0,
                            y: 0,
                            origin: select1
                        }).click(select1).sendKeys("1").click(select1).perform();
                    } catch (e) {
                        console.log('set 100 ' + e.message)
                        // e.message = `${ln()} i=${I}  j=${J}`
                    }
                    await sleep(7500);  // wait for page to reload
                    // const ps = await driver.findElement(By.xpath("//*[@id='pageSize_2']/option[@selected='selected']")).getText().then((t =>t));
                    let ps = await driver.findElement(By.css("#pageSize_2>option:checked")).getText().then(t => t);
                    if (ps !== '100') {
                        throw new Error(`i=${I}  j=${J}`);
                    }
                } catch (e) {
                    // await driver.close() // close about:blank
                    e.message = `${ln()}  i=${I}  j=${J}`;  // no i or j here
                    throw e;

                }
                // var currentURL = await driver.getCurrentUrl().then(c => c);
                try {
                    countSpan = await driver.wait(until.elementLocated(By.className("mobile-job-count-header")), 1000);
                    // console.log('first try countSpan ' + typeof(countSpan));
                } catch (error) {
                    // countSpan = await driver.findElement(By.id('totalJobCount'))
                    // console.log('catch countSpan ' + countSpan);
                }
                pageCountStr = (countSpan === undefined) ? '' : await countSpan.getText().then(t => t);
                if (countSpan === undefined || pageCountStr.length === 0 || pageCountStr === 'X') {
                    countSpan = await driver.wait(until.elementLocated(By.id('totalJobCount')), 1000);
                    pageCountStr = await countSpan.getText().then(t => t);
                }
                // console.log(`countSpan:  ${Object.keys(countSpan)}`)
                if (pageCountStr == 'X') {
                    // countSpan = driver.findElement(By.className("mobile-job-count-header"))
                    // // console.log(`countSpan.length ${countSpan.length}`)
                    // countSpan.getText().then(t => console.log(`|shit ${t}|`));
                    pageCountStr = "585";
                }
                console.log(`total count ${pageCountStr}`);
                const total = parseInt(pageCountStr.replaceAll(',', ''));
                lastPage = total % 100;


                pageCount = Math.floor(((parseInt(pageCountStr.replaceAll(',', '')) + 99) / 100))
                console.log(`pageCount ${pageCount}`)
                // I = 1;  // for testing
                if (I > 0) {
                    for (let i = 0; i < I; i++) {
                        await driver.findElement(By.tagName("body")).sendKeys(Key.END);
                        // await driver.wait(until.elementLocated(By.className("page-item")), 2000);
                        // let buttonNext = await driver.findElements(By.className("page-link"))
                        const li = await driver.wait(until.elementLocated(By.className("pagination-next")), 2000);
                        const isVisible = await driver.wait(until.elementIsVisible(li), 2000);
                        await sleep(2500)
                        try {
                            // await driver.manage().window().scrollBy(0,li.getRect().then(r => r.y))
                            await driver.executeScript("arguments[0].scrollIntoView(true);", li);
                            await driver.actions({bridge: true}).move({x: 0, y: 0, origin: li}).click(li).perform();
                        } catch (e) {
                            console.log(`page increment failed isVisible ${isVisible}    ${ln()} i=${I}  j=${J}`);
                        }
                        // buttonNext[6].click()
                    }
                    // await driver.findElement(By.tagName("body")).sendKeys(Key.HOME)
                }
                for (let i = I; i < pageCount; i++) {
                    if (i % 20 == 0) {
                        console.log();
                    }
                    process.stdout.write(`${i} `)
                    await driver.wait(until.elementLocated(By.id('jobAlertSaveButton')), 4000)
                    await sleep(4000)
                    let html = await driver.findElement(By.tagName('body')).getAttribute('innerHTML').then(t => t);
                    let soup = await new JSSoup(html);
                    let links = soup.findAll('a', {class: ['card-title-link', 'bold']});
                    if (links.length < 100 && (links.length !== lastPage || i < pageCount - 1)) {
                        throw new Error(`${ln()} links.length ${links.length}  pageCount ${pageCount}   i=${i}  j=${j}`);
                    }
                    console.log(` links ${links.length}   html length ${html.length}`)
                    await driver.switchTo().window(tabWindow);
                    await sleep(4000)
                    let j = J
                    for (const el of links.slice(J)) {
                        j++;
                        for (const key of map.keys()) {
                            process.stdout.write(`${key}: ${map.get(key)}  `);
                        }
                        console.log(`${i}-${j}  ${searchCount}   ${alongCount} `)
                        let elAttr = el.attrs['class']
                        // console.log(`elAttr ${elAttr}`);
                        if (elAttr === "card-title-link bold") {
                            let url = await el.attrs['href']
                            let id = await el.attrs['id']
                            // let hash = await getHash(url).then(h => h);
                            if (mySet.has(id)) {
                                continue;
                            }
                            mySet.add(id)
                            await sleep(3000);
                            let text = await el.getText()
                            // console.log(`inside text ${text}   url ${url}`)
                            let urlCrash = false;
                            try {
                                driver.getSession(s => s)
                            } catch (e) {
                                urlCrash = true;
                            }
                            if (!driver || urlCrash) {
                                // await sleep(2000)
                                // await driver.switchTo().newWindow('tab');
                                // tabWindow = await driver.getWindowHandle();
                                // urlCrash = true;
                                // console.log(`url ${url} crashed !driver`)
                                throw new Error(`${ln()}  i=${i}  j=${j}`);
                            } else {
                                let textDescription = el.parent.parent.getText();
                                // let textDescription = el.parent().parent().getText().then(t => t);
                                let searchFound = false;
                                let alongFound = false;
                                const boolMap = new Map();
                                for (const key of map.keys()) {
                                    boolMap.set(key, false);
                                }
                                let match = text.match(patternSearch)
                                if (match != null) {
                                    for (const m of match) {
                                        boolMap.set(m.trim().toLowerCase(), true);
                                    }
                                }
                                let tMatch = textDescription.match(patternSearch);
                                if (tMatch != null) {
                                    for (const m of tMatch) {
                                        boolMap.set(m.trim().toLowerCase(), true);
                                    }
                                }
                                if (match == null) {
                                    match = tMatch;
                                }
                                if (match != null) {
                                    searchCount++;
                                    searchFound = true
                                }
                                match = text.match(patternAlong)
                                if (match != null) {
                                    for (const m of match) {
                                        boolMap.set(m.trim().toLowerCase(), true);
                                    }
                                }
                                let aMatch = textDescription.match(patternAlong);
                                if (aMatch != null) {
                                    for (const m of aMatch) {
                                        boolMap.set(m.trim().toLowerCase(), true);
                                    }
                                }

                                if (match == null) {
                                    match = aMatch;
                                }
                                if (match != null) {
                                    alongCount++;
                                    alongFound = true
                                }
                                if ((!(searchFound && alongFound && [...boolMap.values()].every(b => b))) && !urlCrash) {
                                    try {
                                        for (let getCount = 0; getCount < 5; getCount++) {
                                            try {
                                                await driver.get(url);
                                                break;
                                            } catch (e) {
                                                if (getCount > 3) {
                                                    throw e;
                                                }
                                            }
                                        }
                                        await sleep(10000)
                                    } catch (e) {
                                        e.message = `${ln()} i=${i}  j=${j}`;
                                        throw e;
                                        // await sleep(2000)
                                        // // driver.close()
                                        // await driver.get('https://www.dice.com/dashboard/logout');
                                        // originalWindow = await driver.getWindowHandle();
                                        // await driver.switchTo().newWindow('tab');
                                        // tabWindow = await driver.getWindowHandle();
                                        // urlCrash = true;
                                        // console.log(`url ${url} crashed`)// await driver.reloadSession()
                                        // // await driver.quit()
                                        // driver = await new Builder().forBrowser(Browser.CHROME).build();

                                    }

                                    await sleep(2000)
                                    try {
                                        textDescription = await driver.wait(until.elementLocated(By.css('body'))).getText().then(t => t);
                                    } catch (e) {
                                        e.message = `${ln()} i=${i}  j=${j}`;
                                        throw e
                                    }
                                    let sMatch = textDescription.match(patternSearch);
                                    if (!searchFound) {
                                        searchFound = (sMatch != null);
                                        if (searchFound) {
                                            searchCount++;
                                        }
                                    }
                                    let aMatch = textDescription.match(patternAlong);
                                    if (!alongFound) {
                                        alongFound = (aMatch != null);
                                        if (alongFound) {
                                            alongCount++;
                                        }
                                    }
                                    for (const m of (sMatch ?? []).concat(aMatch ?? [])) {
                                        boolMap.set(m.trim().toLowerCase(), true);
                                    }
                                }
                                for (const key of map.keys()) {
                                    if (boolMap.get(key)) {
                                        map.set(key, map.get(key) + 1);
                                    }
                                }
                            }
                            // driver.close();
                            // await driver.wait(until.elementLocated(By.id('jobAlertSaveButton')),1000);

                        }
                    }
                    await sleep(2000);
                    try {
                        J = 0
                        await driver.switchTo().window(originalWindow)
                        await sleep(2000);
                        await driver.wait(until.elementLocated(By.id('jobAlertSaveButton')), 4000)
                        if (i < pageCount - 1) {
                            await driver.findElement(By.tagName("body")).sendKeys(Key.END);
                            // await driver.wait(until.elementLocated(By.className("page-link")), 2000);
                            // let buttonNext = await driver.findElements(By.className("page-link"))
                            // buttonNext[6].click()
                            const li = await driver.wait(until.elementLocated(By.className("pagination-next")), 2000);
                            const isVisible = await driver.wait(until.elementIsVisible(li), 2000);
                            await sleep(2500)
                            try {
                                await driver.executeScript("arguments[0].scrollIntoView(true);", li);
                                await driver.actions({bridge: true}).move({x: 0, y: 0, origin: li}).click(li).perform();
                            } catch (e) {
                                console.log(`${ln()}  ${e.message}`)
                            }
                            // await driver.wait(until.elementLocated(By.className("pagination-next")),2000).click();

                        }
                    } catch (e) {
                        e.message = `$${ln()}  i=${i}  j=${j}`;
                        throw e;

                    }
                }
                I = pageCount;
                J = lastPage;
                break;
            } catch (e) {
                console.log(e.message);
                // console.log(e.trace);
                // console.log(e.stack)
                try {
                    await driver.quit()
                } catch (e) {
                }
                await sleep(2000)
                // await driver.reloadSession()
                // await driver.quit()
                // driver = await new Builder().forBrowser(Browser.CHROME).build();
                // await driver.get('https://www.dice.com/dashboard/logout');
                // originalWindow = await driver.getWindowHandle();
                // await driver.switchTo().newWindow('tab');
                // tabWindow = await driver.getWindowHandle();
                let match = e.message.match(/i=(\d+)\s+j=(\d+)/)
                if (match != null) {
                    I = parseInt(match[1]);
                    J = parseInt(match[2]);
                } // else use old I & J
                map.set('I', I);
                map.set('J', J);
                map.set('searchCount', searchCount);
                map.set('alongCount', alongCount);
                let fd = fs.openSync('./diceSet.json', 'w+');
                let buffer = Buffer.from(JSON.stringify(Array.from(mySet)));
                fs.writeSync(fd, buffer, 0, buffer.length, 0);
                fs.close(fd);
                fd = fs.openSync('./diceCounters.json', 'w+');
                buffer = Buffer.from(JSON.stringify(Array.from(map.entries())));
                fs.writeSync(fd, buffer, 0, buffer.length, 0);
                fs.close(fd)
                // break;

            }
            loop++;
        }
    } finally {
        map.set('I', pageCount);
        map.set('J', lastPage);
        map.set('searchCount', searchCount);
        map.set('alongCount', alongCount);
        let fd = fs.openSync('./diceSet.json', 'w+');
        let buffer = Buffer.from(JSON.stringify(Array.from(mySet)));
        fs.writeSync(fd, buffer, 0, buffer.length, 0);
        fs.close(fd);
        fd = fs.openSync('./diceCounters.json', 'w+');
        buffer = Buffer.from(JSON.stringify(Array.from(map.entries())));
        fs.writeSync(fd, buffer, 0, buffer.length, 0);
        fs.close(fd)
        await driver.quit().then(() => {
            console.log(`quit ${search}: ${searchCount}   ${along}: ${alongCount}`)
            for (const key of map.keys()) {
                process.stdout.write(`${key}: ${map.get(key)}  `);
            }
            console.log();
        // await sleep(80000)
        });
    }
})()