import { NextResponse } from 'next/server';
import { getUsuarios, saveUsuario } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { usuario, claveActual, claveNueva } = body;

    if (!usuario) {
      return NextResponse.json({ success: false, message: 'Usuario es requerido' }, { status: 400 });
    }

    const list = await getUsuarios();
    const found = list.find(u => u.usuario.toUpperCase() === usuario.trim().toUpperCase());

    if (!found) {
      return NextResponse.json({ success: false, message: 'Usuario no encontrado' }, { status: 404 });
    }

    // Verify current password
    if (found.clave !== (claveActual || '')) {
      return NextResponse.json({ success: false, message: 'La clave actual es incorrecta' }, { status: 401 });
    }

    // Update password
    await saveUsuario({
      usuario: found.usuario,
      equipo: found.equipo,
      descripcion: found.descripcion,
      clave: claveNueva || '',
      atributo: found.atributo,
      suspendido: found.suspendido
    });

    return NextResponse.json({ success: true, message: 'Clave actualizada con éxito' });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
