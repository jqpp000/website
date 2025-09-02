const { Ad } = require('../models');
const { Op } = require('sequelize');

// 前端广告数据解析
const frontendAds = [
    // 黄色区域 - 强力推荐 (20条)
    {
        title: '《豪-情》',
        content: '▅▅▅▅《１２０００》▅▅▅▅《经典复古》▅▅▅▅《今晚首区》▅▅▅▅',
        link: 'http://www.3333mu.com',
        region: 'yellow',
        experience: '300倍',
        version: '1.03H',
        startTime: '8月29日',
        sortWeight: 100
    },
    {
        title: '▄豪情奇迹50倍▄',
        content: '【１０／１１／１３点】 【EG新端】【F7完整+Z双助手】【超级防G】',
        link: 'http://9393qj.com:66/',
        region: 'yellow',
        experience: '50倍',
        version: '1.03H',
        startTime: '8月29日',
        sortWeight: 99
    },
    {
        title: '▄【斩神奇迹】今日首区▄',
        content: '▄▄▄【６４０００】▄▄▄【经典怀旧】▄▄▄【物品保值】▄▄▄【今晚首区】▄▄▄',
        link: 'http://www.144mu.com:66',
        region: 'yellow',
        experience: '999倍',
        version: '1.03H',
        startTime: '8月29日',
        sortWeight: 98
    },
    {
        title: '凌天9999级大区[首区]',
        content: '地图高爆-+15全属性随意爆-9999级不快餐-天赋-超级大师-1-6级副本挑战-7D翅膀',
        link: 'http://zd.9smu.com:168/',
        region: 'yellow',
        experience: '9999级',
        version: '1.03H',
        startTime: '8月29日',
        sortWeight: 97
    },
    {
        title: '《传-说》',
        content: '▅▅▅▅《３万２》▅▅▅▅《经典复古》▅▅▅▅《今日新区》▅▅▅▅',
        link: 'http://www.777yy.cn',
        region: 'yellow',
        experience: '500倍',
        version: '1.03H',
        startTime: '8月29日',
        sortWeight: 96
    },
    {
        title: '【【【觉醒奇迹】】】',
        content: '▄▄▄【１２０００】▄▄▄【巅峰版本】▄▄▄【荣耀大陆】▄▄▄【今晚首区】▄▄▄',
        link: 'http://www.60mu.com',
        region: 'yellow',
        experience: '200倍',
        version: '独家S6',
        startTime: '8月29日',
        sortWeight: 95
    },
    {
        title: '【王】【者】【首】【区】',
        content: '▄▄▄【３２０００】▄▄▄【品牌大服】▄▄▄【精品怀旧】▄▄▄【今晚首区】▄▄▄',
        link: 'http://www.95mu.com',
        region: 'yellow',
        experience: '500倍',
        version: '1.03H',
        startTime: '8月29日',
        sortWeight: 94
    },
    {
        title: '★★★★凌云奇迹★★★★',
        content: '▄▄▄▄▄【２４０００】【无VIP称号】【积分购买GM宝箱】【宠物坐骑同骑】▄▄▄▄▄',
        link: 'http://ly.278mu.com:88/',
        region: 'yellow',
        experience: '特色新区',
        version: '1.03H',
        startTime: '8月29日',
        sortWeight: 93
    },
    {
        title: '〓逆龙觉醒〓【新版首区】〓',
        content: '殺',
        link: 'http://103.36.167.161:88/',
        region: 'yellow',
        experience: '全网独家',
        version: '限单开',
        startTime: '8月29日',
        sortWeight: 92
    },
    {
        title: '▄灵魂奇迹20倍▄',
        content: '【５／６／７点】【EG新端+双助手】【第一个大区】',
        link: 'http://9966qj.com:66/',
        region: 'yellow',
        experience: '20倍',
        version: '1.03H',
        startTime: '8月29日',
        sortWeight: 91
    },
    {
        title: '御豪奇迹▄重磅归来▄',
        content: '▄【10/11/12】▄【纯正S6老品牌新服】▄【不售任何装备】▄【商人月入过万】▄',
        link: 'http://zd.588mu.com:81/',
        region: 'yellow',
        experience: '推荐',
        version: 'S6',
        startTime: '8月29日',
        sortWeight: 90
    },
    {
        title: '★起源★【休闲耐玩】',
        content: '▅满点6000左右▅▅白瓢天堂▅▅好玩易上手▅▅装备靠自己▅',
        link: 'http://wwww.s6mu.com:88/',
        region: 'yellow',
        experience: '100/20',
        version: '特色S6',
        startTime: '8月29日',
        sortWeight: 89
    },
    {
        title: '▄神魔奇迹【今日首区】▄',
        content: '▄▄▄【15/16/28】▄▄▄【独立双区】▄▄▄【专属宠物】▄▄▄【跨服超爽PK】▄▄▄',
        link: 'http://www.shenmomu.com:88/',
        region: 'yellow',
        experience: '50/100',
        version: 'S6EP3',
        startTime: '8月29日',
        sortWeight: 88
    },
    {
        title: '问鼎奇迹【首区】',
        content: '《散人天堂~BOSS掉元宝~全职平衡》-《今夜首区》',
        link: 'http://cq.01mu.com:88/',
        region: 'yellow',
        experience: '500倍',
        version: 'S6',
        startTime: '8月29日',
        sortWeight: 87
    },
    {
        title: '★★★★依然MU★★★★',
        content: '【１２／１３／１５点】【小怪无限刷元宝】【特色神装】【爆所有顶级】',
        link: 'http://mu.165mu.com:88',
        region: 'yellow',
        experience: '今日新区',
        version: 'EX603',
        startTime: '8月29日',
        sortWeight: 86
    },
    {
        title: '星芒奇迹▄新服首区▄',
        content: '▄▄▄【４ 8０００】【BOSS爆所有顶级】【EG新端+双助手】【品牌大服】▄▄▄',
        link: 'http://103.635mu.com:88',
        region: 'yellow',
        experience: '今日新区',
        version: '1.03H',
        startTime: '8月29日',
        sortWeight: 85
    },
    {
        title: '天启103『新服首区』',
        content: '【５／６／７点】【无VIP无声望】【不售任何道具积分】【让利商人只为人气】',
        link: 'http://zd.20mu.com:166/',
        region: 'yellow',
        experience: '20倍',
        version: '1.03H',
        startTime: '8月29日',
        sortWeight: 84
    },
    {
        title: '〓〓〓★雷鸣奇迹★〓〓〓',
        content: '【１8／１９／２０点】【打怪掉充值】【积分购买GM宝箱】【进阶神装】',
        link: 'http://lm.46mu.com:81',
        region: 'yellow',
        experience: '今日新区',
        version: '特色S6',
        startTime: '8月29日',
        sortWeight: 83
    },
    {
        title: '天下',
        content: '３２０００复古',
        link: 'http://188mu.com:88/',
        region: 'yellow',
        experience: '今日新区',
        version: '1.03H',
        startTime: '8月29日',
        sortWeight: 82
    },
    {
        title: '神佑奇迹▄▄王者大区▄▄',
        content: '▄超多福利领取▄怀旧经典版▄精品老牌设置▄物品保值高▄畅爽ＰＫ▄散人天堂▄公平耐玩▄',
        link: 'http://www.620mu.com:88/',
        region: 'yellow',
        experience: '200倍',
        version: '1.03H',
        startTime: '8月29日',
        sortWeight: 81
    }
];

