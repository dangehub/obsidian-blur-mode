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

        // Blur amount setting
        new Setting(containerEl)
            .setName(this.plugin.t("Blur amount"))
            .setDesc(this.plugin.t("Set the amount of blur (in em)"))
            .addText(text => text
                .setPlaceholder(this.plugin.t("0.5em"))
                .setValue(this.plugin.settings.blurAmount)
                .onChange(async (value) => {
                    this.plugin.settings.blurAmount = value;
                    await this.plugin.saveSettings();
                    if (this.plugin.settings.isBlurActive) {
                        this.plugin.blurManager.applyBlurEffects();
                    }
                }));

        // Manage presets setting
        new Setting(containerEl)
            .setName(this.plugin.t("Manage presets"))
            .setDesc(this.plugin.t("Open the preset management panel"))
            .addButton(button => button
                .setButtonText(this.plugin.t("Open panel"))
                .onClick(() => {
                    if (!this.plugin.blurPanel) {
                        this.plugin.blurPanel = new BlurManagePanel(this.plugin);
                        this.plugin.blurPanel?.open();
                    }
                }));

        // Keywords list
        new Setting(containerEl).setName(this.plugin.t("Current keywords")).setHeading();
        const keywordList = containerEl.createEl('ul');
        this.plugin.settings.keywords.forEach((keyword: string) => {
            keywordList.createEl('li', { text: keyword });
        });

        // Debug mode setting (moved to bottom)
        new Setting(containerEl)
            .setName(this.plugin.t("Debug mode"))
            .setDesc(this.plugin.t("Enable debug mode to show console logs"))
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.isDebugMode)
                .onChange(async (value) => {
                    this.plugin.settings.isDebugMode = value;
                    await this.plugin.saveSettings();
                }));
    }
}