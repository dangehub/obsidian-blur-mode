import { App, Plugin } from 'obsidian';

export interface BlurSettings {
    blurAmount: string;
    isSelectingMode: boolean;
    isBlurActive: boolean;
    presets: string[];
    keywords: string[];
    isDebugMode: boolean;
}

export const DEFAULT_SETTINGS: BlurSettings = {
    blurAmount: '0.5em',
    isSelectingMode: false,
    isBlurActive: false,
    presets: [],
    keywords: [],
    isDebugMode: false,
};

export interface BlurPluginInterface extends Plugin {
    settings: BlurSettings;
    saveSettings(): Promise<void>;
    blurManager: any;  // 或者导入具体的类型
    blurPanel: any;    // 或者导入具体的类型
    isEditorElement(element: HTMLElement): boolean;
    isRibbonElement(element: HTMLElement): boolean;
    isManagePanelElement(element: HTMLElement): boolean;
    t(key: string, params?: Record<string, string | number>): string;
}