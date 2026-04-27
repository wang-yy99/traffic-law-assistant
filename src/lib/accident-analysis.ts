/**
 * 交通事故案例分析推理引擎
 * 严格按照"引用法规 → 分析事实 → 逻辑推演 → 输出结论"流程
 */

import { Regulation, searchRegulations, trafficRegulations, identifyRoadGrade, getRoadGradeImpact, roadGrades, RoadGrade } from './traffic-regulations';

// ========== 类型定义 ==========

// 事故主体类型
export type PartyType = 'motor_vehicle' | 'non_motor_vehicle' | 'pedestrian' | 'unknown';

// 道路类型
export type RoadType = 
  | 'intersection_with_signal'     // 有信号灯交叉路口
  | 'intersection_without_signal'  // 无信号灯交叉路口
  | 'zebra_crossing'               // 人行横道
  | 'general_road'                // 一般路段
  | 'highway'                     // 高速公路
  | 'one_way'                     // 单行道
  | 'unknown';

// 交叉口几何形状类型
export type IntersectionType = 
  | '十字交叉口'   // 四条道路垂直交叉
  | 'T型交叉口'    // T字形交叉
  | 'Y型交叉口'    // Y字形交叉
  | '环形交叉口'   // 环岛
  | 'X型交叉口'    // 斜交交叉
  | '多肢交叉口'   // 五路及以上
  | '一般道路';    // 非交叉口

// 车辆状态
export type VehicleState = 
  | 'going_straight'     // 直行
  | 'turning_left'       // 左转
  | 'turning_right'      // 右转
  | 'changing_lane'      // 变道
  | 'overtaking'         // 超车
  | 'reversing'          // 倒车
  | 'u_turn'             // 掉头
  | 'stopped'            // 静止/停车
  | 'parked'             // 停放
  | 'turning_around'     // 转向
  | 'entering_roundabout'  // 进入环岛
  | 'exiting_roundabout'   // 驶出环岛
  | 'in_roundabout'        // 在环岛内行驶
  | 'unknown';

// 信号状态
export type SignalState = 
  | 'green'              // 绿灯
  | 'yellow'             // 黄灯
  | 'red'                // 红灯
  | 'no_signal'          // 无信号灯
  | 'defective_signal'    // 信号灯故障
  | 'pedestrian_signal'   // 行人信号灯
  | 'unknown';

// 天气与路况
export type WeatherCondition = 
  | 'clear'              // 晴朗
  | 'rainy'               // 雨天
  | 'foggy'               // 雾天
  | 'snowy'               // 雪天
  | 'windy'               // 大风
  | 'night'               // 夜间
  | 'unknown';

export type RoadCondition = 
  | 'dry'                // 干燥
  | 'wet'                // 潮湿
  | 'icy'                // 结冰
  | 'pothole'            // 坑洼
  | 'under_construction'  // 施工
  | 'unknown';

// 过错程度
export type FaultLevel = 
  | 'full_fault'         // 全部责任
  | 'primary_fault'      // 主要责任
  | 'equal_fault'        // 同等责任
  | 'secondary_fault'     // 次要责任
  | 'no_fault'           // 无责任
  | 'undetermined';      // 待定

// 事故当事方
export interface AccidentParty {
  id: string;
  type: PartyType;
  vehicleState: VehicleState;
  direction?: string;         // 行驶方向描述
  location?: string;          // 所在位置描述
  signalStatus?: SignalState; // 遇到的信号状态
  violations: string[];       // 违规行为列表
  injuries?: boolean;         // 是否造成人员伤亡
  propertyDamage?: boolean;   // 是否造成财产损失
  // 交叉路口方向信息
  turningIntention?: string;    // 转弯意图（left/right）
  stopReason?: string;         // 停车等待原因
  relativePosition?: string;   // 相对位置（左侧/右侧/对面）
}

// 事故场景
export interface AccidentScenario {
  parties: AccidentParty[];
  roadType: RoadType;
  roadCondition: RoadCondition;
  weather: WeatherCondition;
  hasSpeedLimit?: boolean;
  speedLimit?: number;
  collisionPoint?: string;    // 碰撞点描述
  collisionType?: string;     // 碰撞类型
  timeOfDay?: string;
  trafficControl?: string;    // 交通管控措施
  additionalInfo?: string;    // 其他补充信息
  // 公路技术等级相关字段
  roadGrade?: string;         // 公路技术等级（高速公路/一级/二级/三级/四级）
  roadGradeDescription?: string; // 道路等级详细描述
  actualSpeed?: number;       // 实际行驶速度（用于判断超速）
  detectedRoadGrade?: RoadGrade; // 识别的道路等级对象
  // 交叉口类型
  intersectionType?: IntersectionType; // 交叉口几何形状类型
}

// 分析步骤
export interface AnalysisStep {
  step: number;
  phase: '第一步：事实要素提取' | '第二步：法律检索与匹配' | '第三步：逻辑推演链' | '第四步：责任结论' | '法规检索' | '事实分析' | '逻辑推演' | '责任认定';
  title: string;
  content: string;
  regulations?: Regulation[];
  reasoning?: string;
  keyFacts?: string[];
}

// 分析结果
export interface AnalysisResult {
  scenario: AccidentScenario;
  steps: AnalysisStep[];
  liabilityAllocation: {
    partyId: string;
    faultLevel: FaultLevel;
    faultPercentage: number;
    reason: string;
  }[];
  keyFindings: string[];
  learningPoints: string[];
  disclaimer: string;
  directionValidation?: DirectionValidationResult;
}

// ========== 方向与位置信息类型定义 ==========

// 标准方位方向
export type CardinalDirection = 
  | 'north_south'      // 南北方向
  | 'south_north'      // 北南方向
  | 'east_west'        // 东西方向
  | 'west_east'        // 西东方向
  | 'unknown';

// 停车等待原因
export type StopReason = 
  | 'red_light'        // 红灯
  | 'yielding'         // 让行其他车辆/行人
  | 'traffic_jam'      // 交通拥堵
  | 'mechanical'        // 车辆故障
  | 'unknown';

// 方向信息
export interface DirectionInfo {
  fromDirection?: string;      // 驶来方向（东/西/南/北）
  toDirection?: string;        // 去往方向（东/西/南/北）
  relativePosition?: 'left' | 'right' | 'front' | 'back';  // 相对方位
  stopReason?: StopReason;     // 停车等待原因
  turningIntention?: 'left' | 'right' | 'straight' | 'u_turn';  // 转弯意图
}

// 方向验证结果
export interface DirectionValidationResult {
  isValid: boolean;
  missingInfo: string[];
  questions: string[];
  directionSceneSummary?: string;
}

// ========== 方向与位置信息验证函数 ==========

/**
 * 验证事故场景中的方向信息是否完整
 * 优先级最高：涉及交叉路口的案例必须收集方向信息
 */
export function validateDirectionInfo(scenario: AccidentScenario): DirectionValidationResult {
  const missingInfo: string[] = [];
  const questions: string[] = [];

  // 判断是否为交叉路口类型
  const isIntersection = 
    scenario.roadType === 'intersection_with_signal' || 
    scenario.roadType === 'intersection_without_signal';
  
  // 人行横道场景：检查非机动车骑行/推行状态
  const isZebraCrossing = scenario.roadType === 'zebra_crossing';
  const nonMotorParties = scenario.parties.filter(p => p.type === 'non_motor_vehicle');

  // 只有交叉路口类型才强制要求方向信息
  if (!isIntersection && !isZebraCrossing) {
    return {
      isValid: true,
      missingInfo: [],
      questions: [],
    };
  }

  // 人行横道场景：检查非机动车骑行/推行状态
  if (isZebraCrossing && nonMotorParties.length > 0) {
    for (const party of nonMotorParties) {
      const partyLabel = '非机动车' + party.id;
      const crossMethod = (party as { crossingMethod?: string }).crossingMethod;
      
      if (!crossMethod || crossMethod === 'unknown' || (crossMethod !== 'riding' && crossMethod !== 'walking')) {
        missingInfo.push(`${partyLabel}的通行方式（骑行/推行）`);
        questions.push(`非机动车${party.id}是通过人行横道时是骑行还是推行？\n- 如为骑行：需承担次要责任（20-30%）\n- 如为推行：享有优先通行权，无责任`);
      }
    }
    
    if (missingInfo.length > 0) {
      return {
        isValid: false,
        missingInfo,
        questions,
      };
    }
  }

  // 交叉口场景检查
  if (isIntersection) {
    // 检查交叉口几何类型
    if (!scenario.intersectionType) {
      missingInfo.push('交叉口几何类型');
      questions.push('请确认事故发生的交叉口类型：十字交叉口/T型交叉口/Y型交叉口/环形交叉口/X型交叉口/多肢交叉口？');
    }

    // 检查每辆车的方向信息
    for (const party of scenario.parties) {
      const partyLabel = `${party.type === 'motor_vehicle' ? '机动车' : party.type === 'non_motor_vehicle' ? '非机动车' : '行人'}${party.id}`;

      // 检查行驶方向
      if (!party.direction || party.direction === 'unknown' || party.direction === '') {
        missingInfo.push(`${partyLabel}的行驶方向`);
        questions.push(`请说明${partyLabel}从哪个方向驶来，要去往哪个方向？`);
      }

      // 如果是停车等待状态，检查停车原因
      if (party.vehicleState === 'stopped' || party.vehicleState === 'parked') {
        const stopInfo = (party as { stopReason?: string }).stopReason;
        if (!stopInfo || stopInfo === 'unknown') {
          missingInfo.push(`${partyLabel}的停车等待原因`);
          questions.push(`${partyLabel}停车等待的具体原因是什么？（红灯？让行其他车辆？）`);
        }
      }

      // 如果是转弯状态，检查转弯意图
      if (party.vehicleState === 'turning_left' || party.vehicleState === 'turning_right') {
        const turningInfo = (party as { turningIntention?: string }).turningIntention;
        if (!turningInfo || turningInfo === 'unknown') {
          missingInfo.push(`${partyLabel}的转弯具体方向`);
          questions.push(`${partyLabel}准备左转还是右转？`);
        }
      }
    }

    // 检查两车之间的相对方位
    if (scenario.parties.length >= 2 && missingInfo.length === 0) {
      // 如果基础方向都有了，检查相对位置
      const party1 = scenario.parties[0];
      const party2 = scenario.parties[1];
      
      const relPos1 = (party1 as { relativePosition?: string }).relativePosition;
      const relPos2 = (party2 as { relativePosition?: string }).relativePosition;
      
      if (!relPos1 && !relPos2) {
        // 可以从绝对方向推导，不需要追问
        // 这里可以添加推导逻辑
      }
    }
  }

  const isValid = missingInfo.length === 0;

  return {
    isValid,
    missingInfo,
    questions,
    directionSceneSummary: isValid ? generateDirectionSceneSummary(scenario) : undefined,
  };
}

/**
 * 生成方向场景重述
 */
export function generateDirectionSceneSummary(scenario: AccidentScenario): string {
  const intersectionLabels: Record<RoadType, string> = {
    intersection_with_signal: '有信号灯十字路口',
    intersection_without_signal: '无信号灯十字路口',
    zebra_crossing: '人行横道',
    general_road: '一般路段',
    highway: '高速公路',
    one_way: '单行道',
    unknown: '未知类型道路',
  };

  let summary = `【方向场景重述】
- 路口类型：${intersectionLabels[scenario.roadType] || '其他路口'}`;

  for (const party of scenario.parties) {
    const partyLabel = `${party.type === 'motor_vehicle' ? '机动车' : party.type === 'non_motor_vehicle' ? '非机动车' : '行人'}${party.id}`;
    
    // 解析方向
    let directionText = '【待补充】';
    if (party.direction && party.direction !== 'unknown' && party.direction !== '') {
      directionText = party.direction;
    }

    // 解析动作
    const stateLabels: Record<VehicleState, string> = {
      going_straight: '直行',
      turning_left: '左转',
      turning_right: '右转',
      changing_lane: '变更车道',
      overtaking: '超车',
      reversing: '倒车',
      u_turn: '掉头',
      stopped: '停车等待',
      parked: '停放',
      turning_around: '转向',
      entering_roundabout: '进入环岛',
      exiting_roundabout: '驶出环岛',
      in_roundabout: '在环岛内行驶',
      unknown: '行驶中',
    };
    const actionText = stateLabels[party.vehicleState] || '行驶中';

    // 解析停车原因
    const stopInfo = (party as { stopReason?: string }).stopReason;
    const stopReasonText = party.vehicleState === 'stopped' 
      ? `，等待原因：${stopInfo || '【待补充】'}`
      : '';

    summary += `\n- ${partyLabel}：${directionText}，动作：${actionText}${stopReasonText}`;
  }

  // 添加相对位置（如果有的话）
  if (scenario.parties.length >= 2) {
    const party1 = scenario.parties[0];
    const party2 = scenario.parties[1];
    const relPos1 = (party1 as { relativePosition?: string }).relativePosition;
    
    if (relPos1) {
      const party1Label = `${party1.type === 'motor_vehicle' ? '机动车' : party1.type === 'non_motor_vehicle' ? '非机动车' : '行人'}${party1.id}`;
      const party2Label = `${party2.type === 'motor_vehicle' ? '机动车' : party2.type === 'non_motor_vehicle' ? '非机动车' : '行人'}${party2.id}`;
      summary += `\n- 相对位置：在进入路口时，${party1Label}在${party2Label}的${relPos1}侧`;
    }
  }

  return summary;
}

