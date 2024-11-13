import { App, Plugin, PluginSettingTab, Setting, Notice, Modal } from 'obsidian';

interface MyPluginSettings {
	blurAmount: string;
	isSelectingMode: boolean;
	isBlurActive: boolean;
	presets: string[];
	keywords: string[];
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	blurAmount: '0.5em',
	isSelectingMode: false,
	isBlurActive: false,
	presets: [],
	keywords: [],
};

export default class BlurPlugin extends Plugin {
	settings: MyPluginSettings;
	blurPanel: BlurManagePanel | null = null;

	async onload() {
		await this.loadSettings();
		
		this.addSettingTab(new BlurSettingTab(this.app, this));

		this.addCommand({
			id: 'manage-blur',
			name: 'Manage Blur Settings',
			callback: () => {
				if (this.blurPanel) {
					this.blurPanel.close();
					this.blurPanel = null;
					this.settings.isSelectingMode = false;
					this.removeAllHighlights();
				} else {
					this.blurPanel = new BlurManagePanel(this);
					this.blurPanel.open();
					this.settings.isSelectingMode = true;
				}
				this.saveSettings();
			},
		});

		this.addRibbonIcon('eye-off', 'Toggle Blur Effect', (evt) => {
			this.toggleBlurEffect();
		});

		this.registerDomEvent(document, 'mouseover', (event) => {
			if (!this.settings.isSelectingMode) return;
			const target = event.target as HTMLElement;
			this.highlightElement(target);
		});

		this.registerDomEvent(document, 'mouseout', (event) => {
			if (!this.settings.isSelectingMode) return;
			const target = event.target as HTMLElement;
			this.removeHighlight(target);
		});

		this.registerDomEvent(document, 'click', (event) => {
			if (!this.settings.isSelectingMode) return;
			const target = event.target as HTMLElement;
			this.togglePresetElement(target);
		});
	}

