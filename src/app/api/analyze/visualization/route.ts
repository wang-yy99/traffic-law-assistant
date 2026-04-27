/**
 * 可视化示意图生成 API
 * 根据事故场景生成 HTML Canvas 可视化示意图
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateVisualizationHTML, AccidentScenario } from '@/lib/accident-analysis';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const scenario: AccidentScenario = body.scenario;

    if (!scenario || !scenario.parties || scenario.parties.length < 2) {
      return NextResponse.json({ error: '事故场景信息不完整' }, { status: 400 });
    }

    // 生成可视化 HTML
    const html = generateVisualizationHTML(scenario);

    return NextResponse.json({ html });
  } catch (error) {
    console.error('生成可视化失败:', error);
    return NextResponse.json({ error: '生成可视化示意图失败' }, { status: 500 });
  }
}