/**
 * 生成方向信息补充提问
 */
export function generateDirectionQuestions(validation: DirectionValidationResult): string {
  if (validation.isValid) {
    return '';
  }

  let message = `为了准确判断路权和责任，请补充以下方向信息：

`;

  validation.questions.forEach((q, i) => {
    message += `${i + 1}. ${q}
`;
  });

  message += `
请补充以上信息后重新提交分析。`;

  return message;
}

// ========== 推理引擎核心函数 ==========

/**
 * 从事故描述中提取关键要素
 */
export function extractKeyElements(scenario: AccidentScenario): {
  keywords: string[];
  categories: string[];
} {
  const keywords: string[] = [];
  const categories: Set<string> = new Set();

  // 道路类型关键词
  const roadTypeKeywords: Record<RoadType, string[]> = {
    intersection_with_signal: ['信号灯', '交叉路口', '红绿灯', '路口'],
    intersection_without_signal: ['无信号灯', '无信号', '路口', '让行'],
    zebra_crossing: ['人行横道', '斑马线', '行人过街'],
    general_road: ['路段', '道路', '直路'],
    highway: ['高速', '高速公路', '快速路'],
    one_way: ['单行道', '单向'],
    unknown: [],
  };

  // 车辆状态关键词
  const vehicleStateKeywords: Record<VehicleState, string[]> = {
    going_straight: ['直行', '前行', '前进'],
    turning_left: ['左转', '左转弯'],
    turning_right: ['右转', '右转弯'],
    changing_lane: ['变道', '并道', '换道'],
    overtaking: ['超车', '超越'],
    reversing: ['倒车', '倒行'],
    u_turn: ['掉头', 'U转'],
    stopped: ['停车', '等候', '等待'],
    parked: ['停放', '路边停放'],
    turning_around: ['转向', '调头'],
    entering_roundabout: ['进入环岛', '驶入环岛', '入岛'],
    exiting_roundabout: ['驶出环岛', '出岛', '出环岛'],
    in_roundabout: ['绕岛', '环岛内', '在环岛内'],
    unknown: [],
  };

  // 信号状态关键词
  const signalKeywords: Record<SignalState, string[]> = {
    green: ['绿灯', '绿色信号'],
    yellow: ['黄灯', '黄色信号'],
    red: ['红灯', '红色信号'],
    no_signal: ['无信号灯', '无信号'],
    defective_signal: ['信号灯故障', '信号灯损坏'],
    pedestrian_signal: ['行人信号'],
    unknown: [],
  };

  // 违规行为关键词
  const violationKeywords = [
    '闯红灯', '超速', '逆行', '酒驾', '醉驾', '毒驾', '疲劳驾驶',
    '未让行', '未减速', '未打转向灯', '违法变道', '违法超车',
    '未保持安全距离', '追尾', '妨碍通行', '占道', '穿插',
  ];

  // 提取关键词
  for (const party of scenario.parties) {
    // 添加车辆状态关键词
    const stateKws = vehicleStateKeywords[party.vehicleState];
    if (stateKws) keywords.push(...stateKws);

    // 添加信号状态关键词
    if (party.signalStatus) {
      const signalKws = signalKeywords[party.signalStatus];
      if (signalKws) keywords.push(...signalKws);
    }

    // 添加违规行为关键词
    keywords.push(...party.violations);

    // 从违规行为中提取关键词
    for (const v of party.violations) {
      categories.add(v);
    }
  }

  // 添加道路类型关键词
  const roadKws = roadTypeKeywords[scenario.roadType];
  if (roadKws) keywords.push(...roadKws);

  // 添加天气/路况关键词
  if (scenario.weather !== 'clear' && scenario.weather !== 'unknown') {
    categories.add(scenario.weather);
  }

  return {
    keywords: [...new Set(keywords)],
    categories: [...categories],
  };
}

/**
 * 执行法规检索
 */
export function retrieveApplicableRegulations(scenario: AccidentScenario): {
  regulations: Regulation[];
  reasoning: string;
} {
  const { keywords, categories } = extractKeyElements(scenario);
  
  // 人行横道事故：只适用第四十七条
  if (scenario.roadType === 'zebra_crossing') {
    const art47 = trafficRegulations.find(r => r.article.includes('第四十七条'));
    const regulations = art47 ? [art47] : [];
    
    const reasoning = `根据事故场景分析，提取到以下关键要素：
- 道路类型：人行横道
- 事故场景：${scenario.parties.some(p => p.type === 'pedestrian') ? '机动车与行人' : '机动车与非机动车'}
- 核心违法：${scenario.parties.some(p => p.type === 'pedestrian') ? '机动车未按规定让行' : '机动车未按规定让行'}

人行横道事故适用唯一法条：《道路交通安全法》第四十七条，共 1 条相关法规条款`;

    return { regulations, reasoning };
  }
  
  let regulations = searchRegulations(keywords);

  // 如果检索结果太少，扩大检索范围
  if (regulations.length < 3) {
    // 添加一般性法规
    regulations = [
      ...regulations,
      ...trafficRegulations.filter(r => r.category.includes('general')).slice(0, 3),
    ];
  }

  // 去重
  regulations = [...new Set(regulations)];

  const roadTypeMap: Record<RoadType, string> = {
    'intersection_with_signal': '有信号灯交叉路口',
    'intersection_without_signal': '无信号灯交叉路口',
    'zebra_crossing': '人行横道',
    'general_road': '一般路段',
    'highway': '高速公路',
    'one_way': '单行道',
    'unknown': '未知类型道路',
  };
  const reasoning = `根据事故场景分析，提取到以下关键要素：
- 道路类型：${roadTypeMap[scenario.roadType] || '一般路段'}
- 天气路况：${scenario.weather}${scenario.roadCondition !== 'dry' ? '、' + scenario.roadCondition : ''}
- 关键行为：${keywords.slice(0, 5).join('、')}

共检索到 ${regulations.length} 条相关法规条款`;

  return { regulations, reasoning };
}

/**
 * 分析事实要素
 */
export function analyzeFacts(scenario: AccidentScenario): {
  analysis: string;
  keyFacts: {
    fact: string;
    evidence: string;
    relatedParty: string;
  }[];
} {
  const partyAnalyses = scenario.parties.map(party => {
    let typeDesc = '';
    switch (party.type) {
      case 'motor_vehicle': typeDesc = '机动车'; break;
      case 'non_motor_vehicle': typeDesc = '非机动车'; break;
      case 'pedestrian': typeDesc = '行人'; break;
      default: typeDesc = '未知主体';
    }

    let stateDesc = '';
    switch (party.vehicleState) {
      case 'going_straight': stateDesc = '直行'; break;
      case 'turning_left': stateDesc = '左转弯'; break;
      case 'turning_right': stateDesc = '右转弯'; break;
      case 'changing_lane': stateDesc = '变更车道'; break;
      case 'overtaking': stateDesc = '超车'; break;
      case 'reversing': stateDesc = '倒车'; break;
      case 'u_turn': stateDesc = '掉头'; break;
      case 'stopped': stateDesc = '停车等待'; break;
      case 'parked': stateDesc = '停放'; break;
      default: stateDesc = '行驶中';
    }

    const violationsDesc = party.violations.length > 0 
      ? `；存在违规行为：${party.violations.join('、')}` 
      : '';

    return {
      partyId: party.id,
      party: `${typeDesc}${party.id}`,
      state: stateDesc,
      violations: violationsDesc,
      location: party.location || '道路行驶中',
    };
  });

  const facts = partyAnalyses.map(p => ({
    fact: `${p.party}（${p.state}）${p.violations}`,
    evidence: p.location,
    relatedParty: p.partyId,
  }));

  // 添加道路环境事实
  const envFacts: typeof facts = [];
  
  if (scenario.roadType === 'intersection_with_signal') {
    const signalParties = scenario.parties.filter(p => p.signalStatus);
    if (signalParties.length > 0) {
      envFacts.push({
        fact: `事故发生在有信号灯控制的交叉路口`,
        evidence: '道路类型',
        relatedParty: 'all',
      });
    }
  } else if (scenario.roadType === 'intersection_without_signal') {
    envFacts.push({
      fact: `事故发生在无信号灯控制的交叉路口，需遵循让行规则`,
      evidence: '道路类型',
      relatedParty: 'all',
    });
  }

  if (scenario.hasSpeedLimit) {
    envFacts.push({
      fact: `该路段限速 ${scenario.speedLimit} 公里/小时`,
      evidence: '速度限制标志',
      relatedParty: 'all',
    });
  }

  const analysis = `本案共涉及 ${scenario.parties.length} 方当事人：

${partyAnalyses.map((p, i) => `${i + 1}. ${p.party}：${p.state}，${p.location}${p.violations}`).join('\n')}

道路与环境条件：
${scenario.roadType === 'intersection_with_signal' ? '- 事故地点：有信号灯控制的交叉路口' : 
  scenario.roadType === 'intersection_without_signal' ? '- 事故地点：无信号灯控制的交叉路口' : 
  scenario.roadType === 'zebra_crossing' ? '- 事故地点：人行横道' : 
  '- 事故地点：一般道路路段'}
${scenario.roadGrade ? `- 公路技术等级：${scenario.roadGrade}` : ''}
${scenario.detectedRoadGrade ? `- 道路等级特征：${scenario.detectedRoadGrade.coreFeatures}` : ''}
${scenario.actualSpeed ? `- 车辆实际速度：${scenario.actualSpeed} km/h` : ''}
${scenario.weather !== 'unknown' ? `- 天气状况：${scenario.weather === 'clear' ? '晴朗' : scenario.weather}` : ''}
${scenario.roadCondition !== 'unknown' ? `- 路面条件：${scenario.roadCondition === 'dry' ? '干燥' : scenario.roadCondition}` : ''}
${scenario.hasSpeedLimit ? `- 限速规定：${scenario.speedLimit} km/h` : ''}`;

  return {
    analysis,
    keyFacts: [...envFacts, ...facts],
  };
}

/**
 * 逻辑推演
 */
