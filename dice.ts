// import {Driver} from "selenium-webdriver/firefox";
import {Builder, Browser, By, Key, until, WebDriver} from 'selenium-webdriver';
// import {Actions} from "selenium-webdriver/lib/input";
import JSSoup from "jssoup";

import * as fs from 'fs';


function sleep(m: number) {
    return new Promise(resolve => setTimeout(resolve, m));
}

function ln() {
    const e:Error = new Error();
    if (!e.stack) try {
        // IE requires the Error to actually be throw or else the Error's 'stack'
        // property is undefined.
        throw e;
    } catch (e) {
        // @ts-ignore
        if (!e.stack) {
            return 0; // IE < 10, likely
        }
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const stack = e.stack.toString().split(/\r\n|\n/);
    // We want our caller's frame. It's index into |stack| depends on the
    // browser and browser version, so we need to search for the second frame:
    const frameRE = /:(\d+):(?:\d+)[^\d]*$/;
    let frame:string | undefined
    // @ts-ignore
    // @ts-ignore
    do {
        frame = stack.shift();
        // @ts-ignore
    } while (!frameRE.exec(frame) && stack.length);
    // @ts-ignore
    return frameRE.exec(stack.shift())[1];
}

function save(map: Map<string, number>, mySet: Iterable<string> | ArrayLike<string>, name: string, searchCount: number, alongCount: number) {
    map.set('searchCount', searchCount);
    map.set('alongCount', alongCount);
    let fd = fs.openSync(`./diceSet.${name}.json`, 'w');
    let buffer = Buffer.from(JSON.stringify(Array.from(mySet)));
    fs.writeSync(fd, buffer, 0, buffer.length, 0);
    fs.close(fd);
    fd = fs.openSync(`./diceCounters.${name}.json`, 'w');
    buffer = Buffer.from(JSON.stringify(Array.from(map.entries())));
    fs.writeSync(fd, buffer, 0, buffer.length, 0);
    fs.close(fd)
}

async function nextPage(driver:WebDriver) {
    await driver.findElement(By.tagName("body")).sendKeys(Key.END);
    // await driver.wait(until.elementLocated(By.className("page-link")), 2000);
    // let buttonNext = await driver.findElements(By.className("page-link"))
    // buttonNext[6].click()
    const li = await driver.wait(until.elementLocated(By.className("pagination-next")), 2000);
    await driver.wait(until.elementIsVisible(li), 2000);
    await sleep(2500)
    try {
        await driver.executeScript("arguments[0].scrollIntoView(true);", li);
        await driver.actions({bridge: true}).move({x: 0, y: 0, origin: li}).click(li).perform();
    } catch (e: unknown) {
        // @ts-ignore
        console.log(`${ln()}  ${e.message}`)
    }
}
interface ExampleObject {
    [key: string]: string
}
function wordReplace(s: string, set:Set<string>) {
    if (set.has(s.toLowerCase().substring(1, s.length-1))) {
        return "_" + s.toLowerCase().substring(1, s.length-1) + "_"
    }
    return s
}
(async function scrapeDice(along = 'javascript|\\Wjs\\W|typescript|angular|react|jquery|\\Wvue\\W ', regexSearch = 'asp\\.net', // separate with |
                           diceSearch = 'asp.net') {

    // const tree = new BTree()
    // const BTree = BTree_.default({maxNodeSize:21});
    // console.log(typeof(BTree))
    // JSON.parse(fs.readFileSync("./diceSet.json").toString())
    // console.log(`lineNumber ${ln()}`)
    // const browsers = [Browser.CHROME, Browser.EDGE, Browser.FIREFOX];
    // const letterColon = '꞉'
    const pipe = '▏'
    const name: string = `${along.replaceAll(' ', '.').replaceAll('|', pipe).replaceAll('\\s', '').
        replaceAll('?', '').replaceAll("\\W", '_')}꞉` +
        `${diceSearch.replaceAll(' ', '.')}`;
    // const browsers: string[] = [Browser.FIREFOX]
    // let browserIndex: number = 0;
    let map = new Map<string, number>([['I', 0], ['J', 0]]);
    const keys:string[] = [...map.keys()]
    for (const key of keys) {
        console.log(key)
    }
    const wordSet = new Set<string>();
    for (const s of regexSearch.split('|')) {
        if (s.substring(0,2) == "\\W" && s.substring(s.length - 2) == "\\W") {
            wordSet.add(s.substring(2, s.length - 2))
        }
        map.set(s.toLowerCase().replaceAll("\\s*", "").replaceAll("\\s", " ").replaceAll("\\.", ".").replaceAll("\\w", "_"), 0);
    }
    let I = 0;
    let J = 0;
    let searchCount = 0;
    let alongCount = 0;
    try {
        map = new Map<string, number>(JSON.parse(fs.readFileSync(`./diceCounters.${name}.json`).toString()));
        // @ts-ignore
        I = map.get('I');
        // @ts-ignore
        J = map.get('J');
        // @ts-ignore
        searchCount = map.get('searchCount');
        // @ts-ignore
        alongCount = map.get('alongCount');
    } catch (e) {
        // @ts-ignore
        console.log(e.message);
    }
    let mySet = new Set<string>();
    try {
        mySet = new Set<string>(JSON.parse(fs.readFileSync(`./diceSet.${name}.json`).toString()));
    } catch (e) {
        // @ts-ignore
        console.log(e.message);
    }

    let countSpan = undefined;
    const patternSearch = new RegExp(`(${regexSearch})`, 'ig')
    const patternAlong = new RegExp(`(${along})`, 'ig')
    let pageCountStr = "X";
    let pageCount = 0;
    let driver: WebDriver;
    let loop = 0;
    let lastPage = 0;
    const dice: ExampleObject = JSON.parse(fs.readFileSync("./dice.json").toString());
    try {
        // eslint-disable-next-line no-constant-condition
        while (true) {
            try {
                driver = await new Builder().forBrowser(Browser.FIREFOX).build();
                if (J >= 50) {
                    J -= 50;
                } else if (I > 0) {
                    I -= 1
                    J += 50
                } else {
                    I = 0
                    J = 0
                }
                await driver.manage().setTimeouts({pageLoad: 12000});
                await driver.get('https://www.dice.com/dashboard/logout');
                const originalWindow = await driver.getWindowHandle();
                //
                await driver.switchTo().newWindow('tab');
                //
                const tabWindow = await driver.getWindowHandle();
                //
                await driver.switchTo().window(originalWindow);
                try {
                    await driver.findElement(By.id('email')).sendKeys(dice.email, Key.TAB);
                    await sleep(1000);
                    await driver.findElement(By.id('password')).sendKeys(dice.password, Key.TAB);
                    await sleep(1000);
                    await driver.findElement(By.xpath("//button[@type='submit']")).click();
                    await sleep(1000);
                    try {
                        await driver.wait(until.elementLocated(By.className('navbar-magnifier')), 5000).click();
                        // eslint-disable-next-line no-empty
                    } catch (e) {

                    }
                    await sleep(1000);
                    await driver.wait(until.elementLocated(By.id('typeaheadInput')), 10000).sendKeys(
                        // regexSearch.replaceAll("\\s*","").replaceAll("\\s","").replaceAll("\\.", ".").
                        //             replaceAll("|", " or "));
                        diceSearch);
                    await sleep(1000);
                    await driver.findElement(By.id('google-location-search')).sendKeys(dice.address, Key.TAB);
                    await sleep(1000);
                    await driver.findElement(By.id('submitSearch-button')).click();
                    await sleep(3000);
                    try {
                        const cancel = await driver.wait(until.elementLocated(By.className('ng-binding')), 4000);
                        await cancel.click()
                        // eslint-disable-next-line no-empty
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
                        // @ts-ignore
                        console.log('set 100 ' + e.message)
                        // e.message = `${ln()} i=${I}  j=${J}`
                    }
                    await sleep(7500);  // wait for page to reload
                    // const ps = await driver.findElement(By.xpath("//*[@id='pageSize_2']/option[@selected='selected']")).getText().then((t =>t));
                    const ps = await driver.findElement(By.css("#pageSize_2>option:checked")).getText().then(t => t);
                    if (ps !== '100') {
                        throw new Error(`i=${I}  j=${J}`);
                    }
                } catch (e) {
                    // await driver.close() // close about:blank
                    // @ts-ignore
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
                const total: number = parseInt(pageCountStr.replaceAll(',', ''));
                lastPage = total % 100;


                pageCount = Math.floor(((parseInt(pageCountStr.replaceAll(',', '')) + 99) / 100))
                console.log(`pageCount ${pageCount}`)
                // I = 1;  // for testing
                if (I > 0) {
                    for (let i = 0; i < I; i++) {
                        await nextPage(driver);
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
                    const html = await driver.findElement(By.tagName('body')).getAttribute('innerHTML').then(t => t);
                    const soup = await new JSSoup(html);
                    /* eslint-disable @typescript-eslint/no-explicit-any */
                    const links: any[] = soup.findAll('a', {class: ['card-title-link', 'bold']});
                    if (links.length < 100 && (links.length !== lastPage || i < pageCount - 1)) {
                        throw new Error(`${ln()} links.length ${links.length}  pageCount ${pageCount}   i=${i} j=0`);
                    }
                    console.log(` links ${links.length}   html length ${html.length}`)
                    if (i < pageCount - 1) {
                        lastPage += 100 - links.length; // sometimes link.length == 101
                    }
                    await driver.switchTo().window(tabWindow);
                    await sleep(4000)
                    let j = J
                    for (const el of links.slice(J)) {
                        j++;
                        for (const key of map.keys()) {
                            process.stdout.write(`${key}: ${map.get(key)}  `);
                        }
                        console.log(`${i}-${j}  ${searchCount}   ${alongCount} `)
                        const elAttr = el.attrs['class']
                        // console.log(`elAttr ${elAttr}`);
                        if (elAttr === "card-title-link bold") {
                            const url = await el.attrs['href']
                            const id = await el.attrs['id']
                            // let hash = await getHash(url).then(h => h);
                            if (mySet.has(id)) {
                                continue;
                            }
                            mySet.add(id)
                            await sleep(1500);
                            const text = await el.getText()
                            // console.log(`inside text ${text}   url ${url}`)
                            let urlCrash = false;
                            try {
                                await driver.getSession()
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
                                const boolMap = new Map<string, boolean>();
                                for (const key of map.keys()) {
                                    boolMap.set(key, false);
                                }
                                let match: string[] | null = text.match(patternSearch)
                                if (match != null) {
                                    for (const m of match) {
                                        boolMap.set(wordReplace(m, wordSet).toLowerCase(), true);
                                    }
                                }
                                const tMatch: string[] | null = textDescription.match(patternSearch);
                                if (tMatch != null) {
                                    for (const m of tMatch) {
                                        boolMap.set(wordReplace(m, wordSet).toLowerCase(), true);
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
                                        boolMap.set(wordReplace(m, wordSet).toLowerCase(), true);
                                    }
                                }
                                const aMatch:string[] | null = textDescription.match(patternAlong);
                                if (aMatch != null) {
                                    for (const m of aMatch) {
                                        boolMap.set(wordReplace(m, wordSet).toLowerCase(), true);
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
                                                //
                                                await driver.get(url);
                                                break;
                                            } catch (e) {
                                                if (getCount > 3) {
                                                    throw e;
                                                }
                                            }
                                        }
                                        await sleep(1000)
                                    } catch (e) {
                                        // @ts-ignore
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

                                    await sleep(1000)
                                    try {
                                        textDescription = await driver.wait(until.elementLocated(By.css('body'))).getText().then(t => t);
                                    } catch (e) {
                                        // @ts-ignore
                                        e.message = `${ln()} i=${i}  j=${j}`;
                                        throw e
                                    }
                                    const sMatch:string[] | null = textDescription.match(patternSearch);
                                    if (!searchFound) {
                                        searchFound = (sMatch != null);
                                        if (searchFound) {
                                            searchCount++;
                                        }
                                    }
                                    const aMatch:string[] | null = textDescription.match(patternAlong);
                                    if (!alongFound) {
                                        alongFound = (aMatch != null);
                                        if (alongFound) {
                                            alongCount++;
                                        }
                                    }
                                    // @ts-ignore
                                    let saMatch:string[] = [];
                                    // @ts-ignore
                                    if (sMatch) {
                                        saMatch = saMatch.concat(sMatch);
                                    }
                                    // @ts-ignore
                                    if (aMatch) {
                                        saMatch = saMatch.concat(aMatch);
                                    }
                                    for (const m of saMatch) {
                                        boolMap.set(wordReplace(m, wordSet).toLowerCase(), true);
                                    }
                                }
                                const keys:string[] = [...map.keys()]
                                for (const key of keys) {
                                    if (boolMap.get(key)) {
                                        // @ts-ignore
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
                            // await driver.wait(until.elementLocated(By.className("pagination-next")),2000).click();
                            await nextPage(driver)
                        }
                    } catch (e) {
                        // @ts-ignore
                        e.message = `$${ln()}  i=${i}  j=${j}`;
                        throw e;

                    }
                }
                I = pageCount;
                J = lastPage;
                break;
            } catch (e) {
                // @ts-ignore
                console.log(e.message);
                // console.log(e.trace);
                // console.log(e.stack)
                try {
                    // @ts-ignore
                    await driver.quit()
                    // eslint-disable-next-line no-empty
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
                // @ts-ignore
                const match: string[] | null = e.message.match(/i=(\d+)\s+j=(\d+)/)
                if (match != null) {
                    I = parseInt(match[1]);
                    J = parseInt(match[2]);
                } // else use old I & J
                map.set('I', I);
                map.set('J', J);
                save(map, mySet, name, searchCount, alongCount)
                // break;

            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            loop++;
        }
    } finally {
        map.set('I', pageCount);
        map.set('J', lastPage);
        save(map, mySet, name, searchCount, alongCount);
        // @ts-ignore
        await driver.quit().then(() => {
            console.log(`quit ${regexSearch}: ${searchCount}   ${along}: ${alongCount}`)
            for (const key of map.keys()) {
                process.stdout.write(`${key}: ${map.get(key)}  `);
            }
            console.log();
            // await sleep(80000)
        });
    }
})()