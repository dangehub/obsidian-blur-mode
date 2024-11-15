import { Notice } from 'obsidian';
import { BlurPlugin } from '../main';
import { DOMUtils } from '../utils/dom';

export class BlurManager {
    private plugin: BlurPlugin;

    constructor(plugin: BlurPlugin) {
        this.plugin = plugin;
        
        // 初始化事件监听器
        document.addEventListener('mouseover', this.handleMouseOver.bind(this));
        document.addEventListener('mouseout', this.handleMouseOut.bind(this));
    }

    private handleMouseOver(e: MouseEvent) {
        if (!this.plugin.settings.isSelectingMode) return;
        const target = e.target as HTMLElement;
        if (target && !this.plugin.isManagePanelElement(target) && !this.plugin.isRibbonElement(target)) {
            target.classList.add('blur-plugin-selecting');
        }
    }

    private handleMouseOut(e: MouseEvent) {
        if (!this.plugin.settings.isSelectingMode) return;
        const target = e.target as HTMLElement;
        if (target) {
            target.classList.remove('blur-plugin-selecting');
        }
    }

    applyBlurEffects() {
        const blurAmount = !this.plugin.settings.blurAmount.includes('em') 
            ? `${this.plugin.settings.blurAmount}em` 
            : this.plugin.settings.blurAmount;
        document.documentElement.style.setProperty('--blur-amount', blurAmount);

        this.plugin.settings.presets.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                if (element && !this.plugin.isManagePanelElement(element as HTMLElement)) {
                    const el = element as HTMLElement;
                    if (this.plugin.isEditorElement(el)) {
                        el.classList.add('blur-plugin-editor');
                    } else {
                        const tagName = el.tagName.toLowerCase();
                        if (['h1', 'h2', 'h3', 'h4'].includes(tagName)) {
                            el.classList.add(`blur-${tagName}`);
                        } else {
                            el.classList.add('blur-element');
                        }
                    }
                }
            });
        });

        if (this.plugin.settings.keywords.length > 0) {
            this.applyKeywordBlur();
        }
    }

    removeBlurEffects() {
        document.documentElement.style.removeProperty('--blur-amount');
        
        const blurClasses = [
            'blur-plugin-editor',
            'blur-h1',
            'blur-h2',
            'blur-h3',
            'blur-h4',
            'blur-element',
            'blur-keyword'
        ];
        
        document.querySelectorAll(blurClasses.map(c => `.${c}`).join(',')).forEach(el => {
            blurClasses.forEach(className => {
                el.classList.remove(className);
            });
        });
    }

    applyKeywordBlur() {
        if (!this.plugin.settings.keywords.length) return;

        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    const parent = node.parentElement;
                    if (parent?.tagName === 'SCRIPT' || parent?.tagName === 'STYLE') {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        const textNodes = [];
        let node;
        while ((node = walker.nextNode()) !== null) {
            textNodes.push(node);
        }

        textNodes.forEach(node => {
            const text = node.textContent || '';
            if (this.plugin.settings.keywords.some(keyword => text.includes(keyword))) {
                const parent = node.parentElement;
                if (parent && !this.plugin.isManagePanelElement(parent) && !this.plugin.isRibbonElement(parent)) {
                    if (this.plugin.isEditorElement(parent)) {
                        parent.classList.add('blur-plugin-editor');
                    } else {
                        parent.classList.add('blur-keyword');
                    }
                }
            }
        });
    }

    async togglePresetElement(element: HTMLElement) {
        if (!element || element === document.body || 
            this.plugin.isRibbonElement(element) || 
            this.plugin.isManagePanelElement(element)) return;

        const selector = DOMUtils.getElementSelector(element);
        if (!selector) return;

        // 移除所有其他高亮状态
        element.classList.remove('blur-plugin-selecting', 'blur-plugin-hover');

        const index = this.plugin.settings.presets.indexOf(selector);
        if (index === -1) {
            this.plugin.settings.presets.push(selector);
            new Notice('Added element to presets');
            element.classList.add('blur-plugin-preset');

            // 立即更新面板列表
            if (this.plugin.blurPanel) {
                const selectorContainer = this.plugin.blurPanel.containerEl.querySelector('.selector-container');
                if (selectorContainer) {
                    this.plugin.blurPanel.updatePresetList(selectorContainer as HTMLElement);
                }
            }
        } else {
            this.plugin.settings.presets.splice(index, 1);
            new Notice('Removed element from presets');
            element.classList.remove('blur-plugin-preset');

            // 立即更新面板列表
            if (this.plugin.blurPanel) {
                const selectorContainer = this.plugin.blurPanel.containerEl.querySelector('.selector-container');
                if (selectorContainer) {
                    this.plugin.blurPanel.updatePresetList(selectorContainer as HTMLElement);
                }
            }
        }

        await this.plugin.saveSettings();
        
        // 重新应用模糊效果
        if (this.plugin.settings.isBlurActive) {
            this.applyBlurEffects();
        }
    }

    removeAllHighlights() {
        document.querySelectorAll('.blur-plugin-selecting, .blur-plugin-preset, .blur-plugin-hover').forEach(el => {
            el.classList.remove('blur-plugin-selecting', 'blur-plugin-preset', 'blur-plugin-hover');
        });
    }
}