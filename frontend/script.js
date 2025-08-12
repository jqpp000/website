// 全局变量
const AD_API_URL = 'http://localhost:3000/api/ads';
let currentAdId = null;
let originalExpireTime = null;
let originalDisplayDuration = null;
let currentView = 'all'; // 默认显示全部广告
let allAds = []; // 存储所有广告，用于视图切换时筛选
// --------------------------
// 状态管理：解决页面刷新后状态丢失问题
// --------------------------
function restoreEditState() {
  try {
    const savedState = localStorage.getItem('editAdState');
    if (savedState) {
      const { currentAdId: savedId, originalExpireTime: savedExpire, originalDisplayDuration: savedDuration } = JSON.parse(savedState);
      
      if (savedId && savedExpire && savedDuration) {
        currentAdId = savedId;
        originalExpireTime = savedExpire;
        originalDisplayDuration = savedDuration;
        console.log('已恢复编辑状态：', currentAdId);
      } else {
        localStorage.removeItem('editAdState');
      }
    }
  } catch (err) {
    console.error('恢复编辑状态失败：', err);
    localStorage.removeItem('editAdState');
  }
}

function clearEditState() {
  currentAdId = null;
  originalExpireTime = null;
  originalDisplayDuration = null;
  localStorage.removeItem('editAdState');
  console.log('已清除编辑状态');
}

