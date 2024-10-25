/*
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

import Ability from '@ohos.app.ability.UIAbility';
import { Log } from '@ohos/common';

const TAG = 'Launcher Settings MainAbility';

export default class MainAbility extends Ability {
  private abilityWant;
  onCreate(want, launchParam) {
    this.abilityWant = want;
    Log.showInfo(TAG, 'onCreate is called');
  }

  onDestroy() {
    Log.showInfo(TAG, 'onDestroy is called');
  }

  onWindowStageCreate(windowStage) {
    Log.showInfo(TAG, 'onWindowStageCreate is called');
    if (this.abilityWant?.parameters?.router === 'settings') {
      globalThis.router = 'settings';
    } else {
      globalThis.router = '';
    }
    globalThis.settingsContext = this.context;
    windowStage.setUIContent(this.context, 'pages/Settings', null);
  }

  onWindowStageDestroy() {
    Log.showInfo(TAG, 'onWindowStageDestroy is called');
  }

  onForeground() {
    Log.showInfo(TAG, 'onForeground is called');
  }

  onBackground() {
    Log.showInfo(TAG, 'onBackground is called');
    globalThis.settingsContext.terminateSelf();
  }
}