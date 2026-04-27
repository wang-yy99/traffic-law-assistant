'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { 
  AlertTriangle, 
  Scale, 
  BookOpen, 
  ChevronRight, 
  Shield, 
  Users, 
  Car, 
  Footprints,
  CircleDot,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  Lightbulb,
  Gavel,
  Search,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

// ========== 类型定义 ==========

interface AccidentParty {
  id: string;
  type: 'motor_vehicle' | 'non_motor_vehicle' | 'pedestrian';
  vehicleState: string;
  violations: string[];
  signalStatus?: string;
  location?: string;
  // 方向信息（优先级最高）
  direction?: string;       // 行驶方向，如"南北"、"北南"等
  relativePosition?: string; // 相对方位，如"左侧"、"右侧"
  stopReason?: string;      // 停车等待原因
  turningIntention?: string; // 转弯意图
  // 人行横道专用
  crossingMethod?: string;  // 非机动车通行方式：walking=推行，riding=骑行
}

interface AccidentScenario {
  parties: AccidentParty[];
  roadType: string;
  roadCondition: string;
  weather: string;
  hasSpeedLimit?: boolean;
  speedLimit?: number;
  roadGrade?: string;
  actualSpeed?: number;
  intersectionType?: string; // 交叉口几何类型
}

interface DirectionValidation {
  isValid: boolean;
  missingInfo: string[];
  questions: string[];
  directionSceneSummary?: string;
}

interface Regulation {
  title: string;
  article: string;
  content: string;
}

interface AnalysisStep {
  step: number;
  phase: string;
  title: string;
  content: string;
  complete: boolean;
}

interface Liability {
  partyId: string;
  faultLevel: string;
  faultPercentage: number;
  reason: string;
}

// ========== 常量 ==========

const ROAD_TYPES = [
  { value: 'intersection_with_signal', label: '有信号灯交叉路口' },
  { value: 'intersection_without_signal', label: '无信号灯交叉路口' },
  { value: 'zebra_crossing', label: '人行横道' },
  { value: 'general_road', label: '一般路段' },
  { value: 'highway', label: '高速公路' },
];

// 交叉口几何形状类型
const INTERSECTION_TYPES = [
  { value: '十字交叉口', label: '十字交叉口', description: '四条道路垂直交汇' },
  { value: 'T型交叉口', label: 'T型交叉口', description: '一条道路终点与另一条垂直相交' },
  { value: 'Y型交叉口', label: 'Y型交叉口', description: '三条道路呈Y形分布' },
  { value: '环形交叉口', label: '环形交叉口（环岛）', description: '车辆绕中心岛逆时针行驶' },
  { value: 'X型交叉口', label: 'X型交叉口', description: '四条道路斜向交叉' },
  { value: '多肢交叉口', label: '多肢交叉口', description: '五条或以上道路交汇' },
];

const ROAD_GRADES = [
  { value: '高速公路', label: '高速公路', speedRange: '60-120 km/h' },
  { value: '一级公路', label: '一级公路', speedRange: '60-100 km/h' },
  { value: '二级公路', label: '二级公路', speedRange: '40-80 km/h' },
  { value: '三级公路', label: '三级公路', speedRange: '30-60 km/h' },
  { value: '四级公路', label: '四级公路', speedRange: '20-40 km/h' },
  { value: '未知', label: '未明确', speedRange: '根据道路确定' },
];

const VEHICLE_STATES = [
  { value: 'going_straight', label: '直行' },
  { value: 'turning_left', label: '左转弯' },
  { value: 'turning_right', label: '右转弯' },
  { value: 'changing_lane', label: '变更车道' },
  { value: 'overtaking', label: '超车' },
  { value: 'stopped', label: '停车等待' },
  { value: 'parked', label: '停放' },
  { value: 'reversing', label: '倒车' },
  { value: 'u_turn', label: '掉头' },
];

const SIGNAL_STATES = [
  { value: 'green', label: '绿灯' },
  { value: 'yellow', label: '黄灯' },
  { value: 'red', label: '红灯' },
  { value: 'no_signal', label: '无信号灯' },
];

// 行驶方向选项
const DIRECTION_OPTIONS = [
  { value: '南北', label: '南北（由南向北）' },
  { value: '北南', label: '北南（由北向南）' },
  { value: '东西', label: '东西（由东向西）' },
  { value: '西东', label: '西东（由西向东）' },
  { value: '', label: '未明确' },
];

// 停车等待原因
const STOP_REASONS = [
  { value: '红灯', label: '红灯等待' },
  { value: '让行', label: '让行其他车辆/行人' },
  { value: '拥堵', label: '交通拥堵' },
  { value: '故障', label: '车辆故障' },
  { value: '', label: '未明确' },
];

// 相对位置
const RELATIVE_POSITIONS = [
  { value: '左侧', label: '在对方左侧' },
  { value: '右侧', label: '在对方右侧' },
  { value: '对面', label: '在对向' },
  { value: '', label: '未明确' },
];

