class PronunciationPractice {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.currentPhrase = null;
        this.practiceData = [];
        this.score = 0;
        this.attempts = 0;
        this.isListening = false;
        this.selectedLevel = 'beginner';
        this.selectedCategory = 'all';
        
        this.initializeSpeechRecognition();
        this.loadPracticeData();
        this.render();
        this.attachEventListeners();
    }

    initializeSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            this.showError('お使いのブラウザは音声認識に対応していません。ChromeまたはEdgeをご利用ください。');
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'ja-JP';
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 3;

        this.recognition.onstart = () => {
            this.isListening = true;
            this.updateUI();
        };

        this.recognition.onend = () => {
            this.isListening = false;
            this.updateUI();
        };

        this.recognition.onresult = (event) => {
            this.handleRecognitionResult(event);
        };

        this.recognition.onerror = (event) => {
            this.handleRecognitionError(event);
        };
    }

    async loadPracticeData() {
        try {
            const response = await fetch('/data/pronunciation-practice-data.json');
            const data = await response.json();
            this.practiceData = data.phrases;
            this.selectRandomPhrase();
        } catch (error) {
            console.error('練習データの読み込みに失敗しました:', error);
            this.showError('練習データの読み込みに失敗しました。');
        }
    }

    selectRandomPhrase() {
        const filteredPhrases = this.practiceData.filter(phrase => {
            const levelMatch = this.selectedLevel === 'all' || phrase.level === this.selectedLevel;
            const categoryMatch = this.selectedCategory === 'all' || phrase.category === this.selectedCategory;
            return levelMatch && categoryMatch;
        });

        if (filteredPhrases.length === 0) {
            this.showError('該当する練習フレーズがありません。');
            return;
        }

        const randomIndex = Math.floor(Math.random() * filteredPhrases.length);
        this.currentPhrase = filteredPhrases[randomIndex];
        this.updatePhraseDisplay();
    }

    updatePhraseDisplay() {
        const phraseDisplay = this.container.querySelector('.phrase-display');
        if (phraseDisplay && this.currentPhrase) {
            phraseDisplay.innerHTML = `
                <div class="phrase-text">${this.currentPhrase.text}</div>
                <div class="phrase-reading">${this.currentPhrase.reading}</div>
                <div class="phrase-context">${this.currentPhrase.context}</div>
                <div class="phrase-level">レベル: ${this.getLevelLabel(this.currentPhrase.level)}</div>
            `;
        }
    }

    getLevelLabel(level) {
        const labels = {
            'beginner': '初級',
            'intermediate': '中級',
            'advanced': '上級'
        };
        return labels[level] || level;
    }

    handleRecognitionResult(event) {
        const results = event.results[event.results.length - 1];
        const transcript = results[0].transcript;
        const isFinal = results.isFinal;

        this.updateTranscriptDisplay(transcript, isFinal);

        if (isFinal) {
            this.evaluatePronunciation(transcript);
        }
    }

    updateTranscriptDisplay(transcript, isFinal) {
        const transcriptDisplay = this.container.querySelector('.transcript-display');
        if (transcriptDisplay) {
            transcriptDisplay.textContent = transcript;
            transcriptDisplay.classList.toggle('final', isFinal);
        }
    }

    evaluatePronunciation(transcript) {
        if (!this.currentPhrase) return;

        const target = this.currentPhrase.text;
        const similarity = this.calculateSimilarity(transcript, target);
        const score = Math.round(similarity * 100);

        this.attempts++;
        this.displayResult(score, transcript);
        this.updateStats(score);
        this.provideFeedback(score);
    }

    calculateSimilarity(str1, str2) {
        // Remove spaces and normalize
        const s1 = str1.replace(/\s/g, '').toLowerCase();
        const s2 = str2.replace(/\s/g, '').toLowerCase();

        if (s1 === s2) return 1.0;

        const longer = s1.length > s2.length ? s1 : s2;
        const shorter = s1.length > s2.length ? s2 : s1;

        if (longer.length === 0) return 1.0;

        const editDistance = this.levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }

    levenshteinDistance(s1, s2) {
        const costs = [];
        for (let i = 0; i <= s2.length; i++) {
            let lastValue = i;
            for (let j = 0; j <= s1.length; j++) {
                if (i === 0) {
                    costs[j] = j;
                } else {
                    if (j > 0) {
                        let newValue = costs[j - 1];
                        if (s1.charAt(j - 1) !== s2.charAt(i - 1)) {
                            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                        }
                        costs[j - 1] = lastValue;
                        lastValue = newValue;
                    }
                }
            }
            if (i > 0) {
                costs[s1.length] = lastValue;
            }
        }
        return costs[s1.length];
    }

    displayResult(score, transcript) {
        const resultDisplay = this.container.querySelector('.result-display');
        if (resultDisplay) {
            const scoreClass = score >= 80 ? 'excellent' : score >= 60 ? 'good' : 'needs-practice';
            resultDisplay.innerHTML = `
                <div class="score ${scoreClass}">
                    <span class="score-value">${score}%</span>
                    <span class="score-label">${this.getScoreLabel(score)}</span>
                </div>
                <div class="transcript-result">
                    <p>認識された音声: ${transcript}</p>
                    <p>正解: ${this.currentPhrase.text}</p>
                </div>
            `;
        }
    }

    getScoreLabel(score) {
        if (score >= 90) return '素晴らしい！';
        if (score >= 80) return 'とても良い！';
        if (score >= 70) return '良い！';
        if (score >= 60) return 'もう少し！';
        return '練習を続けましょう！';
    }

    updateStats(score) {
        this.score = Math.round((this.score * (this.attempts - 1) + score) / this.attempts);
        const statsDisplay = this.container.querySelector('.stats-display');
        if (statsDisplay) {
            statsDisplay.innerHTML = `
                <span>平均スコア: ${this.score}%</span>
                <span>練習回数: ${this.attempts}回</span>
            `;
        }
    }

    provideFeedback(score) {
        if (score >= 80) {
            this.playSound('success');
        } else {
            this.playSound('try-again');
        }

        if (this.currentPhrase.tips && score < 80) {
            this.showTips();
        }
    }

    showTips() {
        const tipsDisplay = this.container.querySelector('.tips-display');
        if (tipsDisplay && this.currentPhrase.tips) {
            tipsDisplay.innerHTML = `
                <h4>発音のコツ</h4>
                <ul>
                    ${this.currentPhrase.tips.map(tip => `<li>${tip}</li>`).join('')}
                </ul>
            `;
            tipsDisplay.style.display = 'block';
        }
    }

    playModelPronunciation() {
        if (!this.currentPhrase || !this.synthesis) return;

        const utterance = new SpeechSynthesisUtterance(this.currentPhrase.text);
        utterance.lang = 'ja-JP';
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        // Try to find a Japanese voice
        const voices = this.synthesis.getVoices();
        const japaneseVoice = voices.find(voice => voice.lang.includes('ja'));
        if (japaneseVoice) {
            utterance.voice = japaneseVoice;
        }

        this.synthesis.speak(utterance);
    }

    startListening() {
        if (!this.recognition) {
            this.showError('音声認識が初期化されていません。');
            return;
        }

        if (this.isListening) return;

        try {
            this.recognition.start();
            this.hideTips();
            this.clearResult();
        } catch (error) {
            console.error('音声認識の開始に失敗しました:', error);
            this.showError('音声認識の開始に失敗しました。');
        }
    }

    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    }

    handleRecognitionError(event) {
        let errorMessage = '音声認識エラー: ';
        switch (event.error) {
            case 'no-speech':
                errorMessage += '音声が検出されませんでした。';
                break;
            case 'audio-capture':
                errorMessage += 'マイクが見つかりません。';
                break;
            case 'not-allowed':
                errorMessage += 'マイクの使用が許可されていません。';
                break;
            default:
                errorMessage += event.error;
        }
        this.showError(errorMessage);
    }

    showError(message) {
        const errorDisplay = this.container.querySelector('.error-display');
        if (errorDisplay) {
            errorDisplay.textContent = message;
            errorDisplay.style.display = 'block';
            setTimeout(() => {
                errorDisplay.style.display = 'none';
            }, 5000);
        }
    }

    hideTips() {
        const tipsDisplay = this.container.querySelector('.tips-display');
        if (tipsDisplay) {
            tipsDisplay.style.display = 'none';
        }
    }

    clearResult() {
        const resultDisplay = this.container.querySelector('.result-display');
        if (resultDisplay) {
            resultDisplay.innerHTML = '';
        }
        const transcriptDisplay = this.container.querySelector('.transcript-display');
        if (transcriptDisplay) {
            transcriptDisplay.textContent = '';
        }
    }

    playSound(type) {
        // Simple audio feedback using Web Audio API
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioContext = new AudioContext();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        if (type === 'success') {
            oscillator.frequency.value = 523.25; // C5
            gainNode.gain.value = 0.3;
        } else {
            oscillator.frequency.value = 261.63; // C4
            gainNode.gain.value = 0.2;
        }

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.2);
    }

    updateUI() {
        const recordButton = this.container.querySelector('.record-button');
        if (recordButton) {
            recordButton.textContent = this.isListening ? '停止' : '録音開始';
            recordButton.classList.toggle('listening', this.isListening);
        }
    }

    attachEventListeners() {
        const recordButton = this.container.querySelector('.record-button');
        if (recordButton) {
            recordButton.addEventListener('click', () => {
                if (this.isListening) {
                    this.stopListening();
                } else {
                    this.startListening();
                }
            });
        }

        const playButton = this.container.querySelector('.play-model-button');
        if (playButton) {
            playButton.addEventListener('click', () => this.playModelPronunciation());
        }

        const nextButton = this.container.querySelector('.next-phrase-button');
        if (nextButton) {
            nextButton.addEventListener('click', () => {
                this.selectRandomPhrase();
                this.clearResult();
                this.hideTips();
            });
        }

        const levelSelect = this.container.querySelector('.level-select');
        if (levelSelect) {
            levelSelect.addEventListener('change', (e) => {
                this.selectedLevel = e.target.value;
                this.selectRandomPhrase();
                this.clearResult();
                this.hideTips();
            });
        }

        const categorySelect = this.container.querySelector('.category-select');
        if (categorySelect) {
            categorySelect.addEventListener('change', (e) => {
                this.selectedCategory = e.target.value;
                this.selectRandomPhrase();
                this.clearResult();
                this.hideTips();
            });
        }
    }

    render() {
        this.container.innerHTML = `
            <div class="pronunciation-practice-container">
                <div class="practice-header">
                    <h3>敬語発音練習</h3>
                    <div class="controls">
                        <select class="level-select">
                            <option value="all">全レベル</option>
                            <option value="beginner" selected>初級</option>
                            <option value="intermediate">中級</option>
                            <option value="advanced">上級</option>
                        </select>
                        <select class="category-select">
                            <option value="all">全カテゴリー</option>
                            <option value="business">ビジネス</option>
                            <option value="daily">日常会話</option>
                            <option value="formal">フォーマル</option>
                        </select>
                    </div>
                </div>

                <div class="phrase-display"></div>

                <div class="practice-controls">
                    <button class="play-model-button">お手本を聞く</button>
                    <button class="record-button">録音開始</button>
                    <button class="next-phrase-button">次のフレーズ</button>
                </div>

                <div class="transcript-display"></div>
                <div class="result-display"></div>
                <div class="tips-display" style="display: none;"></div>
                <div class="error-display" style="display: none;"></div>

                <div class="stats-display">
                    <span>平均スコア: -</span>
                    <span>練習回数: 0回</span>
                </div>
            </div>
        `;
    }
}

// Initialize when DOM is ready
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PronunciationPractice;
} else {
    window.PronunciationPractice = PronunciationPractice;
}