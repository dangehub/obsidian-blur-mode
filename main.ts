import { App, Plugin, PluginSettingTab, Setting, Notice, Modal } from 'obsidian';

interface MyPluginSettings {
	blurAmount: string;
	isSelectingMode: boolean;
	isBlurActive: boolean;
	presets: string[];
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	blurAmount: '5px',
	isSelectingMode: false,
	isBlurActive: false,
	presets: [],
};

export default class BlurPlugin extends Plugin {
	settings: MyPluginSettings;
	presetPanel: PresetPanel | null = null;

	async onload() {
		await this.loadSettings();
		
		this.addSettingTab(new BlurSettingTab(this.app, this));

		this.addCommand({
			id: 'manage-blur-presets',
			name: 'Manage Blur Presets',
			callback: () => this.toggleSelectingMode(),
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
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	toggleSelectingMode() {
		this.settings.isSelectingMode = !this.settings.isSelectingMode;
		
		if (this.settings.isSelectingMode) {
			this.showCurrentPresets();
			this.presetPanel = new PresetPanel(this);
			this.presetPanel.open();
			new Notice('Entered preset selection mode');
		} else {
			this.removeAllHighlights();
			if (this.presetPanel) {
				this.presetPanel.close();
				this.presetPanel = null;
			}
			new Notice('Exited preset selection mode');
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
			this.applyBlurToPresets();
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
			this.isPresetPanelElement(target)) return;

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
		
		if (this.presetPanel) {
			this.presetPanel.updatePresetList(this.presetPanel.containerEl.querySelector('.preset-list-container'));
		}
	}

	highlightElement(target: HTMLElement) {
		if (!target || 
			target === document.body || 
			this.isRibbonElement(target) ||
			this.isPresetPanelElement(target)) return;
		
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
		const highlightedElements = document.querySelectorAll('[style*="outline"]');
		
		highlightedElements.forEach((el) => {
			const element = el as HTMLElement;
			const originalFilter = element.style.filter;
			if (originalFilter) {
				element.style.filter = originalFilter;
			}
			element.style.removeProperty('outline');
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

	isPresetPanelElement(element: HTMLElement): boolean {
		return element.closest('.preset-panel') !== null;
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
			.setDesc('Enter the blur amount (e.g. 5px)')
			.addText(text => text
				.setPlaceholder('5px')
				.setValue(this.plugin.settings.blurAmount)
				.onChange(async (value) => {
					this.plugin.settings.blurAmount = value;
					await this.plugin.saveSettings();
					
					document.documentElement.style.setProperty('--blur-amount', value);
					
					if (this.plugin.settings.isBlurActive) {
						this.plugin.applyBlurToPresets();
					}
				}));
	}
}

class PresetPanel {
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
		this.containerEl.addClass('preset-panel');
		
		this.dragHandle = this.containerEl.createDiv('preset-panel-handle');
		this.dragHandle.setText('Preset Elements');
		
		const closeButton = this.dragHandle.createEl('span', {text: '×'});
		closeButton.addClass('preset-panel-close');
		closeButton.addEventListener('click', () => {
			this.close();
			this.plugin.toggleSelectingMode();
		});

		const listContainer = this.containerEl.createDiv('preset-list-container');
		this.updatePresetList(listContainer);
		
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
						(element as HTMLElement).style.outline = '2px solid rgba(255, 0, 0, 0.7)';
					}
				});
				
				item.addEventListener('mouseleave', () => {
					const element = document.querySelector(selector);
					if (element) {
						(element as HTMLElement).style.outline = '2px solid rgba(0, 255, 0, 0.7)';
					}
				});
				
				deleteBtn.addEventListener('click', async (e) => {
					e.stopPropagation();
					const element = document.querySelector(selector);
					if (element) {
						(element as HTMLElement).style.removeProperty('outline');
					}
					this.plugin.settings.presets.splice(index, 1);
					await this.plugin.saveSettings();
					this.updatePresetList(container);
				});
			});
		}

		this.containerEl.style.transform = currentTransform;
	}
}

