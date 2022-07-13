# diceScraper
scrape dice.com
diceCounters.ruby.json used along = 'RUBY|ROR', search = 'ASP\\s*\\.net|node|JavaScript|TypeScript|React|Angular|jquery|\\sJS\\s|\\sVue\\s' as args
diceCounters.AspNet.2.json use along = 'ASP\s*\.net, search = \\sRuby\\s|\\sROR\\s|python|django|\\sNode\\s|JavaScript|TypeScript|React|Angular|jquery|\\sJS\\s|\\sVue\\s'

The along is a regex that is used for pattern matching at dice.com scraping contents but is not searched for at dice.com
The search is the regex used for pattern matching, and also "Or"ed together at dice.com for all the files in older 
runs. In newer runs regexSearch is used for pattern matching and search is used at dice.com.  


In general files are named for their along, for instance Ruby for diceCounters.ruby.json.    
If the dice.com search parameters were an "and" then they are after the along in the name.
The contents of diceCounters.<along>.json show the search parameters.


the diceSet files have all the unique dice.com ids for their searches

To run: 
    npx eslint dice.ts
    tsc .\dice.ts --lib es2021 --target es2021 --module commonjs
and
    support Intellij Idea TypeScript linting and running
a jssoup.d.ts is needed in the root
and another jssoup.d.ts is needed in
node_modules/jssoup/dist/lib with the 
interior "declare"s removed