// 白色区域广告 (部分示例)
const whiteAds = [
    {
        title: '凡人奇迹超级变态版',
        content: '满点132000-自动拾取存-技能全屏-称号收集-宠物培育-符文镶嵌-锻造装备-修仙渡劫',
        link: 'http://www.088mu.cn:166/',
        region: 'white',
        experience: '今日新区',
        version: '修仙S6',
        startTime: '8月29日',
        sortWeight: 70
    },
    {
        title: '【极】【光】【奇】【迹】',
        content: '▄▄▄▄▄▄▄【 满点8000+】▄▄▄▄▄▄▄【上线送恶魔+旗子】▄▄▄▄▄▄▄',
        link: 'http://www.215mu.com:88/',
        region: 'white',
        experience: '50倍',
        version: '1.03h',
        startTime: '8月29日',
        sortWeight: 69
    },
    {
        title: '木瓜奇迹（特色专区）',
        content: '满点版、经典版、怀旧版、激战版、多版本多玩法、**特色专区',
        link: 'https://1717mu.1000uc.com',
        region: 'white',
        experience: '特色专区',
        version: '四版本',
        startTime: '8月29日',
        sortWeight: 68
    }
];

// 浅黄色区域广告 (53条套青强力推荐)
const lightYellowAds = [
    {
        title: '★★★★浴火奇迹★★★★',
        content: '6.7.8-1.03H-EG-|999倍|透视排行|经典设置|长久稳定服|高爆|',
        link: 'http://yuhuoeg.hi-mu.cn:888/',
        region: 'lightYellow',
        experience: '999',
        version: '1.03H',
        startTime: '8月29日',
        sortWeight: 60
    },
    {
        title: '头条奇迹',
        content: '【满点9000+】【15/16/18点】【精品设置】【经典耐玩】',
        link: 'http://www.36mu.net:88',
        region: 'lightYellow',
        experience: '50/30倍',
        version: '1.03H',
        startTime: '8月29日',
        sortWeight: 59
    },
    {
        title: '今天新区★超爽S6★',
        content: '▅遍地BOSS任刷▅顶级时装全职业▅▅元宝积分互换▅散人白瓢▅300全通▅',
        link: 'http://www.1111mu.com:999/',
        region: 'lightYellow',
        experience: '400/300',
        version: 'S6EP4',
        startTime: '8月29日',
        sortWeight: 58
    },
    {
        title: '御豪奇迹▄重磅归来▄',
        content: '▄【10/11/12】▄【纯正S6老品牌新服】▄【不售任何装备】▄【商人月入过万】▄',
        link: 'http://zd.588mu.com:81/',
        region: 'lightYellow',
        experience: '推荐',
        version: 'S6',
        startTime: '8月29日',
        sortWeight: 57
    },
    {
        title: '【流】【火】【奇】【迹】',
        content: '══════时═════装════特════效════服════',
        link: 'http://www.61qj.com:91/',
        region: 'lightYellow',
        experience: '今日首区',
        version: 'S20-2',
        startTime: '8月29日',
        sortWeight: 56
    },
    {
        title: '最爽S6【今天新区】',
        content: '★300打通2025最新全拓展设置★【今天新区】【包区超爽】【全民BOSS刷刷刷】',
        link: 'http://www.991mu.com:991/',
        region: 'lightYellow',
        experience: '新区刚开',
        version: '最爽S6',
        startTime: '8月29日',
        sortWeight: 55
    },
    {
        title: '〓〓〓〓怀旧奇迹〓〓〓〓',
        content: '━百分百封G━无VIP━全职二连━商人必玩━经典设置━爆顶级装备大天套',
        link: 'http://www.129mu.com/',
        region: 'lightYellow',
        experience: '50倍',
        version: '1.03H',
        startTime: '8月29日',
        sortWeight: 54
    },
    {
        title: '【王】【者】【首】【区】',
        content: '▄▄▄【３２０００】▄▄▄【品牌大服】▄▄▄【精品怀旧】▄▄▄【今晚首区】▄▄▄',
        link: 'http://www.95mu.com',
        region: 'lightYellow',
        experience: '500倍',
        version: '1.03H',
        startTime: '8月29日',
        sortWeight: 53
    },
    {
        title: '问鼎奇迹【首区】',
        content: '《散人天堂~BOSS掉元宝~全职平衡》-《今夜首区》',
        link: 'http://cq.01mu.com:88/',
        region: 'lightYellow',
        experience: '500倍',
        version: 'S6',
        startTime: '8月29日',
        sortWeight: 52
    },
    {
        title: '【【【觉醒奇迹】】】',
        content: '▄▄▄【１２０００】▄▄▄【巅峰版本】▄▄▄【荣耀大陆】▄▄▄【今晚首区】▄▄▄',
        link: 'http://www.60mu.com',
        region: 'lightYellow',
        experience: '200倍',
        version: '独家S6',
        startTime: '8月29日',
        sortWeight: 51
    },
    {
        title: '★★★★凌云奇迹★★★★',
        content: '▄▄▄▄▄【２４０００】【无VIP称号】【积分购买GM宝箱】【宠物坐骑同骑】▄▄▄▄▄',
        link: 'http://ly.278mu.com:88/',
        region: 'lightYellow',
        experience: '特色新区',
        version: '1.03H',
        startTime: '8月29日',
        sortWeight: 50
    }
];