export function logicalReasoning(
  scenario: AccidentScenario,
  regulations: Regulation[]
): {
  reasoning: string;
  partyLiability: {
    partyId: string;
    faultLevel: FaultLevel;
    reasoning: string;
  }[];
} {
  const partyLiability: { partyId: string; faultLevel: FaultLevel; reasoning: string }[] = [];
  const partyFaults: Map<string, { level: FaultLevel; reasons: string[] }> = new Map();

  // 初始化各方责任
  for (const party of scenario.parties) {
    partyFaults.set(party.id, { level: 'undetermined', reasons: [] });
  }

  // 规则1：信号灯优先规则
  const signalParties = scenario.parties.filter(p => 
    p.signalStatus === 'red' || p.signalStatus === 'green'
  );
  
  if (signalParties.some(p => p.signalStatus === 'red')) {
    const redLightParties = signalParties.filter(p => p.signalStatus === 'red');
    for (const party of redLightParties) {
      const current = partyFaults.get(party.id)!;
      current.level = 'full_fault';
      current.reasons.push('违反信号灯规定，在红灯亮时通行');
    }

    const greenLightParties = signalParties.filter(p => p.signalStatus === 'green');
    for (const party of greenLightParties) {
      const current = partyFaults.get(party.id)!;
      if (current.level === 'undetermined') {
        current.level = 'no_fault';
        current.reasons.push('按照信号灯指示正常通行');
      } else if (current.level !== 'full_fault') {
        current.reasons.push('按照信号灯指示通行，无明显过错');
      }
    }
  }

  // ========== 转弯与直行事故专项规则 ==========
  // 【核心原则】转弯车辆未让行直行车辆，是导致事故的直接原因。直行车辆有绝对优先通行权。
  // 【唯一答案】转弯车未让行直行车（无其他过错）→ 转弯车全责，直行车无责
  
  const straightParties = scenario.parties.filter(p => p.vehicleState === 'going_straight');
  const turningParties = scenario.parties.filter(p => 
    p.vehicleState === 'turning_left' || p.vehicleState === 'turning_right' || p.vehicleState === 'u_turn'
  );

  // 判断是否存在转弯与直行冲突
  if (turningParties.length > 0 && straightParties.length > 0) {
    // 获取直行车的严重违章行为列表
    const straightSevereViolations = ['闯红灯', '超速行驶', '逆向行驶', '酒驾', '醉驾'];
    const straightViolations = straightParties.flatMap(p => p.violations);
    const hasStraightSevereViolation = straightViolations.some(v => straightSevereViolations.includes(v));

    if (hasStraightSevereViolation) {
      // 【规则】转弯车未让行 + 直行车有明显违章 → 转弯车主责，直行车次责
      for (const party of turningParties) {
        const current = partyFaults.get(party.id)!;
        current.level = 'primary_fault';
        current.reasons.push('转弯车辆未让直行车辆优先通行');
      }
      for (const party of straightParties) {
        const current = partyFaults.get(party.id)!;
        current.level = 'secondary_fault';
        const severeViolations = party.violations.filter(v => straightSevereViolations.includes(v));
        current.reasons.push(`存在严重违章行为：${severeViolations.join('、')}，与事故发生存在因果关系`);
      }
    } else {
      // 【唯一正确答案】转弯车未让行直行车（无其他过错）→ 转弯车全责，直行车无责
      for (const party of turningParties) {
        const current = partyFaults.get(party.id)!;
        current.level = 'full_fault';
        current.reasons.push('转弯车辆未让直行车辆优先通行，违反《道路交通安全法实施条例》第五十二条第三项');
      }
      for (const party of straightParties) {
        const current = partyFaults.get(party.id)!;
        if (current.level === 'undetermined') {
          current.level = 'no_fault';
          current.reasons.push('直行车辆正常行驶，享有优先通行权');
        }
      }
    }
  }

  // 【环形交叉口专用规则】进入环岛的车辆让行环岛内车辆
  if (scenario.intersectionType === '环形交叉口') {
    const roundaboutSevereViolations = ['逆向行驶', '逆向环岛', '逆行'];
    const counterClockwiseDirections = [
      '由西向东', '由东向西', '由南向北', '由北向南'
    ];
    
    // 判断环岛内车辆：包含"绕岛"或"在环岛内"描述的车辆
    // 或者处于正常绕岛行驶状态的车辆
    const insideRoundabout = scenario.parties.filter(p => 
      p.location?.includes('绕岛') || 
      p.location?.includes('环岛内') ||
      (p.vehicleState !== 'entering_roundabout' && p.vehicleState !== 'exiting_roundabout' && 
       counterClockwiseDirections.includes(p.direction || ''))
    );
    
    // 进入环岛车辆：包含"进入环岛"描述或vehicleState为entering_roundabout
    const enteringRoundabout = scenario.parties.filter(p => 
      p.location?.includes('进入环岛') ||
      p.vehicleState === 'entering_roundabout' ||
      p.location?.includes('驶入环岛')
    );
    
    // 驶出环岛车辆
    const exitingRoundabout = scenario.parties.filter(p => 
      p.vehicleState === 'exiting_roundabout' ||
      p.location?.includes('驶出环岛') ||
      p.location?.includes('出岛')
    );
    
    // 规则1：进入车辆未让行环岛内车辆 → 进入车辆全责
    if (enteringRoundabout.length > 0 && insideRoundabout.length > 0) {
      for (const party of enteringRoundabout) {
        const current = partyFaults.get(party.id)!;
        current.level = 'full_fault';
        current.reasons.push('进入环形交叉口时未让行环岛内车辆，违反环形交叉口通行规则');
      }
      for (const party of insideRoundabout) {
        const current = partyFaults.get(party.id)!;
        if (current.level === 'undetermined') {
          current.level = 'no_fault';
          current.reasons.push('在环岛内正常行驶，享有优先通行权');
        }
      }
    }
    
    // 规则2：环岛内车辆违规变道或逆行 → 变道/逆行车辆主责
    for (const party of insideRoundabout) {
      const hasViolations = party.violations?.some(v => roundaboutSevereViolations.includes(v));
      if (hasViolations) {
        const current = partyFaults.get(party.id)!;
        current.level = 'primary_fault';
        current.reasons.push(`在环岛内存在违规行为：${party.violations.join('、')}，影响行驶安全`);
      }
    }
    
    // 规则3：驶出环岛车辆变道影响他车 → 变道车辆主责
    if (exitingRoundabout.length > 0) {
      for (const party of exitingRoundabout) {
        const hasLaneChange = party.location?.includes('变道') || party.violations?.includes('变道影响');
        if (hasLaneChange) {
          const current = partyFaults.get(party.id)!;
          current.level = 'primary_fault';
          current.reasons.push('驶出环岛时变道影响其他车道车辆行驶');
        }
      }
    }
  }

  // 规则2：信号灯优先规则（仅在非转弯让直行场景下适用）
  if (turningParties.length === 0 || straightParties.length === 0) {
    const signalParties = scenario.parties.filter(p => 
      p.signalStatus === 'red' || p.signalStatus === 'green'
    );
    
    if (signalParties.some(p => p.signalStatus === 'red')) {
      const redLightParties = signalParties.filter(p => p.signalStatus === 'red');
      for (const party of redLightParties) {
        const current = partyFaults.get(party.id)!;
        current.level = 'full_fault';
        current.reasons.push('违反信号灯规定，在红灯亮时通行');
      }

      const greenLightParties = signalParties.filter(p => p.signalStatus === 'green');
      for (const party of greenLightParties) {
        const current = partyFaults.get(party.id)!;
        if (current.level === 'undetermined') {
          current.level = 'no_fault';
          current.reasons.push('按照信号灯指示正常通行');
        }
      }
    }
  }

  // 规则3：让行规则（无信号灯路口，且非转弯让直行场景）
  if (scenario.roadType === 'intersection_without_signal' && (turningParties.length === 0 || straightParties.length === 0)) {
    const firstFault = partyFaults.values().next().value;
    if (firstFault && firstFault.level === 'undetermined') {
      // 未确定责任时，分析让右规则
    }
  }

  // ========== 人行横道让行规则（专项规则） ==========
  // 【核心原则】机动车应停车让行，适用《道路交通安全法》第四十七条
  // 【禁止行为】禁止引用"转弯让直行""让右原则"等无关条款
  if (scenario.roadType === 'zebra_crossing') {
    const motorParties = scenario.parties.filter(p => p.type === 'motor_vehicle');
    const pedestrianParties = scenario.parties.filter(p => p.type === 'pedestrian');
    const nonMotorParties = scenario.parties.filter(p => p.type === 'non_motor_vehicle');

    for (const motor of motorParties) {
      const current = partyFaults.get(motor.id)!;
      // 机动车在人行横道未停车让行 → 全责
      // 禁止以"行人/非机动车未确认安全"为由减轻机动车责任
      if (motor.violations.includes('未让行') || motor.violations.includes('未停车')) {
        current.level = 'full_fault';
        current.reasons.push('机动车通过人行横道时未停车让行，违反《道路交通安全法》第四十七条');
      } else if (motor.violations.includes('未减速')) {
        current.level = 'primary_fault';
        current.reasons.push('机动车通过人行横道未减速行驶，违反《道路交通安全法》第四十七条');
      }
    }

    for (const pedestrian of pedestrianParties) {
      const current = partyFaults.get(pedestrian.id)!;
      // 行人正常使用人行横道 → 无责
      // 禁止判定行人"未尽观察义务"或"未快速通过"
      // 仅有证据证明故意冲撞时才考虑行人责任
      if (pedestrian.violations.includes('故意冲撞') || pedestrian.violations.includes('恶意碰瓷')) {
        current.level = 'full_fault';
        current.reasons.push('行人故意制造交通事故');
      } else if (current.level === 'undetermined') {
        current.level = 'no_fault';
        current.reasons.push('行人依规使用人行横道享有优先通行权');
      }
    }

    // 非机动车骑行横过：承担次要责任（20-30%）
    // 非机动车推行横过：享有优先通行权，无责任
    for (const nonMotor of nonMotorParties) {
      const current = partyFaults.get(nonMotor.id)!;
      const crossingMethod = (nonMotor as { crossingMethod?: string }).crossingMethod;
      
      // 骑行横过
      if (crossingMethod === 'riding') {
        if (current.level !== 'full_fault') {
          current.level = current.level === 'undetermined' ? 'secondary_fault' : current.level;
          current.reasons.push('非机动车骑行通过人行横道，违反道路通行规定，承担次要责任');
        }
      }
      // 推行横过：无责任
      else if (crossingMethod === 'walking') {
        if (current.level === 'undetermined') {
          current.level = 'no_fault';
          current.reasons.push('非机动车推行通过人行横道享有优先通行权');
        }
      }
      // 状态不明且机动车已确定全责时：假设推行，默认无责
      else if (current.level === 'undetermined') {
        current.level = 'no_fault';
        current.reasons.push('非机动车依规使用人行横道享有优先通行权');
      }
    }
  }

  // 规则4：追尾责任
  const hasRearEnd = scenario.parties.some(p => 
    p.violations.some(v => v.includes('追尾')) ||
    scenario.parties.some(other => 
      other.vehicleState === 'stopped' && 
      p.vehicleState === 'going_straight'
    )
  );

  if (hasRearEnd) {
    const stoppedParty = scenario.parties.find(p => p.vehicleState === 'stopped');
    const movingParty = scenario.parties.find(p => p.vehicleState === 'going_straight');

    if (stoppedParty && movingParty) {
      const stoppedFault = partyFaults.get(movingParty.id)!;
      stoppedFault.level = 'full_fault';
      stoppedFault.reasons.push('后车未与前车保持安全距离，导致追尾碰撞');

      const movingFault = partyFaults.get(stoppedParty.id)!;
      if (movingFault.level === 'undetermined') {
        // 如果停车是因为紧急情况等，可能无责
        movingFault.level = 'no_fault';
        movingFault.reasons.push('正常停车等待，后车未能及时制动');
      }
    }
  }

  // 规则5：变更车道责任
  const changingLaneParties = scenario.parties.filter(p => p.vehicleState === 'changing_lane');
  if (changingLaneParties.length > 0) {
    for (const party of changingLaneParties) {
      const current = partyFaults.get(party.id)!;
      if (current.level !== 'full_fault') {
        current.level = current.level === 'undetermined' ? 'primary_fault' : current.level;
        current.reasons.push('变更车道时影响相关车道内行驶的机动车');
      }
    }
  }

  // 规则6：超车责任
  const overtakingParties = scenario.parties.filter(p => p.vehicleState === 'overtaking');
  if (overtakingParties.length > 0) {
    for (const party of overtakingParties) {
      const current = partyFaults.get(party.id)!;
      if (current.level !== 'full_fault') {
        current.level = current.level === 'undetermined' ? 'primary_fault' : current.level;
        current.reasons.push('超车行为存在不当');
      }
    }
  }

  // 规则7：逆行责任
  for (const party of scenario.parties) {
    if (party.violations.some(v => v.includes('逆行'))) {
      const current = partyFaults.get(party.id)!;
      current.level = 'full_fault';
      current.reasons.push('逆向行驶，严重违反道路通行规定');
    }
  }

  // 规则8：酒驾毒驾责任
  for (const party of scenario.parties) {
    if (party.violations.some(v => v.includes('酒驾') || v.includes('醉驾') || v.includes('毒驾'))) {
      const current = partyFaults.get(party.id)!;
      current.level = 'full_fault';
      current.reasons.push('酒后/醉酒/吸毒后驾驶机动车');
    }
  }

  // 处理未确定的责任方
  for (const party of scenario.parties) {
    const current = partyFaults.get(party.id)!;
    if (current.level === 'undetermined') {
      current.level = 'equal_fault';
      current.reasons.push('双方均存在一定过错，具体责任需综合认定');
    }
  }

  // 转换格式 - 生成结构化推演报告
  const isTurningVsStraight = turningParties.length > 0 && straightParties.length > 0;
  const hasStraightSevereViolation = straightParties.flatMap(p => p.violations)
    .some(v => ['闯红灯', '超速行驶', '逆向行驶', '酒驾', '醉驾'].includes(v));

  let reasoningText = `【逻辑推演过程】

◆ 核心原则确认：
  转弯车辆未让行直行车辆，是导致事故的直接原因。直行车辆有绝对优先通行权。`;

  // 转弯与直行分析
  if (isTurningVsStraight) {
    if (hasStraightSevereViolation) {
      reasoningText += `

◆ 转弯与直行冲突分析：
  - 转弯车辆（A/B）：未让行直行车辆
  - 直行车辆：存在严重违章行为（${straightParties.flatMap(p => p.violations).filter(v => ['闯红灯', '超速行驶', '逆向行驶', '酒驾', '醉驾'].includes(v)).join('、')}）

◆ 法律依据：
  根据《道路交通安全法实施条例》第五十二条第三项：转弯的机动车让直行的车辆先行。

◆ 责任划分（严格遵循唯一答案原则）：
  转弯车辆未让行 + 直行车辆存在严重违章且与事故有因果关系 → 转弯车主责，直行车次责`;
    } else {
      reasoningText += `

◆ 转弯与直行冲突分析：
  - 转弯车辆（A/B）：未让行直行车辆
  - 直行车辆：无严重违章行为

◆ 法律依据：
  根据《道路交通安全法实施条例》第五十二条第三项：转弯的机动车让直行的车辆先行。

◆ 责任划分（唯一正确答案）：
  转弯车辆未让行直行车（无其他过错）→ 转弯车全责（100%），直行车无责（0%）

  【禁止模糊表述】本案例不适用"双方都有注意义务"等模糊判定。`;
    }
  } else {
    // 非转弯直行场景
    const signalParties = scenario.parties.filter(p => 
      p.signalStatus === 'red' || p.signalStatus === 'green'
    );

    reasoningText += `

◆ 信号灯通行规则分析：
${signalParties.length > 0 
  ? signalParties.map(p => {
      const status = p.signalStatus === 'red' ? '红灯禁止通行' : '绿灯准许通行';
      return `  - ${p.id}：${status}（${p.violations.length > 0 ? p.violations.join('、') : '无违规'}）`;
    }).join('\n')
  : '  - 事故与信号灯无直接关联'
}

◆ 路口让行规则分析：
${scenario.roadType === 'intersection_without_signal'
  ? '  根据《道路交通安全法实施条例》第五十二条，无信号灯路口应遵循让行规则：\n  （一）有交通标志标线的，让优先方先行\n  （二）无标志标线的，停车瞭望，让右方来车先行\n  （三）转弯让直行'
  : '  事故路口有信号灯控制或不在路口'
}
`;
  }

  reasoningText += `

◆ 过错程度判定：
${Array.from(partyFaults.entries()).map(([partyId, fault]) => {
  const party = scenario.parties.find(p => p.id === partyId);
  const partyName = party ? `${party.type === 'motor_vehicle' ? '机动车' : party.type === 'non_motor_vehicle' ? '非机动车' : '行人'}${partyId}` : partyId;
  const stateDesc = party?.vehicleState === 'going_straight' ? '（直行）' : 
                    party?.vehicleState === 'turning_left' ? '（左转弯）' : 
                    party?.vehicleState === 'turning_right' ? '（右转弯）' : '';
  const levelText = fault.level === 'full_fault' ? '全部责任' : 
    fault.level === 'primary_fault' ? '主要责任' : 
    fault.level === 'equal_fault' ? '同等责任' : 
    fault.level === 'secondary_fault' ? '次要责任' : '无责任';
  return `  ${partyName}${stateDesc}：${levelText}
    过错理由：${fault.reasons.join('；')}`;
}).join('\n')
}`;

  return {
    reasoning: reasoningText,
    partyLiability: Array.from(partyFaults.entries()).map(([partyId, fault]) => ({
      partyId,
      faultLevel: fault.level,
      reasoning: fault.reasons.join('；'),
    })),
  };
}

