# Known issues
## Bugs
- When joining a non-existent chat, an error happens
- `abusefilter` and `ccui` extensions aren't compatible with the rest of the codebase
- Fix emoticon issue by probably loading MediaWiki messages through meta=allmessages. That will also fix some i18n issues
- Make notifications not display for scrollback messages

## Code issues
- Function names aren't standard (camelCase vs. snake_case, Monch probably preferred the first because I think he's used to work with Python)
- Not everything that can be converted into an extension is an extension
- Use `let` instead of `var`, possibly?
- Generally use ES6 features a bit more such as Promises, arrow functions, `let`, template literals etc.
- JSDoc (if I ever learn how to use it properly)
