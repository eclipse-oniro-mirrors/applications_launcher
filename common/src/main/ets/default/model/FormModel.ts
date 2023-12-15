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

import { Log } from '../utils/Log';
import { EventConstants } from '../constants/EventConstants';
import { CommonConstants } from '../constants/CommonConstants';
import { CardItemInfo } from '../bean/CardItemInfo';
import { SettingsModel } from './SettingsModel';
import { FormManager } from '../manager/FormManager';
import { RdbStoreManager } from '../manager/RdbStoreManager';
import { FormListInfoCacheManager } from '../cache/FormListInfoCacheManager';
import {PageDesktopModel} from './PageDesktopModel';
import { GridLayoutInfo } from '../interface';


const TAG = 'FormModel';
const KEY_FORM_LIST = 'formListInfo';

/**
 * form model.
 */
export class FormModel {
  private readonly mRdbStoreManager: RdbStoreManager;
  private readonly mFormManager: FormManager;
  private readonly mFormListInfoCacheManager: FormListInfoCacheManager;
  private readonly mAppItemFormInfoMap = new Map<string, CardItemInfo[]>();
  private readonly mPageDesktopModel: PageDesktopModel;
  private readonly mAtomicServiceAppItemFormInfoMap = new Map<string, CardItemInfo[]>();

  private constructor() {
    this.mRdbStoreManager = RdbStoreManager.getInstance();
    this.mFormManager = FormManager.getInstance();
    this.mFormListInfoCacheManager = FormListInfoCacheManager.getInstance();
    this.mPageDesktopModel = PageDesktopModel.getInstance();
  }

  /**
   * Get the form model object.
   *
   * @return {object} form model singleton
   */
  static getInstance(): FormModel {
    if (globalThis.FormModelInstance == null) {
      globalThis.FormModelInstance = new FormModel();
    }
    return globalThis.FormModelInstance;
  }

  /**
   * Get the form info list of all ohos applications on the device.
   *
   * @return {array} allFormList
   */
  async getAllFormsInfo() {
    Log.showDebug(TAG, 'getAllFormsInfo start');
    const allFormList = await this.mFormManager.getAllFormsInfo();
    return allFormList;
  }

  getAllAppItemFormInfoMap(): Map<string, CardItemInfo[]> {
    return this.mAppItemFormInfoMap;
  }

  /**
   * Get the form info list of all ohos applications on the device by bundle name.
   *
   * @param {array} bundleName
   * @param {function | undefined} callback
   *
   * @return {array} currentBundleFormsInfo
   */
  async getFormsInfoByBundleName(bundleName: string, callback?) {
    Log.showDebug(TAG, `getFormsInfoByBundleName bundleName: ${bundleName}`);
    let currentBundleFormsInfo: any;
    await this.mFormManager.getFormsInfoByApp(bundleName)
      .then(bundleFormsInfo => {
        currentBundleFormsInfo = bundleFormsInfo;
        if (callback != undefined) {
          callback(bundleName, bundleFormsInfo);
        }
      })
      .catch(err => {
        Log.showError(TAG, `getFormsInfoByBundleName err: ${JSON.stringify(err)}`);
      });
    AppStorage.setOrCreate('formMgrItem', currentBundleFormsInfo);
    return currentBundleFormsInfo;
  }

  /**
   * Get the form info list of all ohos applications on the device by module name.
   *
   * @param {string} bundleName
   * @param {string} moduleName
   *
   * @return {array} currentModuleFormsInfo
   */
  async getFormsInfoByModuleName(bundleName: string, moduleName: string) {
    Log.showDebug(TAG, `getFormsInfoByModuleName bundleName: ${bundleName}, moduleName: ${moduleName}`);
    const currentModuleFormsInfo = await this.mFormManager.getFormsInfoByModule(bundleName, moduleName);
    return currentModuleFormsInfo;
  }

  /**
   * Get the form info list from rdb.
   *
   * @return {array} allFormList
   */
  async getAllFormsInfoFromRdb() {
    Log.showDebug(TAG, 'getAllFormsInfoFromRdb start');
    const allFormList = await this.mRdbStoreManager.getAllFormInfos();
    return allFormList;
  }

