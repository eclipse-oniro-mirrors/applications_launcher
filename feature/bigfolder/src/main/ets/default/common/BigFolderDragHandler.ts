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

import { Log } from '@ohos/common';
import { EventConstants } from '@ohos/common';
import { CommonConstants } from '@ohos/common';
import { localEventManager } from '@ohos/common';
import { layoutConfigManager } from '@ohos/common';
import { SettingsModel } from '@ohos/common';
import { BaseDragHandler } from '@ohos/common';
import { AppGridStyleConfig } from '@ohos/common';
import { BigFolderModel } from '../model/BigFolderModel';
import { BigFolderViewModel } from '../viewmodel/BigFolderViewModel';
import { BigFolderConstants } from './constants/BigFolderConstants';

const TAG = 'BigFolderDragHandler';
const DRAG_DROP_DELAY = 500;

/**
 * bigfolder drag handler class
 */
export default class BigFolderDragHandler extends BaseDragHandler {
  private mFolderCoordinateData = {
    gridXAxis: [],
    gridYAxis: []
  };
  private mStartIndex = 0;
  private mEndIndex = 0;
  private mStartPosition: any = null;
  private mEndPosition: any = null;
  private readonly mSettingsModel: SettingsModel;
  private readonly mBigFolderModel: BigFolderModel = null;
  private mFolderAppList: any[] = [];
  private readonly mBigFolderViewModel: BigFolderViewModel = null;
  private mOpenGridConfig;
  private mGridItemHeight: any = null;
  private mGridItemWidth: any = null;
  private readonly mDesktopStyleConfig: AppGridStyleConfig = null;
  private hasDroped = false;

  constructor() {
    super();
    this.mBigFolderModel = BigFolderModel.getInstance();
    this.mBigFolderViewModel = BigFolderViewModel.getInstance();
    this.mDesktopStyleConfig = layoutConfigManager.getStyleConfig(AppGridStyleConfig.APP_GRID_STYLE_CONFIG,
      BigFolderConstants.PAGEDESKTOP_FEATURE_NAME);
  }

  static getInstance(): BigFolderDragHandler {
    if (globalThis.BigFolderDragHandlerInstance == null) {
      globalThis.BigFolderDragHandlerInstance = new BigFolderDragHandler();
    }
    return globalThis.BigFolderDragHandlerInstance;
  }

  setDragEffectArea(effectArea): void {
    super.setDragEffectArea(effectArea);
    this.updateFolderParam(effectArea);
  }

  getEffectArea(): any {
    return this.getDragEffectArea();
  }

  private updateFolderParam(effectArea): void {
    const gridWidth = effectArea.right - effectArea.left;
    const gridHeight = effectArea.bottom - effectArea.top;
    Log.showDebug(TAG, `Launcher OpenFolder updateGridParam gridWidth: ${gridWidth}, gridHeight: ${gridHeight}`);
    this.mOpenGridConfig = this.mBigFolderModel.getFolderOpenLayout();
    const column = this.mOpenGridConfig.column;
    const row = this.mOpenGridConfig.row;
    this.mGridItemHeight = gridHeight / row;
    Log.showDebug(TAG, `this.mGridItemHeight ${this.mGridItemHeight}`);
    this.mGridItemWidth = gridWidth / column;
    Log.showDebug(TAG, `this.mGridItemWidth ${this.mGridItemWidth}`);
    Log.showDebug(TAG, `Launcher BigFolder updateGridParam column: ${column}, row: ${row}`);
    this.mFolderCoordinateData.gridYAxis = [];
    for (let i = 1; i <= row; i++) {
      const touchPositioningY = this.mGridItemHeight * i + effectArea.top;
      this.mFolderCoordinateData.gridYAxis.push(touchPositioningY);
    }

    this.mFolderCoordinateData.gridXAxis = [];
    for (let i = 1; i <= column; i++) {
      const touchPositioningX = this.mGridItemWidth * i + effectArea.left;
      this.mFolderCoordinateData.gridXAxis.push(touchPositioningX);
    }
  }

