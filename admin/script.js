// 全局变量
let currentUser = null;
let adsDatabase = [];
let logsDatabase = [];
let settingsDatabase = {
    expiryWarningDays: 7,
    pageSize: 20,
    autoRefreshInterval: 60
};

// 初始化系统
document.addEventListener('DOMContentLoaded', function() {
    initializeSystem();
    setupEventListeners();
    generateSampleData();
});

// 初始化系统
function initializeSystem() {
    checkLoginStatus();
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    if (document.getElementById('adStartDate')) {
        document.getElementById('adStartDate').value = formatDateTimeLocal(now);
        document.getElementById('adEndDate').value = formatDateTimeLocal(tomorrow);
    }
}

// 设置事件监听器
function setupEventListeners() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // 导航菜单点击
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.dataset.page;
            showPage(page);
        });
    });
}

// 检查登录状态
function checkLoginStatus() {
    const savedUser = localStorage.getItem('adminUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showMainInterface();
    }
}

// 处理登录
function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (username === 'admin' && password === 'admin123') {
        currentUser = {
            username: username,
            loginTime: new Date().toISOString(),
            ip: '127.0.0.1'
        };
        
        localStorage.setItem('adminUser', JSON.stringify(currentUser));
        addLog('登录', '用户登录成功', username);
        showMainInterface();
        showNotification('登录成功', 'success');
    } else {
        showNotification('用户名或密码错误', 'error');
    }
}

// 显示主界面
function showMainInterface() {
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('mainContainer').style.display = 'block';
    
    if (document.getElementById('currentUser')) {
        document.getElementById('currentUser').textContent = currentUser.username;
    }
    
    loadDashboardData();
    loadAdsData();
    loadRegionStats();
}

// 退出登录
function logout() {
    currentUser = null;
    localStorage.removeItem('adminUser');
    
    document.getElementById('mainContainer').style.display = 'none';
    document.getElementById('loginContainer').style.display = 'flex';
    
    if (document.getElementById('loginForm')) {
        document.getElementById('loginForm').reset();
    }
    
    showNotification('已退出登录', 'info');
}

// 显示页面
function showPage(pageName) {
    document.querySelectorAll('.page-content').forEach(page => {
        page.classList.remove('active');
    });
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const targetPage = document.getElementById(pageName);
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    const targetNav = document.querySelector(`[data-page="${pageName}"]`);
    if (targetNav) {
        targetNav.classList.add('active');
    }
    
    switch(pageName) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'ads':
            loadAdsData();
            break;
        case 'regions':
            loadRegionStats();
            break;
    }
}

// 加载仪表盘数据
function loadDashboardData() {
    const totalAds = adsDatabase.length;
    const now = new Date();
    const warningDays = settingsDatabase.expiryWarningDays;
    
    let activeAds = 0;
    let expiringAds = 0;
    let expiredAds = 0;
    
    adsDatabase.forEach(ad => {
        const endDate = new Date(ad.endDate);
        const daysUntilExpiry = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
        
        if (endDate > now) {
            if (daysUntilExpiry <= warningDays) {
                expiringAds++;
            } else {
                activeAds++;
            }
        } else {
            expiredAds++;
        }
    });
    
    const totalAdsElement = document.getElementById('totalAds');
    const activeAdsElement = document.getElementById('activeAds');
    const expiringAdsElement = document.getElementById('expiringAds');
    const expiredAdsElement = document.getElementById('expiredAds');
    
    if (totalAdsElement) totalAdsElement.textContent = totalAds;
    if (activeAdsElement) activeAdsElement.textContent = activeAds;
    if (expiringAdsElement) expiringAdsElement.textContent = expiringAds;
    if (expiredAdsElement) expiredAdsElement.textContent = expiredAds;
}

