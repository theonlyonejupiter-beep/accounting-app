/**
 * 主题模块
 * 处理深色模式切换
 */

const ThemeModule = {
    /** 存储键名 */
    STORAGE_KEY: 'theme_preference',

    /**
     * 初始化主题
     */
    init() {
        // 获取保存的主题偏好
        const savedTheme = localStorage.getItem(this.STORAGE_KEY);

        // 如果没有保存的偏好，检查系统主题
        if (!savedTheme) {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.setTheme(prefersDark ? 'dark' : 'light');
        } else {
            this.setTheme(savedTheme);
        }

        // 监听系统主题变化
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            // 只有在没有手动设置过的情况下才跟随系统
            if (!localStorage.getItem(this.STORAGE_KEY)) {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });
    },

    /**
     * 获取当前主题
     * @returns {string} 'light' 或 'dark'
     */
    getTheme() {
        return document.documentElement.getAttribute('data-theme') || 'light';
    },

    /**
     * 设置主题
     * @param {string} theme - 'light' 或 'dark'
     */
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);

        // 更新按钮图标
        const btn = document.getElementById('btnTheme');
        if (btn) {
            const icon = btn.querySelector('i');
            if (icon) {
                icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
        }

        // 保存偏好
        localStorage.setItem(this.STORAGE_KEY, theme);
    },

    /**
     * 切换主题
     */
    toggle() {
        const currentTheme = this.getTheme();
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);

        // 显示提示
        const message = newTheme === 'dark' ? '已切换到深色模式' : '已切换到浅色模式';
        Utils.showToast(message);
    }
};