/**
 * 分配责任比例
 */
export function allocateLiability(
  partyLiability: { partyId: string; faultLevel: FaultLevel; reasoning: string }[]
): {
  partyId: string;
  faultLevel: FaultLevel;
  faultPercentage: number;
  reason: string;
}[] {
  const faultCounts: Record<string, number> = {
    full_fault: 0,
    primary_fault: 0,
    equal_fault: 0,
    secondary_fault: 0,
    no_fault: 0,
  };

  for (const p of partyLiability) {
    faultCounts[p.faultLevel] = (faultCounts[p.faultLevel] || 0) + 1;
  }

  // 计算责任比例
  const totalParties = partyLiability.length;
  const faultLevels = partyLiability.map(p => p.faultLevel);

  // 如果只有两方
  if (totalParties === 2) {
    const hasFullFault = faultLevels.includes('full_fault');
    const hasNoFault = faultLevels.includes('no_fault');
    const hasEqualFault = faultLevels.includes('equal_fault');
    const hasPrimaryFault = faultLevels.includes('primary_fault');
    const hasSecondaryFault = faultLevels.includes('secondary_fault');

    if (hasFullFault && hasNoFault) {
      return partyLiability.map(p => ({
        partyId: p.partyId,
        faultLevel: p.faultLevel,
        faultPercentage: p.faultLevel === 'full_fault' ? 100 : 0,
        reason: p.reasoning,
      }));
    }

    // 全责 + 次责 分配（适用人行横道骑行场景：机动车主责70%，非机动车次责30%）
    if (hasFullFault && hasSecondaryFault) {
      const fullFaultParty = partyLiability.find(p => p.faultLevel === 'full_fault')!;
      const secondaryParty = partyLiability.find(p => p.faultLevel === 'secondary_fault')!;
      return [
        {
          partyId: fullFaultParty.partyId,
          faultLevel: 'primary_fault' as FaultLevel,
          faultPercentage: 70,
          reason: fullFaultParty.reasoning,
        },
        {
          partyId: secondaryParty.partyId,
          faultLevel: 'secondary_fault' as FaultLevel,
          faultPercentage: 30,
          reason: secondaryParty.reasoning,
        },
      ];
    }

    if (hasFullFault && hasNoFault) {
      // 全责 + 无责：全责方100%，无责方0%
      return partyLiability.map(p => ({
        partyId: p.partyId,
        faultLevel: p.faultLevel,
        faultPercentage: p.faultLevel === 'full_fault' ? 100 : 0,
        reason: p.reasoning,
      }));
    }

    if (hasFullFault) {
      const fullFaultParty = partyLiability.find(p => p.faultLevel === 'full_fault')!;
      const otherParty = partyLiability.find(p => p.faultLevel !== 'full_fault')!;
      return [
        {
          partyId: fullFaultParty.partyId,
          faultLevel: 'full_fault' as FaultLevel,
          faultPercentage: 100,
          reason: fullFaultParty.reasoning,
        },
        {
          partyId: otherParty.partyId,
          faultLevel: otherParty.faultLevel,
          faultPercentage: 0,
          reason: otherParty.reasoning || '无过错',
        },
      ];
    }

    // 主责 + 次责 分配
    if (hasPrimaryFault && hasSecondaryFault) {
      const primaryParty = partyLiability.find(p => p.faultLevel === 'primary_fault')!;
      const secondaryParty = partyLiability.find(p => p.faultLevel === 'secondary_fault')!;
      return [
        {
          partyId: primaryParty.partyId,
          faultLevel: 'primary_fault' as FaultLevel,
          faultPercentage: 70,
          reason: primaryParty.reasoning,
        },
        {
          partyId: secondaryParty.partyId,
          faultLevel: 'secondary_fault' as FaultLevel,
          faultPercentage: 30,
          reason: secondaryParty.reasoning,
        },
      ];
    }

    if (hasEqualFault) {
      return partyLiability.map(p => ({
        partyId: p.partyId,
        faultLevel: p.faultLevel,
        faultPercentage: 50,
        reason: p.reasoning || '双方均存在一定过错',
      }));
    }
  }

  // 默认平均分配
  const defaultPercentage = Math.round(100 / totalParties);
  const remainder = 100 - defaultPercentage * (totalParties - 1);

  return partyLiability.map((p, index) => ({
    partyId: p.partyId,
    faultLevel: p.faultLevel,
    faultPercentage: index === 0 ? remainder : defaultPercentage,
    reason: p.reasoning,
  }));
}

/**
 * 生成学习要点
 */
export function generateLearningPoints(
  scenario: AccidentScenario,
  regulations: Regulation[]
): string[] {
  const points: string[] = [];

  // 转弯与直行专项学习要点（优先级最高）
  const straightParties = scenario.parties.filter(p => p.vehicleState === 'going_straight');
  const turningParties = scenario.parties.filter(p => 
    p.vehicleState === 'turning_left' || p.vehicleState === 'turning_right' || p.vehicleState === 'u_turn'
  );
  
  if (turningParties.length > 0 && straightParties.length > 0) {
    points.push('【核心原则】转弯车辆未让行直行车辆，是导致事故的直接原因。直行车辆有绝对优先通行权。');
    points.push('【唯一答案】转弯车未让行直行车（无其他过错）→ 转弯车全责（100%），直行车无责（0%）。');
    points.push('【法条依据】《道路交通安全法实施条例》第五十二条第三项：转弯的机动车让直行的车辆先行。');
    
    // 如果直行车也有违章
    const straightViolations = straightParties.flatMap(p => p.violations);
    if (straightViolations.some(v => ['闯红灯', '超速行驶', '逆向行驶', '酒驾', '醉驾'].includes(v))) {
      points.push('【特殊情形】直行车辆存在严重违章（如闯红灯、超速等）且与事故有因果关系时，可减轻转弯车责任，但仍以转弯车为主责方。');
    }
  }

  // 根据事故类型添加学习要点
  for (const party of scenario.parties) {
    if (party.violations.some(v => v.includes('闯红灯'))) {
      points.push('《道路交通安全法》第三十八条规定，车辆、行人应当按照交通信号通行。闯红灯是严重的交通违法行为。');
    }

    if (party.violations.some(v => v.includes('超速'))) {
      points.push('《道路交通安全法》第四十二条规定，机动车上道路行驶不得超过限速标志标明的最高时速。');
    }

    if (party.violations.some(v => v.includes('逆行'))) {
      points.push('《道路交通安全法》第三十五条规定，机动车、非机动车实行右侧通行。逆向行驶极易引发正面碰撞事故。');
    }

    if (party.violations.some(v => v.includes('酒驾') || v.includes('醉驾'))) {
      points.push('《道路交通安全法》第二十二条规定，饮酒、服用国家管制的精神药品或者麻醉药品不得驾驶机动车。酒驾是严重的交通违法行为。');
    }
  }

  if (scenario.roadType === 'intersection_without_signal') {
    points.push('无信号灯路口应遵循让行规则：让优先通行方先行；无优先标志时，让右方来车先行；转弯让直行。');
  }

  if (scenario.roadType === 'zebra_crossing') {
    points.push('【核心原则】机动车行经人行横道时，应当减速行驶；遇行人正在通过，应当停车让行。');
    points.push('【唯一答案】无信号灯斑马线，行人正常横过，机动车未停车让行 → 机动车全责，行人无责。');
    points.push('【法条依据】《道路交通安全法》第四十七条：机动车行经人行横道时，应当减速行驶；遇行人正在通过人行横道，应当停车让行。');
    points.push('【非机动车规则】非机动车骑行通过人行横道需承担次要责任（20-30%）；推行通过则享有优先通行权，无责任。');
    points.push('【注意事项】"停车让行"指完全停止，减速后缓慢通过不算让行；行人无义务"快速通过"，只要正常行走即可。');
    points.push('【禁止判定】不得引用"转弯让直行""让右原则"等无关条款；不得以"行人未确认安全"或"未快速通过"为由减轻机动车责任；不得以"已减速但未停车"判为同等责任。');
  }

  const hasRearEnd = scenario.parties.some(p => 
    p.violations.some(v => v.includes('追尾'))
  );
  if (hasRearEnd) {
    points.push('同车道行驶的机动车，后车应当与前车保持足以采取紧急制动措施的安全距离。');
  }

  // 去重
  return [...new Set(points)];
}

/**
 * 完整案例分析流程
 */
export function analyzeAccident(scenario: AccidentScenario): AnalysisResult {
  // 优先级最高：验证方向信息
  const directionValidation = validateDirectionInfo(scenario);
  
  // 如果方向信息不完整，返回验证结果而不进行完整分析
  if (!directionValidation.isValid) {
    return {
      scenario,
      steps: [],
      liabilityAllocation: [],
      keyFindings: [],
      learningPoints: [],
      disclaimer: '方向信息验证失败，请补充必要信息后重新分析。',
      directionValidation,
    };
  }

  // 步骤1：法规检索
  const { regulations, reasoning: regulationReasoning } = retrieveApplicableRegulations(scenario);

  // 步骤2：事实分析
  const { analysis: factAnalysis, keyFacts } = analyzeFacts(scenario);

  // 步骤3：逻辑推演
  const { reasoning: logicReasoning, partyLiability } = logicalReasoning(scenario, regulations);

  // 步骤4：责任认定
  const liabilityAllocation = allocateLiability(partyLiability);

  // 学习要点
  const learningPoints = generateLearningPoints(scenario, regulations);

  // 道路等级分析（新增）
  const { grade: roadGrade, isSpeeding, speedingAnalysis } = analyzeRoadGrade(scenario);

  // 更新场景中的道路等级信息
  if (roadGrade && !scenario.detectedRoadGrade) {
    scenario.detectedRoadGrade = roadGrade;
    scenario.roadGrade = roadGrade.name;
  }

  // 生成方向场景重述（如果有的话）
  const directionSceneSummary = generateDirectionSceneSummary(scenario);

  // 构建分析步骤 - 使用四步结构化格式
  const steps: AnalysisStep[] = [
    {
      step: 1,
      phase: '第一步：事实要素提取',
      title: '事实要素提取',
      content: generateStructuredFacts(scenario, directionValidation, factAnalysis, roadGrade),
      regulations: [],
    },
    {
      step: 2,
      phase: '第二步：法律检索与匹配',
      title: '法律检索与匹配',
      content: generateLegalAnalysis(regulations, scenario),
      regulations: regulations.slice(0, 5),
    },
    {
      step: 3,
      phase: '第三步：逻辑推演链',
      title: '逻辑推演链',
      content: generateLogicChain(scenario, regulations, partyLiability),
      regulations: [],
    },
    {
      step: 4,
      phase: '第四步：责任结论',
      title: '责任结论',
      content: generateLiabilityConclusion(scenario, liabilityAllocation, partyLiability),
      regulations: [],
    },
  ];

  // 关键发现
  const keyFindings = partyLiability.flatMap(p => p.reasoning.split('；').filter(Boolean));

  return {
    scenario,
    steps,
    liabilityAllocation,
    keyFindings: [...new Set(keyFindings)],
    learningPoints,
    disclaimer: '本分析基于《道路交通安全法》及其实施条例等法规条款进行推演，旨在帮助学习交通事故责任认定的逻辑和法规依据。最终责任认定请以交管部门正式出具的事故认定书为准。',
    directionValidation,
  };
}