	onunload() {
		this.removeAllEffects();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		
		if (!isNaN(parseFloat(this.settings.blurAmount)) && !this.settings.blurAmount.includes('em')) {
			this.settings.blurAmount = `${this.settings.blurAmount}em`;
			await this.saveSettings();
		}
		
		document.documentElement.style.setProperty('--blur-amount', this.settings.blurAmount);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	toggleSelectingMode() {
		this.settings.isSelectingMode = !this.settings.isSelectingMode;
		
		if (this.settings.isSelectingMode) {
			this.showCurrentPresets();
			this.blurPanel = new BlurManagePanel(this);
			this.blurPanel.open();
			new Notice('Entered blur management mode');
		} else {
			this.removeAllHighlights();
			if (this.blurPanel) {
				this.blurPanel.close();
				this.blurPanel = null;
			}
			new Notice('Exited blur management mode');
		}
		
		this.saveSettings();
	}

	showCurrentPresets() {
		this.settings.presets.forEach(selector => {
			const element = document.querySelector(selector);
			if (element) {
				(element as HTMLElement).style.outline = '2px solid rgba(0, 255, 0, 0.7)';
			}
		});
	}

	toggleBlurEffect() {
		this.settings.isBlurActive = !this.settings.isBlurActive;
		
		if (this.settings.isBlurActive) {
			this.applyBlurEffects();
			new Notice('Blur effect enabled');
		} else {
			this.removeAllBlur();
			new Notice('Blur effect disabled');
		}
		
		this.saveSettings();
	}

	async togglePresetElement(target: HTMLElement) {
		if (!target || 
			target === document.body || 
			this.isRibbonElement(target) ||
			this.isManagePanelElement(target)) return;

		const selector = this.getElementSelector(target);
		if (!selector) return;

		const index = this.settings.presets.indexOf(selector);
		if (index === -1) {
			this.settings.presets.push(selector);
			new Notice('Added element to presets');
			target.style.outline = '2px solid rgba(0, 255, 0, 0.7)';
		} else {
			this.settings.presets.splice(index, 1);
			new Notice('Removed element from presets');
			target.style.removeProperty('outline');
		}
		
		await this.saveSettings();
		
		if (this.blurPanel) {
			this.blurPanel.updatePresetList(this.blurPanel.containerEl.querySelector('.selector-container'));
		}
	}

	highlightElement(target: HTMLElement) {
		if (!target || 
			target === document.body || 
			this.isRibbonElement(target) ||
			this.isManagePanelElement(target)) return;
		
		if (!this.settings.isSelectingMode) return;
		
		const selector = this.getElementSelector(target);
		const isInPreset = selector && this.settings.presets.includes(selector);
		
		if (this.isEditorElement(target)) {
			target.classList.add('blur-plugin-selecting');
			if (isInPreset) {
				target.classList.add('blur-plugin-preset');
			}
		} else {
			const originalFilter = target.style.filter;
			target.style.cssText = `
				${originalFilter ? `filter: ${originalFilter};` : ''}
				outline: ${isInPreset ? '2px solid rgba(0, 255, 0, 0.7)' : '2px solid rgba(255, 255, 0, 0.7)'};
			`;
		}
	}

	removeHighlight(target: HTMLElement) {
		if (!target || target === document.body) return;
		if (!this.settings.isSelectingMode) return;
		
		if (this.isEditorElement(target)) {
			target.classList.remove('blur-plugin-selecting');
			const selector = this.getElementSelector(target);
			if (!selector || !this.settings.presets.includes(selector)) {
				target.classList.remove('blur-plugin-preset');
			}
		} else {
			const originalFilter = target.style.filter;
			const selector = this.getElementSelector(target);
			if (selector && this.settings.presets.includes(selector)) {
				target.style.cssText = `
					${originalFilter ? `filter: ${originalFilter};` : ''}
					outline: 2px solid rgba(0, 255, 0, 0.7);
				`;
			} else {
				if (originalFilter) {
					target.style.filter = originalFilter;
				} else {
					target.style.removeProperty('outline');
				}
			}
		}
	}

	applyBlurToPresets() {
		this.settings.presets.forEach(selector => {
			const elements = document.querySelectorAll(selector);
			elements.forEach(element => {
				if (element && this.isEditorElement(element as HTMLElement)) {
					element.classList.add('blur-plugin-editor');
				} else if (element) {
					(element as HTMLElement).style.filter = `blur(${this.settings.blurAmount})`;
				}
			});
		});
	}

	removeAllBlur() {
		const blurredElements = document.querySelectorAll('[style*="filter: blur"]');
		blurredElements.forEach((el) => {
			(el as HTMLElement).style.removeProperty('filter');
		});

		const blurredEditors = document.querySelectorAll('.blur-plugin-editor');
		
		blurredEditors.forEach((el) => {
			el.classList.remove('blur-plugin-editor');
		});
	}

	removeAllHighlights() {
		// 清除选择高亮
		document.querySelectorAll('.blur-plugin-selecting').forEach(el => {
			el.classList.remove('blur-plugin-selecting');
		});

		// 清除预设高亮
		document.querySelectorAll('.blur-plugin-preset').forEach(el => {
			el.classList.remove('blur-plugin-preset');
		});

		// 清除内联样式的高亮
		document.querySelectorAll('[style*="outline"]').forEach(el => {
			(el as HTMLElement).style.removeProperty('outline');
		});
	}

	removeAllEffects() {
		this.removeAllBlur();
		this.removeAllHighlights();
	}

	getElementSelector(element: HTMLElement): string | null {
		if (this.isEditorElement(element)) {
			const classes = Array.from(element.classList);
			const filteredClasses = classes.filter(cls => 
				!cls.startsWith('blur-plugin-')
			);
			if (filteredClasses.length > 0) {
				return '.' + filteredClasses.join('.');
			}
		}
		
		if (element.id) {
			return `#${element.id}`;
		} else if (element.className) {
			const classStr = typeof element.className === 'string' 
				? element.className 
				: element.classList.toString();
			
			const classes = classStr.split(' ')
				.filter(cls => !cls.startsWith('blur-plugin-'))
				.filter(Boolean);
			
			if (classes.length > 0) {
				return '.' + classes.join('.');
			}
		}
		return null;
	}

	isEditorElement(element: HTMLElement): boolean {
		return element.classList.contains('cm-editor') || 
			   element.classList.contains('markdown-preview-view') ||
			   element.closest('.cm-editor') !== null ||
			   element.closest('.markdown-preview-view') !== null;
	}

	isRibbonElement(element: HTMLElement): boolean {
		return element.classList.contains('ribbon-tab') || 
			   element.closest('.ribbon-tab') !== null ||
			   element.classList.contains('side-dock-ribbon') ||
			   element.closest('.side-dock-ribbon') !== null;
	}

	isManagePanelElement(element: HTMLElement): boolean {
		return element.closest('.blur-manage-panel') !== null;
	}

	applyBlurEffects() {
		const blurAmount = !this.settings.blurAmount.includes('em') 
			? `${this.settings.blurAmount}em` 
			: this.settings.blurAmount;

		this.settings.presets.forEach(selector => {
			const elements = document.querySelectorAll(selector);
			elements.forEach(element => {
				if (element && !this.isManagePanelElement(element as HTMLElement)) {
					const el = element as HTMLElement;
					if (this.isEditorElement(el)) {
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

		if (this.settings.keywords.length > 0) {
			this.applyKeywordBlur();
		}
	}

	applyKeywordBlur() {
		if (!this.settings.keywords.length) return;

		const blurAmount = !this.settings.blurAmount.includes('em') 
			? `${this.settings.blurAmount}em` 
			: this.settings.blurAmount;

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
		while (node = walker.nextNode()) {
			textNodes.push(node as Text);
		}

		textNodes.forEach(textNode => {
			const content = textNode.textContent || '';
			if (this.settings.keywords.some(keyword => content.includes(keyword))) {
				const parent = textNode.parentElement;
				if (parent && !this.isManagePanelElement(parent) && !this.isRibbonElement(parent)) {
					if (this.isEditorElement(parent)) {
						parent.classList.add('blur-plugin-editor');
					} else {
						parent.style.filter = `blur(${blurAmount})`;
					}
				}
			}
		});
	}
}

class BlurSettingTab extends PluginSettingTab {
	plugin: BlurPlugin;

	constructor(app: App, plugin: BlurPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('Blur Amount')
			.setDesc('Enter the blur amount (e.g. 0.5em). Larger values create stronger blur effects.')
			.addText(text => text
				.setPlaceholder('0.5em')
				.setValue(this.plugin.settings.blurAmount)
				.onChange(async (value) => {
					if (!isNaN(parseFloat(value)) && !value.includes('em')) {
						value = value + 'em';
					}
					this.plugin.settings.blurAmount = value;
					await this.plugin.saveSettings();
					document.documentElement.style.setProperty('--blur-amount', value);
					if (this.plugin.settings.isBlurActive) {
						this.plugin.applyBlurEffects();
					}
				}));

		containerEl.createEl('h3', {text: 'Keywords Management'});
		
		const keywordsList = containerEl.createEl('div', {cls: 'keywords-list'});
		this.updateKeywordsList(keywordsList);

		new Setting(containerEl)
			.setName('Add Keyword')
			.setDesc('Add a new keyword to blur content containing it')
			.addText(text => text
				.setPlaceholder('Enter keyword')
				.onChange(() => {}))
			.addButton(button => button
				.setButtonText('Add')
				.onClick(async () => {
					const input = button.buttonEl.parentElement?.querySelector('input') as HTMLInputElement;
					const keyword = input.value.trim();
					if (keyword && !this.plugin.settings.keywords.includes(keyword)) {
						this.plugin.settings.keywords.push(keyword);
						await this.plugin.saveSettings();
						this.updateKeywordsList(keywordsList);
						input.value = '';
						if (this.plugin.settings.isBlurActive) {
							this.plugin.applyBlurEffects();
						}
					}
				}));
	}

	updateKeywordsList(container: HTMLElement) {
		container.empty();
		
		this.plugin.settings.keywords.forEach((keyword) => {
			const keywordEl = container.createEl('div', {cls: 'keyword-item'});
			keywordEl.createSpan({text: keyword});
			
			const deleteButton = keywordEl.createEl('button', {text: '×'});
			deleteButton.addEventListener('click', async () => {
				const index = this.plugin.settings.keywords.indexOf(keyword);
				if (index > -1) {
					this.plugin.settings.keywords.splice(index, 1);
					await this.plugin.saveSettings();
					this.updateKeywordsList(container);
					if (this.plugin.settings.isBlurActive) {
						this.plugin.applyBlurEffects();
					}
				}
			});
		});
	}
}

class BlurManagePanel {
	plugin: BlurPlugin;
	containerEl: HTMLElement;
	dragHandle: HTMLElement;
	initialX: number = 0;
	initialY: number = 0;
	currentX: number = 0;
	currentY: number = 0;
	xOffset: number = 20;
	yOffset: number = 50;
	active: boolean = false;

	constructor(plugin: BlurPlugin) {
		this.plugin = plugin;
		this.containerEl = document.createElement('div');
		this.containerEl.addClass('blur-manage-panel');
		
		this.dragHandle = this.containerEl.createDiv('blur-panel-handle');
		this.dragHandle.setText('Blur Management');
		
		const closeButton = this.dragHandle.createEl('span', {text: '×'});
		closeButton.addClass('blur-panel-close');
		closeButton.addEventListener('click', () => {
			if (this.plugin.blurPanel) {
				this.plugin.blurPanel.close();
				this.plugin.blurPanel = null;
				this.plugin.settings.isSelectingMode = false;
				this.plugin.removeAllHighlights();
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
		
		this.xOffset = this.currentX;
		this.yOffset = this.currentY;
	}

	setTranslate(xPos: number, yPos: number) {
		this.currentX = xPos;
		this.currentY = yPos;
		this.containerEl.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
	}

	open() {
		document.body.appendChild(this.containerEl);
	}

	close() {
		this.containerEl.remove();
	}

	updatePresetList(container: HTMLElement) {
		const currentTransform = this.containerEl.style.transform;
		
		container.empty();
		
		if (this.plugin.settings.presets.length === 0) {
			container.createEl('p', {text: 'No elements selected'});
		} else {
			const list = container.createEl('ul');
			list.addClass('preset-list');
			
			this.plugin.settings.presets.forEach((selector, index) => {
				const item = list.createEl('li');
				item.addClass('preset-item');
				
				const selectorText = item.createSpan({text: selector});
				selectorText.addClass('preset-selector');
				
				const deleteBtn = item.createEl('span', {text: '×'});
				deleteBtn.addClass('preset-delete-btn');
				
				item.addEventListener('mouseenter', () => {
					const element = document.querySelector(selector);
					if (element) {
						const el = element as HTMLElement;
						if (this.plugin.isEditorElement(el)) {
							// 对于编辑器元素，使用类来切换高亮
							el.classList.remove('blur-plugin-preset');
							el.classList.add('blur-plugin-hover');
						} else {
							// 对于其他元素，使用样式
							el.style.outline = '2px solid rgba(255, 0, 0, 0.7)';
						}
					}
				});
				
				item.addEventListener('mouseleave', () => {
					const element = document.querySelector(selector);
					if (element) {
						const el = element as HTMLElement;
						if (this.plugin.isEditorElement(el)) {
							// 恢复编辑器元素的预设高亮
							el.classList.remove('blur-plugin-hover');
							el.classList.add('blur-plugin-preset');
						} else {
							// 恢复其他元素的预设高亮
							el.style.outline = '2px solid rgba(0, 255, 0, 0.7)';
						}
					}
				});
				
				deleteBtn.addEventListener('click', async (e) => {
					e.stopPropagation();
					const element = document.querySelector(selector);
					if (element) {
						const el = element as HTMLElement;
						if (this.plugin.isEditorElement(el)) {
							el.classList.remove('blur-plugin-preset', 'blur-plugin-hover');
						} else {
							el.style.removeProperty('outline');
						}
					}
					this.plugin.settings.presets.splice(index, 1);
					await this.plugin.saveSettings();
					this.updatePresetList(container);
				});
			});
		}

		this.containerEl.style.transform = currentTransform;
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
				this.updateKeywordsList(listContainer);
				input.value = '';
				if (this.plugin.settings.isBlurActive) {
					this.plugin.applyBlurEffects();
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
		
		this.plugin.settings.keywords.forEach((keyword, index) => {
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
					this.plugin.applyBlurEffects();
				}
			});
		});
	}
}

