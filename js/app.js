/**
 * 主应用模块
 * 处理用户交互和界面更新
 */

// 错误处理
window.onerror = function(msg, url, line, col, error) {
    console.error('全局错误:', msg, url, line, col, error);
    return false;
};

const App = {
    /** 当前状态 */
    state: {
        currentType: 'expense',
        currentAccount: 'wechat',
        currentCategory: null,
        currentFilter: {
            startDate: null,
            endDate: null,
            account: 'all',
            type: 'all',
            keyword: ''
        },
        editingId: null,
        deletingId: null,
        selectedYear: new Date().getFullYear(),
        selectedMonth: new Date().getMonth() + 1
    },

    /**
     * 初始化应用
     */
    init() {
        try {
            // 设置全局引用，供导入模块调用
            window.App = this;

            this.bindElements();
            this.bindEvents();
            this.setDefaultDate();
            this.initDateRange();
            this.updateMonthDisplay();
            this.renderCategories();
            this.refresh();

            // 初始化导入模块
            if (typeof ImportModule !== 'undefined') {
                ImportModule.init();
            }

            // 初始化图表模块
            if (typeof ChartModule !== 'undefined') {
                ChartModule.init();
            }

            // 初始化预算模块
            if (typeof BudgetModule !== 'undefined') {
                BudgetModule.updateDisplay();
            }

            // 初始化导出模块
            if (typeof ExportModule !== 'undefined') {
                ExportModule.init();
            }

            // 初始化主题模块
            if (typeof ThemeModule !== 'undefined') {
                ThemeModule.init();
            }

            // 初始化语音记账模块
            if (typeof VoiceModule !== 'undefined') {
                VoiceModule.init();
            }

            // 初始化常用模板模块
            if (typeof TemplateModule !== 'undefined') {
                TemplateModule.init();
            }

            console.log('记账本应用已初始化');
        } catch (error) {
            console.error('应用初始化失败:', error);
        }
    },

    /**
     * 清空所有数据
     */
    clearAllData() {
        try {
            Storage.clearAll();
            this.refresh();
            Utils.showToast('所有数据已清空');
        } catch (error) {
            console.error('清空数据失败:', error);
        }
    },

    /**
     * 刷新所有数据
     */
    refresh() {
        this.updateSummary();
        this.renderRecords();
        ChartModule.update();
        BudgetModule.updateDisplay();
    },

    /**
     * 绑定DOM元素
     */
    bindElements() {
        // 按钮
        this.btnAdd = document.getElementById('btnAdd');
        this.btnImport = document.getElementById('btnImport');
        this.btnClear = document.getElementById('btnClear');
        this.btnBudget = document.getElementById('btnBudget');
        this.btnExport = document.getElementById('btnExport');
        this.btnTheme = document.getElementById('btnTheme');
        this.btnClose = document.getElementById('btnClose');
        this.btnCancel = document.getElementById('btnCancel');

        // 搜索
        this.searchInput = document.getElementById('searchInput');
        this.btnClearSearch = document.getElementById('btnClearSearch');
        this.btnSave = document.getElementById('btnSave');
        this.btnImportClose = document.getElementById('btnImportClose');
        this.btnImportCancel = document.getElementById('btnImportCancel');
        this.btnDeleteClose = document.getElementById('btnDeleteClose');
        this.btnDeleteCancel = document.getElementById('btnDeleteCancel');
        this.btnDeleteConfirm = document.getElementById('btnDeleteConfirm');
        this.btnResetFilter = document.getElementById('btnResetFilter');
        this.btnClearClose = document.getElementById('btnClearClose');
        this.btnClearCancel = document.getElementById('btnClearCancel');
        this.btnClearConfirm = document.getElementById('btnClearConfirm');

        // 弹窗
        this.modalOverlay = document.getElementById('modalOverlay');
        this.importModal = document.getElementById('importModal');
        this.deleteModal = document.getElementById('deleteModal');
        this.clearModal = document.getElementById('clearModal');
        this.budgetModal = document.getElementById('budgetModal');
        this.exportModal = document.getElementById('exportModal');
        this.modalTitle = document.getElementById('modalTitle');

        // 预算相关
        this.inputBudget = document.getElementById('inputBudget');
        this.btnBudgetClose = document.getElementById('btnBudgetClose');
        this.btnBudgetCancel = document.getElementById('btnBudgetCancel');
        this.btnBudgetSave = document.getElementById('btnBudgetSave');

        // 导出相关
        this.btnExportClose = document.getElementById('btnExportClose');
        this.btnExportCancel = document.getElementById('btnExportCancel');

        // 表单元素
        this.inputAmount = document.getElementById('inputAmount');
        this.inputDate = document.getElementById('inputDate');
        this.inputNote = document.getElementById('inputNote');
        this.categoryGrid = document.getElementById('categoryGrid');

        // 日期筛选
        this.dateStart = document.getElementById('dateStart');
        this.dateEnd = document.getElementById('dateEnd');

        // 统计显示
        this.monthIncome = document.getElementById('monthIncome');
        this.monthExpense = document.getElementById('monthExpense');
        this.wechatIncome = document.getElementById('wechatIncome');
        this.wechatExpense = document.getElementById('wechatExpense');
        this.alipayIncome = document.getElementById('alipayIncome');
        this.alipayExpense = document.getElementById('alipayExpense');
        this.cashIncome = document.getElementById('cashIncome');
        this.cashExpense = document.getElementById('cashExpense');

        // 记录列表
        this.recordsList = document.getElementById('recordsList');
        this.recordCount = document.getElementById('recordCount');
        this.filterIncome = document.getElementById('filterIncome');
        this.filterExpense = document.getElementById('filterExpense');

        // 类型切换按钮
        this.typeBtns = document.querySelectorAll('.type-btn');

        // 账户选择按钮
        this.accountBtns = document.querySelectorAll('.account-btn');
        this.accountFilterBtns = document.querySelectorAll('.account-filter-btn');
        this.typeFilterBtns = document.querySelectorAll('.type-filter-btn');

        // 快捷日期按钮
        this.quickDateBtns = document.querySelectorAll('.quick-date-btn');

        // 月份选择器
        this.prevMonth = document.getElementById('prevMonth');
        this.nextMonth = document.getElementById('nextMonth');
        this.currentMonth = document.getElementById('currentMonth');
        this.btnToday = document.getElementById('btnToday');
        this.totalTitle = document.getElementById('totalTitle');
    },

    /**
     * 绑定事件监听
     */
    bindEvents() {
        // 安全绑定事件的辅助函数
        const safeBind = (element, event, handler) => {
            if (element) {
                element.addEventListener(event, handler);
            }
        };

        // 打开记账弹窗
        safeBind(this.btnAdd, 'click', () => this.openModal());
        safeBind(this.btnImport, 'click', () => this.openImportModal());
        safeBind(this.btnClear, 'click', () => this.openClearModal());
        safeBind(this.btnBudget, 'click', () => this.openBudgetModal());
        safeBind(this.btnExport, 'click', () => this.openExportModal());
        safeBind(this.btnTheme, 'click', () => ThemeModule.toggle());

        // 搜索功能
        safeBind(this.searchInput, 'input', Utils.debounce(() => {
            this.state.currentFilter.keyword = this.searchInput.value.trim();
            this.btnClearSearch.style.display = this.searchInput.value ? 'flex' : 'none';
            this.refresh();
        }, 300));

        safeBind(this.btnClearSearch, 'click', () => {
            this.searchInput.value = '';
            this.state.currentFilter.keyword = '';
            this.btnClearSearch.style.display = 'none';
            this.refresh();
        });

        // 关闭弹窗
        safeBind(this.btnClose, 'click', () => this.closeModal());
        safeBind(this.btnCancel, 'click', () => this.closeModal());
        safeBind(this.btnImportClose, 'click', () => this.closeImportModal());
        safeBind(this.btnImportCancel, 'click', () => this.closeImportModal());
        safeBind(this.btnClearClose, 'click', () => this.closeClearModal());
        safeBind(this.btnClearCancel, 'click', () => this.closeClearModal());
        safeBind(this.btnBudgetClose, 'click', () => this.closeBudgetModal());
        safeBind(this.btnBudgetCancel, 'click', () => this.closeBudgetModal());
        safeBind(this.btnExportClose, 'click', () => this.closeExportModal());
        safeBind(this.btnExportCancel, 'click', () => this.closeExportModal());

        // 点击遮罩层关闭弹窗（仅当点击遮罩本身时，不含弹窗内部）
        safeBind(this.modalOverlay, 'click', (e) => { if (e.target === this.modalOverlay) this.closeModal(); });
        safeBind(this.importModal, 'click', (e) => { if (e.target === this.importModal) this.closeImportModal(); });
        safeBind(this.clearModal, 'click', (e) => { if (e.target === this.clearModal) this.closeClearModal(); });
        safeBind(this.budgetModal, 'click', (e) => { if (e.target === this.budgetModal) this.closeBudgetModal(); });
        safeBind(this.exportModal, 'click', (e) => { if (e.target === this.exportModal) this.closeExportModal(); });
        safeBind(this.deleteModal, 'click', (e) => { if (e.target === this.deleteModal) this.closeDeleteModal(); });

        // 保存记录
        safeBind(this.btnSave, 'click', () => this.saveRecord());

        // 保存预算
        safeBind(this.btnBudgetSave, 'click', () => this.saveBudget());

        // 预算快捷按钮
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.inputBudget) {
                    this.inputBudget.value = btn.dataset.amount;
                }
            });
        });

        // 类型切换
        this.typeBtns.forEach(btn => {
            btn.addEventListener('click', () => this.switchType(btn.dataset.type));
        });

        // 账户切换（记账弹窗）
        this.accountBtns.forEach(btn => {
            btn.addEventListener('click', () => this.switchAccount(btn.dataset.account));
        });

        // 账户筛选
        this.accountFilterBtns.forEach(btn => {
            btn.addEventListener('click', () => this.filterByAccount(btn.dataset.account));
        });

        // 类型筛选
        this.typeFilterBtns.forEach(btn => {
            btn.addEventListener('click', () => this.filterByType(btn.dataset.type));
        });

        // 快捷日期
        this.quickDateBtns.forEach(btn => {
            btn.addEventListener('click', () => this.setQuickDate(btn.dataset.range));
        });

        // 月份选择器
        safeBind(this.prevMonth, 'click', () => this.changeMonth(-1));
        safeBind(this.nextMonth, 'click', () => this.changeMonth(1));
        safeBind(this.btnToday, 'click', () => this.goToToday());

        // 日期范围变化
        safeBind(this.dateStart, 'change', () => this.applyDateFilter());
        safeBind(this.dateEnd, 'change', () => this.applyDateFilter());

        // 重置筛选
        safeBind(this.btnResetFilter, 'click', () => this.resetFilter());

        // 删除确认
        safeBind(this.btnDeleteClose, 'click', () => this.closeDeleteModal());
        safeBind(this.btnDeleteCancel, 'click', () => this.closeDeleteModal());
        safeBind(this.btnDeleteConfirm, 'click', () => this.confirmDelete());

        // 清空确认
        safeBind(this.btnClearConfirm, 'click', () => {
            this.clearAllData();
            this.closeClearModal();
        });

        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                this.closeImportModal();
                this.closeDeleteModal();
                this.closeClearModal();
                this.closeBudgetModal();
                this.closeExportModal();
            }
        });
    },

    /**
     * 设置默认日期为今天
     */
    setDefaultDate() {
        this.inputDate.value = Utils.getToday();
    },

    /**
     * 初始化日期范围（默认本月）
     */
    initDateRange() {
        const range = Utils.getDateRange('month');
        this.dateStart.value = range.start;
        this.dateEnd.value = range.end;
        this.state.currentFilter.startDate = range.start;
        this.state.currentFilter.endDate = range.end;
    },

    /**
     * 切换月份
     * @param {number} delta - 月份变化量（-1或1）
     */
    changeMonth(delta) {
        this.state.selectedMonth += delta;

        // 处理月份溢出
        if (this.state.selectedMonth > 12) {
            this.state.selectedMonth = 1;
            this.state.selectedYear++;
        } else if (this.state.selectedMonth < 1) {
            this.state.selectedMonth = 12;
            this.state.selectedYear--;
        }

        this.updateMonthDisplay();
        this.updateDateFilterByMonth();
        this.refresh();
    },

    /**
     * 回到本月
     */
    goToToday() {
        const now = new Date();
        this.state.selectedYear = now.getFullYear();
        this.state.selectedMonth = now.getMonth() + 1;

        this.updateMonthDisplay();
        this.updateDateFilterByMonth();
        this.refresh();
    },

    /**
     * 更新月份显示
     */
    updateMonthDisplay() {
        const now = new Date();
        const isCurrentMonth = this.state.selectedYear === now.getFullYear() &&
                               this.state.selectedMonth === now.getMonth() + 1;

        this.currentMonth.textContent = `${this.state.selectedYear}年${this.state.selectedMonth}月`;
        this.totalTitle.textContent = isCurrentMonth ? '本月总计' : `${this.state.selectedMonth}月总计`;

        // 显示/隐藏"回到本月"按钮
        if (isCurrentMonth) {
            this.btnToday.classList.add('hidden');
        } else {
            this.btnToday.classList.remove('hidden');
        }
    },

    /**
     * 根据选择的月份更新日期筛选
     */
    updateDateFilterByMonth() {
        const year = this.state.selectedYear;
        const month = this.state.selectedMonth;
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = new Date(year, month, 0); // 获取该月最后一天
        const endDateStr = `${year}-${String(month).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

        this.dateStart.value = startDate;
        this.dateEnd.value = endDateStr;
        this.state.currentFilter.startDate = startDate;
        this.state.currentFilter.endDate = endDateStr;
    },

    /**
     * 设置快捷日期
     */
    setQuickDate(range) {
        const dateRange = Utils.getDateRange(range);
        this.dateStart.value = dateRange.start;
        this.dateEnd.value = dateRange.end;
        this.state.currentFilter.startDate = dateRange.start;
        this.state.currentFilter.endDate = dateRange.end;

        // 更新按钮状态
        this.quickDateBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.range === range);
        });

        this.refresh();
    },

    /**
     * 应用日期筛选
     */
    applyDateFilter() {
        this.state.currentFilter.startDate = this.dateStart.value;
        this.state.currentFilter.endDate = this.dateEnd.value;

        // 取消快捷日期选中状态
        this.quickDateBtns.forEach(btn => btn.classList.remove('active'));

        this.refresh();
    },

    /**
     * 按账户筛选
     */
    filterByAccount(account) {
        this.state.currentFilter.account = account;

        // 更新按钮状态
        this.accountFilterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.account === account);
        });

        this.refresh();
    },

    /**
     * 按类型筛选
     */
    filterByType(type) {
        this.state.currentFilter.type = type;

        // 更新按钮状态
        this.typeFilterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === type);
        });

        this.refresh();
    },

    /**
     * 重置筛选
     */
    resetFilter() {
        // 重置为本月
        const now = new Date();
        this.state.selectedYear = now.getFullYear();
        this.state.selectedMonth = now.getMonth() + 1;
        this.updateMonthDisplay();

        this.initDateRange();
        this.state.currentFilter.account = 'all';
        this.state.currentFilter.type = 'all';
        this.state.currentFilter.keyword = '';

        // 重置搜索框
        this.searchInput.value = '';
        this.btnClearSearch.style.display = 'none';

        // 重置按钮状态
        this.quickDateBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.range === 'month');
        });
        this.accountFilterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.account === 'all');
        });
        this.typeFilterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === 'all');
        });

        this.refresh();
    },

    /**
     * 切换类型（收入/支出）
     */
    switchType(type) {
        try {
            this.state.currentType = type;
            this.state.currentCategory = null;

            this.typeBtns.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.type === type);
            });

            this.renderCategories();
        } catch (error) {
            console.error('切换类型失败:', error);
        }
    },

    /**
     * 切换账户（记账弹窗）
     */
    switchAccount(account) {
        try {
            this.state.currentAccount = account;

            this.accountBtns.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.account === account);
            });
        } catch (error) {
            console.error('切换账户失败:', error);
        }
    },

    /**
     * 渲染分类选择器
     */
    renderCategories() {
        try {
            const categories = Utils.getCategories()[this.state.currentType];
            if (!this.categoryGrid) return;

            this.categoryGrid.innerHTML = '';

            categories.forEach(category => {
                const div = document.createElement('div');
                div.className = 'category-item';
                div.dataset.id = category.id;
                div.innerHTML = `
                    <i class="fas ${category.icon}"></i>
                    <span>${category.name}</span>
                `;
                div.addEventListener('click', () => this.selectCategory(category.id));
                this.categoryGrid.appendChild(div);
            });
        } catch (error) {
            console.error('渲染分类失败:', error);
        }
    },

    /**
     * 选择分类
     */
    selectCategory(categoryId) {
        try {
            this.state.currentCategory = categoryId;

            if (this.categoryGrid) {
                this.categoryGrid.querySelectorAll('.category-item').forEach(item => {
                    item.classList.toggle('active', item.dataset.id === categoryId);
                });
            }
        } catch (error) {
            console.error('选择分类失败:', error);
        }
    },

    /**
     * 打开记账弹窗
     */
    openModal(id = null) {
        try {
            this.state.editingId = id;

            if (id) {
                this.modalTitle.textContent = '编辑记录';
                const record = Storage.getById(id);
                if (record) {
                    this.state.currentType = record.type;
                    this.state.currentAccount = record.account || 'cash';
                    this.state.currentCategory = record.category;
                    this.inputAmount.value = record.amount;
                    this.inputDate.value = record.date;
                    this.inputNote.value = record.note || '';

                    this.typeBtns.forEach(btn => {
                        btn.classList.toggle('active', btn.dataset.type === record.type);
                    });
                    this.accountBtns.forEach(btn => {
                        btn.classList.toggle('active', btn.dataset.account === this.state.currentAccount);
                    });
                    this.renderCategories();
                    this.selectCategory(record.category);
                }
            } else {
                this.modalTitle.textContent = '新建记账';
                this.resetForm();
            }

            this.modalOverlay.classList.add('active');
            this.inputAmount.focus();
        } catch (error) {
            console.error('打开弹窗失败:', error);
        }
    },

    /**
     * 关闭记账弹窗
     */
    closeModal() {
        try {
            if (this.modalOverlay) {
                this.modalOverlay.classList.remove('active');
            }
            this.state.editingId = null;
            this.resetForm();
        } catch (error) {
            console.error('关闭弹窗失败:', error);
        }
    },

    /**
     * 打开导入弹窗
     */
    openImportModal() {
        try {
            if (this.importModal) {
                this.importModal.classList.add('active');
            }
        } catch (error) {
            console.error('打开导入弹窗失败:', error);
        }
    },

    /**
     * 关闭导入弹窗
     */
    closeImportModal() {
        try {
            if (this.importModal) {
                this.importModal.classList.remove('active');
            }
            if (typeof ImportModule !== 'undefined') {
                ImportModule.removeFile();
            }
        } catch (error) {
            console.error('关闭导入弹窗失败:', error);
        }
    },

    /**
     * 打开清空确认弹窗
     */
    openClearModal() {
        try {
            if (this.clearModal) {
                this.clearModal.classList.add('active');
            }
        } catch (error) {
            console.error('打开清空弹窗失败:', error);
        }
    },

    /**
     * 关闭清空确认弹窗
     */
    closeClearModal() {
        try {
            if (this.clearModal) {
                this.clearModal.classList.remove('active');
            }
        } catch (error) {
            console.error('关闭清空弹窗失败:', error);
        }
    },

    /**
     * 打开预算管理弹窗
     */
    openBudgetModal() {
        try {
            BudgetModule.updateModalDisplay();
            if (this.budgetModal) {
                this.budgetModal.classList.add('active');
            }
        } catch (error) {
            console.error('打开预算弹窗失败:', error);
        }
    },

    /**
     * 关闭预算管理弹窗
     */
    closeBudgetModal() {
        try {
            if (this.budgetModal) {
                this.budgetModal.classList.remove('active');
            }
        } catch (error) {
            console.error('关闭预算弹窗失败:', error);
        }
    },

    /**
     * 保存预算
     */
    saveBudget() {
        try {
            const amount = this.inputBudget.value;

            if (amount && parseFloat(amount) < 0) {
                Utils.showToast('请输入有效的预算金额', 'error');
                return;
            }

            BudgetModule.setBudget(amount || 0);
            BudgetModule.updateDisplay();
            this.closeBudgetModal();

            if (parseFloat(amount) > 0) {
                Utils.showToast(`预算已设置为 ${Utils.formatAmount(amount)}`);
            } else {
                Utils.showToast('预算已清除');
            }
        } catch (error) {
            console.error('保存预算失败:', error);
            Utils.showToast('保存预算失败', 'error');
        }
    },

    /**
     * 打开导出弹窗
     */
    openExportModal() {
        try {
            if (this.exportModal) {
                this.exportModal.classList.add('active');
            }
        } catch (error) {
            console.error('打开导出弹窗失败:', error);
        }
    },

    /**
     * 关闭导出弹窗
     */
    closeExportModal() {
        try {
            if (this.exportModal) {
                this.exportModal.classList.remove('active');
            }
        } catch (error) {
            console.error('关闭导出弹窗失败:', error);
        }
    },

    /**
     * 重置表单
     */
    resetForm() {
        try {
            this.state.currentType = 'expense';
            this.state.currentAccount = 'wechat';
            this.state.currentCategory = null;

            if (this.inputAmount) this.inputAmount.value = '';
            if (this.inputNote) this.inputNote.value = '';
            this.setDefaultDate();

            this.typeBtns.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.type === 'expense');
            });
            this.accountBtns.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.account === 'wechat');
            });

            this.renderCategories();
        } catch (error) {
            console.error('重置表单失败:', error);
        }
    },

    /**
     * 保存记录
     */
    saveRecord() {
        try {
            const amount = this.inputAmount.value;
            const date = this.inputDate.value;
            const note = this.inputNote.value.trim();

            // 验证
            if (!Utils.validateAmount(amount)) {
                Utils.showToast('请输入有效的金额', 'error');
                return;
            }

            if (!this.state.currentCategory) {
                Utils.showToast('请选择分类', 'error');
                return;
            }

            if (!date) {
                Utils.showToast('请选择日期', 'error');
                return;
            }

            // 创建记录
            const record = {
                type: this.state.currentType,
                amount: parseFloat(amount).toFixed(2),
                account: this.state.currentAccount,
                category: this.state.currentCategory,
                date: date,
                note: note
            };

            if (this.state.editingId) {
                Storage.update(this.state.editingId, record);
                Utils.showToast('记录已更新');
            } else {
                Storage.add(record);
                Utils.showToast('记录已保存');
            }

            this.closeModal();
            this.refresh();
        } catch (error) {
            console.error('保存记录失败:', error);
            Utils.showToast('保存失败', 'error');
        }
    },

    /**
     * 更新统计摘要
     */
    updateSummary() {
        try {
            // 获取选择月份的数据
            const year = this.state.selectedYear;
            const month = this.state.selectedMonth;
            const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
            const endDate = new Date(year, month, 0);
            const endDateStr = `${year}-${String(month).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

            const monthStats = Storage.getStats({
                startDate: startDate,
                endDate: endDateStr
            });

            // 更新总览卡片
            if (this.monthIncome) this.monthIncome.textContent = Utils.formatAmount(monthStats.total.income);
            if (this.monthExpense) this.monthExpense.textContent = Utils.formatAmount(monthStats.total.expense);

            // 更新微信卡片
            if (this.wechatIncome) this.wechatIncome.textContent = Utils.formatAmount(monthStats.wechat.income);
            if (this.wechatExpense) this.wechatExpense.textContent = Utils.formatAmount(monthStats.wechat.expense);

            // 更新支付宝卡片
            if (this.alipayIncome) this.alipayIncome.textContent = Utils.formatAmount(monthStats.alipay.income);
            if (this.alipayExpense) this.alipayExpense.textContent = Utils.formatAmount(monthStats.alipay.expense);

            // 更新现金卡片
            if (this.cashIncome) this.cashIncome.textContent = Utils.formatAmount(monthStats.cash.income);
            if (this.cashExpense) this.cashExpense.textContent = Utils.formatAmount(monthStats.cash.expense);

            // 更新筛选统计
            const filterStats = Storage.getStats(this.state.currentFilter);
            const filteredRecords = Storage.filter(this.state.currentFilter);
            if (this.recordCount) this.recordCount.textContent = filteredRecords.length;
            if (this.filterIncome) this.filterIncome.textContent = Utils.formatAmount(filterStats.total.income);
            if (this.filterExpense) this.filterExpense.textContent = Utils.formatAmount(filterStats.total.expense);
        } catch (error) {
            console.error('更新统计失败:', error);
        }
    },

    /**
     * 渲染记录列表
     */
    renderRecords() {
        const dateGroups = Storage.getStatsByDate(this.state.currentFilter);
        const dates = Object.keys(dateGroups).sort((a, b) => b.localeCompare(a));

        if (dates.length === 0) {
            this.recordsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-receipt"></i>
                    <p>还没有记录</p>
                    <p class="empty-hint">点击"记一笔"或"导入账单"开始</p>
                </div>
            `;
            return;
        }

        let html = '';

        dates.forEach(date => {
            const group = dateGroups[date];
            const dateDisplay = Utils.formatDate(date, 'chinese');

            // 日期分组头
            html += `
                <div class="record-date-group">
                    <span>${dateDisplay}</span>
                    <span class="date-total">
                        收: ${Utils.formatAmount(group.income)} | 支: ${Utils.formatAmount(group.expense)}
                    </span>
                </div>
            `;

            // 该日期下的记录
            group.records.forEach(record => {
                const category = Utils.getCategoryById(record.category, record.type);
                const amountPrefix = record.type === 'income' ? '+' : '-';
                const accountName = Utils.getAccountName(record.account);

                html += `
                    <div class="record-item ${record.type}" data-id="${record.id}">
                        <div class="record-icon">
                            <i class="fas ${category.icon}"></i>
                        </div>
                        <div class="record-info">
                            <div class="record-category">${category.name}</div>
                            <div class="record-note">${record.note || '无备注'}</div>
                            <div class="record-account ${record.account}">
                                <i class="fas fa-circle" style="font-size: 6px;"></i>
                                ${accountName}
                            </div>
                        </div>
                        <div class="record-right">
                            <div class="record-amount">${amountPrefix}¥${record.amount}</div>
                        </div>
                        <button class="record-delete" onclick="App.deleteRecord('${record.id}')">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                `;
            });
        });

        this.recordsList.innerHTML = html;

        // 绑定点击事件（编辑）
        this.recordsList.querySelectorAll('.record-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.record-delete')) {
                    this.openModal(item.dataset.id);
                }
            });
        });
    },

    /**
     * 删除记录
     */
    deleteRecord(id) {
        try {
            this.state.deletingId = id;
            if (this.deleteModal) {
                this.deleteModal.classList.add('active');
            }
        } catch (error) {
            console.error('打开删除弹窗失败:', error);
        }
    },

    /**
     * 关闭删除确认弹窗
     */
    closeDeleteModal() {
        try {
            if (this.deleteModal) {
                this.deleteModal.classList.remove('active');
            }
            this.state.deletingId = null;
        } catch (error) {
            console.error('关闭删除弹窗失败:', error);
        }
    },

    /**
     * 确认删除
     */
    confirmDelete() {
        try {
            if (this.state.deletingId) {
                Storage.delete(this.state.deletingId);
                Utils.showToast('记录已删除');
                this.closeDeleteModal();
                this.refresh();
            }
        } catch (error) {
            console.error('删除记录失败:', error);
        }
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
