import { Notice } from 'obsidian';
import { BlurPluginInterface } from '../models/types';
import { DOMUtils } from '../utils/dom';

export class PresetManager {
    private plugin: BlurPluginInterface;

    constructor(plugin: BlurPluginInterface) {
        this.plugin = plugin;
    }

    async togglePresetElement(target: HTMLElement) {
        if (!target || 
            target === document.body || 
            DOMUtils.isRibbonElement(target) ||
            DOMUtils.isManagePanelElement(target)) return;

        const selector = DOMUtils.getElementSelector(target);
        if (!selector) return;

        const index = this.plugin.settings.presets.indexOf(selector);
        if (index === -1) {
            this.plugin.settings.presets.push(selector);
            new Notice('Added element to presets');
            target.style.outline = '2px solid rgba(0, 255, 0, 0.7)';
        } else {
            this.plugin.settings.presets.splice(index, 1);
            new Notice('Removed element from presets');
            target.style.removeProperty('outline');
        }
        
        await this.plugin.saveSettings();
    }

    highlightPresetElements() {
        this.plugin.settings.presets.forEach(selector => {
            const element = document.querySelector(selector);
            if (element instanceof HTMLElement) {
                if (DOMUtils.isEditorElement(element)) {
                    element.classList.add('blur-plugin-preset');
                } else {
                    element.style.outline = '2px solid rgba(0, 255, 0, 0.7)';
                }
            }
        });
    }

    removePresetHighlights() {
        this.plugin.settings.presets.forEach(selector => {
            const element = document.querySelector(selector);
            if (element instanceof HTMLElement) {
                if (DOMUtils.isEditorElement(element)) {
                    element.classList.remove('blur-plugin-preset');
                } else {
                    element.style.removeProperty('outline');
                }
            }
        });
    }
}