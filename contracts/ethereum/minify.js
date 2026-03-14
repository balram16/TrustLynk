const fs = require('fs');
let code = fs.readFileSync('contracts/InsurancePortal.sol', 'utf8');

let counter = 1;
// Replace require(condition, "Message") with require(condition, "E1")
code = code.replace(/require\(([^,]+),\s*"[^"]+"\)/g, (match, p1) => {
    return 'require(' + p1 + ', "E' + (counter++) + '")';
});

fs.writeFileSync('contracts/InsurancePortal.sol', code);
console.log('Contract minified. Replaced ' + (counter - 1) + ' statements.');
