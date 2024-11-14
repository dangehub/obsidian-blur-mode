import { Notice } from 'obsidian';
import { BlurPlugin } from '../main';

export class BlurManagePanel {
    plugin: BlurPlugin;
    containerEl: HTMLElement;
    dragHandle: HTMLElement;
    initialX = 0;
    initialY = 0;
    currentX = 0;
    currentY = 0;
    xOffset = 20;
    yOffset = 50;
    active = false;

    constructor(plugin: BlurPlugin) {
        this.plugin = plugin;
        this.containerEl = document.createElement('div');
        this.containerEl.addClass('blur-manage-panel');
        
        this.dragHandle = this.containerEl.createDiv('blur-panel-handle');
        this.dragHandle.setText('Blur management');
        
        const closeButton = this.dragHandle.createEl('span', {text: '×'});
        closeButton.addClass('blur-panel-close');
        closeButton.addEventListener('click', () => {
            if (this.plugin.blurPanel) {
                this.plugin.blurPanel.close();
                this.plugin.blurPanel = null;
                this.plugin.settings.isSelectingMode = false;
                this.plugin.blurManager.removeAllHighlights();
                this.plugin.saveSettings();
            }
        });

        const tabsContainer = this.containerEl.createDiv('blur-panel-tabs');
        
        const selectorTab = tabsContainer.createDiv('blur-panel-tab active');
        selectorTab.setText('CSS Selector');
        const keywordTab = tabsContainer.createDiv('blur-panel-tab');
        keywordTab.setText('Keywords');

        const contentContainer = this.containerEl.createDiv('blur-panel-content');
        
        const selectorContainer = contentContainer.createDiv('selector-container');
        this.updatePresetList(selectorContainer);

        const keywordContainer = contentContainer.createDiv('keyword-container');
        keywordContainer.style.display = 'none';
        this.createKeywordUI(keywordContainer);

        selectorTab.addEventListener('click', () => {
            selectorTab.addClass('active');
            keywordTab.removeClass('active');
            selectorContainer.style.display = 'block';
            keywordContainer.style.display = 'none';
        });

        keywordTab.addEventListener('click', () => {
            keywordTab.addClass('active');
            selectorTab.removeClass('active');
            keywordContainer.style.display = 'block';
            selectorContainer.style.display = 'none';
        });

        this.setTranslate(this.xOffset, this.yOffset);
        this.setupDrag();
    }

    setupDrag() {
        this.dragHandle.addEventListener('mousedown', this.dragStart.bind(this), false);
        document.addEventListener('mousemove', this.drag.bind(this), false);
        document.addEventListener('mouseup', this.dragEnd.bind(this), false);
    }

    dragStart(e: MouseEvent) {
        if (e.target === this.dragHandle) {
            const rect = this.containerEl.getBoundingClientRect();
            this.initialX = e.clientX - rect.left;
            this.initialY = e.clientY - rect.top;
            
            if (e.target === this.dragHandle) {
                this.active = true;
            }
        }
    }

    drag(e: MouseEvent) {
        if (this.active) {
            e.preventDefault();
            
            const currentX = e.clientX - this.initialX;
            const currentY = e.clientY - this.initialY;

            const maxX = window.innerWidth - this.containerEl.offsetWidth;
            const maxY = window.innerHeight - this.containerEl.offsetHeight;
            
            this.xOffset = Math.min(Math.max(0, currentX), maxX);
            this.yOffset = Math.min(Math.max(0, currentY), maxY);

            this.setTranslate(this.xOffset, this.yOffset);
        }
    }

    dragEnd() {
        this.initialX = this.currentX;
        this.initialY = this.currentY;
        this.active = false;
    }

    setTranslate(xPos: number, yPos: number) {
        this.currentX = xPos;
        this.currentY = yPos;
        this.containerEl.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
    }

    updatePresetList(container: HTMLElement) {
        container.empty();
        
        if (this.plugin.settings.presets.length === 0) {
            container.createEl('p', {text: 'No elements selected'});
        } else {
            const list = container.createEl('ul');
            list.addClass('preset-list');
            
            this.plugin.settings.presets.forEach((selector: string, index: number) => {
                const item = list.createEl('li');
                item.addClass('preset-item');
                
                const selectorText = item.createSpan({text: selector});
                selectorText.addClass('preset-selector');
                
                const deleteBtn = item.createEl('span', {text: '×'});
                deleteBtn.addClass('preset-delete-btn');
                
                this.setupPresetItemEvents(item, selector, deleteBtn, index);
            });
        }
    }