// 青色区域广告 (67条套青强力推荐)
const cyanAds = [
    {
        title: '一寻97★纯净四区',
        content: '原汁原味，仅38R永久卡，其他一切靠自己打！Q群：695 186 994',
        link: 'http://yixunmu.com:97/',
        region: 'cyan',
        experience: '0.5/1',
        version: '0.97D',
        startTime: '8月29日',
        sortWeight: 40
    },
    {
        title: '朱雀奇迹',
        content: '新服，首区，EG端，3.2W纯复古PK服，无隐藏，公平公正',
        link: 'http://www.333mu.cc:8888/',
        region: 'cyan',
        experience: '500/200',
        version: '103H',
        startTime: '8月29日',
        sortWeight: 39
    },
    {
        title: '【６Ｗ４】【今日首区】',
        content: '▄『６４０００』『永不关服长久稳定』『BOSS狂刷』『0氪当天顶级』『全职业PK平衡』▄',
        link: 'http://tyq.muguanggaoxx.top:88/',
        region: 'cyan',
        experience: '今日首区',
        version: '1.03H',
        startTime: '8月29日',
        sortWeight: 38
    },
    {
        title: '〓小退２４００００万点〓',
        content: '２４Ｗ一连【全职业平衡】【全图积分元宝】【长久稳定】【爆率超高】【独家设置】【无限BOSS】',
        link: 'http://mnq.muguanggaoxx.top:88/',
        region: 'cyan',
        experience: '今日新开',
        version: '1.03H',
        startTime: '8月29日',
        sortWeight: 37
    },
    {
        title: '浑天奇迹0.97D',
        content: '▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅经典0.97D加强版本▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅',
        link: 'http://www.yunleb.cn:90/',
        region: 'cyan',
        experience: '10倍',
        version: '0.97D',
        startTime: '8月29日',
        sortWeight: 36
    },
    {
        title: '▄高武奇迹▄今日新区▄',
        content: '▄▄▄超绝变态▄▄▄▄13W级▄▄▄▄满点13万▄▄▄▄全屏攻击▄▄▄自动拾取▄▄▄',
        link: 'http://qj.106mu.cn:99/',
        region: 'cyan',
        experience: '数量升级',
        version: 'S6EP3',
        startTime: '8月29日',
        sortWeight: 35
    },
    {
        title: '★★【６W４首区】★★',
        content: '【满点64000】【送全属性大天-百套时装】【全职平衡-无限BOSS】【白瓢元宝-白瓢积分】',
        link: 'http://6w4qh.muguanggaoxx.top:88/',
        region: 'cyan',
        experience: '今日新开',
        version: '1.03H',
        startTime: '8月29日',
        sortWeight: 34
    }
];

