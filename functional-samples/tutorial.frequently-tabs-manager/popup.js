// Copyright 2022 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const freqSites = [
  'https://twitter.com/*',
  'https://developer.chrome.com/docs/*'
];

async function getAllTabs() {
  const tabs = await chrome.tabs.query({
    url: freqSites
  });
  return tabs;
}

/**
 * Group tabs by frequency of site
 *
 * @param {Array} tabs
 * @return {{[hostname]: Array}}
 */
function groupTabsByFreqSite(tabs) {
  const freqSiteTabs = {};
  for (const tab of tabs) {
    const url = new URL(tab.url);
    const hostname = url.hostname;
    if (!freqSiteTabs[hostname]) {
      freqSiteTabs[hostname] = [];
    }
    freqSiteTabs[hostname].push(tab);
  }
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Collator
  // const collator = new Intl.Collator();
  // tabs.sort((a, b) => collator.compare(a.title, b.title));
  return freqSiteTabs;
}

/**
 * Generate list of
 *
 * @param {*} freqSiteTabs
 */
function generateLists(freqSiteTabs) {
  const listTemplate = document.getElementById('list_template');
  const itemTemplate = document.getElementById('item_template');
  const listElements = new Set();
  for (const [hostname, tabList] of Object.entries(freqSiteTabs)) {
    const list = listTemplate.content.firstElementChild.cloneNode(true);
    list.querySelector('h2').textContent = hostname;
    list.querySelector('button').addEventListener('click', (e) => {
      groupTabsByHostName(freqSiteTabs, hostname);
    });
    for (const tab of tabList) {
      const item = itemTemplate.content.firstElementChild.cloneNode(true);
      const title = tab.title.split('-')[0].trim();
      const pathname = new URL(tab.url).pathname;

      item.querySelector('.title').textContent = '💀: ' + title;
      item.querySelector('.pathname').textContent = '🏳️‍🌈: ' + pathname;
      item.addEventListener('click', () => {
        clickItemUrl(tab);
      });
      list.append(item);
    }
    listElements.add(list);
  }
  document.getElementsByClassName('lists')[0].append(...listElements);
}

/**
 * Click item url, focus window and active tab
 *
 * @param {*} tab
 */
async function clickItemUrl(tab) {
  await chrome.tabs.update(tab.id, { active: true });
  await chrome.windows.update(tab.windowId, { focused: true });
}

/**
 *
 * @param {string} hostname
 */
async function groupTabsByHostName(freqSiteTabs, hostname) {
  const tabs = freqSiteTabs[hostname];
  const tabIds = tabs.map(({ id }) => id);
  if (tabIds.length) {
    const group = await chrome.tabs.group({ tabIds });
    await chrome.tabGroups.update(group, {
      title: hostname.slice(0, 5),
      color: 'purple',
      collapsed: true
    });
  }
}

async function main() {
  const tabs = await getAllTabs();
  const freqSiteTabs = groupTabsByFreqSite(tabs);
  generateLists(freqSiteTabs);
}

main();
