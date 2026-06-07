// 数据存储键名
const STORAGE_KEYS = {
    HABITS: 'life-habit-data',
    RECORDS: 'life-account-data',
    DIARIES: 'life-diary-data',
    SYNC: 'life-sync-config',
    AUTH: 'life-auth-data',
    REMEMBER: 'life-remember-account',
    PEOPLE: 'life-people-data'
};

// 简单的哈希函数（用于密码存储）
function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return 'hash_' + Math.abs(hash).toString(16);
}

// 认证相关
let authData = null;

// 登录处理
function handleLogin() {
    const account = document.getElementById('login-account').value.trim();
    const password = document.getElementById('login-password').value;
    const rememberAccount = document.getElementById('remember-account').checked;
    
    if (!account || !password) {
        alert('请输入账号和密码');
        return;
    }
    
    // 保存记住账号设置
    if (rememberAccount) {
        localStorage.setItem(STORAGE_KEYS.REMEMBER, account);
    } else {
        localStorage.removeItem(STORAGE_KEYS.REMEMBER);
    }
    
    authData = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUTH));
    
    if (!authData) {
        // 首次登录，创建账号
        authData = {
            account: account,
            passwordHash: hashPassword(password),
            createdAt: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(authData));
        showMainApp();
    } else {
        // 验证账号密码
        if (account === authData.account && hashPassword(password) === authData.passwordHash) {
            showMainApp();
        } else {
            alert('账号或密码错误');
            document.getElementById('login-password').value = '';
        }
    }
}

// 显示主应用
function showMainApp() {
    document.getElementById('login-screen').classList.add('hidden');
    init();
}

// 页面加载时检查登录状态
function checkAuth() {
    authData = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUTH));
    const rememberedAccount = localStorage.getItem(STORAGE_KEYS.REMEMBER);
    
    if (authData) {
        // 已有账号，显示登录界面
        document.getElementById('login-screen').classList.remove('hidden');
        // 自动填充记住的账号
        if (rememberedAccount) {
            document.getElementById('login-account').value = rememberedAccount;
            document.getElementById('remember-account').checked = true;
        } else {
            document.getElementById('login-account').value = authData.account;
        }
    } else {
        // 无账号，同样显示登录界面让用户创建
        document.getElementById('login-screen').classList.remove('hidden');
        // 如果有记住的账号，也填充
        if (rememberedAccount) {
            document.getElementById('login-account').value = rememberedAccount;
            document.getElementById('remember-account').checked = true;
        }
    }
}

// 初始化认证检查
checkAuth();

// 分类配置
const CATEGORIES = {
    expense: [
        { id: 'food', icon: '🍔', name: '餐饮' },
        { id: 'transport', icon: '🚗', name: '交通' },
        { id: 'shopping', icon: '🛒', name: '购物' },
        { id: 'entertainment', icon: '🎮', name: '娱乐' },
        { id: 'medical', icon: '💊', name: '医疗' },
        { id: 'education', icon: '📚', name: '教育' },
        { id: 'housing', icon: '🏠', name: '住房' },
        { id: 'smoking', icon: '🚬', name: '抽烟' },
        { id: 'other', icon: '📦', name: '其他' }
    ],
    income: [
        { id: 'salary', icon: '💰', name: '工资' },
        { id: 'bonus', icon: '🎁', name: '奖金' },
        { id: 'investment', icon: '📈', name: '投资' },
        { id: 'gift', icon: '💝', name: '礼金' },
        { id: 'other', icon: '📦', name: '其他' }
    ]
};

// 全局数据
let habitsData = {};
let accountData = { records: [], balance: 0 };
let diaryData = { work: [], personal: [] };
let peopleData = [];
let currentPersonId = null;
let currentRecordType = 'expense';
let selectedCategory = null;
let editingDiaryId = null;
let currentDiaryType = 'work'; // 当前编辑的类型
let workoffData = []; // 下班打卡数据

// 初始化主应用
function init() {
    loadAllData();
    initCategories();
    initTabNavigation();
    initAccountTabs();
    renderTodayDate();
    renderWeekView();
    updateHabitUI();
    updateAccountSummary();
    renderRecords();
    renderWorkEntries();
    renderPersonalDiaries();
    renderWorkEntriesPage();
    updateStats();
    bindDetailInputs();
    renderDailyExercises();
    renderInstantExercises();
    updateExerciseStats();
    renderWorkoffHistory();
    updateWorkoffStats();
    loadPeopleData();
    updatePersonSelector();
}

// 数据加载与保存
function loadAllData() {
    habitsData = JSON.parse(localStorage.getItem(STORAGE_KEYS.HABITS)) || getDefaultHabits();
    accountData = JSON.parse(localStorage.getItem(STORAGE_KEYS.RECORDS)) || { records: [], balance: 0 };
    const savedDiary = JSON.parse(localStorage.getItem(STORAGE_KEYS.DIARIES));
    if (savedDiary) {
        diaryData = {
            work: savedDiary.work || [],
            personal: savedDiary.personal || []
        };
    } else {
        diaryData = { work: [], personal: [] };
    }
    workoffData = JSON.parse(localStorage.getItem('life-workoff-data')) || [];
    peopleData = JSON.parse(localStorage.getItem(STORAGE_KEYS.PEOPLE)) || [];
}

function saveHabits() {
    localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habitsData));
}

function saveAccount() {
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(accountData));
}

function saveDiaries() {
    localStorage.setItem(STORAGE_KEYS.DIARIES, JSON.stringify(diaryData));
}

function savePeople() {
    localStorage.setItem(STORAGE_KEYS.PEOPLE, JSON.stringify(peopleData));
}

function getDefaultHabits() {
    const today = getTodayDate();
    return {
        [today]: {
            breakfast: false,
            lunch: false,
            dinner: false,
            sleep: false,
            sleepDuration: 0,
            dailyExercises: {},
            instantExercises: []
        }
    };
}

// 工具函数
function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
}

// ==================== 运动打卡功能 ====================

let dailyExerciseTemplates = JSON.parse(localStorage.getItem('daily-exercise-templates')) || [];

function showAddDailyExercise() {
    document.getElementById('daily-exercise-modal').classList.add('active');
}

function closeDailyExerciseModal() {
    document.getElementById('daily-exercise-modal').classList.remove('active');
    document.getElementById('daily-exercise-name').value = '';
    document.getElementById('daily-exercise-target').value = '';
    document.getElementById('daily-exercise-calories').value = '';
}

