

(function test() {
    const fs = require('fs');

    const {Builder, Browser, By, Key, until} = require('selenium-webdriver');


    let dice = JSON.parse(fs.readFileSync("./dice.json").toString());
    console.log(dice.address);
    const text = "python xx data science";
    const regexSearch = 'Python|data\\sscience';
    let patternSearch = new RegExp(`(${regexSearch})`, 'ig')
    let match = text.match(patternSearch);
    let map = new Map([['I', 0], ['J',0]]);
    for (const s of regexSearch.split('|')) {
        map.set(s.toLowerCase().replaceAll("\\s*","").replaceAll("\\s"," ").replaceAll("\\.", "."), 0);
    }
    const boolMap = new Map();
    for (const key of map.keys()) {
        boolMap.set(key, false);
    }
    if (match != null) {
        for (const m of match) {
            console.log(m.trim().toLowerCase())
            boolMap.set(m.trim().toLowerCase(), true)
        }
    }
    for (const key of map.keys()) {
        if (boolMap.get(key)) {
            // @ts-ignore
            map.set(key, map.get(key) + 1);
        }
    }
    for (const key of map.keys()) {
        console.log(`${key} ${map.get(key)}`)
    }

    console.log('done')
})()