// 加载广告数据
function loadAdsData() {
    const tbody = document.getElementById('adsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (adsDatabase.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: #666;">暂无广告数据</td></tr>';
        return;
    }
    
    adsDatabase.forEach(ad => {
        const row = document.createElement('tr');
        const now = new Date();
        const endDate = new Date(ad.endDate);
        const daysUntilExpiry = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
        
        if (endDate <= now) {
            row.classList.add('expired');
        } else if (daysUntilExpiry <= settingsDatabase.expiryWarningDays) {
            row.classList.add('expiring');
        }
        
        const statusBadge = getStatusBadge(endDate, daysUntilExpiry);
        
        row.innerHTML = `
            <td><input type="checkbox" value="${ad.id}" onchange="toggleAdSelection(${ad.id})"></td>
            <td>${ad.id}</td>
            <td>${ad.title}</td>
            <td>${getRegionName(ad.region)}</td>
            <td>${formatDateTime(new Date(ad.startDate))}</td>
            <td>${formatDateTime(new Date(ad.endDate))}</td>
            <td>${statusBadge}</td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="editAd(${ad.id})">
                    <i class="fas fa-edit"></i> 编辑
                </button>
                <button class="btn btn-warning btn-sm" onclick="renewAd(${ad.id})">
                    <i class="fas fa-sync"></i> 续费
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteAd(${ad.id})">
                    <i class="fas fa-trash"></i> 删除
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// 获取状态标签
function getStatusBadge(endDate, daysUntilExpiry) {
    const now = new Date();
    
    if (endDate <= now) {
        return '<span class="status-badge expired">已过期</span>';
    } else if (daysUntilExpiry <= settingsDatabase.expiryWarningDays) {
        return '<span class="status-badge expiring">即将到期</span>';
    } else {
        return '<span class="status-badge active">正常</span>';
    }
}

// 获取区域名称
function getRegionName(region) {
    const regionNames = {
        'yellow': '黄色置顶区',
        'white': '套白区域',
        'lightYellow': '套淡黄区域',
        'cyan': '套青区域'
    };
    return regionNames[region] || region;
}

// 加载区域统计
function loadRegionStats() {
    const regionCounts = {
        yellow: 0,
        white: 0,
        lightYellow: 0,
        cyan: 0
    };
    
    adsDatabase.forEach(ad => {
        if (regionCounts.hasOwnProperty(ad.region)) {
            regionCounts[ad.region]++;
        }
    });
    
    const yellowCountElement = document.getElementById('yellowCount');
    const whiteCountElement = document.getElementById('whiteCount');
    const lightYellowCountElement = document.getElementById('lightYellowCount');
    const cyanCountElement = document.getElementById('cyanCount');
    
    if (yellowCountElement) yellowCountElement.textContent = regionCounts.yellow;
    if (whiteCountElement) whiteCountElement.textContent = regionCounts.white;
    if (lightYellowCountElement) lightYellowCountElement.textContent = regionCounts.lightYellow;
    if (cyanCountElement) cyanCountElement.textContent = regionCounts.cyan;
}

// 生成示例数据
function generateSampleData() {
    if (adsDatabase.length > 0) return;
    
    const sampleAds = [
        {
            id: 1,
            title: '《豪-情》',
            region: 'yellow',
            content: '▅▅▅▅《１２０００》▅▅▅▅《经典复古》▅▅▅▅《今晚首区》▅▅▅▅',
            link: 'http://www.3333mu.com',
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            experience: '300倍',
            version: '1.03H',
            sortWeight: 100,
            status: 'active',
            createTime: new Date().toISOString(),
            lastEditTime: new Date().toISOString()
        },
        {
            id: 2,
            title: '▄豪情奇迹50倍▄',
            region: 'yellow',
            content: '【１０／１１／１３点】 【EG新端】【F7完整+Z双助手】【超级防G】',
            link: 'http://9393qj.com:66/',
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
            experience: '50倍',
            version: '1.03H',
            sortWeight: 90,
            status: 'active',
            createTime: new Date().toISOString(),
            lastEditTime: new Date().toISOString()
        }
    ];
    
    adsDatabase.push(...sampleAds);
    addLog('系统启动', '系统初始化完成', '系统');
}

// 添加日志
function addLog(action, details, operator) {
    const log = {
        id: Date.now() + Math.random(),
        time: new Date().toISOString(),
        action: action,
        details: details,
        operator: operator,
        ip: '127.0.0.1'
    };
    
    logsDatabase.push(log);
    
    if (logsDatabase.length > 1000) {
        logsDatabase = logsDatabase.slice(-1000);
    }
}

// 工具函数
function formatDateTime(date) {
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDateTimeLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        font-weight: 500;
        z-index: 3000;
        max-width: 300px;
    `;
    
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8'
    };
    
    notification.style.background = colors[type] || colors.info;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}