function saveDailyExercise() {
    const name = document.getElementById('daily-exercise-name').value.trim();
    const target = parseInt(document.getElementById('daily-exercise-target').value) || 30;
    const calories = parseInt(document.getElementById('daily-exercise-calories').value) || 200;

    if (!name) {
        alert('请输入运动名称');
        return;
    }

    const exercise = {
        id: Date.now(),
        name,
        target,
        calories
    };

    dailyExerciseTemplates.push(exercise);
    localStorage.setItem('daily-exercise-templates', JSON.stringify(dailyExerciseTemplates));

    closeDailyExerciseModal();
    renderDailyExercises();
}

function toggleDailyExercise(exerciseId) {
    const today = getTodayDate();
    if (!habitsData[today]) {
        habitsData[today] = getDefaultHabits()[today];
    }

    if (!habitsData[today].dailyExercises) {
        habitsData[today].dailyExercises = {};
    }

    habitsData[today].dailyExercises[exerciseId] = !habitsData[today].dailyExercises[exerciseId];

    saveHabits();
    renderDailyExercises();
    updateExerciseStats();
}

function deleteDailyExercise(exerciseId) {
    if (confirm('确定要删除这个日常运动吗？')) {
        dailyExerciseTemplates = dailyExerciseTemplates.filter(e => e.id !== exerciseId);
        localStorage.setItem('daily-exercise-templates', JSON.stringify(dailyExerciseTemplates));
        renderDailyExercises();
    }
}

function renderDailyExercises() {
    const container = document.getElementById('daily-exercise-list');
    const today = getTodayDate();
    const todayData = habitsData[today];

    if (dailyExerciseTemplates.length === 0) {
        container.innerHTML = '<div class="empty-hint">点击下方按钮添加日常运动</div>';
        return;
    }

    container.innerHTML = dailyExerciseTemplates.map(exercise => {
        const isChecked = todayData && todayData.dailyExercises && todayData.dailyExercises[exercise.id];
        return `
            <div class="daily-exercise-item" onclick="toggleDailyExercise(${exercise.id})">
                <div class="daily-exercise-info">
                    <div class="daily-exercise-name">${exercise.name}</div>
                    <div class="daily-exercise-meta">目标: ${exercise.target}分钟 | 消耗: ${exercise.calories}kcal</div>
                </div>
                <div class="habit-check ${isChecked ? 'checked' : ''}">
                    <span class="check-icon"></span>
                </div>
            </div>
        `;
    }).join('');
}

function addInstantExercise() {
    const name = document.getElementById('instant-exercise-name').value.trim();
    const duration = parseInt(document.getElementById('instant-exercise-duration').value) || 0;
    const calories = parseInt(document.getElementById('instant-exercise-calories').value) || 0;
    const time = document.getElementById('instant-exercise-time').value || '';

    if (!name) {
        alert('请输入运动名称');
        return;
    }

    const today = getTodayDate();
    if (!habitsData[today]) {
        habitsData[today] = getDefaultHabits()[today];
    }

    if (!habitsData[today].instantExercises) {
        habitsData[today].instantExercises = [];
    }

    const exercise = {
        id: Date.now(),
        name,
        duration,
        calories,
        time
    };

    habitsData[today].instantExercises.unshift(exercise);
    saveHabits();

    // 清空表单
    document.getElementById('instant-exercise-name').value = '';
    document.getElementById('instant-exercise-duration').value = '';
    document.getElementById('instant-exercise-calories').value = '';
    document.getElementById('instant-exercise-time').value = '';

    renderInstantExercises();
    updateExerciseStats();
}

function deleteInstantExercise(exerciseId) {
    const today = getTodayDate();
    if (habitsData[today] && habitsData[today].instantExercises) {
        habitsData[today].instantExercises = habitsData[today].instantExercises.filter(e => e.id !== exerciseId);
        saveHabits();
        renderInstantExercises();
        updateExerciseStats();
    }
}

function renderInstantExercises() {
    const container = document.getElementById('instant-exercise-list');
    const today = getTodayDate();
    const todayData = habitsData[today];
    const exercises = todayData && todayData.instantExercises ? todayData.instantExercises : [];

    if (exercises.length === 0) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = exercises.map(exercise => `
        <div class="instant-exercise-item">
            <div>
                <span class="instant-exercise-name">${exercise.name}</span>
                ${exercise.time ? `<span class="instant-exercise-info"> ${exercise.time}</span>` : ''}
            </div>
            <div>
                <span class="instant-exercise-info">${exercise.duration}分钟</span>
                <span class="instant-exercise-info"> ${exercise.calories}kcal</span>
                <button class="btn-delete" onclick="deleteInstantExercise(${exercise.id})" style="margin-left: 8px;">×</button>
            </div>
        </div>
    `).join('');
}

function updateExerciseStats() {
    const today = getTodayDate();
    const todayData = habitsData[today];

    let totalDuration = 0;
    let totalCalories = 0;

    // 统计日常运动
    if (dailyExerciseTemplates.length > 0 && todayData && todayData.dailyExercises) {
        dailyExerciseTemplates.forEach(exercise => {
            if (todayData.dailyExercises[exercise.id]) {
                totalDuration += exercise.target;
                totalCalories += exercise.calories;
            }
        });
    }

    // 统计即时运动
    if (todayData && todayData.instantExercises) {
        todayData.instantExercises.forEach(exercise => {
            totalDuration += exercise.duration || 0;
            totalCalories += exercise.calories || 0;
        });
    }

    document.getElementById('total-exercise-duration').textContent = `${totalDuration}分钟`;
    document.getElementById('total-exercise-calories').textContent = `${totalCalories} kcal`;
}

// 初始化分类
function initCategories() {
    const grid = document.getElementById('category-grid');
    grid.innerHTML = CATEGORIES[currentRecordType].map(cat => `
        <div class="category-item" data-id="${cat.id}" onclick="selectCategory('${cat.id}')">
            <span>${cat.icon}</span>
            <span>${cat.name}</span>
        </div>
    `).join('');
}

function selectCategory(id) {
    selectedCategory = id;
    document.querySelectorAll('.category-item').forEach(item => {
        item.classList.toggle('active', item.dataset.id === id);
    });
}

// 标签页切换
function initTabNavigation() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const page = btn.dataset.page;
            
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            document.getElementById(`page-${page}`).classList.add('active');
            
            if (page === 'stats') {
                updateStats();
            }
        });
    });
}