// 合并所有广告
const allAds = [...frontendAds, ...whiteAds, ...lightYellowAds, ...cyanAds];

// 同步函数
async function syncFrontendAds() {
    try {
        console.log('开始同步前端广告数据到数据库...');
        
        // 清空现有数据
        await Ad.destroy({ where: {} });
        console.log('已清空现有广告数据');
        
        // 批量插入新数据
        const adsToInsert = allAds.map(ad => ({
            title: ad.title,
            content: ad.content,
            link: ad.link,
            region: ad.region,
            start_date: new Date('2025-09-02T10:00:00.000Z'), // 默认开始时间
            end_date: new Date('2025-12-31T23:59:59.000Z'),   // 默认结束时间
            experience: ad.experience,
            version: ad.version,
            sort_weight: ad.sortWeight,
            status: 'active',
            create_user: 'system',
            update_user: 'system'
        }));
        
        await Ad.bulkCreate(adsToInsert);
        console.log(`成功同步 ${adsToInsert.length} 条广告数据到数据库`);
        
        // 显示统计信息
        const stats = await Ad.getStatistics();
        console.log('数据库统计信息:', stats);
        
    } catch (error) {
        console.error('同步失败:', error);
        throw error;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    syncFrontendAds()
        .then(() => {
            console.log('同步完成！');
            process.exit(0);
        })
        .catch((error) => {
            console.error('同步失败:', error);
            process.exit(1);
        });
}

module.exports = { syncFrontendAds, allAds };