  protected getDragRelativeData(): any {
    const openFolderData: {
      layoutInfo: [[]]
    } = AppStorage.Get('openFolderData');
    return openFolderData;
  }

  protected getItemIndex(event: any): number {
    const x = event.touches[0].screenX;
    const y = event.touches[0].screenY;
    let rowVal = CommonConstants.INVALID_VALUE;
    for (let index = 0; index < this.mFolderCoordinateData.gridYAxis.length; index++) {
      if (this.mFolderCoordinateData.gridYAxis[index] > y) {
        rowVal = index;
        break;
      }
    }
    let columnVal = CommonConstants.INVALID_VALUE;
    for (let index = 0; index < this.mFolderCoordinateData.gridXAxis.length; index++) {
      if (this.mFolderCoordinateData.gridXAxis[index] > x) {
        columnVal = index;
        break;
      }
    }
    const column = this.mOpenGridConfig.column;
    Log.showDebug(TAG, `Launcher BigFolder getItemIndex column: ${column}, rowVal: ${rowVal}, columnVal: ${columnVal}`);
    if (rowVal != CommonConstants.INVALID_VALUE && columnVal != CommonConstants.INVALID_VALUE) {
      return rowVal * column + columnVal;
    }
    return CommonConstants.INVALID_VALUE;
  }

  protected getItemByIndex(index: number): any {
    const pageIndex: number = this.mBigFolderViewModel.getIndex();
    Log.showDebug(TAG, `getItemByIndex: ${index}, pageIndex: ${pageIndex}`);
    const dataObj = this.getDragRelativeData().layoutInfo;
    if (index >= 0 && pageIndex < dataObj.length && index < dataObj[pageIndex].length) {
      return dataObj[pageIndex][index];
    }
    return null;
  }

  private getTouchPosition(x, y): any {
    const pageIndex: number = this.mBigFolderViewModel.getIndex();
    const position = {
      page: pageIndex,
      row: 0,
      column: 0,
      X: x,
      Y: y,
    };
    for (let i = 0; i < this.mFolderCoordinateData.gridXAxis.length; i++) {
      if (x < this.mFolderCoordinateData.gridXAxis[i]) {
        position.column = i;
        break;
      } else {
        position.column = this.mFolderCoordinateData.gridXAxis.length - 1;
      }
    }
    for (let i = 0; i < this.mFolderCoordinateData.gridYAxis.length; i++) {
      if (y < this.mFolderCoordinateData.gridYAxis[i]) {
        position.row = i;
        break;
      } else {
        position.row = this.mFolderCoordinateData.gridYAxis.length - 1;
      }
    }
    return position;
  }

  protected onDragStart(event: any, itemIndex: number): void {
    super.onDragStart(event, itemIndex);
    this.mFolderAppList = [];
    const moveAppX = event.touches[0].screenX;
    const moveAppY = event.touches[0].screenY;
    this.mStartPosition = this.getTouchPosition(moveAppX, moveAppY);
    const pageIndex: number = this.mBigFolderViewModel.getIndex();
    const mItemIndex = this.getItemIndex(event);
    this.mStartIndex = mItemIndex + this.mOpenGridConfig.column * this.mOpenGridConfig.row * pageIndex;
    Log.showDebug(TAG, `onDragStart mStartIndex: ${this.mStartIndex}`);

    AppStorage.SetOrCreate('overlayPositionX', moveAppX);
    AppStorage.SetOrCreate('overlayPositionY', moveAppY);
    AppStorage.SetOrCreate('overlayData', {
      iconSize: this.mDesktopStyleConfig.mIconSize * 1.05,
      nameSize: this.mDesktopStyleConfig.mNameSize * 1.05,
      nameHeight: this.mDesktopStyleConfig.mNameHeight * 1.05,
      appInfo: this.getDragItemInfo(),
    });
    AppStorage.SetOrCreate('withBlur', false);
    AppStorage.SetOrCreate('overlayMode', CommonConstants.OVERLAY_TYPE_APP_ICON);
  }