// 记账标签页
function initAccountTabs() {
    document.querySelectorAll('.account-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            
            document.querySelectorAll('.account-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            document.querySelectorAll('.account-content').forEach(c => c.classList.remove('active'));
            document.getElementById(`account-${tabName}`).classList.add('active');
            
            // 如果是人际 tab，渲染人物列表
            if (tabName === 'people') {
                renderPeopleList();
            }
        });
    });
    
    // 类型切换
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentRecordType = btn.dataset.type;
            document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedCategory = null;
            initCategories();
        });
    });
    
    // 设置默认日期
    document.getElementById('record-date').value = getTodayDate();
}

// 渲染日期
function renderTodayDate() {
    const today = new Date();
    const options = { month: 'long', day: 'numeric', weekday: 'long' };
    document.getElementById('today-date').textContent = today.toLocaleDateString('zh-CN', options);
}

// 打卡功能
let currentMealTab = 'breakfast';
let currentMealSource = 'canteen';

function toggleHabit(type) {
    const today = getTodayDate();
    
    if (!habitsData[today]) {
        habitsData[today] = getDefaultHabits()[today];
    }
    
    if (type === 'breakfast' || type === 'lunch' || type === 'dinner') {
        habitsData[today][type] = !habitsData[today][type];
    }
    
    saveHabits();
    updateHabitUI();
    renderWeekView();
}

// ==================== 睡眠打卡功能 ====================

function toggleSleep() {
    const today = getTodayDate();
    
    if (!habitsData[today]) {
        habitsData[today] = getDefaultHabits()[today];
    }
    
    habitsData[today].sleep = !habitsData[today].sleep;
    
    saveHabits();
    updateHabitUI();
    renderWeekView();
}

function toggleSleepDetail() {
    const panel = document.getElementById('sleep-detail-panel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    if (panel.style.display === 'block') {
        loadSleepDetail();
    }
}

function loadSleepDetail() {
    const today = getTodayDate();
    const todayData = habitsData[today] || {};
    const sleepDetail = todayData.sleepDetail || {};
    
    // 加载计划睡眠时间
    document.getElementById('planned-sleep-time').value = sleepDetail.plannedSleepTime || '23:00';
    document.getElementById('planned-wake-time').value = sleepDetail.plannedWakeTime || '07:00';
    
    // 加载睡眠检查状态
    toggleSleepCheckUI('onTime', sleepDetail.onTime || false);
    toggleSleepCheckUI('wakeOnTime', sleepDetail.wakeOnTime || false);
    toggleSleepCheckUI('overslept', sleepDetail.overslept || false);
    toggleSleepCheckUI('wokeEarly', sleepDetail.wokeEarly || false);
    
    // 加载实际时间
    document.getElementById('actual-sleep-time').value = sleepDetail.actualSleepTime || '';
    document.getElementById('actual-wake-time').value = sleepDetail.actualWakeTime || '';
    
    // 加载原因
    document.getElementById('late-reason').value = sleepDetail.lateReason || '';
    document.getElementById('oversleep-reason').value = sleepDetail.oversleepReason || '';
    document.getElementById('early-reason').value = sleepDetail.earlyReason || '';
    
    // 显示/隐藏原因输入框
    document.getElementById('sleep-late-reason').style.display = sleepDetail.onTime === false ? 'block' : 'none';
    document.getElementById('sleep-oversleep-reason').style.display = sleepDetail.overslept ? 'block' : 'none';
    document.getElementById('sleep-early-reason').style.display = sleepDetail.wokeEarly ? 'block' : 'none';
    
    // 计算实际睡眠时长
    calculateSleepDuration();
}

function toggleSleepCheckUI(type, isChecked) {
    const check = document.querySelector(`.sleep-section [onclick="toggleSleepCheck('${type}')"]`);
    if (check) {
        check.classList.toggle('checked', isChecked);
    }
}

function toggleSleepCheck(type) {
    const today = getTodayDate();
    if (!habitsData[today]) {
        habitsData[today] = getDefaultHabits()[today];
    }
    if (!habitsData[today].sleepDetail) {
        habitsData[today].sleepDetail = {};
    }
    
    const detail = habitsData[today].sleepDetail;
    
    // 互斥逻辑
    if (type === 'wakeOnTime') {
        detail.wakeOnTime = !detail.wakeOnTime;
        if (detail.wakeOnTime) {
            detail.overslept = false;
            detail.wokeEarly = false;
        }
    } else if (type === 'overslept') {
        detail.overslept = !detail.overslept;
        if (detail.overslept) {
            detail.wakeOnTime = false;
            detail.wokeEarly = false;
        }
    } else if (type === 'wokeEarly') {
        detail.wokeEarly = !detail.wokeEarly;
        if (detail.wokeEarly) {
            detail.wakeOnTime = false;
            detail.overslept = false;
        }
    } else if (type === 'onTime') {
        detail.onTime = !detail.onTime;
    }
    
    // 更新UI
    toggleSleepCheckUI('onTime', detail.onTime || false);
    toggleSleepCheckUI('wakeOnTime', detail.wakeOnTime || false);
    toggleSleepCheckUI('overslept', detail.overslept || false);
    toggleSleepCheckUI('wokeEarly', detail.wokeEarly || false);
    
    // 显示/隐藏原因输入框
    document.getElementById('sleep-late-reason').style.display = detail.onTime === false ? 'block' : 'none';
    document.getElementById('sleep-oversleep-reason').style.display = detail.overslept ? 'block' : 'none';
    document.getElementById('sleep-early-reason').style.display = detail.wokeEarly ? 'block' : 'none';
    
    saveHabits();
}

function calculateSleepDuration() {
    const actualSleepTime = document.getElementById('actual-sleep-time').value;
    const actualWakeTime = document.getElementById('actual-wake-time').value;
    
    if (actualSleepTime && actualWakeTime) {
        const [sleepHour, sleepMin] = actualSleepTime.split(':').map(Number);
        const [wakeHour, wakeMin] = actualWakeTime.split(':').map(Number);
        
        let sleepMinutes = sleepHour * 60 + sleepMin;
        let wakeMinutes = wakeHour * 60 + wakeMin;
        
        // 如果起床时间是第二天
        if (wakeMinutes <= sleepMinutes) {
            wakeMinutes += 24 * 60;
        }
        
        const durationMinutes = wakeMinutes - sleepMinutes;
        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;
        
        document.getElementById('actual-sleep-duration').textContent = 
            `${hours}小时${minutes > 0 ? minutes + '分钟' : ''}`;
    }
}

