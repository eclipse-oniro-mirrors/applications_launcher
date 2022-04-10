/**
 * Copyright (c) 2021-2022 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import LruCache from './LruCache';
import DiskLruCache from './DiskLruCache';

const KEY_ICON = 'icon';
const DISK_CACHE_MISS = -1;

/**
 * A Manager class that provides get/set/clear cache methods for app image data.
 */
export default class AppResourceCacheManager {
  private readonly memoryCache;
  private readonly diskCache;

  constructor() {
    this.memoryCache = new LruCache();
    this.diskCache = new DiskLruCache();
  }

  /**
   * Get cache from disk or memory.
   *
   * @param {string} key - key of the cache map
   * @return {object} - cache get from memory or disk
   */
  getCache(bundleName: string, key: string) {
    const cache = this.getCacheFromMemory(bundleName, key);
    if (cache == undefined || cache == null || cache == '') {
      if (key === KEY_ICON) {
        const cacheFromDisk = this.getCacheFromDisk(bundleName, key);
        this.setCacheToMemory(bundleName, key, cacheFromDisk);
        return cacheFromDisk;
      }
      return null;
    } else {
      return cache;
    }
  }

  /**
   * Set cache to disk or memory.
   *
   * @param {string} key - key of the cache map
   * @param {object} value - value of the cache map
   */
  setCache(bundleName: string, key: string, value: object | string) {
    console.info('Launcher AppResourceCacheManager setCache bundleName = ' + bundleName + ' key = ' + key);
    this.setCacheToMemory(bundleName, key, value);
    if (key === KEY_ICON) {
      this.setCacheToDisk(bundleName, key, value);
    }
  }

  /**
   * Clear cache of both disk and memory.
   */
  clearCache() {
    console.info('Launcher AppResourceCacheManager clearCache');
    this.memoryCache.clear();
  }

  private getCacheFromMemory(bundleName: string, key: string) {
    const cache = this.memoryCache.getCache(bundleName);
    if (cache == undefined || cache == null || cache == '' || cache === -1) {
      return null;
    } else if (cache[key] == undefined || cache[key] == null || cache[key] == '') {
      return null;
    } else {
      return cache[key];
    }
  }

  private setCacheToMemory(bundleName: string, key: string, value: object | string) {
    let cache = this.memoryCache.getCache(bundleName);
    if (cache == undefined || cache == null || cache == '' || cache === -1) {
      cache = {};
      cache[key] = value;
    } else {
      cache[key] = value;
    }
    this.memoryCache.putCache(bundleName, cache);
  }

  private getCacheFromDisk(bundleName: string, key: string) {
    const data = this.diskCache.getCache(bundleName);
    return data !== DISK_CACHE_MISS ? data : null;
  }

  private setCacheToDisk(bundleName: string, key: string, value: object | string) {
    this.diskCache.putCache(bundleName, value);
  }
}