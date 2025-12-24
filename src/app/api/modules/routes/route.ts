// API endpoint to get module routes

import { NextResponse } from 'next/server';
import { moduleRegistry } from '@/core/config/moduleRegistry';

export async function GET() {
  try {
    const allRoutes = moduleRegistry.getAllRoutes();
    
    return NextResponse.json({
      success: true,
      routes: allRoutes,
    });
  } catch (error) {
    console.error('Failed to get module routes:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load routes',
      },
      { status: 500 }
    );
  }
}