function saveSleepDetail() {
    const today = getTodayDate();
    if (!habitsData[today]) {
        habitsData[today] = getDefaultHabits()[today];
    }
    
    habitsData[today].sleepDetail = {
        plannedSleepTime: document.getElementById('planned-sleep-time').value,
        plannedWakeTime: document.getElementById('planned-wake-time').value,
        onTime: document.querySelector(`.sleep-section [onclick="toggleSleepCheck('onTime')"]`).classList.contains('checked'),
        wakeOnTime: document.querySelector(`.sleep-section [onclick="toggleSleepCheck('wakeOnTime')"]`).classList.contains('checked'),
        overslept: document.querySelector(`.sleep-section [onclick="toggleSleepCheck('overslept')"]`).classList.contains('checked'),
        wokeEarly: document.querySelector(`.sleep-section [onclick="toggleSleepCheck('wokeEarly')"]`).classList.contains('checked'),
        actualSleepTime: document.getElementById('actual-sleep-time').value,
        actualWakeTime: document.getElementById('actual-wake-time').value,
        lateReason: document.getElementById('late-reason').value,
        oversleepReason: document.getElementById('oversleep-reason').value,
        earlyReason: document.getElementById('early-reason').value
    };
    
    // 标记为已打卡
    habitsData[today].sleep = true;
    
    saveHabits();
    updateHabitUI();
    renderWeekView();
    
    alert('睡眠记录已保存！');
}

// 监听实际时间变化，自动计算睡眠时长
document.addEventListener('DOMContentLoaded', () => {
    const actualSleepInput = document.getElementById('actual-sleep-time');
    const actualWakeInput = document.getElementById('actual-wake-time');
    
    if (actualSleepInput) {
        actualSleepInput.addEventListener('change', calculateSleepDuration);
    }
    if (actualWakeInput) {
        actualWakeInput.addEventListener('change', calculateSleepDuration);
    }
});

// 三餐详情相关函数
function toggleMealDetail() {
    const panel = document.getElementById('meal-detail-panel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    if (panel.style.display === 'block') {
        loadMealDetail(currentMealTab);
    }
}

function switchMealTab(meal) {
    currentMealTab = meal;
    document.querySelectorAll('.meal-tab').forEach(tab => {
        tab.classList.toggle('active', tab.textContent === (meal === 'breakfast' ? '早餐' : meal === 'lunch' ? '午餐' : '晚餐'));
    });
    loadMealDetail(meal);
}

function selectSource(source) {
    currentMealSource = source;
    document.querySelectorAll('.source-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.source === source);
    });
}

function loadMealDetail(meal) {
    const today = getTodayDate();
    const todayData = habitsData[today] || {};
    const mealData = todayData[`${meal}Detail`] || {};
    
    document.getElementById('meal-price').value = mealData.price || '';
    document.getElementById('meal-time').value = mealData.time || '';
    document.getElementById('meal-content').value = mealData.content || '';
    
    currentMealSource = mealData.source || 'canteen';
    document.querySelectorAll('.source-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.source === currentMealSource);
    });
}

function saveMealDetail() {
    const today = getTodayDate();
    if (!habitsData[today]) {
        habitsData[today] = getDefaultHabits()[today];
    }
    
    const price = parseFloat(document.getElementById('meal-price').value) || 0;
    const time = document.getElementById('meal-time').value;
    const content = document.getElementById('meal-content').value;
    const source = currentMealSource;
    
    // 保存详细信息
    const mealKey = `${currentMealTab}Detail`;
    habitsData[today][mealKey] = {
        price,
        time,
        content,
        source,
        updatedAt: new Date().toISOString()
    };
    
    // 标记为已打卡
    habitsData[today][currentMealTab] = true;
    
    // 自动同步到记账系统
    if (price > 0) {
        addMealToAccount(currentMealTab, price, content, source);
    }
    
    saveHabits();
    updateHabitUI();
    renderWeekView();
    
    alert('保存成功！已同步到记账');
}

function addMealToAccount(meal, price, content, source) {
    const today = getTodayDate();
    const mealNames = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐' };
    const sourceNames = { canteen: '食堂', delivery: '外卖', cook: '自己做', other: '其他' };
    
    const record = {
        id: Date.now(),
        type: 'expense',
        amount: price,
        category: 'food',
        categoryName: mealNames[meal],
        categoryIcon: '🍔',
        date: today,
        note: `${sourceNames[source]}${content ? ' - ' + content : ''}`
    };
    
    accountData.records.unshift(record);
    accountData.balance -= price;
    
    saveAccount();
    updateAccountSummary();
    renderRecords();
}

function bindDetailInputs() {
    const sleepDuration = document.getElementById('sleep-duration');
    
    sleepDuration.addEventListener('change', () => {
        const today = getTodayDate();
        if (!habitsData[today]) habitsData[today] = getDefaultHabits()[today];
        habitsData[today].sleepDuration = parseFloat(sleepDuration.value) || 0;
        saveHabits();
    });
}

function updateHabitUI() {
    const today = getTodayDate();
    const todayData = habitsData[today] || getDefaultHabits()[today];
    
    // 更新打卡状态
    ['breakfast', 'lunch', 'dinner'].forEach(meal => {
        const check = document.querySelector(`[data-type="${meal}"] .habit-check`);
        if (check) check.classList.toggle('checked', todayData[meal]);
    });
    
    const sleepCheck = document.querySelector('[data-type="sleep"] .habit-check');
    if (sleepCheck) sleepCheck.classList.toggle('checked', todayData.sleep);
    
    // 更新详情输入
    document.getElementById('sleep-duration').value = todayData.sleepDuration || '';
    
    // 计算今日三餐总花费
    let totalMealExpense = 0;
    ['breakfast', 'lunch', 'dinner'].forEach(meal => {
        const mealDetail = todayData[`${meal}Detail`];
        if (mealDetail && mealDetail.price) {
            totalMealExpense += mealDetail.price;
        }
    });
    
    const expenseElement = document.getElementById('total-meal-expense');
    if (expenseElement) {
        expenseElement.textContent = `¥${totalMealExpense.toFixed(2)}`;
    }
    
    // 更新连续天数
    updateStreaks();
}

function updateStreaks() {
    const streakCounts = document.querySelectorAll('.streak-count');
    const mealsStreak = calculateStreak(['breakfast', 'lunch', 'dinner']);
    const exerciseStreak = calculateStreak(['exercise']);
    const sleepStreak = calculateStreak(['sleep']);
    
    if (streakCounts[0]) streakCounts[0].textContent = mealsStreak;
    if (streakCounts[1]) streakCounts[1].textContent = exerciseStreak;
    if (streakCounts[2]) streakCounts[2].textContent = sleepStreak;
}

function calculateStreak(types) {
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 365; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayData = habitsData[dateStr];
        
        if (!dayData) break;
        
        const allComplete = types.every(type => dayData[type]);
        if (allComplete) {
            streak++;
        } else {
            break;
        }
    }
    
    return streak;
}

