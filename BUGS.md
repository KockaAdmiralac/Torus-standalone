# Known issues
## Bugs
- `abusefilter` and `ccui` extensions aren't compatible with the rest of the codebase
- Fix i18n (and emoticon) issues by probably loading MediaWiki messages through meta=allmessages.
- Make notifications not display for scrollback messages
- When a message is entered into a text box in one room it's the same message for every room

## Code issues
- Function names aren't standard (camelCase vs. snake_case, Monch probably preferred the first because I think he's used to work with Python)
- Not everything that can be converted into an extension is an extension
- Use `let` instead of `var`, possibly?
- Generally use ES6 features a bit more such as Promises, arrow functions, `let`, template literals etc.
- JSDoc (if I ever learn how to use it properly)
