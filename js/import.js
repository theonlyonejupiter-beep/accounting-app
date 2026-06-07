/**
 * 账单导入模块
 * 支持支付宝和微信账单导入（Excel和CSV格式）
 */

const ImportModule = {
    /** 当前选择的平台 */
    platform: 'wechat',

    /** 解析后的数据 */
    parsedData: [],

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
        // 安全绑定事件的辅助函数
        const safeBind = (element, event, handler) => {
            if (element) {
                element.addEventListener(event, handler);
            }
        };

        // 平台切换
        document.querySelectorAll('.import-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchPlatform(tab.dataset.platform));
        });

        // 上传区域
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');

        if (uploadArea && fileInput) {
            uploadArea.addEventListener('click', () => fileInput.click());
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.style.borderColor = 'var(--primary-color)';
                uploadArea.style.background = '#f8fafc';
            });
            uploadArea.addEventListener('dragleave', () => {
                uploadArea.style.borderColor = '';
                uploadArea.style.background = '';
            });
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.style.borderColor = '';
                uploadArea.style.background = '';
                const file = e.dataTransfer.files[0];
                if (file) this.handleFile(file);
            });

            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) this.handleFile(file);
            });
        }

        // 移除文件
        const btnRemoveFile = document.getElementById('btnRemoveFile');
        safeBind(btnRemoveFile, 'click', () => this.removeFile());

        // 确认导入
        const btnImportConfirm = document.getElementById('btnImportConfirm');
        safeBind(btnImportConfirm, 'click', () => this.confirmImport());
    },

    /**
     * 切换平台
     */
    switchPlatform(platform) {
        this.platform = platform;

        // 更新标签页状态
        document.querySelectorAll('.import-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.platform === platform);
        });

        // 更新说明内容
        document.getElementById('wechatInstruction').classList.toggle('active', platform === 'wechat');
        document.getElementById('alipayInstruction').classList.toggle('active', platform === 'alipay');

        // 移除已选择的文件
        this.removeFile();
    },

    /**
     * 处理文件
     */
    handleFile(file) {
        const fileName = file.name.toLowerCase();
        const mimeType = file.type;

        console.log('文件名:', file.name);
        console.log('MIME类型:', mimeType);
        console.log('文件大小:', file.size);

        // 显示文件名
        document.getElementById('fileName').textContent = file.name;
        document.getElementById('uploadArea').style.display = 'none';
        document.getElementById('uploadPreview').style.display = 'flex';

        // 读取文件
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target.result;

                // 尝试作为Excel解析
                if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') ||
                    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                    mimeType === 'application/vnd.ms-excel') {

                    console.log('尝试作为Excel文件解析...');
                    this.parseExcel(data);

                } else if (fileName.endsWith('.csv') || mimeType === 'text/csv') {

                    console.log('尝试作为CSV文件解析...');
                    this.parseCSV(data);

                } else {
                    // 尝试两种格式
                    console.log('文件类型不明确，尝试自动检测...');

                    // 先尝试作为Excel
                    try {
                        this.parseExcel(data);
                        if (this.parsedData.length > 0) {
                            console.log('成功识别为Excel格式');
                            return;
                        }
                    } catch (e) {
                        console.log('Excel解析失败，尝试CSV...');
                    }

                    // 再尝试作为CSV
                    try {
                        const text = new TextDecoder('utf-8').decode(data);
                        this.parseCSV(text);
                        if (this.parsedData.length > 0) {
                            console.log('成功识别为CSV格式');
                            return;
                        }
                    } catch (e) {
                        console.log('CSV解析也失败');
                    }

                    throw new Error('无法识别文件格式');
                }
            } catch (error) {
                console.error('解析文件失败:', error);
                Utils.showToast('文件解析失败：' + error.message, 'error');
                this.removeFile();
            }
        };

        reader.onerror = () => {
            console.error('文件读取失败');
            Utils.showToast('文件读取失败', 'error');
            this.removeFile();
        };

        // 始终使用ArrayBuffer读取，这样可以处理Excel和CSV
        reader.readAsArrayBuffer(file);
    },

    /**
     * 移除文件
     */
    removeFile() {
        document.getElementById('uploadArea').style.display = 'block';
        document.getElementById('uploadPreview').style.display = 'none';
        document.getElementById('importPreview').style.display = 'none';
        document.getElementById('btnImportConfirm').disabled = true;
        document.getElementById('fileInput').value = '';
        this.parsedData = [];
    },

    /**
     * 解析Excel文件
     */
    parseExcel(data) {
        try {
            const workbook = XLSX.read(data, { type: 'array' });
            console.log('Excel工作表:', workbook.SheetNames);

            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });

            console.log('Excel数据行数:', jsonData.length);
            console.log('前3行数据:', jsonData.slice(0, 3));

            if (jsonData.length < 2) {
                throw new Error('Excel文件数据不足');
            }

            if (this.platform === 'wechat') {
                this.parsedData = this.parseWechatData(jsonData);
            } else {
                this.parsedData = this.parseAlipayData(jsonData);
            }

            console.log('解析到记录数:', this.parsedData.length);

            if (this.parsedData.length === 0) {
                throw new Error('未找到有效记录，请检查是否选择了正确的平台（微信/支付宝）');
            }

            this.showPreview();
        } catch (error) {
            console.error('Excel解析错误:', error);
            throw error;
        }
    },

    /**
     * 解析CSV文件
     */
    parseCSV(csvText) {
        try {
            // 处理可能的BOM
            if (csvText.charCodeAt(0) === 0xFEFF) {
                csvText = csvText.substring(1);
            }

            const lines = csvText.split(/\r?\n/).filter(line => line.trim());
            console.log('CSV行数:', lines.length);
            console.log('前3行:', lines.slice(0, 3));

            const rows = lines.map(line => this.parseCSVLine(line));

            if (this.platform === 'wechat') {
                this.parsedData = this.parseWechatData(rows);
            } else {
                this.parsedData = this.parseAlipayData(rows);
            }

            console.log('解析到记录数:', this.parsedData.length);

            if (this.parsedData.length === 0) {
                throw new Error('未找到有效记录，请检查是否选择了正确的平台（微信/支付宝）');
            }

            this.showPreview();
        } catch (error) {
            console.error('CSV解析错误:', error);
            throw error;
        }
    },

    /**
     * 解析微信账单数据
     */
    parseWechatData(rows) {
        const records = [];

        // 查找标题行（包含"交易时间"的行）
        let headerIndex = -1;
        for (let i = 0; i < Math.min(rows.length, 20); i++) {
            const row = rows[i];
            if (row && row.length > 0) {
                const rowStr = row.join(',');
                if (rowStr.includes('交易时间') && (rowStr.includes('交易类型') || rowStr.includes('交易对方'))) {
                    headerIndex = i;
                    console.log('找到微信标题行:', i, row);
                    break;
                }
            }
        }

        if (headerIndex === -1) {
            console.error('未找到微信账单标题行');
            throw new Error('未找到微信账单标题行，请确认文件是否为微信账单');
        }

        // 从标题行的下一行开始解析
        for (let i = headerIndex + 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length < 6) continue;

            try {
                // 微信账单列：交易时间,交易类型,交易对方,商品,收/支,金额(元),支付方式,当前状态,...
                const timeValue = row[0];
                const type = row[1] ? row[1].toString().trim() : '';
                const counterpart = row[2] ? row[2].toString().trim() : '';
                const product = row[3] ? row[3].toString().trim() : '';
                const direction = row[4] ? row[4].toString().trim() : '';
                const amountStr = row[5] ? row[5].toString().trim() : '';
                const payment = row[6] ? row[6].toString().trim() : '';
                const status = row[7] ? row[7].toString().trim() : '';

                // 跳过无效行
                if (!timeValue || !amountStr) continue;

                // 跳过汇总行
                const timeStr = timeValue.toString();
                if (timeStr.includes('合计') || timeStr.includes('总计')) continue;

                // 跳过未完成的交易
                if (status && !status.includes('已') && !status.includes('支付') && status !== '') continue;

                // 跳过退款
                if (type.includes('退款') || direction.includes('退款')) continue;

                // 解析金额
                const amount = parseFloat(amountStr);
                if (isNaN(amount) || amount <= 0) continue;

                // 判断收支类型
                const isIncome = direction.includes('收入') || direction.includes('已存入');

                // 解析日期
                let date = '';
                let time = '00:00:00';

                // 检查是否是Excel序列号格式（数字）
                if (typeof timeValue === 'number') {
                    // Excel日期序列号转换
                    const dateObj = this.excelSerialToDate(timeValue);
                    date = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
                    time = `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}:${String(dateObj.getSeconds()).padStart(2, '0')}`;
                } else {
                    // 字符串格式日期
                    const timeStr = timeValue.toString().trim();

                    // 格式1: 2026-06-05 12:00:00
                    // 格式2: 2026/6/5 12:00:00
                    const dateMatch = timeStr.match(/(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})\s*(\d{1,2}:\d{2}(?::\d{2})?)?/);

                    if (dateMatch) {
                        date = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`;
                        time = dateMatch[4] || '00:00:00';
                    } else {
                        console.warn('无法解析日期:', timeStr);
                        continue;
                    }
                }

                // 组合描述
                const note = [counterpart, product].filter(Boolean).join(' - ');

                records.push({
                    id: Utils.generateId(),
                    type: isIncome ? 'income' : 'expense',
                    amount: amount.toFixed(2),
                    account: 'wechat',
                    category: Utils.guessCategory(note, isIncome ? 'income' : 'expense'),
                    date: date,
                    time: time,
                    note: note || '微信交易',
                    source: 'wechat_import',
                    createdAt: new Date().toISOString()
                });
            } catch (error) {
                console.warn('解析第' + i + '行失败:', row, error);
                continue;
            }
        }

        return records;
    },

    /**
     * Excel序列号转日期
     * Excel日期从1900年1月1日开始计算（序列号1 = 1900-01-01）
     * 注意：Excel有一个bug，认为1900年是闰年，所以需要调整
     */
    excelSerialToDate(serial) {
        // Excel日期基准：1899年12月30日（因为Excel的1900年bug）
        const utcDays = Math.floor(serial) - 25569;
        const utcSeconds = utcDays * 86400;

        // 处理小数部分（时间）
        const fractionalDay = serial - Math.floor(serial);
        const totalSeconds = Math.round(fractionalDay * 86400);

        const date = new Date(utcSeconds * 1000);
        date.setSeconds(date.getSeconds() + totalSeconds);

        return date;
    },

    /**
     * 解析支付宝账单数据
     */
    parseAlipayData(rows) {
        const records = [];

        // 查找标题行（包含"交易号"或"交易时间"的行）
        let headerIndex = -1;
        for (let i = 0; i < Math.min(rows.length, 20); i++) {
            const row = rows[i];
            if (row && row.length > 0) {
                const rowStr = row.join(',');
                if (rowStr.includes('交易号') || (rowStr.includes('交易创建时间') && rowStr.includes('金额'))) {
                    headerIndex = i;
                    console.log('找到支付宝标题行:', i, row);
                    break;
                }
            }
        }

        if (headerIndex === -1) {
            console.error('未找到支付宝账单标题行');
            throw new Error('未找到支付宝账单标题行，请确认文件是否为支付宝账单');
        }

        // 从标题行的下一行开始解析
        for (let i = headerIndex + 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length < 10) continue;

            try {
                // 支付宝账单列：交易号,商家订单号,交易创建时间,付款时间,...,商品名称,金额（元）,收/支,交易状态,...
                const tradeNo = row[0] ? row[0].toString().trim() : '';
                const orderNo = row[1] ? row[1].toString().trim() : '';
                const createTime = row[2] ? row[2].toString().trim() : '';
                const payTime = row[3] ? row[3].toString().trim() : '';
                const modifyTime = row[4] ? row[4].toString().trim() : '';
                const source = row[5] ? row[5].toString().trim() : '';
                const type = row[6] ? row[6].toString().trim() : '';
                const counterpart = row[7] ? row[7].toString().trim() : '';
                const product = row[8] ? row[8].toString().trim() : '';
                const amountStr = row[9] ? row[9].toString().trim() : '';
                const direction = row[10] ? row[10].toString().trim() : '';
                const status = row[11] ? row[11].toString().trim() : '';

                // 跳过无效行
                if (!amountStr) continue;

                // 跳过汇总行
                if (tradeNo.includes('合计') || tradeNo.includes('总计')) continue;

                // 跳过未完成的交易
                if (status && !status.includes('成功') && !status.includes('已') && status !== '') continue;

                // 跳过退款
                if (type.includes('退款')) continue;

                // 解析金额
                const cleanAmountStr = amountStr.replace(',', '').replace('￥', '').replace('¥', '').trim();
                const amount = parseFloat(cleanAmountStr);
                if (isNaN(amount) || amount <= 0) continue;

                // 判断收支类型
                const isIncome = direction.includes('收入');

                // 解析日期（优先使用付款时间）
                const timeSource = payTime || createTime;
                let date = '';
                let timeStr = '00:00:00';

                const dateMatch = timeSource.match(/(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})\s*(\d{1,2}:\d{2}(?::\d{2})?)?/);
                if (dateMatch) {
                    date = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`;
                    timeStr = dateMatch[4] || '00:00:00';
                } else {
                    console.warn('无法解析日期:', timeSource);
                    continue;
                }

                // 组合描述
                const note = [counterpart, product].filter(Boolean).join(' - ');

                records.push({
                    id: Utils.generateId(),
                    type: isIncome ? 'income' : 'expense',
                    amount: amount.toFixed(2),
                    account: 'alipay',
                    category: Utils.guessCategory(note, isIncome ? 'income' : 'expense'),
                    date: date,
                    time: timeStr,
                    note: note || '支付宝交易',
                    source: 'alipay_import',
                    createdAt: new Date().toISOString()
                });
            } catch (error) {
                console.warn('解析第' + i + '行失败:', row, error);
                continue;
            }
        }

        return records;
    },

    /**
     * 解析CSV行（处理引号内的逗号）
     */
    parseCSVLine(line) {
        const fields = [];
        let field = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
                    // 转义的引号
                    field += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if ((char === ',' || char === '\t') && !inQuotes) {
                fields.push(field.trim());
                field = '';
            } else {
                field += char;
            }
        }

        fields.push(field.trim());
        return fields;
    },

    /**
     * 显示预览
     */
    showPreview() {
        const preview = document.getElementById('importPreview');
        const tbody = document.getElementById('previewTableBody');

        // 计算统计
        let totalIncome = 0;
        let totalExpense = 0;

        this.parsedData.forEach(record => {
            const amount = parseFloat(record.amount);
            if (record.type === 'income') {
                totalIncome = Utils.add(totalIncome, amount);
            } else {
                totalExpense = Utils.add(totalExpense, amount);
            }
        });

        // 更新统计
        document.getElementById('previewCount').textContent = this.parsedData.length;
        document.getElementById('previewIncome').textContent = Utils.formatAmount(totalIncome);
        document.getElementById('previewExpense').textContent = Utils.formatAmount(totalExpense);

        // 生成表格（最多显示50条）
        const displayRecords = this.parsedData.slice(0, 50);
        tbody.innerHTML = displayRecords.map(record => {
            const category = Utils.getCategoryById(record.category, record.type);
            return `
                <tr>
                    <td>${record.date} ${record.time || ''}</td>
                    <td>${this.extractCounterpart(record.note)}</td>
                    <td>${this.extractProduct(record.note)}</td>
                    <td style="color: ${record.type === 'income' ? 'var(--income-color)' : 'var(--expense-color)'}">
                        ${record.type === 'income' ? '+' : '-'}¥${record.amount}
                    </td>
                    <td>${record.type === 'income' ? '收入' : '支出'}</td>
                </tr>
            `;
        }).join('');

        preview.style.display = 'block';
        document.getElementById('btnImportConfirm').disabled = false;

        Utils.showToast(`成功解析 ${this.parsedData.length} 条记录`);
    },

    /**
     * 提取交易对方
     */
    extractCounterpart(note) {
        const parts = note.split(' - ');
        return parts[0] || '-';
    },

    /**
     * 提取商品描述
     */
    extractProduct(note) {
        const parts = note.split(' - ');
        return parts.slice(1).join(' ') || '-';
    },

    /**
     * 确认导入
     */
    confirmImport() {
        if (this.parsedData.length === 0) return;

        const addedCount = Storage.addBatch(this.parsedData);

        Utils.showToast(`成功导入 ${addedCount} 条记录`);

        // 关闭弹窗并刷新
        document.getElementById('importModal').classList.remove('active');
        this.removeFile();

        // 触发主应用刷新
        if (window.App && window.App.refresh) {
            window.App.refresh();
        }
    }
};
