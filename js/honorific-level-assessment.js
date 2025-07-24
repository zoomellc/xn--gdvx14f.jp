/**
 * 敬語レベル診断機能
 */
class HonorificLevelAssessment {
  constructor() {
    this.assessmentData = null;
    this.currentQuestionIndex = 0;
    this.answers = [];
    this.startTime = null;
    this.categoryScores = {};
  }

  /**
   * 診断データを読み込む
   */
  async loadAssessmentData() {
    try {
      const response = await fetch('/data/honorific-level-assessment.json');
      const data = await response.json();
      this.assessmentData = data.assessmentData;
      return true;
    } catch (error) {
      console.error('診断データの読み込みに失敗しました:', error);
      return false;
    }
  }

  /**
   * 診断を開始する
   */
  startAssessment() {
    this.currentQuestionIndex = 0;
    this.answers = [];
    this.startTime = new Date();
    this.categoryScores = {};
    
    // データの存在確認
    if (!this.assessmentData || !this.assessmentData.categoryAnalysis) {
      console.error('Assessment data not properly loaded');
      return false;
    }
    
    // カテゴリー別スコアの初期化
    Object.keys(this.assessmentData.categoryAnalysis).forEach(category => {
      this.categoryScores[category] = { totalScore: 0, maxScore: 0, count: 0 };
    });
    
    return true;
  }

  /**
   * 次の質問を取得
   */
  getNextQuestion() {
    if (!this.assessmentData || !this.assessmentData.questions) {
      console.error('No assessment data available');
      return null;
    }
    
    if (this.currentQuestionIndex < this.assessmentData.questions.length) {
      return this.assessmentData.questions[this.currentQuestionIndex];
    }
    return null;
  }

  /**
   * 回答を記録
   */
  recordAnswer(questionId, selectedOptionIndex, score) {
    if (!this.assessmentData || !this.assessmentData.questions) {
      console.error('No assessment data available');
      return;
    }
    
    const question = this.assessmentData.questions.find(q => q.id === questionId);
    if (!question) return;

    this.answers.push({
      questionId,
      selectedOptionIndex,
      score,
      category: question.category,
      isCorrect: score === 10
    });

    // カテゴリー別スコアを更新
    const category = question.category;
    if (!this.categoryScores[category]) {
      this.categoryScores[category] = { totalScore: 0, maxScore: 0, count: 0 };
    }
    this.categoryScores[category].totalScore += score;
    this.categoryScores[category].maxScore += 10;
    this.categoryScores[category].count += 1;

    this.currentQuestionIndex++;
  }

  /**
   * 診断結果を計算
   */
  calculateResults() {
    if (!this.assessmentData || !this.assessmentData.questions || !this.assessmentData.levels) {
      console.error('Assessment data is incomplete');
      return null;
    }
    
    const totalScore = this.answers.reduce((sum, answer) => sum + answer.score, 0);
    const maxScore = this.assessmentData.questions.length * 10;
    const percentage = Math.round((totalScore / maxScore) * 100);

    // レベル判定
    let level = null;
    for (const [key, value] of Object.entries(this.assessmentData.levels)) {
      if (percentage >= value.scoreRange[0] && percentage <= value.scoreRange[1]) {
        level = { key, ...value };
        break;
      }
    }
    
    if (!level) {
      console.error('Could not determine level for percentage:', percentage);
      return null;
    }

    // カテゴリー別分析
    const categoryAnalysis = this.analyzeCategoriesWeakness();

    // 所要時間
    const endTime = new Date();
    const duration = Math.round((endTime - this.startTime) / 1000);

    return {
      totalScore,
      maxScore,
      percentage,
      level,
      categoryAnalysis,
      duration,
      correctAnswers: this.answers.filter(a => a.isCorrect).length,
      totalQuestions: this.assessmentData.questions.length
    };
  }

