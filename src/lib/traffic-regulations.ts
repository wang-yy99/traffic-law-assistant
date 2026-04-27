/**
 * 交管法规知识库
 * 包含道路交通事故责任认定相关的核心法规条款
 */

// 法规分类
export type RegulationCategory = 
  | 'signal_violation'      // 信号灯违规
  | 'right_of_way'          // 路权优先
  | 'lane_change'           // 变道超车
  | 'pedestrian_protection' // 行人保护
  | 'speeding'              // 超速行驶
  | 'drunk_driving'         // 酒驾毒驾
  | 'rear_end'              // 追尾事故
  | 'intersection'          // 路口通行
  | 'general'               // 一般规定
  | 'loading'               // 装载规定
  | 'towing'                // 牵引规定
  | 'accident_handling'     // 事故处理
  | 'road_grade';           // 公路技术等级

// ========== 公路技术等级分类标准（依据JTG B01-2014）==========

export interface RoadGrade {
  id: string;
  name: string;                    // 等级名称
  coreFeatures: string;            // 核心特征
  designSpeedRange: string;        // 设计速度范围
  applicableScenario: string;       // 适用场景
  speedLimitRange: string;         // 限速参考范围
  laneConfiguration: string;       // 车道配置
  accessControl: string;           // 出入控制
}

export const roadGrades: RoadGrade[] = [
  {
    id: 'highway',
    name: '高速公路',
    coreFeatures: '专供汽车分方向分车道行驶、全部控制出入',
    designSpeedRange: '80-120 km/h',
    applicableScenario: '国家干线、省际通道',
    speedLimitRange: '60-120 km/h（根据道路具体条件）',
    laneConfiguration: '双向四车道及以上，中央分隔带隔离',
    accessControl: '全部控制出入，仅限机动车，匝道接入',
  },
  {
    id: 'first_class',
    name: '一级公路',
    coreFeatures: '供汽车分方向分车道行驶，部分控制出入',
    designSpeedRange: '60-100 km/h',
    applicableScenario: '连接重要政治经济中心',
    speedLimitRange: '60-100 km/h',
    laneConfiguration: '双向四车道及以上，可设置中央分隔带',
    accessControl: '部分控制出入，允许非机动车和行人通行',
  },
  {
    id: 'second_class',
    name: '二级公路',
    coreFeatures: '双向两车道，不设中央分隔带',
    designSpeedRange: '40-80 km/h',
    applicableScenario: '连接县、乡主要交通',
    speedLimitRange: '40-80 km/h',
    laneConfiguration: '双向两车道，无中央分隔带',
    accessControl: '无控制出入，混合交通',
  },
  {
    id: 'third_class',
    name: '三级公路',
    coreFeatures: '双车道，通行能力较低',
    designSpeedRange: '30-60 km/h',
    applicableScenario: '连接乡镇、一般干线',
    speedLimitRange: '30-60 km/h',
    laneConfiguration: '双车道，路面宽度较窄',
    accessControl: '无控制出入，混合交通为主',
  },
  {
    id: 'fourth_class',
    name: '四级公路',
    coreFeatures: '单车道或双车道，通行能力最低',
    designSpeedRange: '20-40 km/h',
    applicableScenario: '乡村道路、支线交通',
    speedLimitRange: '20-40 km/h',
    laneConfiguration: '单车道或双车道',
    accessControl: '无控制出入，多为混合交通',
  },
];

/**
 * 根据道路类型识别公路技术等级
 */
export function identifyRoadGrade(roadType: string): RoadGrade | null {
  const gradeKeywords: Record<string, string> = {
    '高速': 'highway',
    '一级': 'first_class',
    '二级': 'second_class',
    '三级': 'third_class',
    '四级': 'fourth_class',
    '国道': 'first_class',
    '省道': 'second_class',
    '县道': 'third_class',
    '乡道': 'fourth_class',
    '乡村': 'fourth_class',
    '城市': 'first_class',
  };

  for (const [keyword, gradeId] of Object.entries(gradeKeywords)) {
    if (roadType.includes(keyword)) {
      return roadGrades.find(g => g.id === gradeId) || null;
    }
  }

  // 默认返回二级公路（最常见的一般道路）
  return roadGrades.find(g => g.id === 'second_class') || null;
}

/**
 * 获取道路等级对事故分析的影响说明
 */
