export class DOMUtils {
    static isEditorElement(element: HTMLElement): boolean {
        return element.classList.contains('cm-editor') || 
               element.classList.contains('markdown-preview-view') ||
               element.closest('.cm-editor') !== null ||
               element.closest('.markdown-preview-view') !== null;
    }

    static isRibbonElement(element: HTMLElement): boolean {
        return element.classList.contains('ribbon-tab') || 
               element.closest('.ribbon-tab') !== null ||
               element.classList.contains('side-dock-ribbon') ||
               element.closest('.side-dock-ribbon') !== null;
    }

    static isManagePanelElement(element: HTMLElement): boolean {
        return element.closest('.blur-manage-panel') !== null;
    }

    static getElementSelector(element: HTMLElement): string | null {
        if (DOMUtils.isEditorElement(element)) {
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
}