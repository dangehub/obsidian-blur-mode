export class Logger {
    private plugin: any;

    constructor(plugin: any) {
        this.plugin = plugin;
    }

    debug(...args: any[]) {
        if (this.plugin.settings.isDebugMode) {
            console.log('[Blur Debug]', ...args);
        }
    }

    error(...args: any[]) {
        // 错误总是记录，不管调试模式是否开启
        console.error('[Blur Error]', ...args);
    }

    info(...args: any[]) {
        if (this.plugin.settings.isDebugMode) {
            console.info('[Blur Info]', ...args);
        }
    }
}