// ========== 四步结构化分析内容生成函数 ==========

/**
 * 生成第一步：事实要素提取
 */
function generateStructuredFacts(
  scenario: AccidentScenario,
  directionValidation: ReturnType<typeof validateDirectionInfo>,
  factAnalysis: string,
  roadGrade?: ReturnType<typeof analyzeRoadGrade>['grade']
): string {
  const lines: string[] = [];
  
  lines.push('## 明确事实\n');
  
  // 当事方信息
  for (const party of scenario.parties) {
    const typeDesc = party.type === 'motor_vehicle' ? '机动车' : 
                     party.type === 'non_motor_vehicle' ? '非机动车' : '行人';
    const stateDesc = party.vehicleState === 'going_straight' ? '直行' :
                      party.vehicleState === 'turning_left' ? '左转弯' :
                      party.vehicleState === 'turning_right' ? '右转弯' :
                      party.vehicleState === 'changing_lane' ? '变更车道' :
                      party.vehicleState === 'stopped' ? '停车等待' : '行驶中';
    const direction = party.direction || '行驶中';
    const violations = party.violations.length > 0 ? party.violations.join('、') : '无';
    const signal = party.signalStatus ? (party.signalStatus === 'red' ? '红灯' : '绿灯') : '无信号指示';
    
    lines.push(`- ${typeDesc}${party.id}：${direction}，${stateDesc}，信号灯${signal}，违规行为：${violations}`);
  }
  
  lines.push('\n## 道路与环境条件\n');
  
  const roadTypeDesc = scenario.roadType === 'intersection_with_signal' ? '有信号灯控制的交叉路口' :
                       scenario.roadType === 'intersection_without_signal' ? '无信号灯控制的交叉路口' :
                       scenario.roadType === 'zebra_crossing' ? '人行横道路段' : '一般道路';
  
  // 添加交叉口几何类型
  let intersectionTypeDesc = '';
  if (scenario.roadType === 'intersection_with_signal' || scenario.roadType === 'intersection_without_signal') {
    const intersectionType = scenario.intersectionType || '十字交叉口';
    intersectionTypeDesc = `（${intersectionType}）`;
  }
  
  lines.push(`- 道路类型：${roadTypeDesc}${intersectionTypeDesc}`);
  
  if (roadGrade) {
    lines.push(`- 道路等级：${roadGrade.name}（${roadGrade.coreFeatures}）`);
  }
  
  if (scenario.weather && scenario.weather !== 'unknown') {
    const weatherDesc = scenario.weather === 'clear' ? '晴朗' : scenario.weather;
    lines.push(`- 天气状况：${weatherDesc}`);
  }
  
  if (scenario.roadCondition && scenario.roadCondition !== 'unknown') {
    const roadCondDesc = scenario.roadCondition === 'dry' ? '干燥' : scenario.roadCondition;
    lines.push(`- 路面条件：${roadCondDesc}`);
  }
  
  // 方向场景总结
  if (directionValidation.directionSceneSummary) {
    lines.push('\n## 方向场景描述\n');
    lines.push(directionValidation.directionSceneSummary);
  }
  
  // 标注待补充信息
  const missingFacts: string[] = [];
  if (!scenario.roadGrade && !roadGrade) {
    missingFacts.push('道路技术等级');
  }
  if (scenario.parties.some(p => !p.direction)) {
    missingFacts.push('部分当事方行驶方向');
  }
  // 交叉路口时未指定交叉口类型
  if ((scenario.roadType === 'intersection_with_signal' || scenario.roadType === 'intersection_without_signal') && !scenario.intersectionType) {
    missingFacts.push('交叉口几何类型');
  }
  
  // 人行横道事故专项检查清单
  if (scenario.roadType === 'zebra_crossing' || scenario.parties.some(p => p.type === 'pedestrian')) {
    lines.push('\n## 人行横道事故检查清单\n');
    const pedestrian = scenario.parties.find(p => p.type === 'pedestrian');
    const vehicle = scenario.parties.find(p => p.type !== 'pedestrian');
    
    lines.push('- 是否为人行横道：**是**（事故发生在人行横道/斑马线区域）');
    lines.push(`- 有无信号灯：${scenario.roadType === 'intersection_with_signal' ? '**有**（信号灯控制）' : '**无**（无信号灯）'}`);
    lines.push(`- 行人是否在斑马线上：**是**（${pedestrian?.id || '行人'}正常横过道路）`);
    lines.push(`- 机动车是否停车让行：${vehicle?.violations?.some(v => v.includes('未让行') || v.includes('未停车')) ? '**否**（机动车未停车让行）' : '**待确认**'}`);
  }
  
  if (missingFacts.length > 0) {
    lines.push('\n## 待补充事实\n');
    lines.push(`- ${missingFacts.join('、')}：根据现有信息无法确定，请在实际分析时补充`);
  }
  
  return lines.join('\n');
}

/**
 * 生成第二步：法律检索与匹配
 */
function generateLegalAnalysis(regulations: Regulation[], scenario: AccidentScenario): string {
  const lines: string[] = [];
  
  lines.push('## 适用法律条款\n\n');
  
  if (regulations.length === 0) {
    lines.push('未检索到直接适用的法规条款，请补充事故详情以便检索。');
    return lines.join('');
  }
  
  // 分析场景中的关键事实
  const turningParty = scenario.parties.find(p => p.vehicleState?.includes('turning'));
  const straightParty = scenario.parties.find(p => p.vehicleState === 'going_straight');
  const signalViolation = scenario.parties.some(p => p.violations?.some(v => v.includes('闯红灯') || v.includes('信号')));
  const hasSignal = scenario.parties.some(p => p.signalStatus);
  const signalStatus = scenario.parties[0]?.signalStatus || '未知';
  const isRoundabout = scenario.intersectionType === '环形交叉口';
  
  // 转弯方向描述
  const getTurnDirection = (party: typeof turningParty) => {
    if (!party) return '';
    if (party.turningIntention === 'left') return '左转弯';
    if (party.turningIntention === 'right') return '右转弯';
    return '转弯';
  };
  
  for (let i = 0; i < Math.min(regulations.length, 4); i++) {
    const reg = regulations[i];
    
    // 小节之间用空行隔开
    if (i > 0) {
      lines.push('\n\n');
    }
    
    // 条款名称加粗（article已是"第X条"完整形式）
    lines.push(`**${reg.title} ${reg.article}**\n\n`);
    
    // 条款原文放在引用块里
    lines.push(`> ${reg.content}\n`);
    
    // 适用理由单独一行，根据具体事实生成
    const categoryStr = Array.isArray(reg.category) ? reg.category[0] : reg.category;
    let reason = '';
    
    if (reg.article === '38' && reg.title.includes('交通安全法实施条例')) {
      // 第四十五条：绿灯通行规则
      if (hasSignal && turningParty && straightParty) {
        reason = `本案中，A车${getTurnDirection(turningParty)}时，B车直行，A车转弯行为需不妨害B车正常通行`;
      } else if (signalViolation) {
        reason = `本案存在信号灯违规情况，该条款规定了信号灯通行规则`;
      } else {
        reason = `该条款规定了机动车信号灯的通行规则，适用于本案`;
      }
    } else if (reg.article === '第五十一条' && reg.title.includes('交通安全法实施条例')) {
      // 第五十一条：转弯让行规则
      if (turningParty && straightParty) {
        reason = `本案发生在有信号灯控制的交叉路口，A车${getTurnDirection(turningParty)}时未让B车直行先行，违反该条款第（三）项规定`;
      } else if (isRoundabout) {
        reason = `本案发生在环形交叉口，该条款第（二）项规定准备进入环形路口的让已在路口内的机动车先行`;
      } else {
        reason = `该条款规定了交叉路口通行的基本规则，适用于本案`;
      }
    } else if (reg.article === '第五十二条' && reg.title.includes('交通安全法实施条例')) {
      // 第五十二条：无信号灯交叉口让行规则
      const hasTurnRequirement = reg.content.includes('转弯的机动车让直行的车辆先行');
      const hasYieldRight = reg.content.includes('让右方道路的来车先行');
      
      if (turningParty && straightParty && hasTurnRequirement) {
        reason = `本案发生在交叉路口，A车${getTurnDirection(turningParty)}时未让B车直行先行，违反该条款第（三）项"转弯的机动车让直行的车辆先行"规定`;
      } else if (hasYieldRight) {
        reason = `该条款第（二）项规定了"让右原则"，在没有交通标志标线控制的交叉路口，让右方道路来车先行`;
      } else {
        reason = `该条款是无信号灯交叉路口通行的核心规则，规定了转弯让直行、让右等基本路权原则`;
      }
    } else if (reg.article === '第三十八条' && reg.title.includes('交通安全法实施条例')) {
      // 第三十八条：信号灯通行规则
      if (turningParty && straightParty) {
        const aSignal = turningParty.signalStatus === 'green' ? '绿灯' : (turningParty.signalStatus === 'red' ? '红灯' : '黄灯');
        const bSignal = straightParty.signalStatus === 'green' ? '绿灯' : (straightParty.signalStatus === 'red' ? '红灯' : '黄灯');
        reason = `本案双方均为${aSignal}通行，该条款规定绿灯亮时准许通行，但转弯车辆不得妨碍被放行的直行车辆通行`;
      } else {
        reason = `该条款规定了信号灯通行规则，绿灯亮时准许车辆通行，但转弯车辆不得妨碍被放行的车辆和行人通行`;
      }
    } else if (reg.article === '第四十七条' && reg.title.includes('交通安全法实施条例')) {
      // 第四十七条：人行横道让行
      const pedestrian = scenario.parties.find(p => p.type === 'pedestrian');
      if (pedestrian) {
        reason = `本案涉及机动车与行人冲突，该条款规定机动车遇行人通过人行横道应当停车让行`;
      } else {
        reason = `该条款规定了机动车在人行横道前必须减速慢行，遇行人时应当让行`;
      }
    } else if (reg.article === '第四十三条' && reg.title.includes('交通安全法')) {
      // 第四十三条：安全车距和禁止超车情形
      reason = `该条款规定了同车道行驶的机动车应当保持安全车距，以及禁止超车的情形`;
    } else if (String(categoryStr) === '追尾' || String(categoryStr) === '追尾责任') {
      reason = `本案涉及追尾事故，该条款规定了同车道行驶的机动车应当保持安全车距，后车应当与前车保持足以采取紧急制动措施的安全距离`;
    } else if (String(categoryStr) === 'lane_change' || String(categoryStr) === '变更车道') {
      reason = `本案涉及变更车道，该条款规定变更车道不得影响相关车道内行驶的机动车的正常行驶`;
    } else if (isRoundabout) {
      reason = `本案发生在环形交叉口，该条款规定准备进入环形路口的让已在路口内的机动车先行`;
    } else {
      reason = `该条款与本案事实相关，规定了相应的通行规则和让行义务`;
    }
    
    lines.push(`\n**适用理由**：${reason}`);
  }
  
  return lines.join('');
}

/**
 * 生成第三步：逻辑推演链
 */
function generateLogicChain(
  scenario: AccidentScenario,
  regulations: Regulation[],
  partyLiability: { partyId: string; faultLevel: FaultLevel; reasoning: string }[]
): string {
  const lines: string[] = [];
  
  lines.push('## 推演过程\n\n');
  lines.push('### 法条要件逐一比对\n\n');
  
  // 创建比对表格
  lines.push('| 序号 | 法条要件 | 案件事实 | 比对结果 |');
  lines.push('|:---:|---------|---------|:-------:|');
  
  let seq = 1;
  
  // 遍历相关法规，提取要件进行比对
  for (const reg of regulations.slice(0, 3)) {
    const requirements = extractRequirements(reg);
    
    for (const req of requirements) {
      const matchingFacts = findMatchingFacts(scenario, req);
      const hasMatch = matchingFacts.length > 0;
      
      lines.push(`| ${seq} | ${req} | ${matchingFacts.join('；') || '未发现相关事实'} | ${hasMatch ? '✓ 满足' : '✗ 不满足'} |`);
      seq++;
    }
  }
  
  lines.push('\n### 逻辑推演\n\n');
  
  // 生成推演逻辑
  for (const liability of partyLiability) {
    const party = scenario.parties.find(p => p.id === liability.partyId);
    if (!party) continue;
    
    const typeDesc = party.type === 'motor_vehicle' ? '机动车' : 
                     party.type === 'non_motor_vehicle' ? '非机动车' : '行人';
    
    lines.push(`**${typeDesc}${party.id}责任分析**：\n`);
    
    // 分割reasoning为多个要点
    const reasons = liability.reasoning.split(/[；;]/).filter(Boolean);
    for (const reason of reasons) {
      lines.push(`→ ${reason.trim()}\n`);
    }
    
    const faultText = liability.faultLevel === 'full_fault' ? '全责' :
                      liability.faultLevel === 'primary_fault' ? '主责' :
                      liability.faultLevel === 'equal_fault' ? '同责' :
                      liability.faultLevel === 'secondary_fault' ? '次责' : '无责';
    lines.push(`**结论**：${typeDesc}${party.id}承担${faultText}\n\n`);
  }
  
  return lines.join('');
}

