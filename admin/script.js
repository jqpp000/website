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
    
    // 处理URL哈希值
    handleUrlHash();
    
    // 监听哈希值变化
    window.addEventListener('hashchange', handleUrlHash);
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
    
    // 广告表单提交
    const adForm = document.getElementById('adForm');
    if (adForm) {
        adForm.addEventListener('submit', handleAdFormSubmit);
    }
    
    // 导航菜单点击
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.dataset.page;
            showPage(page);
        });
    });
    
    // 模态框外部点击关闭
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('adModal');
        if (event.target === modal) {
            closeAdModal();
        }
    });
    
    // 添加所有按钮的事件监听器
    setupButtonEventListeners();
}

// 检查登录状态
function checkLoginStatus() {
    const savedUser = localStorage.getItem('adminUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showMainInterface();
    } else {
        // 确保显示登录界面
        document.getElementById('loginContainer').style.display = 'flex';
        document.getElementById('mainContainer').style.display = 'none';
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
async function showMainInterface() {
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('mainContainer').style.display = 'block';
    
    if (document.getElementById('currentUser')) {
        document.getElementById('currentUser').textContent = currentUser.username;
    }
    
    // 确保默认显示仪表盘页面
    showPage('dashboard');
    
    // 从API加载数据
    await loadAdsFromAPI();
    loadDashboardData();
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
        const endDate = new Date(ad.end_date);
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
        const endDate = new Date(ad.end_date);
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
            <td>${formatDateTime(new Date(ad.start_date))}</td>
            <td>${formatDateTime(new Date(ad.end_date))}</td>
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

// 显示添加广告模态框
function showAddAdModal() {
    const modal = document.getElementById('adModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('adForm');
    
    if (modal && modalTitle && form) {
        modalTitle.textContent = '添加广告';
        form.reset();
        
        // 设置默认日期
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        
        const startDateInput = document.getElementById('adStartDate');
        const endDateInput = document.getElementById('adEndDate');
        
        if (startDateInput) startDateInput.value = formatDateTimeLocal(now);
        if (endDateInput) endDateInput.value = formatDateTimeLocal(tomorrow);
        
        modal.style.display = 'block';
    } else {
        showNotification('模态框元素未找到', 'error');
    }
}

// 关闭广告模态框
function closeAdModal() {
    const modal = document.getElementById('adModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// 处理广告表单提交
async function handleAdFormSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const adData = {
        title: formData.get('title'),
        region: formData.get('region'),
        startDate: formData.get('startDate'),
        endDate: formData.get('endDate'),
        content: formData.get('content'),
        experience: formData.get('experience'),
        version: formData.get('version'),
        link: formData.get('link'),
        sortWeight: formData.get('sortWeight') || 0,
        startTime: formData.get('startTime') || '',
        status: formData.get('status') || 'active'
    };
    
    // 验证必填字段
    if (!adData.title || !adData.region || !adData.startDate || !adData.endDate) {
        showNotification('请填写所有必填字段', 'error');
        return;
    }
    
    // 验证日期
    const startDate = new Date(adData.startDate);
    const endDate = new Date(adData.endDate);
    
    if (endDate <= startDate) {
        showNotification('结束时间必须晚于开始时间', 'error');
        return;
    }
    
    try {
        // 通过API保存到数据库
        const response = await fetch('/api/v1/ads', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(adData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // 刷新广告列表
            await loadAdsFromAPI();
            
            // 关闭模态框
            closeAdModal();
            
            // 显示成功消息
            showNotification('广告添加成功', 'success');
        } else {
            showNotification('广告添加失败: ' + (result.error || '未知错误'), 'error');
        }
    } catch (error) {
        console.error('添加广告失败:', error);
        showNotification('网络错误，请稍后重试', 'error');
    }
}

// 处理URL哈希值
function handleUrlHash() {
    const hash = window.location.hash.substring(1); // 移除 # 符号
    
    if (hash && currentUser) {
        // 如果用户已登录且有哈希值，则跳转到对应页面
        const validPages = ['dashboard', 'ads', 'regions', 'logs'];
        if (validPages.includes(hash)) {
            showPage(hash);
        } else {
            // 无效的哈希值，默认显示仪表盘
            showPage('dashboard');
            window.location.hash = '#dashboard';
        }
    } else if (currentUser) {
        // 用户已登录但没有哈希值，默认显示仪表盘
        showPage('dashboard');
        window.location.hash = '#dashboard';
    }
}

// 设置所有按钮的事件监听器
function setupButtonEventListeners() {
    // 退出登录按钮
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // 添加广告按钮
    const addAdBtn = document.getElementById('addAdBtn');
    if (addAdBtn) {
        addAdBtn.addEventListener('click', showAddAdModal);
    }
    
    // 搜索广告按钮
    const searchAdsBtn = document.getElementById('searchAdsBtn');
    if (searchAdsBtn) {
        searchAdsBtn.addEventListener('click', searchAds);
    }
    
    // 分页按钮
    const previousPageBtn = document.getElementById('previousPageBtn');
    if (previousPageBtn) {
        previousPageBtn.addEventListener('click', previousPage);
    }
    
    const nextPageBtn = document.getElementById('nextPageBtn');
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', nextPage);
    }
    
    // 批量操作按钮
    const batchDeleteBtn = document.getElementById('batchDeleteBtn');
    if (batchDeleteBtn) {
        batchDeleteBtn.addEventListener('click', batchDelete);
    }
    
    const batchRenewBtn = document.getElementById('batchRenewBtn');
    if (batchRenewBtn) {
        batchRenewBtn.addEventListener('click', batchRenew);
    }
    
    // 区域查看按钮
    const viewYellowAdsBtn = document.getElementById('viewYellowAdsBtn');
    if (viewYellowAdsBtn) {
        viewYellowAdsBtn.addEventListener('click', () => viewRegionAds('yellow'));
    }
    
    const viewWhiteAdsBtn = document.getElementById('viewWhiteAdsBtn');
    if (viewWhiteAdsBtn) {
        viewWhiteAdsBtn.addEventListener('click', () => viewRegionAds('white'));
    }
    
    const viewLightYellowAdsBtn = document.getElementById('viewLightYellowAdsBtn');
    if (viewLightYellowAdsBtn) {
        viewLightYellowAdsBtn.addEventListener('click', () => viewRegionAds('lightYellow'));
    }
    
    const viewCyanAdsBtn = document.getElementById('viewCyanAdsBtn');
    if (viewCyanAdsBtn) {
        viewCyanAdsBtn.addEventListener('click', () => viewRegionAds('cyan'));
    }
    
    // 保存设置按钮
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', saveSettings);
    }
    
    // 模态框关闭按钮
    const closeAdModalBtn = document.getElementById('closeAdModalBtn');
    if (closeAdModalBtn) {
        closeAdModalBtn.addEventListener('click', closeAdModal);
    }
    
    const cancelAdBtn = document.getElementById('cancelAdBtn');
    if (cancelAdBtn) {
        cancelAdBtn.addEventListener('click', closeAdModal);
    }
    
    const closeRenewModalBtn = document.getElementById('closeRenewModalBtn');
    if (closeRenewModalBtn) {
        closeRenewModalBtn.addEventListener('click', closeRenewModal);
    }
    
    const cancelRenewBtn = document.getElementById('cancelRenewBtn');
    if (cancelRenewBtn) {
        cancelRenewBtn.addEventListener('click', closeRenewModal);
    }
    
    const closeDeleteModalBtn = document.getElementById('closeDeleteModalBtn');
    if (closeDeleteModalBtn) {
        closeDeleteModalBtn.addEventListener('click', closeDeleteModal);
    }
    
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    }
    
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', confirmDelete);
    }
}

// 从API加载广告数据
async function loadAdsFromAPI() {
    try {
        const response = await fetch('/api/v1/ads');
        const result = await response.json();
        
        if (result.success) {
            adsDatabase = result.data.ads || [];
            loadAdsData();
        } else {
            console.error('加载广告数据失败:', result.error);
            showNotification('加载广告数据失败', 'error');
        }
    } catch (error) {
        console.error('网络错误:', error);
        showNotification('网络错误，请稍后重试', 'error');
    }
}

// 加载广告数据（别名函数）
function loadAds() {
    loadAdsFromAPI();
}

// 搜索广告
function searchAds() {
    const keyword = document.getElementById('searchKeyword').value;
    const region = document.getElementById('regionFilter').value;
    const status = document.getElementById('statusFilter').value;
    
    // 这里应该实现搜索逻辑
    console.log('搜索广告:', { keyword, region, status });
    showNotification('搜索功能开发中', 'info');
}

// 上一页
function previousPage() {
    console.log('上一页');
    showNotification('分页功能开发中', 'info');
}

// 下一页
function nextPage() {
    console.log('下一页');
    showNotification('分页功能开发中', 'info');
}

// 批量删除
function batchDelete() {
    console.log('批量删除');
    showNotification('批量删除功能开发中', 'info');
}

// 批量续费
function batchRenew() {
    console.log('批量续费');
    showNotification('批量续费功能开发中', 'info');
}

// 查看区域广告
function viewRegionAds(region) {
    console.log('查看区域广告:', region);
    showNotification(`查看${region}区域广告功能开发中`, 'info');
}

// 保存设置
function saveSettings() {
    console.log('保存设置');
    showNotification('设置保存功能开发中', 'info');
}

// 关闭续费模态框
function closeRenewModal() {
    const modal = document.getElementById('renewModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// 关闭删除模态框
function closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// 确认删除
function confirmDelete() {
    console.log('确认删除');
    showNotification('删除功能开发中', 'info');
    closeDeleteModal();
}