function renderWeekView() {
    const container = document.getElementById('week-days');
    const days = ['日', '一', '二', '三', '四', '五', '六'];
    const today = new Date();
    let html = '';
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayData = habitsData[dateStr];
        const isToday = i === 0;
        
        const hasRecord = dayData && (dayData.breakfast || dayData.lunch || dayData.dinner);
        const dayClass = isToday ? 'today' : (hasRecord ? 'has-record' : 'no-record');
        
        html += `
            <div class="week-day ${dayClass}">
                <span class="week-day-label">${days[date.getDay()]}</span>
                <span class="week-day-date">${date.getDate()}</span>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

// 记账功能
function addRecord() {
    const amount = parseFloat(document.getElementById('record-amount').value);
    const date = document.getElementById('record-date').value;
    const note = document.getElementById('record-note').value;
    const personId = document.getElementById('record-person').value;
    
    if (!amount || amount <= 0) {
        alert('请输入有效金额');
        return;
    }
    
    if (!selectedCategory) {
        alert('请选择分类');
        return;
    }
    
    const category = CATEGORIES[currentRecordType].find(c => c.id === selectedCategory);
    const person = personId ? peopleData.find(p => p.id === personId) : null;
    
    const record = {
        id: Date.now(),
        type: currentRecordType,
        amount: amount,
        category: selectedCategory,
        categoryName: category.name,
        categoryIcon: category.icon,
        date: date,
        note: note,
        personId: personId || null,
        personName: person ? person.name : null
    };
    
    accountData.records.unshift(record);
    
    if (currentRecordType === 'income') {
        accountData.balance += amount;
    } else {
        accountData.balance -= amount;
    }
    
    saveAccount();
    updateAccountSummary();
    renderRecords();
    
    // 清空表单
    document.getElementById('record-amount').value = '';
    document.getElementById('record-note').value = '';
    selectedCategory = null;
    initCategories();
}

function updateAccountSummary() {
    const today = getTodayDate();
    let income = 0;
    let expense = 0;
    
    accountData.records.forEach(record => {
        if (record.type === 'income') {
            income += record.amount;
        } else {
            expense += record.amount;
        }
    });
    
    document.getElementById('total-income').textContent = `¥${income.toFixed(2)}`;
    document.getElementById('total-expense').textContent = `¥${expense.toFixed(2)}`;
    document.getElementById('total-balance').textContent = `¥${accountData.balance.toFixed(2)}`;
}

function renderRecords() {
    const container = document.getElementById('record-list');
    
    if (accountData.records.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📝</span>
                <p>暂无记账记录</p>
                <p class="empty-hint">点击「记一笔」开始记账</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = accountData.records.map(record => `
        <div class="record-item">
            <div class="record-icon ${record.type}-color">${record.categoryIcon}</div>
            <div class="record-info">
                <div class="record-category">${record.categoryName}</div>
                <div class="record-note">${record.note || ''}</div>
                <div class="record-date">${formatDate(record.date)}</div>
            </div>
            <div>
                <span class="record-amount ${record.type}">
                    ${record.type === 'income' ? '+' : '-'}${record.amount.toFixed(2)}
                </span>
                <button class="btn-delete" onclick="deleteRecord(${record.id})" style="margin-top: 8px;">删除</button>
            </div>
        </div>
    `).join('');
}

function deleteRecord(id) {
    if (confirm('确定要删除这条记录吗？')) {
        const record = accountData.records.find(r => r.id === id);
        if (record) {
            if (record.type === 'income') {
                accountData.balance -= record.amount;
            } else {
                accountData.balance += record.amount;
            }
            accountData.records = accountData.records.filter(r => r.id !== id);
            saveAccount();
            updateAccountSummary();
            renderRecords();
        }
    }
}

// 日记功能
function showNewDiary(type) {
    editingDiaryId = null;
    currentDiaryType = type;
    document.getElementById('diary-date').value = getTodayDate();
    document.getElementById('diary-editor').innerHTML = '';
    
    // 更新占位符和标签
    const label = type === 'work' ? '💼 工作安排' : '📔 个人日记';
    const placeholder = type === 'work' ? '今天的工作计划或记录...' : '今天发生了什么...';
    document.getElementById('editor-type-label').textContent = label;
    document.getElementById('diary-editor').setAttribute('placeholder', placeholder);
    
    document.getElementById('diary-modal').classList.add('active');
}

function closeDiaryModal() {
    document.getElementById('diary-modal').classList.remove('active');
}

function formatText(command) {
    document.execCommand(command, false, null);
    document.getElementById('diary-editor').focus();
}

function setHeading(level) {
    document.execCommand('formatBlock', false, `h${level}`);
    document.getElementById('diary-editor').focus();
}

function saveDiary() {
    const date = document.getElementById('diary-date').value;
    const content = document.getElementById('diary-editor').innerHTML;
    
    if (!content || content.trim() === '<br>') {
        alert('请输入内容');
        return;
    }
    
    const entry = {
        id: Date.now(),
        date: date,
        content: content
    };
    
    if (editingDiaryId) {
        // 编辑现有条目
        const dataArray = diaryData[currentDiaryType];
        const index = dataArray.findIndex(d => d.id === editingDiaryId);
        if (index !== -1) {
            dataArray[index].date = date;
            dataArray[index].content = content;
        }
    } else {
        // 新增条目
        diaryData[currentDiaryType].unshift(entry);
    }
    
    saveDiaries();
    
    // 根据类型更新对应列表
    if (currentDiaryType === 'work') {
        renderWorkEntries();
        renderWorkEntriesPage();
    } else {
        renderPersonalDiaries();
    }
    
    closeDiaryModal();
}

function renderWorkEntries() {
    const container = document.getElementById('work-list');
    if (!container) return;
    
    if (diaryData.work.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📋</span>
                <p>暂无工作规划</p>
                <p class="empty-hint">点击「写规划」开始记录</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = diaryData.work.map(entry => `
        <div class="work-item" onclick="editWorkEntry(${entry.id})">
            <div class="work-item-header">
                <span class="work-date">${formatDate(entry.date)}</span>
                <button class="btn-delete" onclick="event.stopPropagation(); deleteWorkEntry(${entry.id})">删除</button>
            </div>
            <div class="work-preview">${entry.content}</div>
        </div>
    `).join('');
}

function renderPersonalDiaries() {
    const container = document.getElementById('diary-list');
    
    if (diaryData.personal.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📔</span>
                <p>还没有日记</p>
                <p class="empty-hint">点击「写日记」开始记录</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = diaryData.personal.map(entry => `
        <div class="diary-item" onclick="editPersonalDiary(${entry.id})">
            <div class="diary-item-header">
                <span class="diary-date">${formatDate(entry.date)}</span>
                <button class="btn-delete" onclick="event.stopPropagation(); deletePersonalDiary(${entry.id})">删除</button>
            </div>
            <div class="diary-preview">${entry.content}</div>
        </div>
    `).join('');
}

function editWorkEntry(id) {
    const entry = diaryData.work.find(d => d.id === id);
    if (entry) {
        editingDiaryId = id;
        currentDiaryType = 'work';
        document.getElementById('diary-date').value = entry.date;
        document.getElementById('diary-editor').innerHTML = entry.content;
        document.getElementById('editor-type-label').textContent = '💼 工作安排';
        document.getElementById('diary-editor').setAttribute('placeholder', '今天的工作计划或记录...');
        document.getElementById('diary-modal').classList.add('active');
    }
}

function editPersonalDiary(id) {
    const entry = diaryData.personal.find(d => d.id === id);
    if (entry) {
        editingDiaryId = id;
        currentDiaryType = 'personal';
        document.getElementById('diary-date').value = entry.date;
        document.getElementById('diary-editor').innerHTML = entry.content;
        document.getElementById('editor-type-label').textContent = '📔 个人日记';
        document.getElementById('diary-editor').setAttribute('placeholder', '今天发生了什么...');
        document.getElementById('diary-modal').classList.add('active');
    }
}

function deleteWorkEntry(id) {
    if (confirm('确定要删除这条工作记录吗？')) {
        diaryData.work = diaryData.work.filter(d => d.id !== id);
        saveDiaries();
        renderWorkEntries();
        renderWorkEntriesPage();
    }
}

function deletePersonalDiary(id) {
    if (confirm('确定要删除这篇日记吗？')) {
        diaryData.personal = diaryData.personal.filter(d => d.id !== id);
        saveDiaries();
        renderPersonalDiaries();
    }
}

// ==================== 工作页面功能 ====================

// 渲染工作安排列表（工作页面）
function renderWorkEntriesPage() {
    const container = document.getElementById('work-list-page');
    if (!container) return;
    
    if (diaryData.work.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📋</span>
                <p>暂无工作安排</p>
                <p class="empty-hint">点击「写安排」开始记录</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = diaryData.work.map(entry => `
        <div class="work-item" onclick="editWorkEntry(${entry.id})">
            <div class="work-item-header">
                <span class="work-date">${formatDate(entry.date)}</span>
                <button class="btn-delete" onclick="event.stopPropagation(); deleteWorkEntry(${entry.id})">删除</button>
            </div>
            <div class="work-preview">${entry.content}</div>
        </div>
    `).join('');
}

// 下班打卡功能
function saveWorkoffData() {
    localStorage.setItem('life-workoff-data', JSON.stringify(workoffData));
}

function showWorkoffForm() {
    const form = document.getElementById('workoff-form');
    const btn = document.getElementById('btn-workoff');
    form.style.display = 'block';
    btn.style.display = 'none';
    
    // 检查今日是否已打卡
    const today = getTodayDate();
    const todayRecord = workoffData.find(r => r.date === today);
    if (todayRecord) {
        document.getElementById('actual-workoff-time').value = todayRecord.time || '18:30';
        document.getElementById('overtime-reason').value = todayRecord.reason || '';
        toggleWorkoffCheckUI('onTime', todayRecord.onTime || false);
        if (!todayRecord.onTime) {
            document.getElementById('overtime-reason-panel').style.display = 'block';
        }
    }
}

function toggleWorkoffCheckUI(type, isChecked) {
    const check = document.querySelector(`.workoff-check [onclick="toggleWorkoffCheck('${type}')"]`);
    if (check) {
        check.classList.toggle('checked', isChecked);
    }
}

function toggleWorkoffCheck(type) {
    const isChecked = document.querySelector(`.workoff-check [onclick="toggleWorkoffCheck('${type}')"]`).classList.contains('checked');
    
    if (type === 'onTime') {
        toggleWorkoffCheckUI('onTime', !isChecked);
        document.getElementById('overtime-reason-panel').style.display = isChecked ? 'block' : 'none';
    }
}

function saveWorkoff() {
    const today = getTodayDate();
    const time = document.getElementById('actual-workoff-time').value;
    const onTime = document.querySelector(`.workoff-check [onclick="toggleWorkoffCheck('onTime')"]`).classList.contains('checked');
    const reason = document.getElementById('overtime-reason').value;
    
    const record = {
        id: Date.now(),
        date: today,
        time: time,
        onTime: onTime,
        reason: onTime ? '' : reason
    };
    
    // 更新或添加记录
    const existingIndex = workoffData.findIndex(r => r.date === today);
    if (existingIndex !== -1) {
        record.id = workoffData[existingIndex].id;
        workoffData[existingIndex] = record;
    } else {
        workoffData.unshift(record);
    }
    
    saveWorkoffData();
    
    // 更新UI
    document.getElementById('workoff-form').style.display = 'none';
    document.getElementById('btn-workoff').style.display = 'block';
    document.getElementById('workoff-status').textContent = onTime ? '已打卡（按时）' : '已打卡（加班）';
    
    renderWorkoffHistory();
    updateWorkoffStats();
    
    alert('下班打卡成功！');
}

function renderWorkoffHistory() {
    const container = document.getElementById('workoff-history-list');
    if (!container) return;
    
    // 只显示最近7天的记录
    const recentRecords = workoffData.slice(0, 7);
    
    if (recentRecords.length === 0) {
        container.innerHTML = '<div class="empty-hint">暂无打卡记录</div>';
        return;
    }
    
    container.innerHTML = recentRecords.map(record => {
        const statusClass = record.onTime ? 'on-time' : 'overtime';
        const statusText = record.onTime ? '准时' : '加班';
        return `
            <div class="workoff-history-item">
                <div>
                    <div class="workoff-history-date">${formatDate(record.date)}</div>
                    <div class="workoff-history-time">${record.time}</div>
                </div>
                <div class="workoff-history-status ${statusClass}">${statusText}</div>
            </div>
        `;
    }).join('');
}

function updateWorkoffStats() {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // 本周准时率
    const weekRecords = workoffData.filter(r => {
        const recordDate = new Date(r.date);
        return recordDate >= weekStart;
    });
    
    if (weekRecords.length > 0) {
        const onTimeCount = weekRecords.filter(r => r.onTime).length;
        const rate = Math.round((onTimeCount / weekRecords.length) * 100);
        document.getElementById('workoff-on-time-rate').textContent = `${rate}%`;
    } else {
        document.getElementById('workoff-on-time-rate').textContent = '--';
    }
    
    // 本月加班次数
    const monthOvertime = workoffData.filter(r => {
        const recordDate = new Date(r.date);
        return recordDate >= monthStart && !r.onTime;
    }).length;
    document.getElementById('monthly-overtime-count').textContent = monthOvertime;
}

// 统计页面
function updateStats() {
    // 打卡统计
    const mealsRate = calculateCompletionRate(['breakfast', 'lunch', 'dinner']);
    const exerciseRate = calculateCompletionRate(['exercise']);
    const sleepRate = calculateCompletionRate(['sleep']);
    
    document.getElementById('stats-meals').textContent = `${mealsRate}%`;
    document.getElementById('stats-exercise').textContent = `${exerciseRate}%`;
    document.getElementById('stats-sleep').textContent = `${sleepRate}%`;
    
    // 消费统计
    renderExpenseChart();
    
    // 日记统计
    document.getElementById('total-diaries').textContent = diaryData.work.length;
    document.getElementById('personal-diaries').textContent = diaryData.personal.length;
    
    const thisMonth = [...diaryData.work, ...diaryData.personal].filter(entry => {
        const entryDate = new Date(entry.date);
        const now = new Date();
        return entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear();
    }).length;
    document.getElementById('monthly-diaries').textContent = thisMonth;
}

function calculateCompletionRate(types) {
    let total = 0;
    let completed = 0;
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayData = habitsData[dateStr];
        
        if (dayData) {
            total++;
            if (types.every(type => dayData[type])) {
                completed++;
            }
        }
    }
    
    return total > 0 ? Math.round((completed / total) * 100) : 0;
}

function renderExpenseChart() {
    const chart = document.getElementById('expense-chart');
    const categoryTotals = {};
    
    accountData.records.forEach(record => {
        if (record.type === 'expense') {
            if (!categoryTotals[record.categoryName]) {
                categoryTotals[record.categoryName] = 0;
            }
            categoryTotals[record.categoryName] += record.amount;
        }
    });
    
    if (Object.keys(categoryTotals).length === 0) {
        chart.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📊</span>
                <p>暂无消费记录</p>
            </div>
        `;
        return;
    }
    
    const categories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    const total = categories.reduce((sum, [_, amount]) => sum + amount, 0);
    
    chart.innerHTML = categories.map(([name, amount]) => {
        const percentage = Math.round((amount / total) * 100);
        return `
            <div class="diary-stat-item">
                <span>${name}</span>
                <span style="color: var(--danger);">¥${amount.toFixed(2)} (${percentage}%)</span>
            </div>
        `;
    }).join('');
}

