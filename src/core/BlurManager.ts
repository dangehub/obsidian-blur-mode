import { Notice } from 'obsidian';
import { BlurPlugin } from '../main';
import { DOMUtils } from '../utils/dom';

export class BlurManager {
    constructor(private plugin: BlurPlugin) {}

    applyBlurEffects() {
        const blurAmount = !this.plugin.settings.blurAmount.includes('em') 
            ? `${this.plugin.settings.blurAmount}em` 
            : this.plugin.settings.blurAmount;

        this.plugin.settings.presets.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                if (element && !this.plugin.isManagePanelElement(element as HTMLElement)) {
                    const el = element as HTMLElement;
                    if (this.plugin.isEditorElement(el)) {
                        el.classList.add('blur-plugin-editor');
                    } else {
                        // 根据元素类型调整模糊量
                        const tagName = el.tagName.toLowerCase();
                        let blurMultiplier = 1;
                        if (tagName === 'h1') blurMultiplier = 2;
                        else if (tagName === 'h2') blurMultiplier = 1.75;
                        else if (tagName === 'h3') blurMultiplier = 1.5;
                        else if (tagName === 'h4') blurMultiplier = 1.25;

                        const baseBlur = parseFloat(blurAmount);
                        el.style.filter = `blur(${baseBlur * blurMultiplier}em)`;
                    }
                }
            });
        });

        if (this.plugin.settings.keywords.length > 0) {
            this.applyKeywordBlur();
        }
    }

    applyKeywordBlur() {
        if (!this.plugin.settings.keywords.length) return;

        const blurAmount = !this.plugin.settings.blurAmount.includes('em') 
            ? `${this.plugin.settings.blurAmount}em` 
            : this.plugin.settings.blurAmount;

        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    if (node.parentElement?.tagName === 'SCRIPT' || 
                        node.parentElement?.tagName === 'STYLE') {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        const textNodes: Text[] = [];
        let node;
        while ((node = walker.nextNode()) !== null) {
            textNodes.push(node as Text);
        }

        textNodes.forEach(textNode => {
            const content = textNode.textContent || '';
            if (this.plugin.settings.keywords.some((keyword: string) => content.includes(keyword))) {
                const parent = textNode.parentElement;
                if (parent && !this.plugin.isManagePanelElement(parent) && !this.plugin.isRibbonElement(parent)) {
                    if (this.plugin.isEditorElement(parent)) {
                        parent.classList.add('blur-plugin-editor');
                    } else {
                        parent.style.filter = `blur(${blurAmount})`;
                    }
                }
            }
        });
    }

    removeBlurEffects() {
        document.querySelectorAll('.blur-plugin-editor').forEach(el => {
            el.classList.remove('blur-plugin-editor');
        });

        document.querySelectorAll('[style*="filter: blur"]').forEach(el => {
            (el as HTMLElement).style.removeProperty('filter');
        });
    }

    async togglePresetElement(target: HTMLElement) {
        if (!target || 
            target === document.body || 
            this.plugin.isRibbonElement(target) ||
            this.plugin.isManagePanelElement(target)) return;

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
        
        if (this.plugin.blurPanel) {
            const container = this.plugin.blurPanel.containerEl.querySelector('.selector-container');
            if (container instanceof HTMLElement) {
                this.plugin.blurPanel.updatePresetList(container);
            }
        }
    }

    removeAllHighlights() {
        document.querySelectorAll('.blur-plugin-selecting').forEach(el => {
            el.classList.remove('blur-plugin-selecting');
        });
    }

    private applyPresetBlur(blurAmount: string) {
        this.plugin.settings.presets.forEach((selector: string) => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                if (element && !this.plugin.isManagePanelElement(element as HTMLElement)) {
                    const el = element as HTMLElement;
                    if (this.plugin.isEditorElement(el)) {
                        el.classList.add('blur-plugin-editor');
                    } else {
                        // 根据元素类型调整模糊量
                        const tagName = el.tagName.toLowerCase();
                        let blurMultiplier = 1;
                        if (tagName === 'h1') blurMultiplier = 2;
                        else if (tagName === 'h2') blurMultiplier = 1.75;
                        else if (tagName === 'h3') blurMultiplier = 1.5;
                        else if (tagName === 'h4') blurMultiplier = 1.25;

                        const baseBlur = parseFloat(blurAmount);
                        el.style.filter = `blur(${baseBlur * blurMultiplier}em)`;
                    }
                }
            });
        });
    }
}