/**
 * 数据导出模块
 * 支持导出为CSV和JSON格式
 */

const ExportModule = {
    /**
     * 初始化
     */
    init() {
        this.bindEvents();
    },

    /**
     * 绑定事件
     */
    bindEvents() {
        // CSV导出
        const exportCSV = document.getElementById('exportCSV');
        if (exportCSV) {
            exportCSV.addEventListener('click', () => this.exportCSV());
        }

        // JSON导出
        const exportJSON = document.getElementById('exportJSON');
        if (exportJSON) {
            exportJSON.addEventListener('click', () => this.exportJSON());
        }
    },

    /**
     * 导出为CSV
     */
    exportCSV() {
        const records = Storage.getAll();

        if (records.length === 0) {
            Utils.showToast('没有数据可导出', 'error');
            return;
        }

        // CSV标题行
        const headers = ['日期', '时间', '类型', '账户', '分类', '金额', '备注'];

        // 转换数据
        const rows = records.map(record => {
            const category = Utils.getCategoryById(record.category, record.type);
            const accountName = Utils.getAccountName(record.account);
            const typeName = record.type === 'income' ? '收入' : '支出';

            return [
                record.date,
                record.time || '00:00:00',
                typeName,
                accountName,
                category.name,
                record.amount,
                record.note || ''
            ];
        });

        // 生成CSV内容
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        // 添加BOM以支持中文
        const bom = '﻿';
        const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8' });

        // 下载文件
        this.downloadFile(blob, `记账数据_${this.getDateString()}.csv`);

        Utils.showToast(`成功导出 ${records.length} 条记录`);
        this.closeModal();
    },

    /**
     * 导出为JSON
     */
    exportJSON() {
        const records = Storage.getAll();

        if (records.length === 0) {
            Utils.showToast('没有数据可导出', 'error');
            return;
        }

        // 生成JSON内容
        const jsonContent = JSON.stringify(records, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });

        // 下载文件
        this.downloadFile(blob, `记账数据_${this.getDateString()}.json`);

        Utils.showToast(`成功导出 ${records.length} 条记录`);
        this.closeModal();
    },

    /**
     * 下载文件
     */
    downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    /**
     * 获取日期字符串
     */
    getDateString() {
        const now = new Date();
        return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    },

    /**
     * 关闭弹窗
     */
    closeModal() {
        const modal = document.getElementById('exportModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }
};