// ==================== 数据同步功能 ====================

// 同步配置
let syncConfig = null;

// 加载同步配置
function loadSyncConfig() {
    syncConfig = JSON.parse(localStorage.getItem(STORAGE_KEYS.SYNC));
    if (syncConfig) {
        document.getElementById('sync-token').value = syncConfig.token || '';
        document.getElementById('sync-gist-id').value = syncConfig.gistId || '';
    }
}

// 显示同步模态框
function showSyncModal() {
    document.getElementById('sync-modal').classList.add('active');
    loadSyncConfig();
}

// 关闭同步模态框
function closeSyncModal() {
    document.getElementById('sync-modal').classList.remove('active');
}

// 显示同步状态
function showSyncStatus(message, type) {
    const statusEl = document.getElementById('sync-status');
    statusEl.textContent = message;
    statusEl.className = 'sync-status ' + type;
}

// 收集所有数据
function collectAllData() {
    return {
        habits: habitsData,
        account: accountData,
        diary: diaryData,
        workoff: workoffData,
        people: peopleData,
        auth: authData,
        timestamp: new Date().toISOString()
    };
}

// 上传数据到 GitHub Gist
async function uploadData() {
    const token = document.getElementById('sync-token').value.trim();
    const gistId = document.getElementById('sync-gist-id').value.trim();
    
    if (!token) {
        showSyncStatus('请输入 GitHub Token', 'error');
        return;
    }
    
    showSyncStatus('正在上传...', 'loading');
    
    try {
        const allData = collectAllData();
        const gistData = {
            description: '个人生活助手数据备份',
            public: false,
            files: {
                'life-assistant-data.json': {
                    content: JSON.stringify(allData, null, 2)
                }
            }
        };
        
        let response;
        if (gistId) {
            // 更新现有 Gist
            response = await fetch(`https://api.github.com/gists/${gistId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(gistData)
            });
        } else {
            // 创建新 Gist
            response = await fetch('https://api.github.com/gists', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(gistData)
            });
        }
        
        if (!response.ok) {
            throw new Error('上传失败：' + response.statusText);
        }
        
        const result = await response.json();
        const newGistId = result.id;
        
        // 保存同步配置
        syncConfig = {
            token: token,
            gistId: newGistId,
            lastSync: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEYS.SYNC, JSON.stringify(syncConfig));
        
        // 更新 Gist ID 显示
        document.getElementById('sync-gist-id').value = newGistId;
        
        showSyncStatus('上传成功！Gist ID: ' + newGistId, 'success');
    } catch (error) {
        showSyncStatus('上传失败：' + error.message, 'error');
    }
}

// 从 GitHub Gist 下载数据
async function downloadData() {
    const token = document.getElementById('sync-token').value.trim();
    const gistId = document.getElementById('sync-gist-id').value.trim();
    
    if (!token || !gistId) {
        showSyncStatus('请输入 GitHub Token 和 Gist ID', 'error');
        return;
    }
    
    showSyncStatus('正在下载...', 'loading');
    
    try {
        const response = await fetch(`https://api.github.com/gists/${gistId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('下载失败：' + response.statusText);
        }
        
        const result = await response.json();
        const file = result.files['life-assistant-data.json'];
        
        if (!file) {
            throw new Error('找不到数据文件');
        }
        
        const data = JSON.parse(file.content);
        
        // 恢复数据
        if (data.habits) {
            habitsData = data.habits;
            localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habitsData));
        }
        
        if (data.account) {
            accountData = data.account;
            localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(accountData));
        }
        
        if (data.diary) {
            diaryData = data.diary;
            localStorage.setItem(STORAGE_KEYS.DIARIES, JSON.stringify(diaryData));
        }
        
        if (data.workoff) {
            workoffData = data.workoff;
            localStorage.setItem('life-workoff-data', JSON.stringify(workoffData));
        }
        
        if (data.people) {
            peopleData = data.people;
            localStorage.setItem(STORAGE_KEYS.PEOPLE, JSON.stringify(peopleData));
        }
        
        // 保存同步配置
        syncConfig = {
            token: token,
            gistId: gistId,
            lastSync: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEYS.SYNC, JSON.stringify(syncConfig));
        
        // 刷新页面显示
        renderHabits();
        renderAccountRecords();
        renderWorkEntriesPage();
        renderPersonalDiaries();
        renderWorkoffHistory();
        updateWorkoffStats();
        updateStats();
        updatePersonSelector();
        
        showSyncStatus('下载成功！数据已恢复', 'success');
    } catch (error) {
        showSyncStatus('下载失败：' + error.message, 'error');
    }
}

