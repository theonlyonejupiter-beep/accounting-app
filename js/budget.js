/**
 * 预算管理模块
 * 处理预算设置和超支提醒
 */

const BudgetModule = {
    /** 存储键名 */
    STORAGE_KEY: 'monthly_budget',

    /**
     * 获取本月预算
     * @returns {number} 预算金额
     */
    getBudget() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (!data) return 0;

            const budget = JSON.parse(data);
            const now = new Date();
            const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

            // 检查是否是本月的预算
            if (budget.month === currentMonth) {
                return budget.amount || 0;
            }

            return 0;
        } catch (error) {
            console.error('读取预算失败:', error);
            return 0;
        }
    },

    /**
     * 设置本月预算
     * @param {number} amount - 预算金额
     */
    setBudget(amount) {
        try {
            const now = new Date();
            const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

            const budget = {
                month: currentMonth,
                amount: parseFloat(amount) || 0,
                updatedAt: new Date().toISOString()
            };

            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(budget));
        } catch (error) {
            console.error('保存预算失败:', error);
        }
    },

    /**
     * 获取预算状态
     * @returns {Object} 预算状态信息
     */
    getBudgetStatus() {
        const budget = this.getBudget();
        const monthRange = Utils.getDateRange('month');
        const stats = Storage.getStats({
            startDate: monthRange.start,
            endDate: monthRange.end
        });

        const spent = stats.total.expense;
        const remaining = Utils.subtract(budget, spent);
        const percentage = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;

        // 判断状态
        let status = 'normal';
        if (percentage >= 100) {
            status = 'danger';
        } else if (percentage >= 80) {
            status = 'warning';
        }

        return {
            budget,
            spent,
            remaining,
            percentage,
            status
        };
    },

    /**
     * 更新预算显示
     */
    updateDisplay() {
        const status = this.getBudgetStatus();
        const container = document.getElementById('budgetBarContainer');
        const progress = document.getElementById('budgetProgress');
        const info = document.getElementById('budgetInfo');
        const remaining = document.getElementById('budgetRemaining');

        if (!container) return;

        // 如果没有设置预算，隐藏进度条
        if (status.budget <= 0) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';

        // 更新进度条
        progress.style.width = `${status.percentage}%`;
        progress.className = 'budget-progress';
        if (status.status === 'danger') {
            progress.classList.add('danger');
        } else if (status.status === 'warning') {
            progress.classList.add('warning');
        }

        // 更新文字信息
        info.textContent = `已用 ${Utils.formatAmount(status.spent)} / 预算 ${Utils.formatAmount(status.budget)}`;

        // 更新剩余金额
        remaining.textContent = status.remaining >= 0
            ? `剩余 ${Utils.formatAmount(status.remaining)}`
            : `超支 ${Utils.formatAmount(Math.abs(status.remaining))}`;

        remaining.className = 'budget-remaining';
        if (status.remaining >= 0) {
            remaining.classList.add('positive');
        } else {
            remaining.classList.add('negative');
        }

        // 检查是否需要提醒
        this.checkAlert(status);
    },

    /**
     * 检查并显示超支提醒
     */
    checkAlert(status) {
        // 检查是否已经提醒过
        const alertKey = `budget_alert_${status.budget}_${Math.floor(status.percentage / 10)}`;
        const alerted = sessionStorage.getItem(alertKey);

        if (alerted) return;

        if (status.percentage >= 100) {
            Utils.showToast(`⚠️ 预算已超支！已超出 ${Utils.formatAmount(Math.abs(status.remaining))}`, 'error');
            sessionStorage.setItem(alertKey, 'true');
        } else if (status.percentage >= 90) {
            Utils.showToast(`⚠️ 预算即将用完！剩余 ${Utils.formatAmount(status.remaining)}`, 'error');
            sessionStorage.setItem(alertKey, 'true');
        } else if (status.percentage >= 80) {
            Utils.showToast(`💡 预算已使用 ${Math.round(status.percentage)}%，请注意控制支出`);
            sessionStorage.setItem(alertKey, 'true');
        }
    },

    /**
     * 更新预算弹窗显示
     */
    updateModalDisplay() {
        const status = this.getBudgetStatus();
        const inputBudget = document.getElementById('inputBudget');
        const budgetSpent = document.getElementById('budgetSpent');
        const budgetAmount = document.getElementById('budgetAmount');
        const budgetLeft = document.getElementById('budgetLeft');

        if (inputBudget) {
            inputBudget.value = status.budget > 0 ? status.budget : '';
        }

        if (budgetSpent) {
            budgetSpent.textContent = Utils.formatAmount(status.spent);
        }

        if (budgetAmount) {
            budgetAmount.textContent = Utils.formatAmount(status.budget);
        }

        if (budgetLeft) {
            budgetLeft.textContent = Utils.formatAmount(status.remaining);
            budgetLeft.className = 'status-value';
            if (status.remaining < 0) {
                budgetLeft.classList.add('expense');
            }
        }

        // 更新快捷按钮状态
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.classList.toggle('active', parseFloat(btn.dataset.amount) === status.budget);
        });
    }
};