/**
 * 生成第四步：责任结论
 */
function generateLiabilityConclusion(
  scenario: AccidentScenario,
  liabilityAllocation: { partyId: string; faultLevel: FaultLevel; faultPercentage: number; reason: string }[],
  partyLiability: { partyId: string; faultLevel: FaultLevel; reasoning: string }[]
): string {
  const lines: string[] = [];
  
  lines.push('## 责任划分\n\n');
  
  // 按责任大小排序
  const sortedLiability = [...liabilityAllocation].sort((a, b) => b.faultPercentage - a.faultPercentage);
  
  for (const liability of sortedLiability) {
    const party = scenario.parties.find(p => p.id === liability.partyId);
    if (!party) continue;
    
    const typeDesc = party.type === 'motor_vehicle' ? '机动车' : 
                     party.type === 'non_motor_vehicle' ? '非机动车' : '行人';
    
    const levelText = liability.faultLevel === 'full_fault' ? '全部责任' :
                      liability.faultLevel === 'primary_fault' ? '主要责任' :
                      liability.faultLevel === 'equal_fault' ? '同等责任' :
                      liability.faultLevel === 'secondary_fault' ? '次要责任' : '无责任';
    
    lines.push(`### ${typeDesc}${party.id}：${levelText}（${liability.faultPercentage}%）\n`);
    lines.push(`**认定理由**：${liability.reason}\n\n`);
  }
  
  lines.push('---\n\n');
  lines.push('## 免责声明\n\n');
  lines.push('本分析仅供学习参考，不具备法律效力。\n');
  lines.push('最终责任认定请以交管部门正式出具的事故认定书为准。');
  
  return lines.join('');
}

/**
 * 从法规中提取要件
 */
function extractRequirements(reg: Regulation): string[] {
  const content = reg.content;
  const requirements: string[] = [];
  
  // 常见的要件模式
  const patterns = [
    { regex: /让[^\s，,]+先行/g, desc: '让某方先行' },
    { regex: /优先通行/g, desc: '优先通行权' },
    { regex: /不得[^\s，,]+通行/g, desc: '禁止通行' },
    { regex: /应当[^\s，,]+先行/g, desc: '应当让某方先行' },
    { regex: /禁止[^\s，,]+行为/g, desc: '禁止行为' },
  ];
  
  for (const pattern of patterns) {
    const matches = content.match(pattern.regex);
    if (matches) {
      requirements.push(...matches.slice(0, 2)); // 最多取2个
    }
  }
  
  if (requirements.length === 0) {
    requirements.push('按规定通行');
  }
  
  return requirements.slice(0, 3);
}

/**
 * 查找匹配的事实
 */
function findMatchingFacts(scenario: AccidentScenario, requirement: string): string[] {
  const facts: string[] = [];
  
  for (const party of scenario.parties) {
    if (requirement.includes('让') && requirement.includes('先行')) {
      // 让行相关
      if (party.vehicleState === 'turning_left' || party.vehicleState === 'turning_right') {
        facts.push(`${party.id}方进行转弯`);
      }
      if (party.vehicleState === 'going_straight') {
        facts.push(`${party.id}方直行`);
      }
    }
    
    if (requirement.includes('优先') || requirement.includes('直行')) {
      if (party.vehicleState === 'going_straight') {
        facts.push(`${party.id}方直行享有优先权`);
      }
    }
    
    // 环形交叉口相关事实
    if (scenario.intersectionType === '环形交叉口') {
      if (requirement.includes('环岛') || requirement.includes('环形')) {
        if (party.location?.includes('进入环岛') || party.vehicleState === 'entering_roundabout') {
          facts.push(`${party.id}方正在进入环岛`);
        }
        if (party.location?.includes('环岛内') || party.location?.includes('绕岛')) {
          facts.push(`${party.id}方在环岛内行驶`);
        }
        if (party.location?.includes('驶出环岛') || party.vehicleState === 'exiting_roundabout') {
          facts.push(`${party.id}方正在驶出环岛`);
        }
        if (party.violations.some(v => v.includes('逆') || v.includes('变道'))) {
          facts.push(`${party.id}方存在违规行为`);
        }
      }
    }
    
    if (party.violations.some(v => requirement.includes(v) || v.includes(requirement))) {
      facts.push(`${party.id}方存在违规：${party.violations.join('、')}`);
    }
  }
  
  return [...new Set(facts)];
}

/**
 * 简化版分析（用于快速演示）
 */
export function quickAnalysis(
  party1: { type: string; action: string; violations: string[] },
  party2: { type: string; action: string; violations: string[] },
  scenario: string
): string {
  const result = analyzeAccident({
    parties: [
      {
        id: 'A',
        type: party1.type as PartyType,
        vehicleState: party1.action as VehicleState,
        violations: party1.violations,
      },
      {
        id: 'B',
        type: party2.type as PartyType,
        vehicleState: party2.action as VehicleState,
        violations: party2.violations,
      },
    ],
    roadType: scenario.includes('路口') ? 
      (scenario.includes('信号灯') || scenario.includes('红绿灯') ? 'intersection_with_signal' : 'intersection_without_signal') :
      scenario.includes('人行横道') ? 'zebra_crossing' : 'general_road',
    roadCondition: 'dry',
    weather: 'clear',
  });

  return `【案例推演分析】

一、法规检索
${result.steps[0].content}

二、事实分析
${result.steps[1].content}

三、逻辑推演
${result.steps[2].content}

四、责任认定
${result.steps[3].content}

五、学习要点
${result.learningPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}

---
${result.disclaimer}`;
}

// ========== 可视化示意图生成模块 ==========

// 方向到坐标的映射配置
// 画布尺寸: 600x400，中心点: (300, 200)
// 20米 = 100像素
const METERS_TO_PIXELS = 5; // 20米对应100像素，1米 = 5像素

// 十字路口车辆初始位置（距路口中心约30米）
const INTERSECTION_DISTANCE = 150; // 像素，约30米

// 方向映射：标准方向描述 → Canvas方向 + 坐标偏移
interface DirectionMapping {
  canvasDir: 'up' | 'down' | 'left' | 'right';
  offsetX: number;  // 基于中心点(300,200)的X偏移
  offsetY: number;  // 基于中心点(300,200)的Y偏移
  rotation: number; // 旋转角度（用于箭头）
  labelOffsetX: number;
  labelOffsetY: number;
}

// 南向北：车辆从南侧驶来，向北直行
// 北向南：车辆从北侧驶来，向南直行
// 西向东：车辆从西侧驶来，向东直行
// 东向西：车辆从东侧驶来，向西直行
const DIRECTION_MAPPINGS: Record<string, DirectionMapping> = {
  // 南北方向
  '南向北': { canvasDir: 'up', offsetX: 0, offsetY: -INTERSECTION_DISTANCE, rotation: 0, labelOffsetX: 0, labelOffsetY: -35 },
  '北向南': { canvasDir: 'down', offsetX: 0, offsetY: INTERSECTION_DISTANCE, rotation: 180, labelOffsetX: 0, labelOffsetY: 35 },
  // 东西方向（从西向东：车辆在画布左侧，箭头向右）
  '西向东': { canvasDir: 'right', offsetX: -INTERSECTION_DISTANCE, offsetY: 0, rotation: 90, labelOffsetX: 35, labelOffsetY: 0 },
  // 东西方向（从东向西：车辆在画布右侧，箭头向左）
  '东向西': { canvasDir: 'left', offsetX: INTERSECTION_DISTANCE, offsetY: 0, rotation: -90, labelOffsetX: -35, labelOffsetY: 0 },
  // 简化方向（兼容旧数据）
  '南北': { canvasDir: 'up', offsetX: 0, offsetY: -INTERSECTION_DISTANCE, rotation: 0, labelOffsetX: 0, labelOffsetY: -35 },
  '北南': { canvasDir: 'down', offsetX: 0, offsetY: INTERSECTION_DISTANCE, rotation: 180, labelOffsetX: 0, labelOffsetY: 35 },
  '东西': { canvasDir: 'right', offsetX: -INTERSECTION_DISTANCE, offsetY: 0, rotation: 90, labelOffsetX: 35, labelOffsetY: 0 },
  '西东': { canvasDir: 'right', offsetX: -INTERSECTION_DISTANCE, offsetY: 0, rotation: 90, labelOffsetX: 35, labelOffsetY: 0 },
};

// 车辆类型映射
interface VehicleVisualConfig {
  drawType: 'motor_rect' | 'pedestrian_circle' | 'non_motor_bicycle';
  color: string;
  labelPrefix: string;
}

const CENTER_X = 300; // 画布中心X
const CENTER_Y = 200; // 画布中心Y

// 转弯路径计算
interface TurnPath {
  startX: number;
  startY: number;
  controlX: number;
  controlY: number;
  endX: number;
  endY: number;
  isLeftTurn: boolean;
}

function calculateTurnPath(
  vehicleX: number,
  vehicleY: number,
  vehicleDir: string,
  turnDirection: 'left' | 'right'
): TurnPath | null {
  // 计算转弯起点（在路口边缘）
  const entryDist = INTERSECTION_DISTANCE * 0.7; // 进入路口70%处
  let startX = vehicleX, startY = vehicleY;
  let endX = CENTER_X, endY = CENTER_Y;
  let controlX = CENTER_X, controlY = CENTER_Y;

  // 根据车辆方向和转弯方向计算路径（使用车辆实际位置）
  if (vehicleDir === 'up' || vehicleDir === '南北' || vehicleDir === '南向北') {
    // 车辆在路口上方，准备向北直行
    startX = vehicleX;
    startY = CENTER_Y - entryDist;
    if (turnDirection === 'left') {
      // 左转：向左转90度（向西）
      controlX = vehicleX - entryDist * 0.5;
      endX = vehicleX - entryDist;
      endY = CENTER_Y;
    } else {
      // 右转：向右转90度（向东）
      controlX = vehicleX + entryDist * 0.5;
      endX = vehicleX + entryDist;
      endY = CENTER_Y;
    }
  } else if (vehicleDir === 'down' || vehicleDir === '北南' || vehicleDir === '北向南') {
    // 车辆在路口下方，准备向南直行
    startX = vehicleX;
    startY = CENTER_Y + entryDist;
    if (turnDirection === 'left') {
      // 左转：向右转90度（向东）
      controlX = vehicleX + entryDist * 0.5;
      endX = vehicleX + entryDist;
      endY = CENTER_Y;
    } else {
      // 右转：向左转90度（向西）
      controlX = vehicleX - entryDist * 0.5;
      endX = vehicleX - entryDist;
      endY = CENTER_Y;
    }
  } else if (vehicleDir === 'right' || vehicleDir === '东西' || vehicleDir === '西向东') {
    // 车辆在路口左侧，准备向东直行（从西向东）
    startX = vehicleX;  // 使用车辆实际x位置
    startY = vehicleY;
    if (turnDirection === 'left') {
      // 左转：向上转90度（向北）
      controlY = vehicleY - entryDist * 0.5;
      endX = vehicleX;
      endY = vehicleY - entryDist;
    } else {
      // 右转：向下转90度（向南）
      controlY = vehicleY + entryDist * 0.5;
      endX = vehicleX;
      endY = vehicleY + entryDist;
    }
  } else if (vehicleDir === 'left' || vehicleDir === '西东' || vehicleDir === '东向西') {
    // 车辆在路口右侧，准备向西直行（从东向西）
    startX = vehicleX;  // 使用车辆实际x位置
    startY = vehicleY;
    if (turnDirection === 'left') {
      // 左转：向下转90度（向南）
      controlY = vehicleY + entryDist * 0.5;
      endX = CENTER_X;
      endY = vehicleY + entryDist;
    } else {
      // 右转：向上转90度（向北）
      controlY = vehicleY - entryDist * 0.5;
      endX = CENTER_X;
      endY = vehicleY - entryDist;
    }
  }

  return {
    startX, startY, controlX, controlY, endX, endY,
    isLeftTurn: turnDirection === 'left'
  };
}

