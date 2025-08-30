// 动态加载广告数据
function loadAds() {
    fetch('data/ads.json')
        .then(response => response.json())
        .then(data => {
            const ads = data.ads;
            let html = '';
            ads.forEach(ad => {
                html += `<TR bgColor=#FFFF00 onmouseover="this.bgColor='#B0E0E6'" onmouseout="this.bgColor='#FFFF00'">
                    <TD>&nbsp;<a href="${ad.link}" target="_blank"><font color="red">${ad.title}</font></a></TD>
                    <TD align="center"><font color="red">${ad.date}</font></TD>
                    <TD><font color="red">&nbsp;${ad.description}</font></TD>
                    <TD align="center"><font color="red">${ad.experience}</font></TD>
                    <TD align="center"><font color="red">${ad.version}</font></TD>
                    <TD align="center"><a href="${ad.link}" target="_blank"><font color="red">点击查看</font></a></TD>
                </TR>`;
            });
            document.getElementById('ads-container').innerHTML = html;
        });
}

// 初始化
window.onload = function() {
    loadAds();
};