  /**
   * Update the form info in rdb by id.
   *
   * @param {object} cardItemInfo
   *
   * @return {boolean} result
   */
  async updateFormInfoById(cardItemInfo) {
    return await this.mRdbStoreManager.updateFormInfoById(cardItemInfo);
  }

  /**
   * Delete form in rdb and fms by id.
   *
   * @param {number} cardId
   */
  async deleteFormById(cardId: number): Promise<boolean> {
    try{
      await this.mRdbStoreManager.deleteFormInfoById(cardId);
      await this.mFormManager.deleteCard(cardId.toString());
    } catch(error){
      Log.showError(TAG, `deleteFormById err: ${JSON.stringify(error)}`);
      return false;
    }
    return true;

  }

  /**
   * Delete form in fms by formId.
   *
   * @param {number} formId
   */
  deleteFormByFormID(formId: number) {
    this.mFormManager.deleteCard(formId.toString());
  }

  /**
   * Set app item form info into map.
   *
   * @param {string} bundleName
   * @param {array} appItemFormInfo
   */
  setAppItemFormInfo(bundleName: string, appItemFormInfo: CardItemInfo[]): void {
    this.mAppItemFormInfoMap.set(bundleName, appItemFormInfo);
  }

  /**
   * Get app item form info from map.
   *
   * @param {string} bundleName
   *
   * @return {array | undefined} mAppItemFormInfoMap
   */
  getAppItemFormInfo(bundleName: string, moduleName?: string): CardItemInfo[] | undefined {
    Log.showDebug(TAG, `getAppItemFormInfo bundleName: ${bundleName},
      appItemFormInfo: ${JSON.stringify(this.mAppItemFormInfoMap.get(bundleName))}`);
    let formList = this.mAppItemFormInfoMap.get(bundleName);
    if (formList && formList.length && moduleName) {
      formList = formList.filter(item => item.moduleName === moduleName);
    }
    return formList;
  }

  /**
   * Update app item form info into map.
   *
   * @param {string} bundleName
   * @param {string | undefined} eventType
   */
  async updateAppItemFormInfo(bundleName: string, eventType?: string): Promise<void> {
    if (eventType && eventType === EventConstants.EVENT_PACKAGE_REMOVED) {
      this.mAppItemFormInfoMap.delete(bundleName);
      return;
    }
    const formsInfoList = this.getFormsInfoByBundleName(bundleName, this.setAppItemFormInfo.bind(this));
  }

  /**
   * Delete form by bundleName and update layout info.
   *
   * @param {string} bundleName
   */
  deleteFormByBundleName(bundleName: string): void {
    const settingsModel = SettingsModel.getInstance();
    this.mRdbStoreManager.deleteFormInfoByBundle(bundleName);
    const formInfoList: any = this.mFormListInfoCacheManager.getCache(KEY_FORM_LIST);
    if (formInfoList === CommonConstants.INVALID_VALUE) {
      return;
    }
    const layoutInfo = settingsModel.getLayoutInfo();
    const tempFormInfoList = JSON.parse(JSON.stringify(formInfoList));
    const pageItemMap = new Map<string, number>();
    for (let i = 0; i < layoutInfo.layoutInfo.length; i++) {
      const tmpPage = layoutInfo.layoutInfo[i].page.toString();
      if (pageItemMap.has(tmpPage)) {
        pageItemMap.set(tmpPage, pageItemMap.get(tmpPage) + 1);
      } else {
        pageItemMap.set(tmpPage, 1);
      }
    }
    for(let i = formInfoList.length - 1; i >= 0; i--) {
      const formInfo = formInfoList[i];
      if (formInfo.bundleName === bundleName) {
        tempFormInfoList.splice(i, 1);
        for(let j = layoutInfo.layoutInfo.length - 1; j >= 0; j--) {
          if (layoutInfo.layoutInfo[j].typeId === CommonConstants.TYPE_CARD && formInfo.cardId == layoutInfo.layoutInfo[j].cardId) {
            const tmpPage = layoutInfo.layoutInfo[j].page.toString();
            pageItemMap.set(tmpPage, pageItemMap.get(tmpPage) - 1);
            layoutInfo.layoutInfo.splice(j, 1);
            break;
          }
        }
      }
    }
    if (tempFormInfoList.length === 0) {
      this.mFormListInfoCacheManager.setCache(KEY_FORM_LIST, null);
    } else {
      this.mFormListInfoCacheManager.setCache(KEY_FORM_LIST, tempFormInfoList);
    }

    this.updateBlankPage(pageItemMap, layoutInfo);
    settingsModel.setLayoutInfo(layoutInfo);
  }