    setupPresetItemEvents(item: HTMLElement, selector: string, deleteBtn: HTMLElement, index: number) {
        item.addEventListener('mouseenter', () => {
            const element = document.querySelector(selector);
            if (element instanceof HTMLElement) {
                if (this.plugin.isEditorElement(element)) {
                    element.classList.remove('blur-plugin-preset');
                    element.classList.add('blur-plugin-hover');
                } else {
                    element.style.outline = '2px solid rgba(255, 0, 0, 0.7)';
                }
            }
        });
        
        item.addEventListener('mouseleave', () => {
            const element = document.querySelector(selector);
            if (element instanceof HTMLElement) {
                if (this.plugin.isEditorElement(element)) {
                    element.classList.remove('blur-plugin-hover');
                    element.classList.add('blur-plugin-preset');
                } else {
                    element.style.outline = '2px solid rgba(0, 255, 0, 0.7)';
                }
            }
        });
        
        deleteBtn.addEventListener('click', async () => {
            const element = document.querySelector(selector);
            if (element instanceof HTMLElement) {
                if (this.plugin.isEditorElement(element)) {
                    element.classList.remove('blur-plugin-preset', 'blur-plugin-hover');
                } else {
                    element.style.removeProperty('outline');
                }
            }
            this.plugin.settings.presets.splice(index, 1);
            await this.plugin.saveSettings();
            this.updatePresetList(this.containerEl.querySelector('.selector-container') as HTMLElement);
        });
    }

    createKeywordUI(container: HTMLElement) {
        const inputContainer = container.createDiv('keyword-input-container');
        const input = inputContainer.createEl('input', {
            type: 'text',
            placeholder: 'Enter keyword'
        });
        const addButton = inputContainer.createEl('button', {
            text: 'Add',
            cls: 'keyword-add-button'
        });

        addButton.addEventListener('click', async () => {
            const keyword = input.value.trim();
            if (keyword && !this.plugin.settings.keywords.includes(keyword)) {
                this.plugin.settings.keywords.push(keyword);
                await this.plugin.saveSettings();
                this.updateKeywordsList(container.querySelector('.keyword-list-container') as HTMLElement);
                input.value = '';
                if (this.plugin.settings.isBlurActive) {
                    this.plugin.blurManager.applyBlurEffects();
                }
            }
        });

        const listContainer = container.createDiv('keyword-list-container');
        this.updateKeywordsList(listContainer);
    }

    updateKeywordsList(container: HTMLElement) {
        container.empty();
        
        if (this.plugin.settings.keywords.length === 0) {
            container.createEl('p', {text: 'No keywords added'});
            return;
        }

        const list = container.createEl('ul');
        list.addClass('keyword-list');
        
        this.plugin.settings.keywords.forEach((keyword: string, index: number) => {
            const item = list.createEl('li');
            item.addClass('keyword-item');
            
            const keywordText = item.createSpan({text: keyword});
            keywordText.addClass('keyword-text');
            
            const deleteBtn = item.createEl('span', {text: '×'});
            deleteBtn.addClass('keyword-delete-btn');
            
            deleteBtn.addEventListener('click', async () => {
                this.plugin.settings.keywords.splice(index, 1);
                await this.plugin.saveSettings();
                this.updateKeywordsList(container);
                if (this.plugin.settings.isBlurActive) {
                    this.plugin.blurManager.applyBlurEffects();
                }
            });
        });
    }

    open() {
        document.body.appendChild(this.containerEl);
    }

    close() {
        this.containerEl.remove();
        this.plugin.blurPanel = null;
        // 关闭面板时自动关闭选择模式
        this.plugin.settings.isSelectingMode = false;
        
        // 清除所有高亮效果
        this.clearAllHighlights();
        
        this.plugin.saveSettings();
    }

    private clearAllHighlights() {
        // 清除选择模式的高亮
        this.plugin.blurManager.removeAllHighlights();

        // 清除预设元素的高亮
        this.plugin.settings.presets.forEach((selector: string) => {
            const element = document.querySelector(selector);
            if (element instanceof HTMLElement) {
                // 清除所有可能的高亮样式
                element.classList.remove('blur-plugin-preset', 'blur-plugin-hover');
                element.style.removeProperty('outline');
            }
        });

        // 清除任何可能的临时高亮
        document.querySelectorAll('[style*="outline"]').forEach(el => {
            if (el instanceof HTMLElement && this.plugin.isManagePanelElement(el)) {
                el.style.removeProperty('outline');
            }
        });
    }
}