// ==================== 人际账本功能 ====================

// 加载人物数据
function loadPeopleData() {
    peopleData = JSON.parse(localStorage.getItem(STORAGE_KEYS.PEOPLE)) || [];
}

// 更新人物选择器
function updatePersonSelector() {
    const selector = document.getElementById('record-person');
    if (!selector) return;
    
    selector.innerHTML = '<option value="">无</option>' + 
        peopleData.map(person => `<option value="${person.id}">${person.name}</option>`).join('');
}

// 显示添加人物模态框
function showAddPersonModal() {
    document.getElementById('add-person-modal').classList.add('active');
    document.getElementById('person-name').value = '';
    document.getElementById('person-relation').value = '';
}

// 关闭添加人物模态框
function closeAddPersonModal() {
    document.getElementById('add-person-modal').classList.remove('active');
}

// 添加人物
function addPerson() {
    const name = document.getElementById('person-name').value.trim();
    const relation = document.getElementById('person-relation').value.trim();
    
    if (!name) {
        alert('请输入人物姓名');
        return;
    }
    
    const person = {
        id: Date.now().toString(),
        name: name,
        relation: relation,
        createdAt: new Date().toISOString()
    };
    
    peopleData.push(person);
    savePeople();
    updatePersonSelector(); // 更新选择器（很重要！）
    closeAddPersonModal();
    renderPeopleList();
}