// 转弯意图
const TURNING_INTENTIONS = [
  { value: 'left', label: '左转' },
  { value: 'right', label: '右转' },
  { value: '', label: '未明确' },
];

// 非机动车通行方式（人行横道场景）
const CROSSING_METHODS = [
  { value: 'walking', label: '推行（下车推过）' },
  { value: 'riding', label: '骑行（车上通过）' },
  { value: '', label: '请选择通行方式' },
];

const VIOLATIONS = [
  '闯红灯',
  '超速行驶',
  '逆向行驶',
  '酒驾',
  '醉驾',
  '未保持安全距离',
  '未让行',
  '违法变道',
  '违法超车',
  '未打转向灯',
  '未减速慢行',
  '追尾',
  '妨碍通行',
];

const ROAD_CONDITIONS = [
  { value: 'dry', label: '干燥' },
  { value: 'wet', label: '潮湿' },
  { value: 'icy', label: '结冰' },
  { value: 'under_construction', label: '施工' },
];

const WEATHER_CONDITIONS = [
  { value: 'clear', label: '晴朗' },
  { value: 'rainy', label: '雨天' },
  { value: 'foggy', label: '雾天' },
  { value: 'snowy', label: '雪天' },
  { value: 'night', label: '夜间' },
];

// ========== 示例案例 ==========

const SAMPLE_CASES = [
  {
    title: '案例1：追尾事故',
    description: 'A车直行时与前方B车发生追尾碰撞',
    scenario: {
      parties: [
        { id: 'A', type: 'motor_vehicle', vehicleState: 'going_straight', violations: ['未保持安全距离'], signalStatus: 'green', direction: '南北' },
        { id: 'B', type: 'motor_vehicle', vehicleState: 'stopped', violations: [], signalStatus: 'green', location: '等红灯', direction: '南北', stopReason: '红灯' },
      ],
      roadType: 'intersection_with_signal',
      intersectionType: '十字交叉口',
      roadCondition: 'dry',
      weather: 'clear',
      roadGrade: '二级公路',
    },
  },
  {
    title: '案例2：转弯未让直行',
    description: 'A车左转弯时与B车直行发生碰撞',
    scenario: {
      parties: [
        { id: 'A', type: 'motor_vehicle', vehicleState: 'turning_left', violations: ['未让行'], signalStatus: 'green', direction: '西东', turningIntention: 'left', relativePosition: '左侧' },
        { id: 'B', type: 'motor_vehicle', vehicleState: 'going_straight', violations: [], signalStatus: 'green', direction: '南北' },
      ],
      roadType: 'intersection_with_signal',
      intersectionType: '十字交叉口',
      roadCondition: 'dry',
      weather: 'clear',
      roadGrade: '一级公路',
    },
  },
  {
    title: '案例3：人行横道事故（行人）',
    description: 'A车通过人行横道时与行人B发生碰撞',
    scenario: {
      parties: [
        { id: 'A', type: 'motor_vehicle', vehicleState: 'going_straight', violations: ['未让行'], direction: '东西' },
        { id: 'B', type: 'pedestrian', vehicleState: 'going_straight', violations: [] },
      ],
      roadType: 'zebra_crossing',
      roadCondition: 'dry',
      weather: 'clear',
      roadGrade: '二级公路',
    },
  },
  {
    title: '案例4：人行横道事故（非机动车）',
    description: 'A车通过人行横道时与骑行电动车的B发生碰撞',
    scenario: {
      parties: [
        { id: 'A', type: 'motor_vehicle', vehicleState: 'going_straight', violations: ['未让行'], direction: '东西' },
        { id: 'B', type: 'non_motor_vehicle', vehicleState: 'going_straight', violations: [], crossingMethod: 'riding' },
      ],
      roadType: 'zebra_crossing',
      roadCondition: 'dry',
      weather: 'clear',
      roadGrade: '二级公路',
    },
  },
  {
    title: '案例5：闯红灯事故',
    description: 'A车闯红灯与B车绿灯通行时发生碰撞',
    scenario: {
      parties: [
        { id: 'A', type: 'motor_vehicle', vehicleState: 'going_straight', violations: ['闯红灯'], signalStatus: 'red', direction: '南北' },
        { id: 'B', type: 'motor_vehicle', vehicleState: 'going_straight', violations: [], signalStatus: 'green', direction: '东西' },
      ],
      roadType: 'intersection_with_signal',
      intersectionType: '十字交叉口',
      roadCondition: 'dry',
      weather: 'clear',
      roadGrade: '一级公路',
    },
  },
  {
    title: '案例6：变更车道事故',
    description: 'A车变更车道时与B车发生碰撞',
    scenario: {
      parties: [
        { id: 'A', type: 'motor_vehicle', vehicleState: 'changing_lane', violations: ['违法变道'], direction: '南北' },
        { id: 'B', type: 'motor_vehicle', vehicleState: 'going_straight', violations: [], direction: '南北' },
      ],
      roadType: 'general_road',
      roadCondition: 'dry',
      weather: 'clear',
      roadGrade: '二级公路',
    },
  },
  {
    title: '案例6：高速公路事故',
    description: 'A车在高速公路行驶时超速与B车发生追尾',
    scenario: {
      parties: [
        { id: 'A', type: 'motor_vehicle', vehicleState: 'going_straight', violations: ['超速行驶', '未保持安全距离'] },
        { id: 'B', type: 'motor_vehicle', vehicleState: 'stopped', violations: [], location: '前方拥堵停车' },
      ],
      roadType: 'highway',
      roadCondition: 'dry',
      weather: 'clear',
      roadGrade: '高速公路',
      speedLimit: 120,
      actualSpeed: 140,
    },
  },
];

