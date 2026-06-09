import { NextResponse } from 'next/server';
import { getUsuarios } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { usuario, clave } = body;

    if (!usuario) {
      return NextResponse.json({ success: false, message: 'Debe ingresar un usuario' }, { status: 400 });
    }

    const users = await getUsuarios();
    const found = users.find(u => u.usuario.toUpperCase() === usuario.trim().toUpperCase());

    if (!found) {
      return NextResponse.json({ success: false, message: 'Usuario no registrado' }, { status: 401 });
    }

    if (found.suspendido === 1) {
      return NextResponse.json({ success: false, message: 'Usuario suspendido' }, { status: 401 });
    }

    // Check password
    if (found.clave !== (clave || '')) {
      return NextResponse.json({ success: false, message: 'Contraseña incorrecta' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      usuario: found.usuario,
      atributo: found.atributo,
      equipo: found.equipo
    });
  } catch (error) {
    console.error('Error en API login:', error);
    return NextResponse.json({ success: false, message: 'Error interno de servidor' }, { status: 500 });
  }
}
