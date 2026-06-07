/**
 * 常用模板模块
 * 保存和使用常用记录模板
 */

const TemplateModule = {
    /** 存储键名 */
    STORAGE_KEY: 'record_templates',

    /**
     * 初始化
     */
    init() {
        this.bindEvents();
        this.render();
    },

    /**
     * 绑定事件
     */
    bindEvents() {
        const btnAdd = document.getElementById('btnAddTemplate');
        if (btnAdd) {
            btnAdd.addEventListener('click', () => this.saveCurrentAsTemplate());
        }
    },

    /**
     * 获取所有模板
     * @returns {Array} 模板数组
     */
    getAll() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('读取模板失败:', error);
            return [];
        }
    },

    /**
     * 保存所有模板
     * @param {Array} templates - 模板数组
     */
    saveAll(templates) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(templates));
        } catch (error) {
            console.error('保存模板失败:', error);
        }
    },

    /**
     * 添加模板
     * @param {Object} template - 模板对象
     */
    add(template) {
        const templates = this.getAll();

        // 检查是否已存在相同模板
        const exists = templates.some(t =>
            t.type === template.type &&
            t.amount === template.amount &&
            t.category === template.category &&
            t.note === template.note
        );

        if (exists) {
            Utils.showToast('该模板已存在', 'error');
            return;
        }

        // 最多保存10个模板
        if (templates.length >= 10) {
            templates.pop();
        }

        templates.unshift({
            id: Utils.generateId(),
            ...template,
            createdAt: new Date().toISOString()
        });

        this.saveAll(templates);
        this.render();
        Utils.showToast('模板已保存');
    },

    /**
     * 删除模板
     * @param {string} id - 模板ID
     */
    delete(id) {
        let templates = this.getAll();
        templates = templates.filter(t => t.id !== id);
        this.saveAll(templates);
        this.render();
    },

    /**
     * 使用模板
     * @param {string} id - 模板ID
     */
    use(id) {
        const templates = this.getAll();
        const template = templates.find(t => t.id === id);

        if (!template) return;

        // 填充表单
        App.switchType(template.type);
        document.getElementById('inputAmount').value = template.amount;
        document.getElementById('inputNote').value = template.note || '';
        document.getElementById('inputDate').value = Utils.getToday();
        App.selectCategory(template.category);

        Utils.showToast('已填充模板');
    },

    /**
     * 保存当前表单为模板
     */
    saveCurrentAsTemplate() {
        const amount = document.getElementById('inputAmount').value;
        const note = document.getElementById('inputNote').value.trim();
        const category = App.state.currentCategory;

        if (!amount || parseFloat(amount) <= 0) {
            Utils.showToast('请先输入金额', 'error');
            return;
        }

        if (!category) {
            Utils.showToast('请先选择分类', 'error');
            return;
        }

        this.add({
            type: App.state.currentType,
            amount: parseFloat(amount).toFixed(2),
            category: category,
            note: note
        });
    },

    /**
     * 渲染模板列表
     */
    render() {
        const container = document.getElementById('templateList');
        if (!container) return;

        const templates = this.getAll();

        if (templates.length === 0) {
            container.innerHTML = '<div class="template-empty">暂无常用记录，输入金额后点击"存为模板"</div>';
            return;
        }

        container.innerHTML = templates.map(template => {
            const category = Utils.getCategoryById(template.category, template.type);
            const amountPrefix = template.type === 'income' ? '+' : '-';

            return `
                <div class="template-item ${template.type}" data-id="${template.id}">
                    <div class="template-icon">
                        <i class="fas ${category.icon}"></i>
                    </div>
                    <div class="template-info">
                        <span class="template-name">${template.note || category.name}</span>
                        <span class="template-amount">${amountPrefix}¥${template.amount}</span>
                    </div>
                    <button class="btn-delete-template" data-id="${template.id}">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
        }).join('');

        // 绑定点击事件
        container.querySelectorAll('.template-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.btn-delete-template')) {
                    this.use(item.dataset.id);
                }
            });
        });

        // 绑定删除事件
        container.querySelectorAll('.btn-delete-template').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.delete(btn.dataset.id);
            });
        });
    }
};