// --------------------------
// 1. 广告渲染（核心修复：增强容错）
// --------------------------
async function renderAds() {
  const adAreas = [
    { area: 'top_yellow', containerId: 'top-yellow-list', name: '置顶黄区域' },
    { area: 'white', containerId: 'white-list', name: '白色区域' },
    { area: 'orange', containerId: 'orange-list', name: '橙色区域' },
    { area: 'green', containerId: 'green-list', name: '绿色区域' }
  ];

  adAreas.forEach(({ containerId }) => {
    const tbody = document.getElementById(containerId);
    if (!tbody) {
      console.warn(`未找到表格容器：${containerId}，该区域无法显示`);
    }
  });

  try {
    // 先获取所有广告数据（全局存储，只请求一次）
    const res = await fetch(AD_API_URL, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error(`接口状态错误：${res.status}`);
    const responseData = await res.json();
    if (responseData.code !== 200) throw new Error(`后端提示：${responseData.msg || '数据异常'}`);
    // 全局变量赋值（关键：不再定义局部allAds）
    allAds = Array.isArray(responseData.data) ? responseData.data : [];
  } catch (err) {
    console.error('获取全局广告数据失败：', err);
    // 全局获取失败时，所有区域显示错误
    adAreas.forEach(({ containerId }) => {
      const tbody = document.getElementById(containerId);
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="6" class="error">加载失败：${err.message}</td></tr>`;
      }
    });
    return; // 终止后续渲染
  }

  // 按区域渲染广告（使用全局allAds数据）
  for (const { area, containerId } of adAreas) {
    const tbody = document.getElementById(containerId);
    if (!tbody) continue;

    tbody.innerHTML = `<tr><td colspan="6" class="loading"><i class="fas fa-circle-notch"></i> 加载中...</td></tr>`;

    try {
      // 从全局allAds中筛选当前区域的广告（不过滤过期状态，交给视图切换处理）
      const ads = allAds
        .filter(ad => {
          return ad && ad.area === area && ad.status === 'active'; // 只筛选区域和状态
        })
        .map(ad => ({
          id: ad.id || '未知',
          server_name: ad.server_name || '未命名',
          open_time: ad.open_time || '无时间',
          feature: ad.feature || '无描述',
          exp_rate: ad.exp_rate || '无',
          version: ad.version || '未知',
          homepage: ad.homepage || '#',
          expire_time: ad.expire_time
        }));

      tbody.innerHTML = ads.length > 0 
        ? ads.map(ad => {
            const isExpired = ad.expire_time ? new Date(ad.expire_time).getTime() <= new Date().getTime() : false;
            return `
            <tr class="${isExpired ? 'expired-ad' : ''}" data-expired="${isExpired}" data-id="${ad.id}">
              <td class="td-server">${ad.server_name}</td>
              <td class="td-time">${formatTime(ad.open_time)}</td>
              <td class="td-feature">${ad.feature}</td>
              <td class="td-exp">${ad.exp_rate}</td>
              <td class="td-version">${ad.version}</td>
              <td class="td-home">
                <a href="${ad.homepage}" target="_blank" class="homepage-link">查看</a>
                <button class="action-btn edit-btn" data-id="${ad.id}">编辑</button>
                <span class="countdown ${isExpired ? 'countdown-expired' : ''}">
                  ${isExpired ? '已过期' : '正常'}
                </span>
              </td>
            </tr>
          `}).join('')
        : `<tr><td colspan="6" class="no-data">该区域暂无数据</td></tr>`;

    } catch (err) {
      console.error(`区域 ${area} 渲染失败：`, err);
      tbody.innerHTML = `<tr><td colspan="6" class="error">加载失败：${err.message}</td></tr>`;
    }
  }

  // 渲染后恢复视图状态
  const activeViewBtn = document.querySelector('.view-btn.active');
  if (activeViewBtn) {
    const currentView = activeViewBtn.getAttribute('data-view');
    filterAdsByView(currentView);
  }
}

async function renderServers() {
  try {
    const serverList = document.getElementById('serverList');
    if (!serverList) {
      console.warn('未找到服务器列表容器，跳过渲染');
      return;
    }

    serverList.innerHTML = '加载服务器列表中...';
    const res = await fetch('http://localhost:3000/api/servers', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!res.ok) throw new Error(`服务器接口错误：${res.status}`);
    const data = await res.json();
    if (data.code !== 200) throw new Error(data.msg || '服务器数据异常');

    const serverSelect = document.getElementById('serverSelect');
    if (serverSelect) {
      serverSelect.innerHTML = data.data?.map(s => 
        `<option value="${s.id}">${s.name}</option>`
      )?.join('') || '<option value="">无服务器数据</option>';
    }
    serverList.innerHTML = '';
  } catch (err) {
    console.error('服务器渲染失败：', err);
  }
}

// --------------------------
// 核心修复：根据视图类型筛选广告（已替换）
// --------------------------
function filterAdsByView(viewType) {
  const rows = document.querySelectorAll('#adTableBody tr, #top-yellow-list tr, #white-list tr, #orange-list tr, #green-list tr');
  const searchKeyword = document.getElementById('searchKeyword').value.trim().toLowerCase();
  
  rows.forEach(row => {
    // 跳过表头、加载行和无数据行
    if (row.querySelector('.loading') || row.querySelector('.no-data') || !row.getAttribute('data-id')) {
      row.style.display = '';
      return;
    }
    
    // 获取过期时间并判断是否过期
    const countdownEl = row.querySelector('.countdown');
    const isExpired = countdownEl ? countdownEl.classList.contains('countdown-expired') : false;
    
    // 先判断是否符合搜索条件
    const text = row.textContent.toLowerCase();
    const matchesSearch = !searchKeyword || text.includes(searchKeyword);
    
    // 再判断是否符合视图条件
    let matchesView = false;
    if (viewType === 'all') {
      matchesView = true; // 所有广告都符合
    } else if (viewType === 'expired') {
      matchesView = isExpired; // 只匹配过期广告
    }
    
    // 同时满足搜索和视图条件才显示
    row.style.display = (matchesSearch && matchesView) ? '' : 'none';
  });
}

// --------------------------
// 2. 编辑模式（修复：检查表单元素是否存在）
// --------------------------
async function enterEditMode(id) {
  try {
    const form = document.getElementById('adForm');
    if (!form) {
      throw new Error('未找到广告表单（id=adForm），无法编辑');
    }

    const res = await fetch(`${AD_API_URL}/${id}`);
    if (!res.ok) throw new Error(`获取详情失败（状态码：${res.status}）`);
    const responseData = await res.json();
    
    // 修复：处理标准响应格式
    if (responseData.code !== 200 || !responseData.data) {
      throw new Error('广告详情数据格式错误');
    }
    const ad = responseData.data;

    currentAdId = id;
    originalExpireTime = ad.expire_time;
    originalDisplayDuration = ad.display_duration;

    // 修复：保存状态到localStorage
    localStorage.setItem('editAdState', JSON.stringify({
      currentAdId: id,
      originalExpireTime: ad.expire_time,
      originalDisplayDuration: ad.display_duration
    }));

    const fields = [
      { id: 'serverName', value: ad.server_name || '' },
      { id: 'openTime', value: ad.open_time ? ad.open_time.slice(0, 16) : '' },
      { id: 'feature', value: ad.feature || '' },
      { id: 'expRate', value: ad.exp_rate || '' },
      { id: 'version', value: ad.version || '' },
      { id: 'homepage', value: ad.homepage || '' },
      { id: 'displayDuration', value: ad.display_duration || 24 },
      { id: 'adArea', value: ad.area || 'top_yellow' }
    ];

    fields.forEach(({ id, value }) => {
      const el = form.querySelector(`[name="${id}"]`) || document.getElementById(id);
      if (el) el.value = value;
      else console.warn(`表单中未找到字段：${id}，跳过赋值`);
    });

    const formTitle = document.getElementById('formTitle');
    if (formTitle) formTitle.textContent = '编辑广告';
    else console.warn('未找到表单标题（id=formTitle）');

    const submitBtn = document.getElementById('submitAd');
    if (submitBtn) {
      submitBtn.textContent = '更新广告';
      submitBtn.onclick = updateAd;
    } else {
      console.warn('未找到提交按钮（id=submitAd）');
    }

    form.scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    alert('编辑失败：' + err.message);
  }
}

// --------------------------
// 3. 新增模式（修复：容错处理）
// --------------------------
function enterAddMode() {
  const form = document.getElementById('adForm');
  if (!form) {
    alert('未找到广告表单，无法新增');
    return;
  }

  clearEditState();

  try {
    form.reset();
    const durationEl = form.displayDuration || document.getElementById('displayDuration');
    if (durationEl) durationEl.value = 24;
    const areaEl = form.adArea || document.getElementById('adArea');
    if (areaEl) areaEl.value = 'top_yellow';
  } catch (err) {
    console.warn('表单重置失败，手动清空：', err);
  }

  const formTitle = document.getElementById('formTitle');
  if (formTitle) formTitle.textContent = '新增广告';

  const submitBtn = document.getElementById('submitAd');
  if (submitBtn) {
    submitBtn.textContent = '新增广告';
    submitBtn.onclick = addAd;
  }

  form.scrollIntoView({ behavior: 'smooth' });
}

// --------------------------
// 4. 表单提交（保持逻辑，增强错误提示）
// --------------------------
async function addAd() {
  const formData = getAdFormData();
  if (!formData) return;

  try {
    const res = await fetch(AD_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (!res.ok) throw new Error(`新增失败（状态码：${res.status}）`);
    const responseData = await res.json();
    if (responseData.code !== 200) throw new Error(responseData.msg || '新增失败');

    alert('新增成功');
    enterAddMode();
    await renderAds();
  } catch (err) {
    alert('新增失败：' + err.message);
  }
}

async function updateAd() {
  if (currentAdId === null) return;
  const formData = getAdFormData();
  if (!formData) return;

  try {
    const res = await fetch(`${AD_API_URL}/${currentAdId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (!res.ok) throw new Error(`更新失败（状态码：${res.status}）`);
    const responseData = await res.json();
    if (responseData.code !== 200) throw new Error(responseData.msg || '更新失败');

    alert('更新成功');
    clearEditState();
    await renderAds();
  } catch (err) {
    alert('更新失败：' + err.message);
  }
}
// 更新选中广告数量（新增）
function updateSelectedCount() {
  const count = document.querySelectorAll('.ad-checkbox:checked').length;
  const countElem = document.getElementById('selectedNum');
  if (countElem) countElem.textContent = count;
  // 控制批量按钮状态（如果有批量删除按钮也一起控制）
  const batchDeleteBtn = document.getElementById('batchDeleteBtn');
  const batchRenewBtn = document.getElementById('batchRenewBtn');
  if (batchDeleteBtn) batchDeleteBtn.disabled = count === 0;
  if (batchRenewBtn) batchRenewBtn.disabled = count === 0;
}
// 批量续费广告（新增）
async function batchRenewAds() {
  // 获取选中的广告ID
  const selectedIds = Array.from(document.querySelectorAll('.ad-checkbox:checked'))
    .map(checkbox => checkbox.getAttribute('data-id'));

  if (selectedIds.length === 0) {
    alert('请先选择要续费的广告');
    return;
  }

  // 询问续费时长
  const duration = prompt('请输入续费时长（小时，1-720）：', '24');
  if (!duration || isNaN(duration) || duration < 1 || duration > 720) {
    alert('请输入1-720之间的有效时长');
    return;
  }

  try {
    const res = await fetch(`${AD_API_URL}/batch-renew`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selectedIds, duration: parseInt(duration) })
    });

    if (!res.ok) throw new Error(`续费失败：${res.status}`);
    const result = await res.json();
    if (result.code === 200) {
      alert(`成功为${selectedIds.length}条广告续费${duration}小时`);
      renderAds(); // 刷新广告列表
    } else {
      alert(`续费失败：${result.msg || '未知错误'}`);
    }
  } catch (err) {
    alert('续费失败：' + err.message);
  }
}
// --------------------------
// 5. 表单数据处理（修复：增强验证和时间计算）
// --------------------------
function getAdFormData() {
  const form = document.getElementById('adForm');
  if (!form) {
    alert('未找到表单，无法提交');
    return null;
  }

  const serverName = (form.serverName || document.getElementById('serverName'))?.value?.trim() || '';
  const openTime = (form.openTime || document.getElementById('openTime'))?.value || '';
  const displayDuration = parseInt((form.displayDuration || document.getElementById('displayDuration'))?.value || 24, 10);
  const feature = (form.feature || document.getElementById('feature'))?.value?.trim() || '';
  const expRate = (form.expRate || document.getElementById('expRate'))?.value?.trim() || '';
  const version = (form.version || document.getElementById('version'))?.value?.trim() || '';
  const homepage = (form.homepage || document.getElementById('homepage'))?.value?.trim() || '';

  // 增强表单验证
  if (!serverName) {
    alert('请输入服务器名（不能为空）');
    (form.serverName || document.getElementById('serverName'))?.focus();
    return null;
  }
  if (!openTime) {
    alert('请选择开机时间（不能为空）');
    (form.openTime || document.getElementById('openTime'))?.focus();
    return null;
  }
  if (isNaN(displayDuration) || displayDuration <= 0) {
    alert('展示时长必须是大于0的数字（如24）');
    (form.displayDuration || document.getElementById('displayDuration'))?.focus();
    return null;
  }
  if (!feature) {
    alert('请输入广告特征描述（不能为空）');
    (form.feature || document.getElementById('feature'))?.focus();
    return null;
  }
  if (!version) {
    alert('请输入版本信息（不能为空）');
    (form.version || document.getElementById('version'))?.focus();
    return null;
  }
  // 网址格式验证
  if (homepage && !/^https?:\/\//i.test(homepage)) {
    alert('请输入有效的网址（需以http://或https://开头）');
    (form.homepage || document.getElementById('homepage'))?.focus();
    return null;
  }

  let expireTime;
  try {
    if (currentAdId) {
      expireTime = originalExpireTime;
      
      // 时间有效性检查
      const originalExpireDate = new Date(originalExpireTime);
      if (isNaN(originalExpireDate.getTime())) {
        throw new Error('原始过期时间格式错误');
      }
      if (isNaN(originalDisplayDuration) || originalDisplayDuration <= 0) {
        throw new Error('原始展示时长无效');
      }

      const originalOpenTime = originalExpireDate.getTime() - (originalDisplayDuration * 3600000);
      const currentOpenTime = new Date(openTime).getTime();

      if (currentOpenTime !== originalOpenTime || displayDuration !== originalDisplayDuration) {
        const newExpire = new Date(openTime);
        newExpire.setHours(newExpire.getHours() + displayDuration);
        expireTime = newExpire.toISOString().slice(0, 16);
      }
    } else {
      const newExpire = new Date(openTime);
      newExpire.setHours(newExpire.getHours() + displayDuration);
      expireTime = newExpire.toISOString().slice(0, 16);
    }
  } catch (timeErr) {
    alert('时间计算错误：' + timeErr.message);
    return null;
  }

  return {
    server_name: serverName,
    open_time: openTime,
    feature: feature,
    exp_rate: expRate,
    version: version,
    homepage: homepage,
    display_duration: displayDuration,
    area: (form.adArea || document.getElementById('adArea'))?.value || 'top_yellow',
    status: 'active',
    expire_time: expireTime
  };
}

// --------------------------
// 6. 辅助函数（时间格式化容错）
// --------------------------
function formatTime(dateString) {
  if (!dateString) return '未知时间';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '时间格式错误';
  return `${date.getMonth() + 1}月${date.getDate()}日 ${
    date.getHours().toString().padStart(2, '0')
  }:${
    date.getMinutes().toString().padStart(2, '0')
  }`;
}

// --------------------------
// 7. 样式和初始化（核心修复：避免初始化崩溃）
// --------------------------
// 添加必要样式（不影响原有布局）
try {
  const style = document.createElement('style');
  style.textContent += `
    /* 加载动画样式 - 仅新增，不影响原有样式 */
    .loading i {
      animation: spin 1.5s linear infinite;
      margin-right: 8px;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    /* 游戏链接基础样式 - 仅在原有样式不存在时生效 */
    .homepage-link {
      color: #0066cc;
      text-decoration: none;
      margin-right: 8px;
    }
    
    .homepage-link:hover {
      text-decoration: underline;
    }

    /* 视图切换按钮样式 */
    .view-toggle {
      display: flex;
      gap: 10px;
      margin: 0 15px;
    }

    .view-btn {
      padding: 8px 16px;
      background: #f1f5f9;
      color: #333;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      cursor: pointer;
    }

    .view-btn.active {
      background: #3498db;
      color: white;
      border-color: #3498db;
    }

    .view-btn:hover:not(.active) {
      background: #e2e8f0;
    }

    /* 过期广告样式 */
    .expired-ad {
      background-color: #fff5f5;
    }

    /* 倒计时样式补充 */
    .countdown {
      margin-left: 8px;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
    }
    .countdown-expired {
      background-color: #ffebee;
      color: #e74c3c;
    }
  `;
  document.head.appendChild(style);
} catch (styleErr) {
  console.warn('样式添加失败：', styleErr);
}

// 页面初始化
window.onload = async () => {
  try {
    // 恢复编辑状态
    restoreEditState();
    
    await renderAds();
    await renderServers().catch(err => console.warn('服务器渲染单独失败：', err));

    const addBtn = document.getElementById('addAdBtn');
    if (addBtn) {
      addBtn.onclick = enterAddMode;
    } else {
      console.warn('未找到新增按钮（id=addAdBtn），新增功能不可用');
    }

    // 修复：编辑按钮事件委托到document，确保可靠触发
    document.addEventListener('click', (e) => {
      const editBtn = e.target.closest('.edit-btn');
      if (editBtn && editBtn.dataset.id) {
        enterEditMode(editBtn.dataset.id);
      }
    });

    // --------------------------
    // 绑定搜索按钮事件（与视图筛选联动）
    // --------------------------
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
      searchBtn.addEventListener('click', function() {
        // 获取当前激活的视图类型
        const activeViewBtn = document.querySelector('.view-btn.active');
        const viewType = activeViewBtn ? activeViewBtn.getAttribute('data-view') : 'all';
        filterAdsByView(viewType); // 使用视图筛选函数同时处理搜索和视图
      });
    }

    // --------------------------
    // 为搜索框添加回车键触发搜索
    // --------------------------
    document.getElementById('searchKeyword').addEventListener('keyup', function(event) {
      if (event.key === 'Enter') {
        const activeViewBtn = document.querySelector('.view-btn.active');
        const viewType = activeViewBtn ? activeViewBtn.getAttribute('data-view') : 'all';
        filterAdsByView(viewType);
      }
    });

    // --------------------------
    // 视图切换按钮事件绑定
    // --------------------------
    const viewBtns = document.querySelectorAll('.view-btn');
    viewBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        // 更新按钮状态
        viewBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
        // 获取视图类型并筛选
        const viewType = this.getAttribute('data-view');
        currentView = viewType; // 更新当前视图状态
        filterAdsByView(viewType);
      });
    });

    // 确保页面加载时应用默认视图
    const activeViewBtn = document.querySelector('.view-btn.active');
    if (activeViewBtn) {
      const viewType = activeViewBtn.getAttribute('data-view');
      filterAdsByView(viewType);
    }

    // 新增：批量续费按钮事件绑定
    const batchRenewBtn = document.getElementById('batchRenewBtn');
    if (batchRenewBtn) {
      batchRenewBtn.addEventListener('click', batchRenewAds);
    } else {
      console.warn('未找到批量续费按钮（id=batchRenewBtn），请在HTML中添加');
    }

    // 新增：全选复选框事件（如果页面有全选框）
    const selectAll = document.getElementById('selectAll');
    if (selectAll) {
      selectAll.addEventListener('change', function() {
        const checkboxes = document.querySelectorAll('.ad-checkbox');
        checkboxes.forEach(checkbox => {
          checkbox.checked = this.checked;
        });
        updateSelectedCount(); // 更新选中数量
      });
    }
  } catch (initErr) {
    console.error('初始化失败：', initErr);
    const errorDiv = document.createElement('div');
    errorDiv.style.padding = '20px';
    errorDiv.style.color = 'red';
    errorDiv.textContent = '页面加载出错，请刷新重试：' + initErr.message;
    document.body.prepend(errorDiv);
  }
};

// 定时刷新
setInterval(async () => {
  try {
    await renderAds();
    await renderServers();
  } catch (refreshErr) {
    console.error('定时刷新失败：', refreshErr);
  }
}, 300000);