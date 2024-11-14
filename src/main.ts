import { Plugin, Notice } from 'obsidian';
import { BlurSettings, DEFAULT_SETTINGS } from './models/types';
import { BlurManager } from './core/BlurManager';
import { BlurManagePanel } from './ui/BlurManagePanel';
import { BlurSettingTab } from './ui/BlurSettingTab';
import { DOMUtils } from './utils/dom';

export default class BlurPlugin extends Plugin {
    settings: BlurSettings;
    blurManager: BlurManager;
    blurPanel: BlurManagePanel | null = null;

    async onload() {
        await this.loadSettings();
        
        // 强制设置选择模式为关闭状态
        this.settings.isSelectingMode = false;
        await this.saveSettings();
        
        this.blurManager = new BlurManager(this);

        // 添加 ribbon 图标
        const ribbonIconEl = this.addRibbonIcon('eye-off', 'Blur Mode', (evt: MouseEvent) => {
            if (evt.button === 0) { // 左键点击
                this.settings.isBlurActive = !this.settings.isBlurActive;
                if (this.settings.isBlurActive) {
                    this.blurManager.applyBlurEffects();
                } else {
                    this.blurManager.removeBlurEffects();
                }
                this.saveSettings();
            } else if (evt.button === 2) { // 右键点击
                if (!this.blurPanel) {
                    this.blurPanel = new BlurManagePanel(this);
                    this.blurPanel.open();
                }
            }
        });

        // 添加右键菜单
        ribbonIconEl.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // 添加设置面板
        this.addSettingTab(new BlurSettingTab(this.app, this));

        // 添加命令
        this.addCommand({
            id: 'toggle-blur',
            name: 'Toggle blur effect',
            callback: () => {
                this.settings.isBlurActive = !this.settings.isBlurActive;
                if (this.settings.isBlurActive) {
                    this.blurManager.applyBlurEffects();
                } else {
                    this.blurManager.removeBlurEffects();
                }
                this.saveSettings();
            }
        });

        // 添加打开管理面板命令
        this.addCommand({
            id: 'open-blur-panel',
            name: 'Open blur management panel',
            callback: () => {
                if (!this.blurPanel) {
                    this.blurPanel = new BlurManagePanel(this);
                    this.blurPanel.open();
                    this.settings.isSelectingMode = true;
                    this.saveSettings();
                }
            }
        });

        // 添加点击事件监听
        document.addEventListener('click', this.handleClick.bind(this));

        // 如果设置为激活状态，则应用模糊效果
        if (this.settings.isBlurActive) {
            this.blurManager.applyBlurEffects();
        }
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    private handleClick(event: MouseEvent) {
        if (!this.settings.isSelectingMode) return;

        const target = event.target as HTMLElement;
        if (!target) return;

        this.blurManager.togglePresetElement(target);
    }

    onunload() {
        this.blurManager.removeBlurEffects();
        if (this.blurPanel) {
            this.blurPanel.close();
        }
    }

    // 这些方法暂时保留在主类中，因为多个组件都需要使用
    isEditorElement(element: HTMLElement): boolean {
        return DOMUtils.isEditorElement(element);
    }

    isRibbonElement(element: HTMLElement): boolean {
        return DOMUtils.isRibbonElement(element);
    }

    isManagePanelElement(element: HTMLElement): boolean {
        return DOMUtils.isManagePanelElement(element);
    }
}
export { BlurPlugin };