export interface VehiclePosition {
  id: string;                  // 车辆标识
  x: number;                   // X坐标
  y: number;                   // Y坐标
  direction: 'up' | 'down' | 'left' | 'right';  // 行驶方向
  color: string;              // 车辆颜色
  label: string;               // 车辆标签
  state: string;              // 行驶状态
  partyType: PartyType;       // 当事方类型
  partyIndex: number;         // 当事方索引（用于区分同类型）
  // 转弯相关
  turnPath?: TurnPath | null;        // 转弯路径
  turnDirection?: 'left' | 'right'; // 转弯方向
  // 标签偏移
  labelOffsetX: number;
  labelOffsetY: number;
}

export interface CollisionPoint {
  x: number;
  y: number;
  label?: string;
}

export interface RoadVisualizationData {
  roadType: '十字交叉口' | 'T型交叉口' | 'Y型交叉口' | '环形交叉口' | 'X型交叉口' | '多肢交叉口' | '一般道路' | 'straight' | 'zebra_crossing' | 'highway';
  vehicles: VehiclePosition[];
  collisionPoint?: CollisionPoint;
  roadGrade?: string;
  turnPaths: { vehicleId: string; path: TurnPath }[];
  intersectionType?: string; // 原始交叉口类型
}

/**
 * 根据事故场景生成可视化数据
 * 实现方向→坐标映射，支持转弯弧线绘制
 */
export function generateVisualizationData(scenario: AccidentScenario): RoadVisualizationData {
  const vehicles: VehiclePosition[] = [];
  let collisionPoint: CollisionPoint | undefined;
  const turnPaths: { vehicleId: string; path: TurnPath }[] = [];

  // 根据道路类型设置基本布局
  const isIntersection = scenario.roadType === 'intersection_with_signal' || 
                          scenario.roadType === 'intersection_without_signal';
  const isZebraCrossing = scenario.roadType === 'zebra_crossing';
  const isHighway = scenario.roadType === 'highway';

  // 根据交叉口几何类型设置道路类型
  let roadType: RoadVisualizationData['roadType'] = 'straight';
  
  if (isIntersection && scenario.intersectionType) {
    // 使用用户指定的交叉口类型
    roadType = scenario.intersectionType as RoadVisualizationData['roadType'];
  } else if (isIntersection) {
    // 默认十字交叉口
    roadType = '十字交叉口';
  } else if (isZebraCrossing) {
    roadType = 'zebra_crossing';
  } else if (isHighway) {
    roadType = 'highway';
  }

  // 车辆颜色映射（机动车用矩形）
  const colorMap: Record<string, string> = {
    A: '#22c55e',  // 绿色
    B: '#ef4444',  // 红色
    C: '#3b82f6',  // 蓝色
    D: '#f59e0b',  // 黄色
  };

  // 行人颜色
  const PEDESTRIAN_COLOR = '#22c55e';
  // 非机动车颜色
  const NON_MOTOR_COLOR = '#f59e0b';

  // 标签前缀映射
  const labelPrefixMap: Record<PartyType, string> = {
    motor_vehicle: '机动车',
    non_motor_vehicle: '非机动车',
    pedestrian: '行人',
    unknown: '主体',
  };

  // 车辆状态标签
  const vehicleStateLabels: Record<VehicleState, string> = {
    going_straight: '直行',
    turning_left: '左转',
    turning_right: '右转',
    changing_lane: '变道',
    overtaking: '超车',
    reversing: '倒车',
    u_turn: '掉头',
    stopped: '停车',
    parked: '停放',
    turning_around: '转向',
    entering_roundabout: '进入环岛',
    exiting_roundabout: '驶出环岛',
    in_roundabout: '在环岛内',
    unknown: '行驶中',
  };

  // 用于追踪同类型主体的数量
  const typeCount: Record<string, number> = {
    motor_vehicle: 0,
    non_motor_vehicle: 0,
    pedestrian: 0,
  };

  // 根据车辆状态和道路类型确定位置
  scenario.parties.forEach((party, index) => {
    const id = party.id;
    
    // 确定颜色和标签前缀
    let color: string;
    let labelPrefix: string;
    let partyType: PartyType = party.type || 'motor_vehicle';
    
    if (party.type === 'pedestrian') {
      color = PEDESTRIAN_COLOR;
      labelPrefix = '行人';
      typeCount.pedestrian++;
    } else if (party.type === 'non_motor_vehicle') {
      color = NON_MOTOR_COLOR;
      labelPrefix = '非机动车';
      typeCount.non_motor_vehicle++;
    } else {
      color = colorMap[id] || colorMap[String.fromCharCode(65 + index)] || '#6b7280';
      labelPrefix = '机动车';
      typeCount.motor_vehicle++;
    }
    
    let x = CENTER_X, y = CENTER_Y;
    let direction: VehiclePosition['direction'] = 'up';
    let labelOffsetX = 0, labelOffsetY = -35;
    let turnDirection: 'left' | 'right' | undefined;
    let turnPath: TurnPath | null | undefined;

    // 解析行驶方向
    const directionStr = party.direction || '';

    // 根据道路类型和车辆状态确定位置
    if (isIntersection) {
      // 十字路口场景 - 使用方向映射
      if (directionStr && DIRECTION_MAPPINGS[directionStr]) {
        // 使用标准方向映射
        const mapping = DIRECTION_MAPPINGS[directionStr];
        x = CENTER_X + mapping.offsetX;
        y = CENTER_Y + mapping.offsetY;
        direction = mapping.canvasDir;
        labelOffsetX = mapping.labelOffsetX;
        labelOffsetY = mapping.labelOffsetY;
      } else {
        // 降级处理：根据车辆状态判断
        if (party.vehicleState === 'turning_right' || party.vehicleState === 'turning_left') {
          // 转弯车辆在支路上
          const isVertical = index % 2 === 0;
          if (isVertical) {
            x = CENTER_X - 100;
            y = CENTER_Y + 100;
            direction = 'up';
            labelOffsetX = 0;
            labelOffsetY = -35;
          } else {
            x = CENTER_X + 100;
            y = CENTER_Y - 100;
            direction = 'down';
            labelOffsetX = 0;
            labelOffsetY = 35;
          }
        } else {
          // 直行车辆
          const isVertical = index % 2 === 0;
          if (isVertical) {
            x = CENTER_X;
            y = CENTER_Y - 150;
            direction = 'up';
          } else {
            x = CENTER_X + 150;
            y = CENTER_Y;
            direction = 'right';
          }
        }
      }

      // 处理转弯逻辑
      if (party.vehicleState === 'turning_left' || party.vehicleState === 'turning_right') {
        turnDirection = party.vehicleState === 'turning_left' ? 'left' : 'right';
        // 计算转弯路径
        const rawDir = directionStr && DIRECTION_MAPPINGS[directionStr] 
          ? DIRECTION_MAPPINGS[directionStr].canvasDir 
          : direction;
        turnPath = calculateTurnPath(x, y, rawDir, turnDirection);
        if (turnPath) {
          turnPaths.push({ vehicleId: id, path: turnPath });
        }
      }
    } else if (isZebraCrossing) {
      // 人行横道场景
      if (party.type === 'pedestrian') {
        x = CENTER_X;
        y = CENTER_Y;
        direction = 'right';
        labelOffsetX = 35;
        labelOffsetY = 0;
      } else {
        x = CENTER_X;
        y = CENTER_Y + 150;
        direction = 'up';
      }
    } else if (isHighway) {
      // 高速公路场景
      x = CENTER_X + 150;
      y = CENTER_Y - 100 + index * 80;
      direction = 'left';
      labelOffsetX = -35;
      labelOffsetY = 0;
    } else {
      // 一般道路场景
      x = CENTER_X - 150 + index * 100;
      y = CENTER_Y;
      direction = party.vehicleState === 'going_straight' ? 'right' : 'up';
      labelOffsetX = 35;
      labelOffsetY = 0;
    }

    // 生成标签
    const typeCountForLabel = typeCount[partyType] || 1;
    const label = `${labelPrefix}${party.id}`;

    vehicles.push({
      id,
      x,
      y,
      direction,
      color,
      label,
      state: vehicleStateLabels[party.vehicleState] || '行驶中',
      partyType,
      partyIndex: typeCountForLabel,
      turnPath,
      turnDirection,
      labelOffsetX,
      labelOffsetY,
    });
  });

  // 计算碰撞点 - 使用路口中心作为默认碰撞点
  if (vehicles.length >= 2) {
    const hasTurningVehicle = vehicles.some(v => v.turnDirection);
    
    if (hasTurningVehicle) {
      // 如果有转弯车辆，碰撞点更接近路口中心
      const turningVehicle = vehicles.find(v => v.turnDirection);
      if (turningVehicle) {
        collisionPoint = {
          x: CENTER_X + (turningVehicle.x - CENTER_X) * 0.3,
          y: CENTER_Y + (turningVehicle.y - CENTER_Y) * 0.3,
          label: '碰撞点',
        };
      }
    } else {
      // 常规情况：取两车的中间位置
      const v1 = vehicles[0];
      const v2 = vehicles[1];
      collisionPoint = {
        x: (v1.x + v2.x) / 2,
        y: (v1.y + v2.y) / 2,
        label: '碰撞点',
      };
    }
  }

  return {
    roadType,
    vehicles,
    collisionPoint,
    roadGrade: scenario.roadGrade || scenario.detectedRoadGrade?.name,
    turnPaths,
  };
}

/**
 * 生成HTML Canvas可视化示意图代码
/**
 * 生成HTML Canvas可视化示意图代码
 * 支持根据当事方类型绘制不同图形：
 * - 机动车：矩形（绿色/红色/蓝色）
 * - 行人：绿色圆形
 * - 非机动车：橙色圆形+两个小圆（车轮）
 */
export function generateVisualizationHTML(scenario: AccidentScenario): string {
  const vizData = generateVisualizationData(scenario);
  
  const roadTypeLabels: Record<string, string> = {
    intersection: '十字路口',
    straight: '一般路段',
    zebra_crossing: '人行横道路段',
    highway: '高速公路',
  };

  const vehiclesJSON = JSON.stringify(vizData.vehicles);
  const collisionJSON = vizData.collisionPoint ? JSON.stringify(vizData.collisionPoint) : 'null';
  const turnPathsJSON = JSON.stringify(vizData.turnPaths);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>交通事故现场示意图</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
      background: #f8fafc;
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    h3 {
      color: #1e40af;
      margin-bottom: 16px;
      font-size: 18px;
    }
    .canvas-container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      padding: 20px;
      margin-bottom: 16px;
    }
    canvas {
      display: block;
      border-radius: 8px;
    }
    .legend {
      display: flex;
      gap: 24px;
      flex-wrap: wrap;
      justify-content: center;
      margin-top: 16px;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: #475569;
    }
    .legend-color {
      width: 20px;
      height: 20px;
      border-radius: 50%;
    }
    .legend-rect {
      width: 24px;
      height: 14px;
      border-radius: 3px;
    }
  </style>
