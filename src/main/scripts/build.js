/*
Copyright (c) 2020, Hollywood Professional Association
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

const hb = require('handlebars');
const fs = require('fs');
const path = require('path');
const proc = require('child_process');

const SF_DATA_PATH = "src/main/data/soundfield-groups.json";
const AC_DATA_PATH = "src/main/data/audio-channels.json";
const TEMPLATE_PATH = "src/main/templates/ac-sf.hbs";
const BUILD_PATH = "build";
const PAGE_SITE_PATH = "index.html";

/* ul to symbol map */

let ch_ul_symbol_map = {
  "urn:smpte:ul:060e2b34.0401010d.03020101.00000000" : "L",
  "urn:smpte:ul:060e2b34.0401010d.03020102.00000000" : "R",
  "urn:smpte:ul:060e2b34.0401010d.03020103.00000000" : "C",
  "urn:smpte:ul:060e2b34.0401010d.03020104.00000000" : "LFE",
  "urn:smpte:ul:060e2b34.0401010d.03020105.00000000" : "Ls",
  "urn:smpte:ul:060e2b34.0401010d.03020106.00000000" : "Rs",
  "urn:smpte:ul:060e2b34.0401010d.03020107.00000000" : "Lss",
  "urn:smpte:ul:060e2b34.0401010d.03020108.00000000" : "Rss",
  "urn:smpte:ul:060e2b34.0401010d.03020109.00000000" : "Lrs",
  "urn:smpte:ul:060e2b34.0401010d.0302010A.00000000" : "Rrs",
  };


/* instantiate template */

let template = hb.compile(
  fs.readFileSync(
    TEMPLATE_PATH,
    'utf8'
  )
);

if (!template) {
  throw "Cannot load HTML template";
}

/* load and validate the audio channels registry */

let ac_registry = JSON.parse(
  fs.readFileSync(
    AC_DATA_PATH
  )
);

if (!ac_registry) {
  throw "Cannot load audio channels registry";
}

/* create the audio channels MCA Tag Symbol */

for (let i = 0; i < ac_registry.length; i++) {
  ac_registry[i]["mca-tag-symbol"] = "ch" + ac_registry[i]["symbol"];
  ch_ul_symbol_map[ac_registry[i]["ul"]] = ac_registry[i]["symbol"];
}

/* load and validate the soundfield group registry */

let sf_registry = JSON.parse(
  fs.readFileSync(
    SF_DATA_PATH
  )
);

if (!sf_registry) {
  throw "Cannot load soundfield group registry";
}

/* process the soundfield groups */

for (let i = 0; i < sf_registry.length; i++) {
  sf_registry[i]["mca-tag-symbol"] = "sg" + sf_registry[i].symbol;

  sf_registry[i]["audio-channels-with-symbols"] =
    sf_registry[i]["audio-channels"].map(
      function(x) {
        return {"ul" : x, "symbol" : ch_ul_symbol_map[x]};
      }
    );
}

/* get the version field */

let version = "Unknown version"

try {
  version = proc.execSync('git rev-parse HEAD').toString().trim();
} catch (e) {
}

/* create build directory */

fs.mkdirSync(BUILD_PATH, { recursive: true });

/* apply template */

var html = template({
  "version" : version,
  "audio-channels" : ac_registry,
  "soundfield-groups" : sf_registry,
  "date" :  new Date(),
});

/* write HTML file */

fs.writeFileSync(path.join(BUILD_PATH, PAGE_SITE_PATH), html, 'utf8');