export function getRoadGradeImpact(grade: RoadGrade): string {
  return `【${grade.name}道路特征分析】
- 设计速度范围：${grade.designSpeedRange}
- 限速参考：${grade.speedLimitRange}
- 通行能力：${grade.coreFeatures}
- 出入控制：${grade.accessControl}

【对事故责任认定的影响】
1. 不同等级道路的限速标准是判断"是否超速"的重要依据
2. 道路等级影响"是否合理使用道路"的判定
3. 中央分隔带设置情况影响对向车辆的路权判断
4. 出入控制方式影响路口让行规则的适用`;
}

// 法规条目
export interface Regulation {
  id: string;
  title: string;              // 法规名称
  article: string;            // 条款编号
  content: string;            // 条款内容
  category: RegulationCategory[];
  keywords: string[];         // 匹配关键词
  applicability: string;     // 适用场景说明
}

// 知识库
export const trafficRegulations: Regulation[] = [
  // ========== 一般规定 ==========
  {
    id: 'r001',
    title: '《中华人民共和国道路交通安全法》',
    article: '第三十五条',
    content: '机动车、非机动车实行右侧通行。',
    category: ['general'],
    keywords: ['逆行', '右侧通行', '对向行驶'],
    applicability: '确定车辆通行方向的基本规则'
  },
  {
    id: 'r002',
    title: '《中华人民共和国道路交通安全法》',
    article: '第三十六条',
    content: '根据道路条件和通行需要，道路划分为机动车道、非机动车道和人行道，机动车、非机动车、行人实行分道通行。没有划分机动车道、非机动车道和人行道的，机动车在道路中间通行，非机动车和行人在道路两侧通行。',
    category: ['general'],
    keywords: ['分道通行', '道路划分', '中间通行'],
    applicability: '确定道路通行区域分配'
  },
  {
    id: 'r003',
    title: '《中华人民共和国道路交通安全法》',
    article: '第三十八条',
    content: '车辆、行人应当按照交通信号通行；遇有交通警察现场指挥时，应当按照交通警察的指挥通行；在没有交通信号的道路上，应当在确保安全、畅通的原则下通行。',
    category: ['signal_violation', 'general'],
    keywords: ['交通信号', '交通警察指挥', '安全通行'],
    applicability: '所有道路通行行为的基础性规定'
  },

  // ========== 路口通行 ==========
  {
    id: 'r004',
    title: '《中华人民共和国道路交通安全法实施条例》',
    article: '第三十八条',
    content: '机动车信号灯和非机动车信号灯表示：（一）绿灯亮时，准许车辆通行，但转弯的车辆不得妨碍被放行的车辆和行人通行；（二）黄灯亮时，已越过停止线的车辆可以继续通行；（三）红灯亮时，禁止车辆通行。',
    category: ['signal_violation', 'intersection'],
    keywords: ['信号灯', '绿灯通行', '黄灯警示', '红灯禁止'],
    applicability: '信号灯控制路口的通行规则'
  },
  {
    id: 'r005',
    title: '《中华人民共和国道路交通安全法实施条例》',
    article: '第五十二条',
    content: '机动车通过没有交通信号灯控制也没有交通警察指挥的交叉路口，除应当遵守第五十一条第（一）项、第（二）项和第（三）项的规定外，还应当遵守下列规定：（一）有交通标志、标线控制的，让优先通行的一方先行；（二）没有交通标志、标线控制的，在进入路口前停车瞭望，让右方道路的来车先行；（三）转弯的机动车让直行的车辆先行；（四）相对方向行驶的右转弯的机动车让左转弯的车辆先行。',
    category: ['intersection', 'right_of_way'],
    keywords: ['无信号灯路口', '让行规则', '优先通行', '停车瞭望', '让右先行'],
    applicability: '无信号灯控制路口的通行优先权判定'
  },
  {
    id: 'r006',
    title: '《中华人民共和国道路交通安全法实施条例》',
    article: '第五十一条',
    content: '机动车通过有交通信号灯控制的交叉路口，应当按照下列规定通行：（一）在划有导向车道的路口，按所需行进方向驶入导向车道；（二）准备进入环形路口的让已在路口内的机动车先行；（三）向左转弯时，靠路口中心点左侧转弯。转弯时开启转向灯，夜间行驶开启近光灯。',
    category: ['intersection', 'general'],
    keywords: ['导向车道', '环形路口', '左转弯'],
    applicability: '有信号灯路口的具体通行规定'
  },

  // ========== 让行规则 ==========
  {
    id: 'r007',
    title: '《中华人民共和国道路交通安全法》',
    article: '第四十四条',
    content: '机动车通过交叉路口，应当按照交通信号灯、交通标志、交通标线或者交通警察的指挥通过；通过没有交通信号灯、交通标志、交通标线或者交通警察指挥的交叉路口时，应当减速慢行，并让行人和优先通行的车辆先行。',
    category: ['right_of_way', 'intersection'],
    keywords: ['减速慢行', '让行人', '让优先通行车辆'],
    applicability: '路口让行的基本原则'
  },
  {
    id: 'r008',
    title: '《中华人民共和国道路交通安全法》',
    article: '第四十七条',
    content: '机动车行经人行横道时，应当减速行驶；遇行人正在通过人行横道，应当停车让行。机动车行经没有交通信号的道路时，遇行人横过道路，应当避让。',
    category: ['pedestrian_protection', 'right_of_way'],
    keywords: ['人行横道', '减速让行', '停车让行', '行人保护'],
    applicability: '机动车对行人的让行义务'
  },
  {
    id: 'r009',
    title: '《中华人民共和国道路交通安全法》',
    article: '第四十五条',
    content: '机动车遇有前方车辆停车排队等候或者缓慢行驶时，不得借道超车或者占用对面车道，不得穿插等候的车辆。',
    category: ['general', 'lane_change'],
    keywords: ['排队等候', '借道超车', '穿插车辆'],
    applicability: '拥堵路段的通行规则'
  },

  // ========== 变更车道与超车 ==========
  {
    id: 'r010',
    title: '《中华人民共和国道路交通安全法》',
    article: '第四十三条',
    content: '同车道行驶的机动车，后车应当与前车保持足以采取紧急制动措施的安全距离。有下列情形之一的，不得超车：（一）前车正在左转弯、掉头或者超车的；（二）与对面来车有会车可能的；（三）前车为执行紧急任务的警车、消防车、救护车、工程救险车的；（四）行经铁路道口、交叉路口、窄桥、弯道、陡坡、隧道、人行横道、市区交通流量大的路段等没有超车条件的。',
    category: ['lane_change'],
    keywords: ['安全距离', '禁止超车情形', '跟车距离'],
    applicability: '超车行为的基本规定'
  },
  {
    id: 'r011',
    title: '《中华人民共和国道路交通安全法实施条例》',
    article: '第四十四条',
    content: '在道路同方向划有2条以上机动车道的，变更车道的机动车不得影响相关车道内行驶的机动车的正常行驶。',
    category: ['lane_change'],
    keywords: ['变更车道', '不得影响', '车道行驶'],
    applicability: '变更车道的行为规范'
  },
  {
    id: 'r012',
    title: '《中华人民共和国道路交通安全法》',
    article: '第四十六条',
    content: '机动车掉头、转弯、下陡坡时，最高行驶速度不得超过每小时30公里。',
    category: ['speeding', 'general'],
    keywords: ['掉头', '转弯', '下坡', '限速30'],
    applicability: '特殊路况下的速度限制'
  },

  // ========== 追尾事故 ==========
  {
    id: 'r013',
    title: '《中华人民共和国道路交通安全法》',
    article: '第四十三条',
    content: '同车道行驶的机动车，后车应当与前车保持足以采取紧急制动措施的安全距离。',
    category: ['rear_end'],
    keywords: ['安全距离', '跟车距离', '追尾'],
    applicability: '预防追尾事故的基本规定'
  },
  {
    id: 'r014',
    title: '《中华人民共和国道路交通安全法》',
    article: '第四十二条',
    content: '机动车上道路行驶，不得超过限速标志标明的最高时速。在没有限速标志的路段，应当保持安全车速。夜间行驶或者在容易发生危险的路段行驶，应当降低行驶速度。',
    category: ['speeding', 'general'],
    keywords: ['限速', '安全车速', '夜间行驶', '降低车速'],
    applicability: '车速控制的基本规定'
  },

  // ========== 倒车与掉头 ==========
  {
    id: 'r015',
    title: '《中华人民共和国道路交通安全法实施条例》',
    article: '第五十条',
    content: '机动车倒车时，应当察明车后情况，确认安全后倒车。不得在铁路道口、交叉路口、单行路、桥梁、急弯、陡坡、隧道中倒车。',
    category: ['general'],
    keywords: ['倒车', '确认安全', '禁止倒车路段'],
    applicability: '倒车行为的安全规范'
  },

  // ========== 行人保护 ==========
  {
    id: 'r016',
    title: '《中华人民共和国道路交通安全法》',
    article: '第六十二条',
    content: '行人通过路口或者横过道路，应当走人行横道或者过街设施；通过有交通信号灯的人行横道，应当按照交通信号灯指示通行；通过没有交通信号灯、人行横道的路口，或者在没有过街设施的路段横过道路，应当在确认安全后通过。',
    category: ['pedestrian_protection'],
    keywords: ['行人通行', '人行横道', '交通信号', '确认安全'],
    applicability: '行人的通行规则'
  },
  {
    id: 'r017',
    title: '《中华人民共和国道路交通安全法》',
    article: '第七十六条',
    content: '机动车发生交通事故造成人身伤亡、财产损失的，由保险公司在机动车第三者责任强制保险责任限额范围内予以赔偿；不足的部分，按照下列规定承担赔偿责任：（一）机动车之间发生交通事故的，由有过错的一方承担赔偿责任；双方都有过错的，按照各自过错的比例分担责任。（二）机动车与非机动车驾驶人、行人之间发生交通事故，非机动车驾驶人、行人没有过错的，由机动车一方承担赔偿责任；有证据证明非机动车驾驶人、行人有过错的，根据过错程度适当减轻机动车一方的赔偿责任；机动车一方没有过错的，承担不超过百分之十的赔偿责任。',
    category: ['general', 'pedestrian_protection'],
    keywords: ['交通事故责任', '赔偿责任', '过错分担', '行人保护'],
    applicability: '交通事故赔偿责任的基本原则'
  },

  // ========== 酒驾毒驾 ==========
  {
    id: 'r018',
    title: '《中华人民共和国道路交通安全法》',
    article: '第二十二条',
    content: '机动车驾驶人应当遵守道路交通安全法律、法规的规定，按照操作规范安全驾驶、文明驾驶。任何人不得强迫、指使、纵容驾驶人违反道路交通安全法律、法规和机动车安全驾驶要求驾驶机动车。饮酒、服用国家管制的精神药品或者麻醉药品，或者患有妨碍安全驾驶机动车的疾病，或者过度疲劳影响安全驾驶的，不得驾驶机动车。',
    category: ['drunk_driving', 'general'],
    keywords: ['禁止酒驾', '安全驾驶', '毒驾', '疲劳驾驶'],
    applicability: '驾驶人的基本义务和禁止行为'
  },
  {
    id: 'r019',
    title: '《中华人民共和国道路交通安全法》',
    article: '第九十一条',
    content: '饮酒后驾驶机动车的，处暂扣六个月机动车驾驶证，并处一千元以上二千元以下罚款。醉酒驾驶机动车的，由公安机关交通管理部门约束至酒醒，吊销机动车驾驶证，依法追究刑事责任，五年内不得重新取得机动车驾驶证。',
    category: ['drunk_driving'],
    keywords: ['酒驾处罚', '醉驾', '吊销驾照'],
    applicability: '酒驾行为的法律后果'
  },

  // ========== 事故处理 ==========
  {
    id: 'r020',
    title: '《中华人民共和国道路交通安全法》',
    article: '第七十条',
    content: '在道路上发生交通事故，车辆驾驶人应当立即停车，保护现场；造成人身伤亡的，车辆驾驶人应当立即抢救受伤人员，并迅速报告执勤的交通警察或者公安机关交通管理部门。因抢救受伤人员变动现场的，应当标明位置。乘车人、过往车辆驾驶人、过往行人应当予以协助。',
    category: ['accident_handling'],
    keywords: ['事故处理', '立即停车', '保护现场', '抢救伤员'],
    applicability: '交通事故发生后的基本处理程序'
  },
  {
    id: 'r021',
    title: '《中华人民共和国道路交通安全法实施条例》',
    article: '第六十条',
    content: '机动车在道路上发生故障或者发生交通事故，妨碍交通又难以移动的，应当按照规定开启危险报警闪光灯并在车后50米至100米处设置警告标志，夜间还应当同时开启示廓灯和后位灯。',
    category: ['accident_handling'],
    keywords: ['故障处理', '警告标志', '危险报警闪光灯', '夜间警示'],
    applicability: '车辆故障或事故后的警示要求'
  },

  // ========== 装载规定 ==========
  {
    id: 'r022',
    title: '《中华人民共和国道路交通安全法》',
    article: '第四十八条',
    content: '机动车载物应当符合核定的载质量，严禁超载；载物的长、宽、高不得违反装载要求；载客汽车除车身外部的行李架和内置的行李箱外，不得载货。载客汽车行李架载货，从车顶起高度不得超过0.5米，从地面起高度不得超过4.5米。',
    category: ['loading'],
    keywords: ['超载', '装载规定', '载物限制'],
    applicability: '机动车装载的基本规定'
  },

  // ========== 牵引规定 ==========
  {
    id: 'r023',
    title: '《中华人民共和国道路交通安全法》',
    article: '第六十一条',
    content: '牵引故障机动车的，牵引车和被牵引车均应开启危险报警闪光灯。',
    category: ['towing'],
    keywords: ['牵引故障车', '危险报警闪光灯'],
    applicability: '牵引故障车辆时的安全要求'
  },
  {
    id: 'r024',
    title: '《中华人民共和国道路交通安全法实施条例》',
    article: '第六十一条',
    content: '牵引车和被牵引车的道路通行规则：不得牵引摩托车；不得使用软连接牵引装置牵引故障机动车；牵引制动失效的机动车，应当使用硬连接牵引装置；牵引和被牵引的机动车时速不得超过30公里。',
    category: ['towing'],
    keywords: ['牵引规定', '时速限制', '软连接', '硬连接'],
    applicability: '牵引故障机动车的具体规定'
  },

  // ========== 转弯变道 ==========
  {
    id: 'r025',
    title: '《中华人民共和国道路交通安全法实施条例》',
    article: '第五十七条',
    content: '机动车应当按照下列规定使用转向灯：（一）向左转弯、向左变更车道、准备超车、驶离停车地点或者掉头时，应当提前开启左转向灯；（二）向右转弯、向右变更车道、超车完毕驶回原车道、靠路边停车时，应当提前开启右转向灯。',
    category: ['lane_change', 'general'],
    keywords: ['转向灯', '变更车道', '转弯', '掉头'],
    applicability: '使用转向灯的具体规定'
  },
  {
    id: 'r026',
    title: '《中华人民共和国道路交通安全法》',
    article: '第四十条',
    content: '遇有自然灾害、恶劣气象条件或者重大交通事故等严重影响交通安全的情形，采取其他措施难以保证交通安全时，公安机关交通管理部门可以实行交通管制。',
    category: ['general'],
    keywords: ['交通管制', '恶劣天气', '自然灾害'],
    applicability: '特殊情况的交通管理措施'
  },
];