  /**
   * Delete form by cardId.
   *
   * @param {number} cardId.
   */
  async deleteForm(cardId) {
    Log.showDebug(TAG, 'deleteForm start');
    let gridLayoutInfo: GridLayoutInfo = {
      layoutDescription: undefined,
      layoutInfo: []
    };
    gridLayoutInfo = SettingsModel.getInstance().getLayoutInfo();
    const cardIndex = gridLayoutInfo.layoutInfo.findIndex(item => {
      return item.typeId === CommonConstants.TYPE_CARD && item.cardId === cardId;
    });
    if (cardIndex != CommonConstants.INVALID_VALUE) {
      this.deleteFormById(cardId);
      const page = gridLayoutInfo.layoutInfo[cardIndex].page;
      gridLayoutInfo.layoutInfo.splice(cardIndex, 1);
      let ret: boolean = this.mPageDesktopModel.deleteBlankPageFromLayoutInfo(gridLayoutInfo, page);
      SettingsModel.getInstance().setLayoutInfo(gridLayoutInfo);
      if(ret){
        const curPageIndex = this.mPageDesktopModel.getPageIndex();
        Log.showInfo(TAG, 'deleteForm' + curPageIndex);
        this.mPageDesktopModel.setPageIndex(curPageIndex - 1);
      }
    }
    const formInfoList: any = this.mFormListInfoCacheManager.getCache(KEY_FORM_LIST);
    if (formInfoList === CommonConstants.INVALID_VALUE) {
      return;
    }
    for(let i = 0; i < formInfoList.length; i++) {
      if (formInfoList[i].cardId === cardId){
        formInfoList.splice(i, 1);
        break;
      }
    }
    if (formInfoList.length === 0) {
      this.mFormListInfoCacheManager.setCache(KEY_FORM_LIST, null);
    } else {
      this.mFormListInfoCacheManager.setCache(KEY_FORM_LIST, formInfoList);
    }
  }

  /**
   * update page number if blank page is exist
   *
   * @param pageItemMap
   * @param layoutInfo
   */
  private updateBlankPage(pageItemMap, layoutInfo): void {
    const blankPages = [];
    for (let [page, count] of pageItemMap) {
      if (count === 0) {
        layoutInfo.layoutDescription.pageCount--;
        blankPages.push(page);
      }
    }
    for (let m = 0; m < layoutInfo.layoutInfo.length; m++) {
      let pageMinus = 0;
      for (let n = 0; n < blankPages.length; n++) {
        if (layoutInfo.layoutInfo[m].page > blankPages[n]) {
          pageMinus++;
        }
      }
      if (pageMinus != 0) {
        layoutInfo.layoutInfo[m].page = layoutInfo.layoutInfo[m].page - pageMinus;
      }
    }
  }

  private setAtomicServiceAppItemFormInfo(bundleName: string, appItemFormInfo: CardItemInfo[]): void {
    this.mAtomicServiceAppItemFormInfoMap.set(bundleName, appItemFormInfo);
  }

  /**
   * 获取所有原服务app 卡片信息
   *
   * @returns {Map<string, CardItemInfo[]>} mAtomicServiceAppItemFormInfoMap
   */
  getAllAtomicServiceAppItemFormInfoMap(): Map<string, CardItemInfo[]> {
    return this.mAtomicServiceAppItemFormInfoMap;
  }