// 渲染人物列表
function renderPeopleList() {
    const summaryEl = document.getElementById('people-summary');
    const listEl = document.getElementById('people-list');
    
    if (!summaryEl || !listEl) return;
    
    // 计算总盈亏
    let totalOweMe = 0;  // 别人欠我的
    let totalIOwe = 0;    // 我欠别人的
    
    peopleData.forEach(person => {
        const balance = calculatePersonBalance(person.id);
        if (balance > 0) {
            totalOweMe += balance;
        } else {
            totalIOwe += Math.abs(balance);
        }
    });
    
    // 渲染汇总
    summaryEl.innerHTML = `
        <div class="people-summary-item owe-me">
            <span class="people-summary-label">别人欠我</span>
            <span class="people-summary-value positive">¥${totalOweMe.toFixed(2)}</span>
        </div>
        <div class="people-summary-item i-owe">
            <span class="people-summary-label">我欠别人</span>
            <span class="people-summary-value negative">¥${totalIOwe.toFixed(2)}</span>
        </div>
    `;
    
    // 渲染人物列表
    if (peopleData.length === 0) {
        listEl.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">👥</span>
                <p>暂无人物</p>
                <p class="empty-hint">点击「添加人物」开始记录</p>
            </div>
        `;
        return;
    }
    
    listEl.innerHTML = peopleData.map(person => {
        const balance = calculatePersonBalance(person.id);
        const balanceClass = balance >= 0 ? 'positive' : 'negative';
        const statusText = balance > 0 ? '欠我' : (balance < 0 ? '我欠' : '平');
        const statusColor = balance >= 0 ? '#059669' : '#dc2626';
        
        return `
            <div class="person-item" onclick="showPersonDetail('${person.id}')">
                <div class="person-info">
                    <span class="person-name">${person.name}</span>
                    <span class="person-relation">${person.relation || '无关系'}</span>
                </div>
                <div class="person-balance">
                    <div class="person-balance-amount ${balanceClass}" style="color: ${statusColor}">
                        ${balance >= 0 ? '+' : ''}¥${balance.toFixed(2)}
                    </div>
                    <div class="person-balance-status">${statusText}</div>
                </div>
            </div>
        `;
    }).join('');
}

// 计算某人物的净盈亏
function calculatePersonBalance(personId) {
    let balance = 0;
    
    accountData.records.forEach(record => {
        if (record.personId === personId) {
            if (record.type === 'expense') {
                // 我付钱给别人 = 别人欠我
                balance += record.amount;
            } else {
                // 别人付钱给我 = 我欠别人
                balance -= record.amount;
            }
        }
    });
    
    return balance;
}

// 显示人物详情
function showPersonDetail(personId) {
    const person = peopleData.find(p => p.id === personId);
    if (!person) return;
    
    currentPersonId = personId;
    
    const balance = calculatePersonBalance(personId);
    const balanceClass = balance >= 0 ? 'positive' : 'negative';
    const statusText = balance > 0 ? '欠你的' : (balance < 0 ? '你欠的' : '已结清');
    
    document.getElementById('person-detail-title').textContent = person.name + ' 的账目';
    document.getElementById('person-detail-balance').innerHTML = `
        <div class="person-detail-balance-amount ${balanceClass}" style="color: ${balance >= 0 ? '#059669' : '#dc2626'}">
            ${balance >= 0 ? '+' : ''}¥${balance.toFixed(2)}
        </div>
        <div class="person-detail-balance-status">${statusText}</div>
    `;
    
    // 渲染该人物的所有记录
    const records = accountData.records.filter(r => r.personId === personId);
    const recordsEl = document.getElementById('person-detail-records');
    
    if (records.length === 0) {
        recordsEl.innerHTML = '<div class="empty-hint">暂无相关记录</div>';
    } else {
        recordsEl.innerHTML = records.map(record => `
            <div class="person-record-item">
                <div class="person-record-info">
                    <div class="person-record-note">${record.note || record.categoryName}</div>
                    <div class="person-record-date">${formatDate(record.date)}</div>
                </div>
                <div class="person-record-amount ${record.type}">
                    ${record.type === 'income' ? '+' : '-'}¥${record.amount.toFixed(2)}
                </div>
            </div>
        `).join('');
    }
    
    document.getElementById('person-detail-modal').classList.add('active');
}

// 关闭人物详情模态框
function closePersonDetailModal() {
    document.getElementById('person-detail-modal').classList.remove('active');
}

// 启动应用
document.addEventListener('DOMContentLoaded', init);