  protected onDragMove(event: any, insertIndex: number, itemIndex: number): void {
    super.onDragMove(event, insertIndex, itemIndex);
    Log.showDebug(TAG, `Launcher OpenFolder onDragMove insertIndex: ${insertIndex}`);
    const moveAppX = event.touches[0].screenX;
    const moveAppY = event.touches[0].screenY;
    AppStorage.SetOrCreate('overlayPositionX', moveAppX);
    AppStorage.SetOrCreate('overlayPositionY', moveAppY);
  }

  protected onDragLeave(event: any): void {
    super.onDragLeave(event);

    const moveAppY = event.touches[0].screenY;
    const dragEffectArea = this.getEffectArea();

    if (moveAppY >= dragEffectArea.bottom || moveAppY <= dragEffectArea.top) {
      this.mBigFolderViewModel.closeFolder();
    }

  }

  protected onDragDrop(event: any, insertIndex: number, itemIndex: number): boolean {
    if (this.hasDroped) {
      return false;
    }
    this.dropDelay();
    super.onDragDrop(event, insertIndex, itemIndex);
    Log.showDebug(TAG, `Launcher OpenFolder onDragDrop insertIndex:${insertIndex},mIsInEffectArea: ${this.mIsInEffectArea}`);
    AppStorage.SetOrCreate('overlayMode', CommonConstants.OVERLAY_TYPE_HIDE);
    const openingStatus = AppStorage.Get('openFolderStatus');

    const pageIndex: number = this.mBigFolderViewModel.getIndex();
    const openFolderData: {
      folderId: string,
      layoutInfo: any
    } = this.getDragRelativeData();
    for (let i = 0; i < openFolderData.layoutInfo.length; i++) {
      this.mFolderAppList = this.mFolderAppList.concat(openFolderData.layoutInfo[i]);
    }
    if (this.mIsInEffectArea && openingStatus !== BigFolderConstants.OPEN_FOLDER_STATUS_CLOSE) {
      this.updateFolderNotClose(event, pageIndex);
    } else if (openingStatus === BigFolderConstants.OPEN_FOLDER_STATUS_CLOSE) {
      // effectarea in desktop
      const endLayoutInfo = this.getEndLayoutInfo(event);

      if (endLayoutInfo != undefined
        && endLayoutInfo.typeId === CommonConstants.TYPE_FOLDER
        && endLayoutInfo.folderId === openFolderData.folderId) {
        return false;
      }

      let result = false;
      const dragAppInfo = this.mFolderAppList[this.mStartIndex];
      result = this.mBigFolderViewModel.deleteAppByDraging(this.mFolderAppList, this.mStartIndex);

      if (endLayoutInfo != undefined && endLayoutInfo.typeId == CommonConstants.TYPE_FOLDER) {
        this.mBigFolderViewModel.addOneAppToFolder(dragAppInfo, endLayoutInfo.folderId);
      }

      AppStorage.SetOrCreate('openFolderData', {});
      localEventManager.sendLocalEventSticky(EventConstants.EVENT_REQUEST_PAGEDESK_ITEM_UPDATE, null);
      if (!result) {
        return false;
      }
    }
    return true;
  }

  protected onDragEnd(isSuccess: boolean): void {
    super.onDragEnd(isSuccess);
    this.mStartPosition = null;
    this.mEndPosition = null;
    AppStorage.SetOrCreate('dragFocus', '');
  }

  private dropDelay(): void {
    this.hasDroped = true;
    setTimeout(() => {
      this.hasDroped = false;
    }, DRAG_DROP_DELAY);
  }

