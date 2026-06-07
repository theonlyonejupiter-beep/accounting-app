/**
 * 图表模块
 * 使用Chart.js绘制统计图表
 */

const ChartModule = {
    /** 图表实例 */
    charts: {
        expensePie: null,
        incomePie: null,
        dailyTrend: null
    },

    /** 图表颜色方案 */
    colors: [
        '#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd',
        '#ec4899', '#f472b6', '#f9a8d4',
        '#f59e0b', '#fbbf24', '#fcd34d',
        '#10b981', '#34d399', '#6ee7b7',
        '#3b82f6', '#60a5fa', '#93c5fd',
        '#ef4444', '#f87171', '#fca5a5'
    ],

    /**
     * 初始化所有图表
     */
    init() {
        this.renderExpensePie();
        this.renderIncomePie();
        this.renderDailyTrend();
    },

    /**
     * 更新所有图表
     */
    update() {
        this.renderExpenseRank();
        this.renderBudgetProgress();
        this.renderDailyTrend();
    },

    /**
     * 获取分类统计数据
     */
    getCategoryStats(type) {
        const records = Storage.filter({
            startDate: document.getElementById('dateStart').value,
            endDate: document.getElementById('dateEnd').value,
            account: App.state.currentFilter.account,
            type: type
        });

        const stats = {};

        records.forEach(record => {
            const category = record.category || 'other';
            const amount = parseFloat(record.amount);

            if (!stats[category]) {
                stats[category] = 0;
            }
            stats[category] = Utils.add(stats[category], amount);
        });

        // 转换为数组并排序
        const categories = Object.entries(stats).map(([id, amount]) => {
            const categoryInfo = Utils.getCategoryById(id, type);
            return {
                id,
                name: categoryInfo.name,
                icon: categoryInfo.icon,
                amount
            };
        });

        categories.sort((a, b) => b.amount - a.amount);

        return categories;
    },

    /**
     * 渲染支出分类饼图
     */
    renderExpensePie() {
        const ctx = document.getElementById('expensePieChart');
        if (!ctx) return;

        const categories = this.getCategoryStats('expense');

        // 销毁旧图表
        if (this.charts.expensePie) {
            this.charts.expensePie.destroy();
        }

        if (categories.length === 0) {
            ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
            document.getElementById('expenseLegend').innerHTML = '<div class="empty-chart">暂无支出数据</div>';
            return;
        }

        // 计算总数
        const total = categories.reduce((sum, cat) => Utils.add(sum, cat.amount), 0);

        this.charts.expensePie = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categories.map(cat => cat.name),
                datasets: [{
                    data: categories.map(cat => cat.amount),
                    backgroundColor: this.colors.slice(0, categories.length),
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${context.label}: ¥${value.toFixed(2)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });

        // 渲染自定义图例
        this.renderLegend('expenseLegend', categories, total);
    },

    /**
     * 渲染收入分类饼图
     */
    renderIncomePie() {
        const ctx = document.getElementById('incomePieChart');
        if (!ctx) return;

        const categories = this.getCategoryStats('income');

        // 销毁旧图表
        if (this.charts.incomePie) {
            this.charts.incomePie.destroy();
        }

        if (categories.length === 0) {
            ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
            document.getElementById('incomeLegend').innerHTML = '<div class="empty-chart">暂无收入数据</div>';
            return;
        }

        // 计算总数
        const total = categories.reduce((sum, cat) => Utils.add(sum, cat.amount), 0);

        this.charts.incomePie = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categories.map(cat => cat.name),
                datasets: [{
                    data: categories.map(cat => cat.amount),
                    backgroundColor: this.colors.slice(0, categories.length),
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${context.label}: ¥${value.toFixed(2)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });

        // 渲染自定义图例
        this.renderLegend('incomeLegend', categories, total);
    },

    /**
     * 渲染图例
     */
    renderLegend(elementId, categories, total) {
        const container = document.getElementById(elementId);
        if (!container) return;

        const html = categories.slice(0, 8).map((cat, index) => {
            const percentage = ((cat.amount / total) * 100).toFixed(1);
            return `
                <div class="legend-item">
                    <span class="legend-color" style="background: ${this.colors[index]}"></span>
                    <span>${cat.name} ${percentage}%</span>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    },

    /**
     * 渲染每日收支趋势图
     */
    renderDailyTrend() {
        const ctx = document.getElementById('dailyTrendChart');
        if (!ctx) return;

        const startDate = document.getElementById('dateStart').value;
        const endDate = document.getElementById('dateEnd').value;
        const account = App.state.currentFilter.account;

        // 销毁旧图表
        if (this.charts.dailyTrend) {
            this.charts.dailyTrend.destroy();
        }

        // 获取日期范围内的所有记录
        const records = Storage.filter({
            startDate,
            endDate,
            account
        });

        // 按日期分组统计
        const dailyData = {};

        // 初始化日期范围内的所有日期
        const start = new Date(startDate);
        const end = new Date(endDate);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = Utils.formatDate(d, 'full');
            dailyData[dateStr] = { income: 0, expense: 0 };
        }

        // 统计每天的收支
        records.forEach(record => {
            if (dailyData[record.date]) {
                const amount = parseFloat(record.amount);
                if (record.type === 'income') {
                    dailyData[record.date].income = Utils.add(dailyData[record.date].income, amount);
                } else {
                    dailyData[record.date].expense = Utils.add(dailyData[record.date].expense, amount);
                }
            }
        });

        // 转换为数组
        const dates = Object.keys(dailyData).sort();
        const incomeData = dates.map(d => dailyData[d].income);
        const expenseData = dates.map(d => dailyData[d].expense);

        // 格式化日期标签
        const labels = dates.map(d => {
            const date = new Date(d);
            return `${date.getMonth() + 1}/${date.getDate()}`;
        });

        this.charts.dailyTrend = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: '收入',
                        data: incomeData,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 3,
                        pointHoverRadius: 6
                    },
                    {
                        label: '支出',
                        data: expenseData,
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 3,
                        pointHoverRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            maxTicksLimit: 10,
                            font: {
                                size: 11
                            }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '¥' + value;
                            },
                            font: {
                                size: 11
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 15,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ¥${context.raw.toFixed(2)}`;
                            }
                        }
                    }
                }
            }
        });
    },

    /**
     * 渲染支出分类排行
     */
    renderExpenseRank() {
        try {
            const categories = this.getCategoryStats('expense');
            const rankList = document.getElementById('expenseRankList');
            if (!rankList) return;

            if (categories.length === 0) {
                rankList.innerHTML = '<div class="empty-chart"><i class="fas fa-chart-bar"></i><p>暂无支出数据</p></div>';
                return;
            }

            const total = categories.reduce((sum, cat) => Utils.add(sum, cat.amount), 0);
            const maxAmount = categories[0].amount;
            const displayCategories = categories.slice(0, 6);

            let html = '';
            displayCategories.forEach((cat, index) => {
                const percent = total > 0 ? (cat.amount / total * 100) : 0;
                const barWidth = maxAmount > 0 ? (cat.amount / maxAmount * 100) : 0;
                const color = this.colors[index % this.colors.length];

                html += `
                    <div class="rank-item">
                        <span class="rank-color" style="background: ${color}"></span>
                        <span class="rank-name">${cat.name}</span>
                        <div class="rank-bar-wrapper">
                            <div class="rank-bar" style="width: ${barWidth}%; background: ${color}"></div>
                        </div>
                        <span class="rank-percent">${percent.toFixed(1)}%</span>
                        <span class="rank-amount">${Utils.formatAmount(cat.amount)}</span>
                    </div>
                `;
            });

            rankList.innerHTML = html;
        } catch (error) {
            console.error('渲染支出分类排行失败:', error);
        }
    },

    /**
     * 渲染预算执行进度
     */
    renderBudgetProgress() {
        try {
            const progressList = document.getElementById('budgetProgressList');
            if (!progressList) return;

            // 获取预算设置
            const budgetData = localStorage.getItem('monthly_budget');
            if (!budgetData) {
                progressList.innerHTML = '<div class="empty-chart"><i class="fas fa-tasks"></i><p>暂未设置预算</p></div>';
                return;
            }

            const budget = JSON.parse(budgetData);
            const now = new Date();
            const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

            // 检查是否是本月预算
            if (budget.month !== currentMonth || !budget.amount) {
                progressList.innerHTML = '<div class="empty-chart"><i class="fas fa-tasks"></i><p>暂未设置本月预算</p></div>';
                return;
            }

            // 获取本月支出
            const year = App.state.selectedYear;
            const month = App.state.selectedMonth;
            const daysInMonth = new Date(year, month, 0).getDate();
            const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
            const monthEnd = `${year}-${String(month).padStart(2, '0')}-${daysInMonth}`;
            const monthStats = Storage.getStats({ startDate: monthStart, endDate: monthEnd });

            const budgetAmount = budget.amount;
            const spent = monthStats.total.expense;
            const remaining = Utils.subtract(budgetAmount, spent);
            const percentage = budgetAmount > 0 ? (spent / budgetAmount * 100) : 0;

            // 确定状态
            let status = 'normal';
            let statusText = '正常';
            if (percentage >= 100) {
                status = 'danger';
                statusText = '已超支';
            } else if (percentage >= 90) {
                status = 'warning';
                statusText = '即将超支';
            } else if (percentage >= 80) {
                status = 'warning';
                statusText = '需注意';
            }

            const html = `
                <div class="budget-progress-item">
                    <div class="budget-progress-header">
                        <span class="budget-progress-name">本月总预算</span>
                        <span class="budget-progress-status">${statusText}</span>
                    </div>
                    <div class="budget-progress-bar-wrapper">
                        <div class="budget-progress-bar ${status}" style="width: ${Math.min(percentage, 100)}%"></div>
                    </div>
                    <div class="budget-progress-detail">
                        <span>已用: ${Utils.formatAmount(spent)}</span>
                        <span>预算: ${Utils.formatAmount(budgetAmount)}</span>
                    </div>
                    <div class="budget-progress-detail">
                        <span>剩余: ${Utils.formatAmount(remaining)}</span>
                        <span>${percentage.toFixed(1)}%</span>
                    </div>
                </div>
            `;

            progressList.innerHTML = html;
        } catch (error) {
            console.error('渲染预算执行进度失败:', error);
        }
    }
};
