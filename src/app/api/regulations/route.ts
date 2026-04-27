/**
 * 交管法规知识库 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  trafficRegulations, 
  searchRegulations, 
  getAllCategories,
  RegulationCategory 
} from '@/lib/traffic-regulations';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const keyword = searchParams.get('keyword');
  const category = searchParams.get('category');

  // 获取所有法规
  if (!action && !keyword && !category) {
    return NextResponse.json({
      total: trafficRegulations.length,
      regulations: trafficRegulations,
      categories: getAllCategories(),
    });
  }

  // 搜索法规
  if (action === 'search' && keyword) {
    const results = searchRegulations(keyword.split(',').filter(Boolean));
    return NextResponse.json({
      total: results.length,
      keyword,
      regulations: results,
    });
  }

  // 按分类获取法规
  if (action === 'category' && category) {
    const results = trafficRegulations.filter(r => 
      r.category.includes(category as RegulationCategory)
    );
    return NextResponse.json({
      category,
      total: results.length,
      regulations: results,
    });
  }

  // 获取分类统计
  if (action === 'categories') {
    return NextResponse.json({
      categories: getAllCategories(),
    });
  }

  return NextResponse.json({
    total: trafficRegulations.length,
    regulations: trafficRegulations.slice(0, 10),
    message: '支持参数: action=search&keyword=关键词, action=category&category=分类名, action=categories',
  });
}
