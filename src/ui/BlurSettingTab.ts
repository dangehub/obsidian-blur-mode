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

        containerEl.createEl('h2', { text: 'Blur Mode Settings' });

        new Setting(containerEl)
            .setName('Blur Amount')
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
            .setName('Manage Presets')
            .setDesc('Open the preset management panel')
            .addButton(button => button
                .setButtonText('Open Panel')
                .onClick(() => {
                    if (!this.plugin.blurPanel) {
                        this.plugin.blurPanel = new BlurManagePanel(this.plugin);
                        this.plugin.blurPanel?.open();
                    }
                }));

        // 添加关键词列表显示
        containerEl.createEl('h3', { text: 'Current Keywords' });
        const keywordList = containerEl.createEl('ul');
        this.plugin.settings.keywords.forEach((keyword: string) => {
            keywordList.createEl('li', { text: keyword });
        });
    }
}