  /**
   * 先从缓存中获取原服务卡片信息，没有的话，再从卡片管理器获取
   *
   * @param bundleName bundleName
   * @returns {Promise<CardItemInfo[]>}
   */
  async getAtomicServiceFormsInfoFromMapAndManager(bundleName: string): Promise<CardItemInfo[]> {
    let cardInfo: CardItemInfo[] = this.mAtomicServiceAppItemFormInfoMap.get(bundleName);
    if (typeof cardInfo === 'undefined') {
      return this.mFormManager.getFormsInfoByApp(bundleName)
        .then(bundleFormsInfo => {
          Log.showInfo(TAG, `getAtomicServiceFormsInfoFromMapAndManager bundleFormsInfo: ${JSON.stringify(bundleFormsInfo)}`);
          return bundleFormsInfo;
        })
        .catch(err => {
          Log.showError(TAG, `getAtomicServiceFormsInfoFromMapAndManager err: ${JSON.stringify(err)}`);
          return [];
        });
    }
    return cardInfo;
  }

  /**
   * 更新原服务应用的卡片信息
   *
   * @param bundleName {string} bundleName
   * @param eventType {string | undefined} eventType
   * @returns {Promise<void>}
   */
  async updateAtomicServiceAppItemFormInfo(bundleName: string, eventType?: string): Promise<void> {
    if (eventType && eventType === EventConstants.EVENT_PACKAGE_REMOVED) {
      this.mAtomicServiceAppItemFormInfoMap.delete(bundleName);
      return;
    }
    await this.getFormsInfoByBundleName(bundleName, this.setAtomicServiceAppItemFormInfo.bind(this));
  }

  /**
   * 从缓存中获取原服务app 卡片信息
   *
   * @param bundleName bundleName
   * @returns CardItemInfo[]
   */
  getAtomicServiceAppItemFormInfo(bundleName: string): CardItemInfo[] | undefined {
    Log.showInfo(TAG, `getAtomicServiceAppItemFormInfo bundleName: ${bundleName}, ` +
      `appItemFormInfo: ${JSON.stringify(this.mAtomicServiceAppItemFormInfoMap.get(bundleName))}`);
    return this.mAtomicServiceAppItemFormInfoMap.get(bundleName);
  }

  /**
   * 删除原服务卡片信息
   *
   * @param bundleName 包名
   */
  deleteAtomicServiceAppItemFormInfo(bundleName: string): void {
    this.mAtomicServiceAppItemFormInfoMap.delete(bundleName);
  }

  getRealForm(cardItemInfos: CardItemInfo[]): CardItemInfo[] {
    if (cardItemInfos.length <= 0) {
      return null;
    }
    let result: CardItemInfo[] = [];
    for (let j: number = 0; j < cardItemInfos.length; j++) {
      let dimensions: number[] = cardItemInfos[j].supportDimensions;
      for (let i: number = 0; i < dimensions.length; i++) {
        const tempCard = new CardItemInfo();
        this.copyCardItemInfo(tempCard, cardItemInfos[j]);
        let tempDimensions: number[] = [];
        tempDimensions.push(dimensions[i]);
        tempCard.supportDimensions = tempDimensions;
        tempCard.cardDimension = dimensions[i];
        result.push(tempCard);
      }
    }
    return result;
  }

  copyCardItemInfo(newCard: CardItemInfo, oldCard: CardItemInfo): void {
    newCard.description = oldCard.description;
    newCard.bundleName = oldCard.bundleName;
    newCard.abilityName = oldCard.abilityName;
    newCard.moduleName = oldCard.moduleName;
    newCard.cardName = oldCard.cardName;
    newCard.area = oldCard.area;
    newCard.formConfigAbility = oldCard.formConfigAbility;
  }

  async getFullFormsInfoByBundleName(bundleName: string, callback?): Promise<CardItemInfo[]> {
    let currentBundleFormsInfo: CardItemInfo[] = [];
    currentBundleFormsInfo = await this.getFormsInfoByBundleName(bundleName, callback);
    currentBundleFormsInfo = this.getRealForm(currentBundleFormsInfo);
    AppStorage.setOrCreate('formMgrItem', currentBundleFormsInfo);
    return currentBundleFormsInfo;
  }

  async doBeforeJumpToFormManager(formBundleName : string): Promise<void> {
    const formItem = await this.getFullFormsInfoByBundleName(formBundleName);
    AppStorage.setOrCreate('formItem', formItem);
  }
}