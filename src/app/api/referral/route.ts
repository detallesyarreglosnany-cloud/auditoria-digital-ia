import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/referral?code=XXX — Get referral info
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  
  if (!code) {
    return NextResponse.json({ error: 'Código de referido requerido' }, { status: 400 });
  }

  const referral = await db.referral.findUnique({
    where: { code }
  });

  if (!referral) {
    return NextResponse.json({ valid: false }, { status: 404 });
  }

  return NextResponse.json({
    valid: true,
    referrerName: referral.referrerName,
    clicks: referral.clicks,
    conversions: referral.conversions
  });
}

// POST /api/referral — Create a new referral code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { name, email, phone } = body;
    
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Nombre y email son obligatorios' },
        { status: 400 }
      );
    }

    // Check if referral already exists for this email
    const existing = await db.referral.findFirst({
      where: { referrerEmail: email }
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        code: existing.code,
        referralLink: `${process.env.NEXT_PUBLIC_SITE_URL || ''}?ref=${existing.code}`,
        message: 'Ya tienes un código de referido'
      });
    }

    // Generate unique code from name
    const baseCode = name.toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 8);
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const code = `${baseCode}${randomSuffix}`;

    const referral = await db.referral.create({
      data: {
        code,
        referrerName: name,
        referrerEmail: email,
        referrerPhone: phone || null,
      }
    });

    return NextResponse.json({
      success: true,
      code: referral.code,
      referralLink: `${process.env.NEXT_PUBLIC_SITE_URL || ''}?ref=${referral.code}`,
      message: 'Código de referido creado exitosamente'
    });

  } catch (error) {
    console.error('Referral API error:', error);
    return NextResponse.json(
      { error: 'Error al crear el código de referido' },
      { status: 500 }
    );
  }
}