// ========== 组件 ==========

export default function HomePage() {
  // 状态
  const [activeTab, setActiveTab] = useState('analyze');
  const [scenario, setScenario] = useState<AccidentScenario>({
    parties: [
      { id: 'A', type: 'motor_vehicle', vehicleState: 'going_straight', violations: [], direction: '' },
      { id: 'B', type: 'motor_vehicle', vehicleState: 'stopped', violations: [], direction: '' },
    ],
    roadType: 'intersection_with_signal',
    roadCondition: 'dry',
    weather: 'clear',
    roadGrade: '二级公路',
    intersectionType: '十字交叉口',
  });
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisSteps, setAnalysisSteps] = useState<AnalysisStep[]>([]);
  const [regulations, setRegulations] = useState<Regulation[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [learningPoints, setLearningPoints] = useState<string[]>([]);
  const [currentPhase, setCurrentPhase] = useState('');
  const [disclaimer, setDisclaimer] = useState('');
  const [directionValidation, setDirectionValidation] = useState<DirectionValidation | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<Regulation[]>([]);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [showVisualization, setShowVisualization] = useState(false);
  const [visualizationHTML, setVisualizationHTML] = useState('');
  const [roadGradeDescription, setRoadGradeDescription] = useState('');

  const analysisRef = useRef<HTMLDivElement>(null);

  // 更新道路等级描述
  const updateRoadGradeDescription = (grade: string) => {
    const gradeMap: Record<string, string> = {
      '高速公路': '专供汽车分方向分车道行驶、全部控制出入，设计速度80-120km/h',
      '一级公路': '供汽车分方向分车道行驶、部分控制出入，设计速度60-100km/h',
      '二级公路': '双向两车道、不设中央分隔带，设计速度40-80km/h',
      '三级公路': '双车道、通行能力较低，设计速度30-60km/h',
      '四级公路': '单车道或双车道、通行能力最低，设计速度20-40km/h',
    };
    setRoadGradeDescription(gradeMap[grade] || '');
  };

  // 更新当事方
  const updateParty = (index: number, field: string, value: string | string[]) => {
    const newParties = scenario.parties.map((party, i) => {
      if (i !== index) return party;
      return { ...party, [field]: value } as AccidentParty;
    });
    setScenario({ ...scenario, parties: newParties });
  };

  // 添加当事方
  const addParty = () => {
    const newId = String.fromCharCode(65 + scenario.parties.length);
    setScenario({
      ...scenario,
      parties: [...scenario.parties, { id: newId, type: 'motor_vehicle', vehicleState: 'going_straight', violations: [] }],
    });
  };

  // 移除当事方
  const removeParty = (index: number) => {
    if (scenario.parties.length <= 2) return;
    const newParties = scenario.parties.filter((_, i) => i !== index);
    setScenario({ ...scenario, parties: newParties });
  };

  // 加载示例案例
  const loadSampleCase = (sample: typeof SAMPLE_CASES[0]) => {
    const parties = sample.scenario.parties.map(p => ({
      ...p,
      type: p.type as 'motor_vehicle' | 'non_motor_vehicle' | 'pedestrian',
      vehicleState: p.vehicleState as string,
    }));
    setScenario({ ...sample.scenario, parties });
  };

  // 提交分析
  const submitAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisSteps([]);
    setRegulations([]);
    setLiabilities([]);
    setLearningPoints([]);
    setDisclaimer('');
    setDirectionValidation(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario }),
      });

      if (!response.ok) {
        throw new Error('分析请求失败');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('无法读取响应流');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            const eventType = line.slice(7).trim();
            continue;
          }
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (!data) continue;

            try {
              const parsed = JSON.parse(data);
              
              // 处理方向验证结果
              if (parsed.directionValidation) {
                setDirectionValidation(parsed.directionValidation);
              }
              
              if (parsed.phase) {
                setCurrentPhase(parsed.phase);
              }
              if (parsed.title && parsed.phase) {
                setCurrentPhase(parsed.title);
              }
              if (parsed.step) {
                setAnalysisSteps(prev => {
                  const existing = prev.find(s => s.step === parsed.step);
                  if (existing) {
                    return prev.map(s => s.step === parsed.step ? { ...s, ...parsed, complete: true } : s);
                  }
                  return [...prev, { ...parsed, complete: parsed.complete || false }];
                });
              }
              if (parsed.title && parsed.article) {
                setRegulations(prev => [...prev, parsed]);
              }
              if (parsed.partyId && parsed.faultLevel) {
                setLiabilities(prev => [...prev, parsed]);
              }
              if (typeof parsed === 'string' && !parsed.includes('{')) {
                setLearningPoints(prev => [...prev, parsed]);
              }
            } catch {
              // 非JSON数据，可能是纯文本
              if (data.includes('本助手为教学辅助工具')) {
                setDisclaimer(data);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('分析错误:', error);
    } finally {
      setIsAnalyzing(false);
      setCurrentPhase('');
      // 滚动到分析结果
      setTimeout(() => {
        analysisRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  // 生成可视化示意图
  const generateVisualization = async () => {
    try {
      const response = await fetch('/api/analyze/visualization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario }),
      });
      const data = await response.json();
      if (data.html) {
        setVisualizationHTML(data.html);
        setShowVisualization(true);
      }
    } catch (error) {
      console.error('生成可视化失败:', error);
    }
  };

  // 下载可视化HTML文件
  const downloadVisualization = () => {
    if (!visualizationHTML) return;
    
    const blob = new Blob([visualizationHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `交通事故示意图_${Date.now()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 搜索法规
  const searchRegulations = useCallback(async () => {
    if (!searchKeyword.trim()) return;
    
    try {
      const response = await fetch(`/api/regulations?action=search&keyword=${encodeURIComponent(searchKeyword)}`);
      const data = await response.json();
      setSearchResults(data.regulations || []);
    } catch (error) {
      console.error('搜索失败:', error);
    }
  }, [searchKeyword]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchKeyword) searchRegulations();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchKeyword, searchRegulations]);

  // 获取责任等级显示
  const getFaultLevelDisplay = (level: string) => {
    switch (level) {
      case 'full_fault': return { text: '全部责任', color: 'bg-red-500', textColor: 'text-red-600' };
      case 'primary_fault': return { text: '主要责任', color: 'bg-orange-500', textColor: 'text-orange-600' };
      case 'equal_fault': return { text: '同等责任', color: 'bg-yellow-500', textColor: 'text-yellow-600' };
      case 'secondary_fault': return { text: '次要责任', color: 'bg-blue-500', textColor: 'text-blue-600' };
      case 'no_fault': return { text: '无责任', color: 'bg-green-500', textColor: 'text-green-600' };
      default: return { text: '待定', color: 'bg-gray-500', textColor: 'text-gray-600' };
    }
  };

  // 获取当事方图标
  const getPartyIcon = (type: string) => {
    switch (type) {
      case 'motor_vehicle': return <Car className="w-5 h-5" />;
      case 'non_motor_vehicle': return <CircleDot className="w-5 h-5" />;
      case 'pedestrian': return <Footprints className="w-5 h-5" />;
      default: return <Users className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-slate-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                <Scale className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">交管法规案例推演助手</h1>
                <p className="text-xs text-slate-500">中国人民公安大学 · 交通管理工程专业</p>
              </div>
            </div>
            <Badge variant="outline" className="hidden sm:flex">
              <Shield className="w-3 h-3 mr-1" />
              教学辅助工具
            </Badge>
          </div>
        </div>
      </header>

      {/* 免责声明 */}
      {showDisclaimer && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-amber-800">
                  <strong>免责声明：</strong>本助手为教学辅助工具，其分析和结论仅用于学习参考，不具备任何法律效力。最终责任认定请以交管部门正式出具的事故认定书为准。
                </p>
              </div>
              <button 
                onClick={() => setShowDisclaimer(false)}
                className="text-amber-600 hover:text-amber-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 主内容 */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="analyze" className="gap-2">
              <FileText className="w-4 h-4" />
              案例分析
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="gap-2">
              <BookOpen className="w-4 h-4" />
              法规知识库
            </TabsTrigger>
          </TabsList>

          {/* 案例分析标签页 */}
          <TabsContent value="analyze" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* 左侧：案例输入 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-600" />
                    事故场景描述
                  </CardTitle>
                  <CardDescription>
                    请详细描述交通事故的各方当事人和事故经过
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* 道路与环境 */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-slate-700">道路与环境条件</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">道路类型</label>
                        <select
                          value={scenario.roadType}
                          onChange={(e) => setScenario({ ...scenario, roadType: e.target.value })}
                          className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm"
                        >
                          {ROAD_TYPES.map((type) => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                      </div>
                      {/* 交叉口类型选择 - 仅交叉路口时显示 */}
                      {(scenario.roadType === 'intersection_with_signal' || scenario.roadType === 'intersection_without_signal') && (
                        <div>
                          <label className="text-xs text-slate-500 mb-1 block">交叉口几何类型</label>
                          <select
                            value={scenario.intersectionType || '十字交叉口'}
                            onChange={(e) => setScenario({ ...scenario, intersectionType: e.target.value })}
                            className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm"
                          >
                            {INTERSECTION_TYPES.map((type) => (
                              <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">公路技术等级</label>
                        <select
                          value={scenario.roadGrade || '二级公路'}
                          onChange={(e) => {
                            setScenario({ ...scenario, roadGrade: e.target.value });
                            updateRoadGradeDescription(e.target.value);
                          }}
                          className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm"
                        >
                          {ROAD_GRADES.map((grade) => (
                            <option key={grade.value} value={grade.value}>{grade.label}</option>
                          ))}
                        </select>
                      </div>
                      {roadGradeDescription && (
                        <div className="col-span-2 text-xs text-slate-500 bg-slate-50 p-2 rounded">
                          {roadGradeDescription}
                        </div>
                      )}
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">路面状况</label>
                        <select
                          value={scenario.roadCondition}
                          onChange={(e) => setScenario({ ...scenario, roadCondition: e.target.value })}
                          className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm"
                        >
                          {ROAD_CONDITIONS.map((cond) => (
                            <option key={cond.value} value={cond.value}>{cond.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">天气状况</label>
                        <select
                          value={scenario.weather}
                          onChange={(e) => setScenario({ ...scenario, weather: e.target.value })}
                          className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm"
                        >
                          {WEATHER_CONDITIONS.map((weather) => (
                            <option key={weather.value} value={weather.value}>{weather.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">限速(km/h)</label>
                        <Input
                          type="number"
                          placeholder="如：60"
                          value={scenario.speedLimit || ''}
                          onChange={(e) => setScenario({ ...scenario, speedLimit: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">实际速度(km/h)</label>
                        <Input
                          type="number"
                          placeholder="如：80"
                          value={scenario.actualSpeed || ''}
                          onChange={(e) => setScenario({ ...scenario, actualSpeed: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* 当事方 */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-slate-700">事故当事方</h3>
                      <Button variant="outline" size="sm" onClick={addParty} disabled={scenario.parties.length >= 4}>
                        添加当事方
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      {scenario.parties.map((party, index) => (
                        <div key={party.id} className="p-4 rounded-lg border border-slate-200 bg-slate-50/50">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-medium">
                                {party.id}
                              </span>
                              <span className="text-sm font-medium text-slate-700">
                                当事方 {party.id}
                              </span>
                            </div>
                            {scenario.parties.length > 2 && (
                              <button
                                onClick={() => removeParty(index)}
                                className="text-slate-400 hover:text-red-500"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-slate-500 mb-1 block">主体类型</label>
                              <select
                                value={party.type}
                                onChange={(e) => updateParty(index, 'type', e.target.value)}
                                className="w-full h-9 px-2 rounded-md border border-slate-200 bg-white text-xs"
                              >
                                <option value="motor_vehicle">机动车</option>
                                <option value="non_motor_vehicle">非机动车</option>
                                <option value="pedestrian">行人</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-xs text-slate-500 mb-1 block">行驶状态</label>
                              <select
                                value={party.vehicleState}
                                onChange={(e) => updateParty(index, 'vehicleState', e.target.value)}
                                className="w-full h-9 px-2 rounded-md border border-slate-200 bg-white text-xs"
                              >
                                {VEHICLE_STATES.map((state) => (
                                  <option key={state.value} value={state.value}>{state.label}</option>
                                ))}
                              </select>
                            </div>
                            {/* 行驶方向 - 交叉路口时显示 */}
                            {(scenario.roadType === 'intersection_with_signal' || scenario.roadType === 'intersection_without_signal') && (
                              <div>
                                <label className="text-xs text-slate-500 mb-1 block">
                                  行驶方向 <span className="text-red-500">*</span>
                                </label>
                                <select
                                  value={party.direction || ''}
                                  onChange={(e) => updateParty(index, 'direction', e.target.value)}
                                  className="w-full h-9 px-2 rounded-md border border-slate-200 bg-white text-xs"
                                >
                                  {DIRECTION_OPTIONS.map((dir) => (
                                    <option key={dir.value} value={dir.value}>{dir.label}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                            {/* 转弯意图 - 当行驶状态是左转或右转时显示 */}
                            {(party.vehicleState === 'turning_left' || party.vehicleState === 'turning_right') && (
                              <div>
                                <label className="text-xs text-slate-500 mb-1 block">
                                  转弯方向 <span className="text-red-500">*</span>
                                </label>
                                <select
                                  value={party.turningIntention || ''}
                                  onChange={(e) => updateParty(index, 'turningIntention', e.target.value)}
                                  className="w-full h-9 px-2 rounded-md border border-slate-200 bg-white text-xs"
                                >
                                  {TURNING_INTENTIONS.map((t) => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                            {(party.type === 'motor_vehicle' || party.type === 'non_motor_vehicle') && (
                              <div>
                                <label className="text-xs text-slate-500 mb-1 block">信号状态</label>
                                <select
                                  value={party.signalStatus || ''}
                                  onChange={(e) => updateParty(index, 'signalStatus', e.target.value)}
                                  className="w-full h-9 px-2 rounded-md border border-slate-200 bg-white text-xs"
                                >
                                  <option value="">不适用</option>
                                  {SIGNAL_STATES.map((signal) => (
                                    <option key={signal.value} value={signal.value}>{signal.label}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                            {/* 停车等待原因 */}
                            {party.vehicleState === 'stopped' && (
                              <div>
                                <label className="text-xs text-slate-500 mb-1 block">
                                  停车原因 <span className="text-red-500">*</span>
                                </label>
                                <select
                                  value={party.stopReason || ''}
                                  onChange={(e) => updateParty(index, 'stopReason', e.target.value)}
                                  className="w-full h-9 px-2 rounded-md border border-slate-200 bg-white text-xs"
                                >
                                  {STOP_REASONS.map((reason) => (
                                    <option key={reason.value} value={reason.value}>{reason.label}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                            {/* 相对位置 - 交叉路口时第一辆车显示 */}
                            {index === 0 && (scenario.roadType === 'intersection_with_signal' || scenario.roadType === 'intersection_without_signal') && (
                              <div>
                                <label className="text-xs text-slate-500 mb-1 block">
                                  A车与B车相对位置
                                </label>
                                <select
                                  value={party.relativePosition || ''}
                                  onChange={(e) => updateParty(index, 'relativePosition', e.target.value)}
                                  className="w-full h-9 px-2 rounded-md border border-slate-200 bg-white text-xs"
                                >
                                  {RELATIVE_POSITIONS.map((pos) => (
                                    <option key={pos.value} value={pos.value}>{pos.label}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                            {/* 非机动车通行方式 - 人行横道场景 */}
                            {scenario.roadType === 'zebra_crossing' && party.type === 'non_motor_vehicle' && (
                              <div>
                                <label className="text-xs text-slate-500 mb-1 block">
                                  通行方式 <span className="text-red-500">*</span>
                                </label>
                                <select
                                  value={(party as { crossingMethod?: string }).crossingMethod || ''}
                                  onChange={(e) => updateParty(index, 'crossingMethod', e.target.value)}
                                  className="w-full h-9 px-2 rounded-md border border-slate-200 bg-white text-xs"
                                >
                                  {CROSSING_METHODS.map((method) => (
                                    <option key={method.value} value={method.value}>{method.label}</option>
                                  ))}
                                </select>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  推行=无责；骑行=次责(30%)
                                </p>
                              </div>
                            )}
                            <div>
                              <label className="text-xs text-slate-500 mb-1 block">违规行为</label>
                              <div className="relative">
                                <select
                                  value={party.violations[0] || ''}
                                  onChange={(e) => updateParty(index, 'violations', e.target.value ? [e.target.value] : [])}
                                  className="w-full h-9 px-2 rounded-md border border-slate-200 bg-white text-xs"
                                >
                                  <option value="">无违规</option>
                                  {VIOLATIONS.map((v) => (
                                    <option key={v} value={v}>{v}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* 示例案例 */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-slate-700">快速加载示例</h3>
                    <div className="flex flex-wrap gap-2">
                      {SAMPLE_CASES.map((sample) => (
                        <Button
                          key={sample.title}
                          variant="outline"
                          size="sm"
                          onClick={() => loadSampleCase(sample)}
                          className="text-xs"
                        >
                          {sample.title}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Button 
                    onClick={submitAnalysis} 
                    disabled={isAnalyzing}
                    className="w-full"
                    size="lg"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        分析中...
                      </>
                    ) : (
                      <>
                        <Gavel className="w-4 h-4 mr-2" />
                        开始分析
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* 右侧：分析结果 */}
              <div ref={analysisRef} className="space-y-6">
                {/* 分析状态 */}
                {isAnalyzing && (
                  <Card className="border-blue-200 bg-blue-50/50">
                    <CardContent className="py-8">
                      <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                        <div className="text-center">
                          <p className="font-medium text-blue-900">{currentPhase || '正在分析...'}</p>
                          <p className="text-sm text-blue-600 mt-1">依据法规进行逻辑推演</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 分析步骤 */}
                {analysisSteps.length > 0 && (
                  <div className="space-y-4">
                    {/* 进度指示 */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                      {['法规检索', '事实分析', '逻辑推演', '责任认定'].map((phase, i) => {
                        const step = analysisSteps.find(s => s.phase === phase);
                        return (
                          <div key={phase} className="flex items-center gap-2">
                            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs whitespace-nowrap ${
                              step?.complete 
                                ? 'bg-green-100 text-green-700' 
                                : step 
                                  ? 'bg-blue-100 text-blue-700' 
                                  : 'bg-slate-100 text-slate-500'
                            }`}>
                              {step?.complete ? (
                                <CheckCircle2 className="w-3 h-3" />
                              ) : i === analysisSteps.length ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : null}
                              {phase}
                            </div>
                            {i < 3 && <ChevronRight className="w-3 h-3 text-slate-300" />}
                          </div>
                        );
                      })}
                    </div>

                    {/* 适用法规 */}
                    {regulations.length > 0 && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-blue-600" />
                            适用法规条款
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {regulations.map((reg, i) => (
                            <div key={i} className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                              <div className="flex items-start gap-2">
                                <Badge variant="outline" className="shrink-0 text-xs">
                                  {reg.article}
                                </Badge>
                                <div>
                                  <p className="text-xs text-slate-500 mb-1">{reg.title}</p>
                                  <p className="text-sm text-slate-700">{reg.content}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}

                    {/* 方向信息确认提示 */}
                    {directionValidation && !directionValidation.isValid && (
                      <Card className="border-amber-300 bg-amber-50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2 text-amber-800">
                            <AlertTriangle className="w-5 h-5" />
                            请补充方向信息
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="text-sm text-amber-700">
                            <p className="mb-3">为确保交叉路口事故分析的准确性，请补充以下信息：</p>
                            <ul className="list-disc list-inside space-y-2">
                              {directionValidation.questions.map((q, i) => (
                                <li key={i}>{q}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-amber-200">
                            <p className="text-xs text-amber-600">
                              <strong>提示：</strong>返回上方表单，勾选「交叉路口」道路类型后，当事方区域将显示行驶方向、停车原因等必填字段。
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* 分析步骤详情 */}
                    {analysisSteps.map((step) => (
                      <Card key={step.step}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                              step.phase === '第一步：事实要素提取' ? 'bg-cyan-100 text-cyan-700' :
                              step.phase === '第二步：法律检索与匹配' ? 'bg-purple-100 text-purple-700' :
                              step.phase === '第三步：逻辑推演链' ? 'bg-amber-100 text-amber-700' :
                              step.phase === '第四步：责任结论' ? 'bg-green-100 text-green-700' :
                              step.phase === '法规检索' ? 'bg-purple-100 text-purple-700' :
                              step.phase === '事实分析' ? 'bg-blue-100 text-blue-700' :
                              step.phase === '逻辑推演' ? 'bg-amber-100 text-amber-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {step.step}
                            </div>
                            <CardTitle className="text-base">{step.title}</CardTitle>
                            {step.complete && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <pre className="text-sm text-slate-600 whitespace-pre-wrap font-sans leading-relaxed">
                            {step.content}
                          </pre>
                        </CardContent>
                      </Card>
                    ))}

                    {/* 责任认定结果 */}
                    {liabilities.length > 0 && (
                      <Card className="border-green-200">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Scale className="w-4 h-4 text-green-600" />
                            责任认定参考
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {liabilities.map((liability) => {
                            const display = getFaultLevelDisplay(liability.faultLevel);
                            return (
                              <div key={liability.partyId} className="p-4 rounded-lg border border-slate-200">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-xs flex items-center justify-center font-medium">
                                      {liability.partyId}
                                    </span>
                                    <span className="font-medium text-slate-700">当事方 {liability.partyId}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-sm font-medium ${display.textColor}`}>{display.text}</span>
                                    <Badge style={{ backgroundColor: display.color }} className="text-white">
                                      {liability.faultPercentage}%
                                    </Badge>
                                  </div>
                                </div>
                                <p className="text-sm text-slate-600">{liability.reason}</p>
                              </div>
                            );
                          })}
                        </CardContent>
                      </Card>
                    )}

                    {/* 可视化示意图 */}
                    {analysisSteps.length > 0 && liabilities.length > 0 && (
                      <Card className="border-purple-200">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                              </svg>
                              事故现场示意图
                            </CardTitle>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={generateVisualization}
                                className="text-xs"
                              >
                                生成示意图
                              </Button>
                              {visualizationHTML && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={downloadVisualization}
                                  className="text-xs"
                                >
                                  下载HTML
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {showVisualization && visualizationHTML ? (
                            <div className="space-y-4">
                              <div dangerouslySetInnerHTML={{ __html: visualizationHTML }} className="border rounded-lg p-4 bg-white" />
                              <p className="text-xs text-slate-500 text-center">
                                上方为自动生成的事故现场示意图，可保存为HTML文件在浏览器中打开
                              </p>
                            </div>
                          ) : (
                            <div className="text-center py-8 text-slate-500">
                              <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <p className="text-sm">点击「生成示意图」查看事故现场可视化</p>
                              <p className="text-xs mt-1">示意图包含道路、车辆位置、行驶方向和碰撞点</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* 学习要点 */}
                    {learningPoints.length > 0 && (
                      <Card className="border-amber-200 bg-amber-50/30">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Lightbulb className="w-4 h-4 text-amber-600" />
                            学习要点
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {learningPoints.map((point, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                                <ChevronRight className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                                {point}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                    {/* 免责声明 */}
                    {disclaimer && (
                      <Card className="border-slate-300 bg-slate-50">
                        <CardContent className="py-4">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-slate-500 mt-0.5 shrink-0" />
                            <p className="text-sm text-slate-600">{disclaimer}</p>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* 空白状态 */}
                {!isAnalyzing && analysisSteps.length === 0 && (
                  <Card className="border-dashed">
                    <CardContent className="py-16">
                      <div className="flex flex-col items-center gap-4 text-center">
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                          <Scale className="w-8 h-8 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-slate-600 font-medium">等待输入事故场景</p>
                          <p className="text-sm text-slate-400 mt-1">
                            请在左侧填写事故信息，或选择一个示例案例
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* 法规知识库标签页 */}
          <TabsContent value="knowledge" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  交管法规知识库
                </CardTitle>
                <CardDescription>
                  收录《道路交通安全法》及其实施条例核心条款，支持关键词检索
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 搜索框 */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="搜索法规条款..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* 搜索结果或全部法规 */}
                {searchKeyword ? (
                  <div className="space-y-3">
                    <p className="text-sm text-slate-500">搜索结果：{searchResults.length} 条</p>
                    {searchResults.map((reg, i) => (
                      <div key={i} className="p-4 rounded-lg border border-slate-200">
                        <div className="flex items-start gap-2 mb-2">
                          <Badge variant="outline">{reg.article}</Badge>
                          <span className="text-sm font-medium text-slate-700">{reg.title}</span>
                        </div>
                        <p className="text-sm text-slate-600">{reg.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="signal">
                      <AccordionTrigger>信号灯与通行规定</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pt-2">
                          <div className="p-3 rounded-lg bg-slate-50">
                            <Badge variant="outline" className="mb-2">道路交通安全法 第三十八条</Badge>
                            <p className="text-sm text-slate-600">车辆、行人应当按照交通信号通行；遇有交通警察现场指挥时，应当按照交通警察的指挥通行；在没有交通信号的道路上，应当在确保安全、畅通的原则下通行。</p>
                          </div>
                          <div className="p-3 rounded-lg bg-slate-50">
                            <Badge variant="outline" className="mb-2">实施条例 第三十八条</Badge>
                            <p className="text-sm text-slate-600">机动车信号灯表示：绿灯亮时，准许车辆通行；黄灯亮时，已越过停止线的车辆可以继续通行；红灯亮时，禁止车辆通行。</p>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="intersection">
                      <AccordionTrigger>路口通行规则</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pt-2">
                          <div className="p-3 rounded-lg bg-slate-50">
                            <Badge variant="outline" className="mb-2">实施条例 第五十二条</Badge>
                            <p className="text-sm text-slate-600">机动车通过没有交通信号灯控制也没有交通警察指挥的交叉路口，应当：（一）有交通标志标线控制的，让优先通行方先行；（二）无标志标线的，停车瞭望，让右方来车先行；（三）转弯让直行。</p>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="pedestrian">
                      <AccordionTrigger>行人保护规定</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pt-2">
                          <div className="p-3 rounded-lg bg-slate-50">
                            <Badge variant="outline" className="mb-2">道路交通安全法 第四十七条</Badge>
                            <p className="text-sm text-slate-600">机动车行经人行横道时，应当减速行驶；遇行人正在通过人行横道，应当停车让行。机动车行经没有交通信号的道路时，遇行人横过道路，应当避让。</p>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="lane">
                      <AccordionTrigger>变更车道与超车</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pt-2">
                          <div className="p-3 rounded-lg bg-slate-50">
                            <Badge variant="outline" className="mb-2">道路交通安全法 第四十三条</Badge>
                            <p className="text-sm text-slate-600">同车道行驶的机动车，后车应当与前车保持足以采取紧急制动措施的安全距离。不得超车的情况包括：前车正在左转弯、掉头或超车的；与对面来车有会车可能的等。</p>
                          </div>
                          <div className="p-3 rounded-lg bg-slate-50">
                            <Badge variant="outline" className="mb-2">实施条例 第四十四条</Badge>
                            <p className="text-sm text-slate-600">变更车道的机动车不得影响相关车道内行驶的机动车的正常行驶。</p>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="liability">
                      <AccordionTrigger>事故责任认定</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pt-2">
                          <div className="p-3 rounded-lg bg-slate-50">
                            <Badge variant="outline" className="mb-2">道路交通安全法 第七十六条</Badge>
                            <p className="text-sm text-slate-600">机动车之间发生交通事故的，由有过错的一方承担赔偿责任；双方都有过错的，按照各自过错的比例分担责任。机动车与非机动车、行人之间发生交通事故的，根据过错程度适当减轻机动车一方的赔偿责任。</p>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* 页脚 */}
      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <p>中国人民公安大学 · 交通管理工程专业 · 教学辅助工具</p>
            <p>本工具仅供学习参考，不具备法律效力</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
