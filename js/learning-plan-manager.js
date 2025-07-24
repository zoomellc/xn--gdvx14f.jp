/**
 * カスタマイズ可能な学習プラン管理システム
 */
class LearningPlanManager {
  constructor() {
    this.plans = this.loadPlans();
    this.currentPlan = null;
    this.progress = this.loadProgress();
  }

  /**
   * 保存されたプランを読み込む
   */
  loadPlans() {
    try {
      const saved = localStorage.getItem('honorificLearningPlans');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load plans:', error);
      return [];
    }
  }

  /**
   * 進捗を読み込む
   */
  loadProgress() {
    try {
      const saved = localStorage.getItem('honorificLearningProgress');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('Failed to load progress:', error);
      return {};
    }
  }

  /**
   * プランを保存
   */
  savePlans() {
    try {
      localStorage.setItem('honorificLearningPlans', JSON.stringify(this.plans));
    } catch (error) {
      console.error('Failed to save plans:', error);
      // 容量エラーの場合は古いデータを削除する試み
      if (error.name === 'QuotaExceededError') {
        console.warn('Storage quota exceeded, trying to clean up old data');
      }
    }
  }

  /**
   * 進捗を保存
   */
  saveProgress() {
    try {
      localStorage.setItem('honorificLearningProgress', JSON.stringify(this.progress));
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  }

  /**
   * 新しい学習プランを作成
   */
  createPlan(options) {
    if (!options || !options.name || !options.level || !options.duration) {
      throw new Error('Required plan options are missing');
    }
    
    const plan = {
      id: Date.now().toString(),
      name: options.name,
      createdAt: new Date().toISOString(),
      level: options.level,
      duration: options.duration, // 週単位
      goals: options.goals || [],
      schedule: this.generateSchedule(options),
      categories: options.categories || [],
      customSettings: options.customSettings || {},
      status: 'active'
    };

    this.plans.push(plan);
    this.savePlans();
    
    // 進捗を初期化
    this.progress[plan.id] = {
      startedAt: new Date().toISOString(),
      completedTasks: [],
      currentWeek: 1,
      totalProgress: 0
    };
    this.saveProgress();

    return plan;
  }

  /**
   * 学習スケジュールを生成
   */
  generateSchedule(options) {
    const schedule = [];
    const weeksCount = options.duration;
    const dailyStudyTime = options.customSettings.dailyStudyTime || 30; // 分

    for (let week = 1; week <= weeksCount; week++) {
      const weekSchedule = {
        week: week,
        theme: this.getWeekTheme(week, options.level, options.categories),
        tasks: this.generateWeekTasks(week, options),
        estimatedTime: dailyStudyTime * 7,
        milestones: []
      };

      // マイルストーンを設定
      if (week % 2 === 0) {
        weekSchedule.milestones.push({
          type: 'review',
          description: `第${week}週までの復習テスト`
        });
      }

      if (week === Math.floor(weeksCount / 2)) {
        weekSchedule.milestones.push({
          type: 'assessment',
          description: '中間評価'
        });
      }

      if (week === weeksCount) {
        weekSchedule.milestones.push({
          type: 'final',
          description: '最終評価'
        });
      }

      schedule.push(weekSchedule);
    }

    return schedule;
  }

  /**
   * 週のテーマを決定
   */
  getWeekTheme(week, level, categories) {
    const themes = {
      beginner: [
        '基本敬語の理解',
        '尊敬語の基礎',
        '謙譲語の基礎',
        '丁寧語の使い方',
        'ビジネス場面での基本',
        '間違いやすい敬語',
        'メール敬語の基本',
        '総復習と実践'
      ],
      intermediate: [
        '敬語の使い分け',
        '二重敬語の回避',
        'クッション言葉',
        '場面別敬語応用',
        'ビジネス文書の敬語',
        '電話応対の敬語',
        '会議での敬語',
        '実践演習'
      ],
      advanced: [
        '微妙なニュアンス',
        '現代的な敬語',
        '相手別の調整',
        '国際ビジネスでの敬語',
        'プレゼンテーションの敬語',
        '交渉での敬語',
        'リーダーシップと敬語',
        '総合実践'
      ]
    };

    const levelThemes = themes[level] || themes.beginner;
    const themeIndex = Math.max(0, (week - 1) % levelThemes.length);
    
    // カテゴリーに基づいてカスタマイズ
    if (categories.length > 0 && week <= categories.length) {
      return `${categories[week - 1]}の強化週間`;
    }

    return levelThemes[themeIndex];
  }

  /**
   * 週のタスクを生成
   */
  generateWeekTasks(week, options) {
    const tasks = [];
    const level = options.level;
    const dailyTasks = options.customSettings.tasksPerDay || 3;

    // 日別タスク
    for (let day = 1; day <= 7; day++) {
      const dayTasks = [];

      // 基本タスク
      if (dailyTasks >= 1) {
        dayTasks.push({
          id: `w${week}d${day}t1`,
          type: 'study',
          title: this.getStudyTaskTitle(week, day, level),
          estimatedTime: 15,
          points: 10
        });
      }

      // 練習タスク
      if (dailyTasks >= 2) {
        dayTasks.push({
          id: `w${week}d${day}t2`,
          type: 'practice',
          title: this.getPracticeTaskTitle(week, day, level),
          estimatedTime: 10,
          points: 15
        });
      }

      // 応用タスク
      if (dailyTasks >= 3) {
        dayTasks.push({
          id: `w${week}d${day}t3`,
          type: 'application',
          title: this.getApplicationTaskTitle(week, day, level),
          estimatedTime: 5,
          points: 20
        });
      }

      tasks.push({
        day: day,
        tasks: dayTasks
      });
    }

    return tasks;
  }

  /**
   * 学習タスクのタイトルを生成
   */
  getStudyTaskTitle(week, day, level) {
    const titles = {
      beginner: [
        '基本動詞の敬語変換を5つ覚える',
        '敬語の種類について読む',
        'よく使う敬語表現を10個学ぶ',
        'ビジネスメールの定型文を覚える',
        '間違いやすい敬語を確認する'
      ],
      intermediate: [
        '場面別敬語表現を学ぶ',
        'クッション言葉を5つマスター',
        '二重敬語のチェックリストを作成',
        'ビジネス文書のテンプレート学習',
        '敬語のニュアンスを理解する'
      ],
      advanced: [
        '高度な敬語表現を研究',
        '相手別の微調整を学ぶ',
        'ケーススタディを分析',
        'プレゼン用敬語を準備',
        '国際ビジネスでの敬語を学ぶ'
      ]
    };

    const levelTitles = titles[level] || titles.beginner;
    return levelTitles[day % levelTitles.length];
  }

  /**
   * 練習タスクのタイトルを生成
   */
  getPracticeTaskTitle(week, day, level) {
    const titles = {
      beginner: [
        '敬語変換ツールで10問練習',
        '敬語クイズに挑戦',
        'メール文を敬語で書く練習',
        '電話応対のロールプレイ',
        '自己紹介を敬語で練習'
      ],
      intermediate: [
        'ビジネスシーンのロールプレイ',
        '議事録を敬語で作成',
        '苦情対応の練習',
        'プレゼンテーション練習',
        '交渉場面の敬語練習'
      ],
      advanced: [
        '複雑な状況での敬語選択',
        '国際会議のシミュレーション',
        'エグゼクティブ対応練習',
        '危機管理時の敬語使用',
        'メディア対応の練習'
      ]
    };

    const levelTitles = titles[level] || titles.beginner;
    return levelTitles[day % levelTitles.length];
  }

  /**
   * 応用タスクのタイトルを生成
   */
  getApplicationTaskTitle(week, day, level) {
    return '実際の場面で敬語を使ってみる';
  }

  /**
   * タスクを完了
   */
  completeTask(planId, taskId) {
    if (!planId || !taskId) {
      console.error('Invalid planId or taskId');
      return;
    }
    
    if (!this.progress[planId]) {
      this.progress[planId] = {
        startedAt: new Date().toISOString(),
        completedTasks: [],
        currentWeek: 1,
        totalProgress: 0
      };
    }

    if (!this.progress[planId].completedTasks) {
      this.progress[planId].completedTasks = [];
    }
    
    if (!this.progress[planId].completedTasks.includes(taskId)) {
      this.progress[planId].completedTasks.push(taskId);
      this.updateProgress(planId);
      this.saveProgress();
    }
  }

  /**
   * 進捗を更新
   */
  updateProgress(planId) {
    const plan = this.plans.find(p => p.id === planId);
    if (!plan) return;

    const totalTasks = this.countTotalTasks(plan);
    const completedCount = this.progress[planId].completedTasks.length;
    this.progress[planId].totalProgress = Math.round((completedCount / totalTasks) * 100);

    // 現在の週を更新
    const tasksPerWeek = totalTasks / plan.duration;
    this.progress[planId].currentWeek = Math.min(
      Math.ceil(completedCount / tasksPerWeek),
      plan.duration
    );
  }

  /**
   * 総タスク数を計算
   */
  countTotalTasks(plan) {
    let count = 0;
    plan.schedule.forEach(week => {
      week.tasks.forEach(day => {
        count += day.tasks.length;
      });
    });
    return count;
  }

  /**
   * 現在のプランを取得
   */
  getCurrentPlan() {
    if (!this.currentPlan && this.plans.length > 0) {
      this.currentPlan = this.plans.find(p => p.status === 'active');
    }
    return this.currentPlan;
  }

  /**
   * プランをアクティブに設定
   */
  setActivePlan(planId) {
    // 全てのプランを非アクティブに
    this.plans.forEach(p => p.status = 'inactive');
    
    // 指定のプランをアクティブに
    const plan = this.plans.find(p => p.id === planId);
    if (plan) {
      plan.status = 'active';
      this.currentPlan = plan;
      this.savePlans();
    }
  }

  /**
   * 週次レポートを生成
   */
  generateWeeklyReport(planId, week) {
    const plan = this.plans.find(p => p.id === planId);
    const progress = this.progress[planId];
    if (!plan || !progress) return null;

    const weekSchedule = plan.schedule[week - 1];
    if (!weekSchedule) return null;

    let completedTasks = 0;
    let totalTasks = 0;
    let totalPoints = 0;

    weekSchedule.tasks.forEach(day => {
      day.tasks.forEach(task => {
        totalTasks++;
        if (progress.completedTasks && progress.completedTasks.includes(task.id)) {
          completedTasks++;
          totalPoints += task.points;
        }
      });
    });

    return {
      week: week,
      theme: weekSchedule.theme,
      completedTasks: completedTasks,
      totalTasks: totalTasks,
      completionRate: Math.round((completedTasks / totalTasks) * 100),
      points: totalPoints,
      milestones: weekSchedule.milestones
    };
  }

  /**
   * 学習統計を取得
   */
  getStatistics(planId) {
    const plan = this.plans.find(p => p.id === planId);
    const progress = this.progress[planId];
    if (!plan || !progress) return null;

    const startDate = new Date(progress.startedAt);
    const today = new Date();
    const daysElapsed = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
    
    const totalTasks = this.countTotalTasks(plan);
    const completedTasks = progress.completedTasks.length;
    const remainingTasks = totalTasks - completedTasks;
    
    const averageTasksPerDay = daysElapsed > 0 ? completedTasks / daysElapsed : 0;
    const estimatedDaysToComplete = averageTasksPerDay > 0 ? 
      Math.ceil(remainingTasks / averageTasksPerDay) : plan.duration * 7;

    return {
      daysElapsed: daysElapsed,
      totalProgress: progress.totalProgress,
      completedTasks: completedTasks,
      totalTasks: totalTasks,
      averageTasksPerDay: averageTasksPerDay.toFixed(1),
      estimatedCompletionDate: new Date(today.getTime() + estimatedDaysToComplete * 24 * 60 * 60 * 1000),
      currentWeek: progress.currentWeek,
      totalWeeks: plan.duration
    };
  }
}

// グローバルに公開
window.LearningPlanManager = LearningPlanManager;