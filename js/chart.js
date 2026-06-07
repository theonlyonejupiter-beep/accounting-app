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
        this.renderExpensePie();
        this.renderIncomePie();
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
    }
};
