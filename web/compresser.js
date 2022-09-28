const fs = require('fs');                   // file system library for reading and writing files
const zlib = require('zlib');               // compression library

// get a list of files from frontend to be compressed
let files = fs.readdirSync('frontend');
let frontendh = '#pragma once\n\n';

// iterate through each file to compress and convert into uint8_t arrays
files.forEach((fName) => {
    let source = fs.readFileSync(`frontend/${fName}`, null);
    let compressed = zlib.gzipSync(source);

    let converted = '';

    for (let i = 0; i < compressed.length - 1; i++) {
        let hexVal = compressed[i].toString(16);
        converted += ' 0x' + ((hexVal.length == 1) ? '0' : '') + hexVal;
        if (i % 16 < 15) {
            converted += ',';
        }
        else {
            converted += ',\n';
        }
    }
    let hexVal = compressed[compressed.length - 1].toString(16);
    converted += ' 0x' + ((hexVal.length == 1) ? '0' : '') + hexVal;

    let fNameMod = fName.replace(/-|\./g, '_');
    frontendh += `#define ${fNameMod}_gz_len ${compressed.length}\nconst uint8_t ${fNameMod}_gz[] = {\n${converted}\n};\n\n`;
});

fs.writeFileSync('frontend.h', frontendh);
