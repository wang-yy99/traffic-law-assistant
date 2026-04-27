/**
 * 交通事故案例分析 API - 流式输出
 * 采用SSE协议，实现打字机式渲染效果
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeAccident, AccidentScenario } from '@/lib/accident-analysis';
import { Regulation } from '@/lib/traffic-regulations';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// SSE流式输出编码器
function createSSEStream() {
  const encoder = new TextEncoder();
  
  return {
    encode: (data: string) => encoder.encode(data),
    encodeEvent: (event: string, data: string, id?: number) => {
      let message = '';
      if (id !== undefined) message += `id: ${id}\n`;
      message += `event: ${event}\n`;
      message += `data: ${data}\n\n`;
      return encoder.encode(message);
    },
  };
}

// 模拟打字机式输出（分词输出）
async function* streamAnalysis(result: Awaited<ReturnType<typeof analyzeAccident>>) {
  const { steps, liabilityAllocation, learningPoints, disclaimer, directionValidation } = result;
  const encoder = createSSEStream();

  // 阶段0：方向信息验证（优先级最高）
  if (directionValidation && !directionValidation.isValid) {
    yield encoder.encodeEvent('phase', JSON.stringify({ 
      phase: '方向信息确认', 
      title: '请补充以下信息...' 
    }));
    await sleep(200);
    
    yield encoder.encodeEvent('directionValidation', JSON.stringify(directionValidation));
    await sleep(300);
    
    // 方向信息不完整时，直接返回，要求用户补充信息
    yield encoder.encodeEvent('done', '请补充方向信息后重新分析');
    return;
  }

  // 阶段1：法规检索
  yield encoder.encodeEvent('phase', JSON.stringify({ 
    phase: '法规检索', 
    title: '正在检索相关法规条款...' 
  }));
  await sleep(200);

  for (const reg of steps[0]?.regulations || []) {
    yield encoder.encodeEvent('regulation', JSON.stringify({
      title: reg.title,
      article: reg.article,
      content: reg.content,
    }));
    await sleep(150);
  }

  yield encoder.encodeEvent('step', JSON.stringify({
    step: 1,
    phase: '法规检索',
    content: steps[0].content,
    complete: true,
  }));
  await sleep(300);

  // 阶段2：事实分析
  yield encoder.encodeEvent('phase', JSON.stringify({
    phase: '事实分析',
    title: '正在分析事故事实...' 
  }));
  await sleep(200);

  yield encoder.encodeEvent('step', JSON.stringify({
    step: 2,
    phase: '事实分析',
    content: steps[1].content,
    complete: true,
  }));
  await sleep(300);

  // 阶段3：逻辑推演
  yield encoder.encodeEvent('phase', JSON.stringify({
    phase: '逻辑推演',
    title: '正在进行逻辑推演...'
  }));
  await sleep(200);

  yield encoder.encodeEvent('step', JSON.stringify({
    step: 3,
    phase: '逻辑推演',
    content: steps[2].content,
    complete: true,
  }));
  await sleep(300);

  // 阶段4：责任认定
  yield encoder.encodeEvent('phase', JSON.stringify({
    phase: '责任认定',
    title: '正在生成责任认定...'
  }));
  await sleep(200);

  yield encoder.encodeEvent('step', JSON.stringify({
    step: 4,
    phase: '责任认定',
    content: steps[3].content,
    complete: true,
  }));

  for (const liability of liabilityAllocation) {
    yield encoder.encodeEvent('liability', JSON.stringify(liability));
    await sleep(100);
  }
  await sleep(200);

  // 学习要点
  yield encoder.encodeEvent('phase', JSON.stringify({
    phase: '学习要点',
    title: '正在生成学习要点...'
  }));
  await sleep(200);

  for (const point of learningPoints) {
    yield encoder.encodeEvent('learning', point);
    await sleep(100);
  }
  await sleep(200);

  // 免责声明
  yield encoder.encodeEvent('disclaimer', disclaimer);

  // 完成
  yield encoder.encodeEvent('done', '分析完成');
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const scenario: AccidentScenario = body.scenario;

    if (!scenario || !scenario.parties || scenario.parties.length < 2) {
      return NextResponse.json(
        { error: '请提供完整的事故场景信息，至少需要两方当事人' },
        { status: 400 }
      );
    }

    // 执行分析
    const result = analyzeAccident(scenario);

    // 创建流式响应
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamAnalysis(result)) {
            controller.enqueue(chunk);
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('分析错误:', error);
    return NextResponse.json(
      { error: '分析过程中发生错误，请稍后重试' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: '交管法规案例推演助手 API',
    endpoints: {
      POST: '/api/analyze - 提交交通事故案例进行分析',
    },
    parameters: {
      scenario: {
        parties: '事故当事方数组',
        roadType: '道路类型',
        roadCondition: '路况条件',
        weather: '天气状况',
      },
    },
  });
}