</head>
<body>
  <h3>事故现场示意图（${roadTypeLabels[vizData.roadType]}）</h3>
  <div class="canvas-container">
    <canvas id="trafficCanvas" width="600" height="400"></canvas>
  </div>
  <div class="legend" id="legend"></div>

  <script>
    const vehicles = ${vehiclesJSON};
    const collisionPoint = ${collisionJSON};
    const turnPaths = ${turnPathsJSON};

    const canvas = document.getElementById('trafficCanvas');
    const ctx = canvas.getContext('2d');
    const CENTER_X = 300;
    const CENTER_Y = 200;

    // ========== 绘制道路 ==========
    function drawRoad() {
      const roadType = '${vizData.roadType}';
      
      ctx.fillStyle = '#94a3b8';
      
      // 根据交叉口类型绘制不同的道路形状
      if (roadType === '十字交叉口') {
        // 十字交叉口 - 横竖两条道路垂直交叉
        ctx.fillRect(200, 0, 200, 400);
        ctx.fillRect(0, 150, 600, 100);
      } else if (roadType === 'T型交叉口') {
        // T型交叉口 - 横向道路贯通，纵向道路从中心向下接入
        ctx.fillRect(150, 0, 300, 400);
        ctx.fillRect(150, 200, 300, 200);
      } else if (roadType === 'Y型交叉口') {
        // Y型交叉口 - 三条道路呈Y形分布
        // 横向主路
        ctx.fillRect(100, 180, 400, 40);
        // 向左上延伸的支路
        ctx.save();
        ctx.translate(200, 200);
        ctx.rotate(-Math.PI / 3);
        ctx.fillRect(-20, -300, 40, 300);
        ctx.restore();
        // 向右上延伸的支路
        ctx.save();
        ctx.translate(400, 200);
        ctx.rotate(Math.PI / 3);
        ctx.fillRect(-20, -300, 40, 300);
        ctx.restore();
      } else if (roadType === '环形交叉口') {
        // 环形交叉口 - 中心圆岛，四条道路连接
        ctx.fillRect(200, 0, 200, 400);
        ctx.fillRect(0, 150, 600, 100);
        // 绘制中心环岛
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.arc(CENTER_X, CENTER_Y, 50, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#94a3b8';
        // 绘制环岛内部道路（绕岛行驶）
        ctx.strokeStyle = '#ffffff';
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.arc(CENTER_X, CENTER_Y, 70, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (roadType === 'X型交叉口') {
        // X型交叉口 - 斜向交叉
        ctx.save();
        ctx.translate(CENTER_X, CENTER_Y);
        ctx.rotate(Math.PI / 6);
        ctx.fillRect(-100, -300, 200, 600);
        ctx.rotate(-Math.PI / 3);
        ctx.fillRect(-100, -300, 200, 600);
        ctx.restore();
      } else if (roadType === 'highway') {
        // 高速公路 - 带中央分隔带
        ctx.fillRect(150, 0, 300, 400);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(290, 0, 20, 400);
        ctx.fillStyle = '#94a3b8';
      } else if (roadType === 'zebra_crossing') {
        // 人行横道
        ctx.fillRect(200, 0, 200, 400);
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 10; i++) {
          ctx.fillRect(200, 180 + i * 12, 200, 8);
        }
        ctx.fillStyle = '#94a3b8';
      } else {
        // 一般道路
        ctx.fillRect(200, 0, 200, 400);
      }

      // 绘制道路标线
      ctx.strokeStyle = '#ffffff';
      ctx.setLineDash([20, 10]);
      ctx.lineWidth = 2;
      
      if (roadType === '十字交叉口') {
        ctx.beginPath();
        ctx.moveTo(250, 0);
        ctx.lineTo(250, 150);
        ctx.moveTo(350, 0);
        ctx.lineTo(350, 150);
        ctx.moveTo(250, 250);
        ctx.lineTo(250, 400);
        ctx.moveTo(350, 250);
        ctx.lineTo(350, 400);
        ctx.moveTo(0, 175);
        ctx.lineTo(200, 175);
        ctx.moveTo(400, 175);
        ctx.lineTo(600, 175);
        ctx.moveTo(0, 225);
        ctx.lineTo(200, 225);
        ctx.moveTo(400, 225);
        ctx.lineTo(600, 225);
        ctx.stroke();
      } else if (roadType === 'T型交叉口') {
        ctx.beginPath();
        ctx.moveTo(180, 0);
        ctx.lineTo(180, 400);
        ctx.moveTo(420, 0);
        ctx.lineTo(420, 400);
        ctx.moveTo(150, 210);
        ctx.lineTo(450, 210);
        ctx.moveTo(150, 290);
        ctx.lineTo(450, 290);
        ctx.stroke();
      } else if (roadType === '环形交叉口') {
        // 环岛标线
        ctx.beginPath();
        ctx.arc(CENTER_X, CENTER_Y, 70, 0, Math.PI * 2);
        ctx.stroke();
        
        // 绘制逆时针行驶指示箭头
        ctx.strokeStyle = '#16a34a';
        ctx.fillStyle = '#16a34a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(CENTER_X, CENTER_Y, 85, Math.PI * 0.7, Math.PI * 1.7);
        ctx.stroke();
        
        // 箭头头部（指示逆时针方向）
        ctx.save();
        ctx.translate(CENTER_X + 85 * Math.cos(Math.PI * 1.7), CENTER_Y + 85 * Math.sin(Math.PI * 1.7));
        ctx.rotate(Math.PI * 1.7 + Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-8, 12);
        ctx.lineTo(8, 12);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        
        // 添加"逆时针行驶"文字标注
        ctx.fillStyle = '#16a34a';
        ctx.font = 'bold 12px Microsoft YaHei';
        ctx.textAlign = 'center';
        ctx.fillText('逆时针行驶', CENTER_X, CENTER_Y - 95);
      } else if (roadType === 'highway') {
        ctx.beginPath();
        ctx.moveTo(220, 0);
        ctx.lineTo(220, 400);
        ctx.moveTo(380, 0);
        ctx.lineTo(380, 400);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(300, 0);
        ctx.lineTo(300, 400);
        ctx.stroke();
      }
      
      ctx.setLineDash([]);
      
      // 绘制交叉口中心标记
      if (roadType === '十字交叉口' || roadType === 'T型交叉口') {
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.arc(CENTER_X, CENTER_Y, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ========== 绘制机动车（矩形） ==========
    function drawMotorVehicle(x, y, direction, color, label, labelOffsetX, labelOffsetY) {
      const width = 50;
      const height = 30;
      
      ctx.save();
      ctx.translate(x, y);
      
      const rotationMap = { up: -90, down: 90, left: 180, right: 0 };
      ctx.rotate((rotationMap[direction] || 0) * Math.PI / 180);
      
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(-width/2, -height/2, width, height, 6);
      ctx.fill();
      
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(-width/4, -height/3, width/2, height*0.66, 3);
      ctx.fill();
      
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(width/2 - 8, 0);
      ctx.lineTo(width/2, 0);
      ctx.stroke();
      
      ctx.restore();
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Microsoft YaHei';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x, y);
      
      ctx.fillStyle = '#1e40af';
      ctx.font = '11px Microsoft YaHei';
      ctx.fillText(label, x + labelOffsetX, y + labelOffsetY - 15);
    }

    // ========== 绘制行人（绿色圆形） ==========
    function drawPedestrian(x, y, direction, label, labelOffsetX, labelOffsetY) {
      const radius = 12;
      const color = '#22c55e';
      
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#fcd34d';
      ctx.beginPath();
      ctx.arc(x, y - radius - 4, 5, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = color;
      ctx.save();
      ctx.translate(x + labelOffsetX/2, y + labelOffsetY/2);
      const arrowAngle = labelOffsetX > 0 ? 0 : (labelOffsetX < 0 ? Math.PI : (labelOffsetY < 0 ? -Math.PI/2 : Math.PI/2));
      ctx.rotate(arrowAngle);
      ctx.beginPath();
      ctx.moveTo(12, 0);
      ctx.lineTo(4, -6);
      ctx.lineTo(4, 6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px Microsoft YaHei';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x, y);
    }

    // ========== 绘制非机动车（橙色圆形+两个小圆轮子） ==========
    function drawNonMotorVehicle(x, y, direction, label, labelOffsetX, labelOffsetY) {
      const color = '#f59e0b';
      const bodyRadius = 10;
      
      ctx.save();
      ctx.translate(x, y);
      
      const rotationMap = { up: -90, down: 90, left: 180, right: 0 };
      ctx.rotate((rotationMap[direction] || 0) * Math.PI / 180);
      
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(0, 0, bodyRadius, bodyRadius * 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#374151';
      ctx.beginPath();
      ctx.arc(0, -bodyRadius * 1.5 - 5, 6, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(0, bodyRadius * 1.5 + 5, 6, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-8, -bodyRadius - 2);
      ctx.lineTo(8, -bodyRadius - 2);
      ctx.stroke();
      
      ctx.restore();
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px Microsoft YaHei';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x, y);
      
      ctx.fillStyle = '#1e40af';
      ctx.font = '11px Microsoft YaHei';
      ctx.fillText(label, x + labelOffsetX, y + labelOffsetY - 10);
    }

    // ========== 绘制转弯弧线 ==========
    function drawTurnPath(path, color) {
      if (!path) return;
      
      const { startX, startY, controlX, controlY, endX, endY } = path;
      
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 4]);
      ctx.globalAlpha = 0.7;
      
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(controlX, controlY, endX, endY);
      ctx.stroke();
      
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(endX, endY, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // ========== 绘制行驶方向箭头 ==========
    function drawDirectionArrow(x, y, direction, color, vehicle) {
      ctx.save();
      
      const arrowLen = 25;
      const arrowWidth = 12;
      let angle = 0;
      
      // 根据车辆原始方向和转弯方向计算箭头指向
      if (vehicle.turnDirection) {
        // 转弯后的方向映射
        const dirMap = { up: -Math.PI/2, down: Math.PI/2, left: Math.PI, right: 0 };
        const baseAngle = dirMap[direction] || 0;
        
        // 左转：逆时针旋转90度；右转：顺时针旋转90度
        if (vehicle.turnDirection === 'left') {
          angle = baseAngle - Math.PI/2;
        } else {
          angle = baseAngle + Math.PI/2;
        }
      } else {
        const dirMap = { up: -Math.PI/2, down: Math.PI/2, left: Math.PI, right: 0 };
        angle = dirMap[direction] || 0;
      }
      
      ctx.translate(x, y);
      ctx.rotate(angle);
      
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.moveTo(arrowLen, 0);
      ctx.lineTo(-arrowLen/2, -arrowWidth);
      ctx.lineTo(-arrowLen/2, arrowWidth);
      ctx.closePath();
      ctx.fill();
      
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // ========== 绘制碰撞点 ==========
    function drawCollision() {
      if (!collisionPoint) return;
      
      const { x, y, label } = collisionPoint;
      
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x - 15, y - 15);
      ctx.lineTo(x + 15, y + 15);
      ctx.moveTo(x + 15, y - 15);
      ctx.lineTo(x - 15, y + 15);
      ctx.stroke();

      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#dc2626';
      ctx.font = 'bold 12px Microsoft YaHei';
      ctx.textAlign = 'center';
      ctx.fillText(label || '碰撞点', x, y + 40);
    }

    // ========== 绘制图例 ==========
    function renderLegend() {
      const legend = document.getElementById('legend');
      
      vehicles.forEach(v => {
        const item = document.createElement('div');
        item.className = 'legend-item';
        
        let iconHtml = '';
        if (v.partyType === 'motor_vehicle') {
          iconHtml = '<div class="legend-rect" style="background:' + v.color + '"></div>';
        } else if (v.partyType === 'pedestrian') {
          iconHtml = '<div class="legend-color" style="background:#22c55e"></div>';
        } else {
          iconHtml = '<div class="legend-color" style="background:#f59e0b"></div>';
        }
        
        item.innerHTML = iconHtml + '<span>' + v.label + '（' + v.state + '）</span>';
        legend.appendChild(item);
      });
      
      if (collisionPoint) {
        const collisionItem = document.createElement('div');
        collisionItem.className = 'legend-item';
        collisionItem.innerHTML = '<svg width="20" height="20" viewBox="0 0 20 20"><line x1="3" y1="3" x2="17" y2="17" stroke="#dc2626" stroke-width="3"/><line x1="17" y1="3" x2="3" y2="17" stroke="#dc2626" stroke-width="3"/></svg><span>碰撞点</span>';
        legend.appendChild(collisionItem);
      }
    }

    // ========== 执行绘制 ==========
    drawRoad();
    
    turnPaths.forEach(tp => {
      const vehicle = vehicles.find(v => v.id === tp.vehicleId);
      if (vehicle) {
        drawTurnPath(tp.path, vehicle.color);
      }
    });
    
    vehicles.forEach(v => {
      if (v.partyType === 'motor_vehicle') {
        drawMotorVehicle(v.x, v.y, v.direction, v.color, v.label, v.labelOffsetX, v.labelOffsetY);
      } else if (v.partyType === 'pedestrian') {
        drawPedestrian(v.x, v.y, v.direction, v.label, v.labelOffsetX, v.labelOffsetY);
      } else if (v.partyType === 'non_motor_vehicle') {
        drawNonMotorVehicle(v.x, v.y, v.direction, v.label, v.labelOffsetX, v.labelOffsetY);
      }
      
      if (v.partyType !== 'pedestrian') {
        drawDirectionArrow(v.x, v.y, v.direction, v.color, v);
      }
    });
    
    drawCollision();
    renderLegend();
  </script>
</body>
</html>`;
}



/**
 * 分析场景中的道路等级信息
 */
export function analyzeRoadGrade(scenario: AccidentScenario): {
  grade: RoadGrade | undefined;
  isSpeeding: boolean;
  speedingAnalysis: string;
} {
  // 尝试识别道路等级
  let grade: RoadGrade | undefined = scenario.detectedRoadGrade;
  
  if (!grade && scenario.roadType) {
    const roadTypeStr = scenario.roadType;
    grade = identifyRoadGrade(roadTypeStr) || undefined;
  }

  if (!grade) {
    // 根据道路类型和描述推断
    if (scenario.roadType === 'highway') {
      grade = roadGrades.find(g => g.id === 'highway') || undefined;
    }
  }

  let isSpeeding = false;
  let speedingAnalysis = '';

  if (grade && scenario.actualSpeed) {
    // 提取限速范围
    const speedMatch = grade.speedLimitRange.match(/(\d+)-(\d+)/);
    if (speedMatch) {
      const minSpeed = parseInt(speedMatch[1]);
      isSpeeding = scenario.actualSpeed > minSpeed;
      speedingAnalysis = `该${grade.name}限速范围为${grade.speedLimitRange}，` +
        `实测速度${scenario.actualSpeed}km/h，` +
        (isSpeeding ? `超过限速上限，应认定为超速行为` : `在合理范围内`);
    }
  }

  return { grade, isSpeeding, speedingAnalysis };
}
