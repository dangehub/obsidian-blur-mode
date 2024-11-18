import { App, PluginSettingTab, Setting } from 'obsidian';
import { BlurPlugin } from '../main';
import { BlurManagePanel } from './BlurManagePanel';

export class BlurSettingTab extends PluginSettingTab {
    plugin: BlurPlugin;

    constructor(app: App, plugin: BlurPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();


        new Setting(containerEl)
            .setName('Debug mode')
            .setDesc('Enable debug mode to show console logs')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.isDebugMode)
                .onChange(async (value) => {
                    this.plugin.settings.isDebugMode = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Blur amount')
            .setDesc('Set the amount of blur (in em)')
            .addText(text => text
                .setPlaceholder('0.5em')
                .setValue(this.plugin.settings.blurAmount)
                .onChange(async (value) => {
                    this.plugin.settings.blurAmount = value;
                    await this.plugin.saveSettings();
                    if (this.plugin.settings.isBlurActive) {
                        this.plugin.blurManager.applyBlurEffects();
                    }
                }));

        new Setting(containerEl)
            .setName('Manage presets')
            .setDesc('Open the preset management panel')
            .addButton(button => button
                .setButtonText('Open panel')
                .onClick(() => {
                    if (!this.plugin.blurPanel) {
                        this.plugin.blurPanel = new BlurManagePanel(this.plugin);
                        this.plugin.blurPanel?.open();
                    }
                }));

        // 添加关键词列表显示
        new Setting(containerEl).setName('Current keywords').setHeading();
        const keywordList = containerEl.createEl('ul');
        this.plugin.settings.keywords.forEach((keyword: string) => {
            keywordList.createEl('li', { text: keyword });
        });
    }
}