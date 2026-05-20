import { NextRequest, NextResponse } from 'next/server';
import { generateChart } from '@/lib/ziwei/algorithm';
import type { BirthInfo } from '@/lib/ziwei/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { year, month, day, hour, gender, name, province, city, longitude } = body;

    // 必填字段存在性
    if (year == null || month == null || day == null || hour == null || !gender) {
      return NextResponse.json({ error: '缺少必填字段（year, month, day, hour, gender）' }, { status: 400 });
    }

    // 类型 + 范围校验
    if (typeof year !== 'number' || year < 1900 || year > 2100) {
      return NextResponse.json({ error: '年份无效（1900-2100）' }, { status: 400 });
    }
    if (typeof month !== 'number' || !Number.isInteger(month) || month < 1 || month > 12) {
      return NextResponse.json({ error: '月份无效（1-12）' }, { status: 400 });
    }
    if (typeof day !== 'number' || !Number.isInteger(day) || day < 1 || day > 31) {
      return NextResponse.json({ error: '日期无效（1-31）' }, { status: 400 });
    }
    if (typeof hour !== 'number' || !Number.isInteger(hour) || hour < 0 || hour > 11) {
      return NextResponse.json({ error: '时辰无效（0-11）' }, { status: 400 });
    }
    if (gender !== 'male' && gender !== 'female') {
      return NextResponse.json({ error: '性别无效（male/female）' }, { status: 400 });
    }

    const birthInfo: BirthInfo = {
      year, month, day, hour, gender,
      name: typeof name === 'string' ? name : undefined,
      province: typeof province === 'string' ? province : undefined,
      city: typeof city === 'string' ? city : undefined,
      longitude: typeof longitude === 'number' ? longitude : undefined,
    };

    const chart = generateChart(birthInfo);
    return NextResponse.json(chart);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : '命盘生成失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