/**
 * 根据关键词检索适用的法规
 */
export function searchRegulations(keywords: string[]): Regulation[] {
  const results: { regulation: Regulation; matchCount: number }[] = [];

  for (const reg of trafficRegulations) {
    let matchCount = 0;
    for (const keyword of keywords) {
      if (reg.keywords.some(k => k.includes(keyword) || keyword.includes(k))) {
        matchCount++;
      }
      // 也检查内容中是否包含关键词
      if (reg.content.includes(keyword)) {
        matchCount += 0.5;
      }
    }
    if (matchCount > 0) {
      results.push({ regulation: reg, matchCount });
    }
  }

  return results
    .sort((a, b) => b.matchCount - a.matchCount)
    .map(r => r.regulation);
}

/**
 * 根据事故类型获取相关法规
 */
export function getRegulationsByCategory(category: RegulationCategory): Regulation[] {
  return trafficRegulations.filter(reg => reg.category.includes(category));
}

/**
 * 获取所有法规分类
 */
export function getAllCategories(): { category: RegulationCategory; label: string; count: number }[] {
  const categoryLabels: Record<RegulationCategory, string> = {
    signal_violation: '信号灯违规',
    right_of_way: '路权优先',
    lane_change: '变更车道与超车',
    pedestrian_protection: '行人保护',
    speeding: '超速行驶',
    drunk_driving: '酒驾毒驾',
    rear_end: '追尾事故',
    intersection: '路口通行',
    general: '一般规定',
    loading: '装载规定',
    towing: '牵引规定',
    accident_handling: '事故处理',
    road_grade: '公路技术等级',
  };

  const categoryCount: Record<RegulationCategory, number> = {
    signal_violation: 0,
    right_of_way: 0,
    lane_change: 0,
    pedestrian_protection: 0,
    speeding: 0,
    drunk_driving: 0,
    rear_end: 0,
    intersection: 0,
    general: 0,
    loading: 0,
    towing: 0,
    accident_handling: 0,
    road_grade: 0,
  };

  for (const reg of trafficRegulations) {
    for (const cat of reg.category) {
      categoryCount[cat]++;
    }
  }

  return Object.entries(categoryLabels).map(([category, label]) => ({
    category: category as RegulationCategory,
    label,
    count: categoryCount[category as RegulationCategory],
  }));
}
