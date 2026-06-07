/**
 * 本地存储管理模块
 * 使用LocalStorage存储记账数据
 * 确保数据完整性和准确性
 */

const Storage = {
    /** 存储键名 */
    RECORDS_KEY: 'accounting_records',

    /**
     * 获取所有记录
     * @returns {Array} 记录数组
     */
    getAll() {
        try {
            const data = localStorage.getItem(this.RECORDS_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('读取数据失败:', error);
            return [];
        }
    },

    /**
     * 保存所有记录
     * @param {Array} records - 记录数组
     */
    saveAll(records) {
        try {
            localStorage.setItem(this.RECORDS_KEY, JSON.stringify(records));
        } catch (error) {
            console.error('保存数据失败:', error);
            Utils.showToast('保存失败，请检查存储空间', 'error');
        }
    },

    /**
     * 添加记录
     * @param {Object} record - 记录对象
     * @returns {Object} 添加的记录
     */
    add(record) {
        const records = this.getAll();

        // 确保金额是有效的数字
        const amount = parseFloat(record.amount);
        if (isNaN(amount) || amount <= 0) {
            throw new Error('无效的金额');
        }

        const newRecord = {
            ...record,
            id: record.id || Utils.generateId(),
            amount: amount.toFixed(2), // 精确到分
            createdAt: record.createdAt || new Date().toISOString()
        };

        records.unshift(newRecord);
        this.saveAll(records);
        return newRecord;
    },

    /**
     * 批量添加记录（用于导入）
     * @param {Array} newRecords - 记录数组
     * @returns {number} 成功添加的数量
     */
    addBatch(newRecords) {
        const records = this.getAll();
        let addedCount = 0;

        newRecords.forEach(record => {
            const amount = parseFloat(record.amount);
            if (isNaN(amount) || amount <= 0) return;

            // 格式化金额
            const formattedAmount = amount.toFixed(2);

            // 检查是否已存在（根据日期、时间、金额、账户判断）
            // 使用更严格的去重逻辑，避免重复导入
            const exists = records.some(r =>
                r.date === record.date &&
                r.time === record.time &&
                r.amount === formattedAmount &&
                r.account === record.account
            );

            if (!exists) {
                records.unshift({
                    ...record,
                    id: record.id || Utils.generateId(),
                    amount: formattedAmount,
                    createdAt: record.createdAt || new Date().toISOString()
                });
                addedCount++;
            }
        });

        // 按日期排序（最新的在前）
        records.sort((a, b) => {
            const dateA = new Date(a.date + 'T' + (a.time || '00:00:00'));
            const dateB = new Date(b.date + 'T' + (b.time || '00:00:00'));
            return dateB - dateA;
        });

        this.saveAll(records);
        return addedCount;
    },

    /**
     * 删除记录
     * @param {string} id - 记录ID
     * @returns {boolean}
     */
    delete(id) {
        const records = this.getAll();
        const index = records.findIndex(r => r.id === id);

        if (index !== -1) {
            records.splice(index, 1);
            this.saveAll(records);
            return true;
        }
        return false;
    },

    /**
     * 更新记录
     * @param {string} id - 记录ID
     * @param {Object} updates - 更新的数据
     * @returns {Object|null}
     */
    update(id, updates) {
        const records = this.getAll();
        const index = records.findIndex(r => r.id === id);

        if (index !== -1) {
            if (updates.amount) {
                updates.amount = parseFloat(updates.amount).toFixed(2);
            }
            records[index] = { ...records[index], ...updates };
            this.saveAll(records);
            return records[index];
        }
        return null;
    },

    /**
     * 根据ID获取记录
     */
    getById(id) {
        const records = this.getAll();
        return records.find(r => r.id === id) || null;
    },

    /**
     * 按条件筛选记录
     * @param {Object} filter - 筛选条件
     * @returns {Array} 筛选后的记录
     */
    filter(filter = {}) {
        let records = this.getAll();

        // 按日期范围筛选
        if (filter.startDate) {
            records = records.filter(r => r.date >= filter.startDate);
        }
        if (filter.endDate) {
            records = records.filter(r => r.date <= filter.endDate);
        }

        // 按账户筛选
        if (filter.account && filter.account !== 'all') {
            records = records.filter(r => r.account === filter.account);
        }

        // 按类型筛选
        if (filter.type && filter.type !== 'all') {
            records = records.filter(r => r.type === filter.type);
        }

        // 按关键字搜索
        if (filter.keyword) {
            const keyword = filter.keyword.toLowerCase();
            records = records.filter(r => {
                const note = (r.note || '').toLowerCase();
                const category = Utils.getCategoryById(r.category, r.type).name.toLowerCase();
                return note.includes(keyword) || category.includes(keyword);
            });
        }

        return records;
    },

    /**
     * 计算统计数据
     * @param {Object} filter - 筛选条件
     * @returns {Object} 统计数据
     */
    getStats(filter = {}) {
        const records = this.filter(filter);

        const stats = {
            total: { income: 0, expense: 0 },
            wechat: { income: 0, expense: 0 },
            alipay: { income: 0, expense: 0 },
            cash: { income: 0, expense: 0 }
        };

        records.forEach(record => {
            const amount = parseFloat(record.amount);
            const account = record.account || 'cash';

            if (record.type === 'income') {
                stats.total.income = Utils.add(stats.total.income, amount);
                if (stats[account]) {
                    stats[account].income = Utils.add(stats[account].income, amount);
                }
            } else {
                stats.total.expense = Utils.add(stats.total.expense, amount);
                if (stats[account]) {
                    stats[account].expense = Utils.add(stats[account].expense, amount);
                }
            }
        });

        return stats;
    },

    /**
     * 按日期分组统计
     * @param {Object} filter - 筛选条件
     * @returns {Object} 按日期分组的数据
     */
    getStatsByDate(filter = {}) {
        const records = this.filter(filter);
        const dateGroups = {};

        records.forEach(record => {
            if (!dateGroups[record.date]) {
                dateGroups[record.date] = {
                    income: 0,
                    expense: 0,
                    records: []
                };
            }

            const amount = parseFloat(record.amount);
            if (record.type === 'income') {
                dateGroups[record.date].income = Utils.add(dateGroups[record.date].income, amount);
            } else {
                dateGroups[record.date].expense = Utils.add(dateGroups[record.date].expense, amount);
            }

            dateGroups[record.date].records.push(record);
        });

        return dateGroups;
    },

    /**
     * 清空所有数据
     */
    clearAll() {
        localStorage.removeItem(this.RECORDS_KEY);
    },

    /**
     * 导出数据
     * @returns {string} JSON字符串
     */
    export() {
        return JSON.stringify(this.getAll(), null, 2);
    },

    /**
     * 导入数据
     * @param {string} jsonStr - JSON字符串
     * @returns {boolean}
     */
    import(jsonStr) {
        try {
            const records = JSON.parse(jsonStr);
            if (Array.isArray(records)) {
                this.saveAll(records);
                return true;
            }
            return false;
        } catch (error) {
            console.error('导入数据失败:', error);
            return false;
        }
    }
};
