import * as _ from "lodash";
import {Browser, Page} from "puppeteer";

const IGNORE_RESOURCE_TYPES = ['image', 'stylesheet', 'script'];

export const getPage = async (browser: Browser): Promise<Page> => {
  const page = await browser.newPage();
  await page.setRequestInterception(true);

  page.on('request', request => {
    if (IGNORE_RESOURCE_TYPES.includes(request.resourceType())) {
      request.abort();
    } else {
      request.continue();
    }
  });
  return page;
}

export function cleanNumber(text: string): number {
  return +_.trim(text.replace(/[$,.]/g, ""));
}
