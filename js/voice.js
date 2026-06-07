/**
 * 语音记账模块
 * 使用Web Speech API实现语音识别
 */

const VoiceModule = {
    /** 语音识别实例 */
    recognition: null,

    /** 是否正在录音 */
    isRecording: false,

    /**
     * 初始化
     */
    init() {
        // 检查浏览器支持
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('浏览器不支持语音识别');
            const btn = document.getElementById('btnVoice');
            if (btn) {
                btn.style.display = 'none';
            }
            return;
        }

        this.bindEvents();
    },

    /**
     * 绑定事件
     */
    bindEvents() {
        const btn = document.getElementById('btnVoice');
        if (btn) {
            btn.addEventListener('click', () => this.toggle());
        }
    },

    /**
     * 切换录音状态
     */
    toggle() {
        if (this.isRecording) {
            this.stop();
        } else {
            this.start();
        }
    },

    /**
     * 开始语音识别
     */
    start() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();

        // 配置
        this.recognition.lang = 'zh-CN'; // 中文
        this.recognition.interimResults = false; // 不返回中间结果
        this.recognition.maxAlternatives = 1;

        // 事件处理
        this.recognition.onstart = () => {
            this.isRecording = true;
            this.updateUI('recording', '正在聆听...');
        };

        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            console.log('语音识别结果:', transcript);
            this.parseVoiceInput(transcript);
        };

        this.recognition.onerror = (event) => {
            console.error('语音识别错误:', event.error);
            this.isRecording = false;

            let errorMsg = '识别失败，请重试';
            if (event.error === 'no-speech') {
                errorMsg = '未检测到语音，请重试';
            } else if (event.error === 'audio-capture') {
                errorMsg = '无法访问麦克风';
            } else if (event.error === 'not-allowed') {
                errorMsg = '请允许麦克风权限';
            }

            this.updateUI('error', errorMsg);
        };

        this.recognition.onend = () => {
            this.isRecording = false;
            const btn = document.getElementById('btnVoice');
            if (btn) {
                btn.classList.remove('recording');
            }
        };

        // 开始识别
        try {
            this.recognition.start();
        } catch (error) {
            console.error('启动语音识别失败:', error);
            this.updateUI('error', '启动失败，请重试');
        }
    },

    /**
     * 停止语音识别
     */
    stop() {
        if (this.recognition) {
            this.recognition.stop();
        }
        this.isRecording = false;
    },

    /**
     * 解析语音输入
     * 支持格式：
     * - "午饭35元"
     * - "打车花了22块"
     * - "收入工资8000元"
     * - "买咖啡15.5"
     */
    parseVoiceInput(text) {
        // 移除空格
        text = text.replace(/\s+/g, '');

        // 判断收入还是支出
        let type = 'expense';
        if (/收入|工资|奖金|红包|进账/.test(text)) {
            type = 'income';
        }

        // 提取金额 - 支持多种格式
        let amount = null;
        const amountPatterns = [
            /(\d+\.?\d*)\s*元/,
            /(\d+\.?\d*)\s*块/,
            /(\d+\.?\d*)\s*块钱/,
            /花了\s*(\d+\.?\d*)/,
            /(\d+\.?\d*)/
        ];

        for (const pattern of amountPatterns) {
            const match = text.match(pattern);
            if (match) {
                amount = parseFloat(match[1]);
                break;
            }
        }

        if (!amount || amount <= 0) {
            this.updateUI('error', '未识别到金额，请重试');
            return;
        }

        // 提取描述（去掉金额和关键词）
        let note = text
            .replace(/\d+\.?\d*\s*(元|块|块钱)/g, '')
            .replace(/花了|花|收入|工资|奖金|红包/g, '')
            .trim();

        // 智能分类
        const category = Utils.guessCategory(note, type);

        // 填充表单
        this.fillForm(type, amount, note, category);

        this.updateUI('success', `已识别：${note} ${amount}元`);
    },

    /**
     * 填充表单
     */
    fillForm(type, amount, note, category) {
        // 设置类型
        App.switchType(type);

        // 设置金额
        document.getElementById('inputAmount').value = amount.toFixed(2);

        // 设置备注
        document.getElementById('inputNote').value = note;

        // 设置分类
        App.selectCategory(category);

        // 设置今天的日期
        document.getElementById('inputDate').value = Utils.getToday();
    },

    /**
     * 更新UI状态
     */
    updateUI(status, message) {
        const btn = document.getElementById('btnVoice');
        const statusEl = document.getElementById('voiceStatus');

        if (btn) {
            btn.classList.remove('recording');
            if (status === 'recording') {
                btn.classList.add('recording');
            }
        }

        if (statusEl) {
            statusEl.textContent = message;
            statusEl.className = 'voice-status ' + status;

            // 3秒后清除状态
            if (status !== 'recording') {
                setTimeout(() => {
                    statusEl.textContent = '';
                    statusEl.className = 'voice-status';
                }, 3000);
            }
        }
    }
};