  private layoutAdjustment(startIndex: number, endIndex: number): void {
    Log.showDebug(TAG, 'layoutAdjustment start');

    const item = this.mFolderAppList[startIndex];
    this.mFolderAppList.splice(startIndex, 1);
    this.mFolderAppList.splice(endIndex, 0, item);

    const folderLayoutInfo = this.mBigFolderViewModel.filterFolderPage(this.mFolderAppList);
    let openFolderData: {
      folderId: string,
      layoutInfo: any
    } = AppStorage.Get('openFolderData');
    openFolderData.layoutInfo = folderLayoutInfo;
    openFolderData = this.mBigFolderViewModel.addAddIcon(openFolderData);
    AppStorage.SetOrCreate('openFolderData', openFolderData);
    Log.showDebug(TAG, `layoutAdjustment this.openFolderData.folderId: ${openFolderData.folderId}`);

    const info = this.mSettingsModel.getLayoutInfo();
    const layoutInfo = info.layoutInfo;

    for (let i = 0; i < layoutInfo.length; i++) {
      if (layoutInfo[i].typeId === CommonConstants.TYPE_FOLDER) {
        if (layoutInfo[i].folderId === openFolderData.folderId) {
          layoutInfo[i].layoutInfo = folderLayoutInfo;
          break;
        }
      }
    }
    info.layoutInfo = layoutInfo;
    this.mSettingsModel.setLayoutInfo(info);
    localEventManager.sendLocalEventSticky(EventConstants.EVENT_REQUEST_PAGEDESK_ITEM_UPDATE, null);
    Log.showDebug(TAG, 'layoutAdjustment end');
  }

  /**
   * update folder info when folder is not close
   *
   * @param event - drag event object
   * @param pageIndex - the index of page
   */
  private updateFolderNotClose(event, pageIndex) {
    const moveAppX = event.touches[0].screenX;
    const moveAppY = event.touches[0].screenY;
    this.mEndPosition = this.getTouchPosition(moveAppX, moveAppY);
    let mItemIndex = this.getItemIndex(event);
    const itemCountByPage = this.mOpenGridConfig.column * this.mOpenGridConfig.row;
    mItemIndex = mItemIndex + itemCountByPage * pageIndex;
    Log.showDebug(TAG, `onDragDrop mItemIndex: ${mItemIndex}`);
    // remove add icon
    if (this.mFolderAppList.length > 0
      && this.mFolderAppList[this.mFolderAppList.length - 1].typeId == CommonConstants.TYPE_ADD) {
      this.mFolderAppList.pop();
    }
    if (mItemIndex > this.mFolderAppList.length - 1) {
      this.mEndIndex = this.mFolderAppList.length - 1;
    } else {
      this.mEndIndex = mItemIndex;
    }
    Log.showDebug(TAG, `onDragDrop this.mEndIndex: ${this.mEndIndex}, this.mStartIndex: ${this.mStartIndex}`);
    this.layoutAdjustment(this.mStartIndex, this.mEndIndex);
  }

  /**
   * get drag end position from layoutInfo
   *
   * @param event - drag event object
   */
  private getEndLayoutInfo(event) {
    const moveAppX = event.touches[0].screenX;
    const moveAppY = event.touches[0].screenY;
    const mDesktopPosition = globalThis.PageDesktopDragHandler.getTouchPosition(moveAppX, moveAppY);

    const info = this.mSettingsModel.getLayoutInfo();
    const layoutInfo = info.layoutInfo;
    const endLayoutInfo = layoutInfo.find(item => {
      if (item.typeId === CommonConstants.TYPE_FOLDER) {
        return item.page === mDesktopPosition.page
          && (item.row <= mDesktopPosition.row && mDesktopPosition.row <= item.row + 1)
          && (item.column <= mDesktopPosition.column && mDesktopPosition.column <= item.column + 1);
      }
    });
    return endLayoutInfo;
  }

}
