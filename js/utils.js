/**
 * 工具函数模块
 * 确保金额计算的准确性
 */

const Utils = {
    /**
     * 生成唯一ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    /**
     * 格式化金额（精确到分）
     * 使用整数运算避免浮点数精度问题
     * @param {number|string} amount - 金额
     * @param {boolean} showSign - 是否显示正负号
     * @returns {string} 格式化后的金额字符串
     */
    formatAmount(amount, showSign = false) {
        // 转换为分进行整数运算，避免浮点精度问题
        const cents = Math.round(parseFloat(amount) * 100);
        const absCents = Math.abs(cents);
        const yuan = Math.floor(absCents / 100);
        const fen = absCents % 100;

        const formatted = `${yuan}.${fen.toString().padStart(2, '0')}`;
        const sign = showSign ? (cents >= 0 ? '+' : '-') : '';

        return `${sign}¥${formatted}`;
    },

    /**
     * 金额加法（精确到分）
     * @param {number|string} a
     * @param {number|string} b
     * @returns {number} 结果
     */
    add(a, b) {
        const centsA = Math.round(parseFloat(a) * 100);
        const centsB = Math.round(parseFloat(b) * 100);
        return (centsA + centsB) / 100;
    },

    /**
     * 金额减法（精确到分）
     * @param {number|string} a
     * @param {number|string} b
     * @returns {number} 结果
     */
    subtract(a, b) {
        const centsA = Math.round(parseFloat(a) * 100);
        const centsB = Math.round(parseFloat(b) * 100);
        return (centsA - centsB) / 100;
    },

    /**
     * 格式化日期
     * @param {string|Date} date - 日期
     * @param {string} format - 格式类型
     * @returns {string}
     */
    formatDate(date, format = 'full') {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');

        switch (format) {
            case 'full':
                return `${year}-${month}-${day}`;
            case 'short':
                return `${month}-${day}`;
            case 'chinese':
                return `${year}年${month}月${day}日`;
            default:
                return `${year}-${month}-${day}`;
        }
    },

    /**
     * 获取今天的日期字符串
     */
    getToday() {
        return this.formatDate(new Date(), 'full');
    },

    /**
     * 解析日期字符串为Date对象
     * @param {string} dateStr - YYYY-MM-DD格式
     * @returns {Date}
     */
    parseDate(dateStr) {
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
    },

    /**
     * 获取日期范围
     * @param {string} range - 范围类型
     * @returns {Object} {start, end}
     */
    getDateRange(range) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        switch (range) {
            case 'today':
                return {
                    start: this.formatDate(today, 'full'),
                    end: this.formatDate(today, 'full')
                };
            case 'week': {
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay());
                return {
                    start: this.formatDate(weekStart, 'full'),
                    end: this.formatDate(today, 'full')
                };
            }
            case 'month': {
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                return {
                    start: this.formatDate(monthStart, 'full'),
                    end: this.formatDate(today, 'full')
                };
            }
            case 'year': {
                const yearStart = new Date(now.getFullYear(), 0, 1);
                return {
                    start: this.formatDate(yearStart, 'full'),
                    end: this.formatDate(today, 'full')
                };
            }
            default:
                return {
                    start: this.formatDate(today, 'full'),
                    end: this.formatDate(today, 'full')
                };
        }
    },

    /**
     * 获取分类配置
     */
    getCategories() {
        return {
            expense: [
                { id: 'food', name: '餐饮', icon: 'fa-utensils' },
                { id: 'transport', name: '交通', icon: 'fa-car' },
                { id: 'shopping', name: '购物', icon: 'fa-shopping-bag' },
                { id: 'housing', name: '住房', icon: 'fa-home' },
                { id: 'entertainment', name: '娱乐', icon: 'fa-gamepad' },
                { id: 'education', name: '教育', icon: 'fa-book' },
                { id: 'medical', name: '医疗', icon: 'fa-heartbeat' },
                { id: 'clothing', name: '服饰', icon: 'fa-tshirt' },
                { id: 'communication', name: '通讯', icon: 'fa-mobile-alt' },
                { id: 'gift', name: '礼物', icon: 'fa-gift' },
                { id: 'travel', name: '旅行', icon: 'fa-plane' },
                { id: 'other', name: '其他', icon: 'fa-ellipsis-h' }
            ],
            income: [
                { id: 'salary', name: '工资', icon: 'fa-briefcase' },
                { id: 'bonus', name: '奖金', icon: 'fa-trophy' },
                { id: 'investment', name: '投资', icon: 'fa-chart-line' },
                { id: 'parttime', name: '兼职', icon: 'fa-hand-holding-usd' },
                { id: 'redpacket', name: '红包', icon: 'fa-envelope' },
                { id: 'refund', name: '退款', icon: 'fa-undo' },
                { id: 'other', name: '其他', icon: 'fa-ellipsis-h' }
            ]
        };
    },

    /**
     * 根据分类ID获取分类信息
     */
    getCategoryById(categoryId, type) {
        const categories = this.getCategories()[type];
        return categories.find(cat => cat.id === categoryId) || { id: 'other', name: '其他', icon: 'fa-ellipsis-h' };
    },

    /**
     * 智能分类（根据交易描述）
     * @param {string} description - 交易描述
     * @param {string} type - 类型
     * @returns {string} 分类ID
     */
    guessCategory(description, type) {
        if (type === 'income') {
            if (/工资|薪资|薪酬/.test(description)) return 'salary';
            if (/奖金|绩效/.test(description)) return 'bonus';
            if (/利息|分红|收益/.test(description)) return 'investment';
            if (/红包/.test(description)) return 'redpacket';
            if (/退款/.test(description)) return 'refund';
            return 'other';
        }

        // 支出分类
        if (/餐|饭|食|外卖|美团|饿了么|肯德基|麦当劳|星巴克|奶茶|咖啡/.test(description)) return 'food';
        if (/滴滴|出租|地铁|公交|高铁|火车|飞机|加油|停车|打车/.test(description)) return 'transport';
        if (/淘宝|天猫|京东|拼多多|超市|商场|购物/.test(description)) return 'shopping';
        if (/房租|水费|电费|燃气|物业/.test(description)) return 'housing';
        if (/游戏|电影|KTV|旅游|门票/.test(description)) return 'entertainment';
        if (/学费|培训|课程|书籍/.test(description)) return 'education';
        if (/医院|药|挂号|体检/.test(description)) return 'medical';
        if (/服装|衣服|鞋|帽/.test(description)) return 'clothing';
        if (/话费|流量|宽带|充值/.test(description)) return 'communication';
        if (/礼物|礼品|鲜花/.test(description)) return 'gift';
        return 'other';
    },

    /**
     * 获取账户显示名称
     */
    getAccountName(account) {
        const names = {
            wechat: '微信',
            alipay: '支付宝',
            cash: '现金'
        };
        return names[account] || account;
    },

    /**
     * 显示提示消息
     */
    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');

        toastMessage.textContent = message;
        toast.className = 'toast ' + type;

        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => toast.classList.remove('show'), 3000);
    },

    /**
     * 验证金额
     */
    validateAmount(amount) {
        const num = parseFloat(amount);
        return !isNaN(num) && num > 0 && num < 10000000;
    },

    /**
     * 防抖函数
     * @param {Function} func - 要执行的函数
     * @param {number} wait - 等待时间（毫秒）
     * @returns {Function} 防抖后的函数
     */
    debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};
