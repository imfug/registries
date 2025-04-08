/*
Copyright (c) IMF User Group
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

import hbs from "handlebars";
import { readFileSync, mkdirSync, writeFileSync, readdirSync, copyFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const DATA_PATH = "src/main/data/cpl-marker-labels.json";
const TEMPLATE_PATH = "src/main/templates/cpl-marker-labels.hbs";
const BUILD_PATH = "build";
const PAGE_SITE_PATH = "index.html";

/* load the CPL marker labels registry */
const register = JSON.parse(
  readFileSync(
    DATA_PATH
  )
);
if (!register) {
  throw "Cannot load audio channels registry";
}

const scopes = new Map();
for (const entry of register) {
  if (entry.scope === undefined) {
    throw "Missing scope property";
  }
  if (entry.label === undefined) {
    throw "Missing label property";
  }
  if (entry.description === undefined) {
    throw "Missing description property";
  }
  if (entry.authority === undefined) {
    throw "Missing authority property";
  }
  if (entry.seeAlso === undefined) {
    throw "Missing seeAlso property";
  }
  let labels = scopes.get(entry.scope);
  if (labels === undefined) {
    labels = [];
    scopes.set(entry.scope, labels);
  }
  if (labels.some((e) => e.label === entry.label)) {
    throw `Duplicate label: ${entry.scope} ${entry.label}`;
  }
  labels.push(entry);

}


/* get the version field */
let version = "Unknown version"
try {
  version = execSync('git rev-parse HEAD').toString().trim();
} catch (e) {
}

/* create build directory */
mkdirSync(BUILD_PATH, { recursive: true });

/* generate and write HTML page */
const template = hbs.compile(
  readFileSync(
    TEMPLATE_PATH,
    'utf8'
  )
);

if (!template) {
  throw "Cannot load HTML template";
}

var html = template({
  "version": version,
  "scopes" : Array.from(scopes.entries(), ([scope, value]) => ({scope: scope, labels: value})),
});

writeFileSync(join(BUILD_PATH, PAGE_SITE_PATH), html, 'utf8');

/* copy the static assets */

function copyDirectory(source, destination) {
  mkdirSync(destination, { recursive: true });
  const entries = readdirSync(source, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = join(source, entry.name);
    const destinationPath = join(destination, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, destinationPath);
    } else if (entry.isFile()) {
      copyFileSync(sourcePath, destinationPath);
    }
  }
}

// Example usage
const sourceDir = "src/main/resources/static";
const destinationDir = join(BUILD_PATH, "static");
copyDirectory(sourceDir, destinationDir);