  /**
   * カテゴリー別の弱点を分析
   */
  analyzeCategoriesWeakness() {
    const analysis = [];

    for (const [category, scores] of Object.entries(this.categoryScores)) {
      if (scores.count === 0) continue;

      const percentage = Math.round((scores.totalScore / scores.maxScore) * 100);
      const weight = this.assessmentData.categoryAnalysis[category].weight;
      const weightedScore = percentage * weight;

      analysis.push({
        category,
        percentage,
        weight,
        weightedScore,
        description: this.assessmentData.categoryAnalysis[category].description,
        isWeak: percentage < 70,
        questionCount: scores.count
      });
    }

    // 弱い順にソート
    analysis.sort((a, b) => a.percentage - b.percentage);

    return analysis;
  }

  /**
   * 学習プランを生成
   */
  generateLearningPlan(results) {
    const plan = {
      immediateActions: [],
      shortTermGoals: [],
      longTermGoals: [],
      recommendedResources: []
    };
    
    if (!results || !results.categoryAnalysis) {
      console.error('Invalid results data');
      return plan;
    }

    // 弱点カテゴリーに基づいて即座に取り組むべき項目
    const weakCategories = results.categoryAnalysis.filter(c => c.isWeak);
    weakCategories.forEach(category => {
      plan.immediateActions.push({
        category: category.category,
        action: `${category.category}の基礎を復習する`,
        priority: 'high',
        estimatedTime: '30分/日'
      });
    });

    // レベルに応じた短期目標
    if (results.level.key === 'beginner') {
      plan.shortTermGoals = [
        '基本的な敬語動詞を10個マスターする',
        'ビジネスメールの定型文を覚える',
        '毎日1つの敬語表現を実践で使う'
      ];
    } else if (results.level.key === 'intermediate') {
      plan.shortTermGoals = [
        '場面別の敬語使い分けを練習する',
        'クッション言葉のレパートリーを増やす',
        '二重敬語のチェックを習慣化する'
      ];
    } else if (results.level.key === 'advanced') {
      plan.shortTermGoals = [
        '微妙なニュアンスの使い分けを意識する',
        '現代的な敬語表現を取り入れる',
        '相手との関係性に応じた調整を練習する'
      ];
    }

    // 長期目標
    plan.longTermGoals = [
      '3ヶ月後に次のレベルに到達する',
      '実践的な場面で自然に敬語を使えるようになる',
      '敬語の知識を体系的に整理する'
    ];

    // おすすめリソース
    if (results.level && results.level.key) {
      plan.recommendedResources = this.getRecommendedResources(results.level.key, weakCategories);
    }

    return plan;
  }

  /**
   * レベルと弱点に基づいておすすめリソースを取得
   */
  getRecommendedResources(levelKey, weakCategories) {
    const resources = [];

    // レベル別の基本リソース
    const levelResources = {
      beginner: [
        { type: 'article', title: '敬語の基本：尊敬語・謙譲語・丁寧語の違い', url: '/尊敬語-謙譲語-丁寧語/' },
        { type: 'practice', title: '基本動詞の敬語変換練習', url: '/converter-demo/' }
      ],
      intermediate: [
        { type: 'article', title: '二重敬語を避ける方法', url: '/二重敬語/' },
        { type: 'practice', title: '場面別敬語クイズ', url: '/quiz-demo/' }
      ],
      advanced: [
        { type: 'article', title: 'させていただくの正しい使い方', url: '/させていただく/' },
        { type: 'practice', title: '敬語実例集', url: '/examples-demo/' }
      ]
    };

    resources.push(...(levelResources[levelKey] || []));

    // 弱点カテゴリー別のリソース
    weakCategories.forEach(category => {
      if (category.category === 'ビジネス敬語') {
        resources.push({
          type: 'article',
          title: 'ビジネスメールの敬語',
          url: '/宜しくお願い致します/'
        });
      } else if (category.category === '間違えやすい敬語') {
        resources.push({
          type: 'article',
          title: 'よくある敬語の間違い',
          url: '/了解しました-承知しました/'
        });
      }
    });

    return resources;
  }
}

// グローバルに公開
window.HonorificLevelAssessment = HonorificLevelAssessment;