import { NextResponse } from 'next/server';
import { getUsuarios, saveUsuario, deleteUsuario, UsuarioDB } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const list = await getUsuarios();
    // Return users, hide password hashes or keep them empty in response
    const sanitized = list.map((u: UsuarioDB) => ({
      id: u.id,
      equipo: u.equipo,
      usuario: u.usuario,
      descripcion: u.descripcion,
      atributo: u.atributo,
      suspendido: u.suspendido === 1
    }));
    return NextResponse.json({ success: true, users: sanitized });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { equipo, usuario, descripcion, clave, atributo, suspendido } = body;

    if (!usuario) {
      return NextResponse.json({ success: false, message: 'Usuario es requerido' }, { status: 400 });
    }

    // Check if user already exists
    const list = await getUsuarios();
    if (list.some((u: UsuarioDB) => u.usuario.toUpperCase() === usuario.trim().toUpperCase())) {
      return NextResponse.json({ success: false, message: 'El usuario ya existe' }, { status: 400 });
    }

    await saveUsuario({
      equipo: equipo || 'PC-CLIENTE',
      usuario: usuario.trim(),
      descripcion: descripcion || '',
      clave: clave || '',
      atributo: atributo || 'Control Total',
      suspendido: !!suspendido
    });

    return NextResponse.json({ success: true, message: 'Usuario creado con éxito' });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { equipo, usuario, descripcion, clave, atributo, suspendido } = body;

    if (!usuario) {
      return NextResponse.json({ success: false, message: 'Usuario es requerido' }, { status: 400 });
    }

    // Check if user exists
    const list = await getUsuarios();
    const found = list.find((u: UsuarioDB) => u.usuario.toUpperCase() === usuario.trim().toUpperCase());
    if (!found) {
      return NextResponse.json({ success: false, message: 'Usuario no encontrado' }, { status: 404 });
    }

    await saveUsuario({
      equipo: equipo !== undefined ? equipo : found.equipo,
      usuario: found.usuario, // keep casing
      descripcion: descripcion !== undefined ? descripcion : found.descripcion,
      clave: clave !== undefined ? clave : undefined, // only update if provided
      atributo: atributo !== undefined ? atributo : found.atributo,
      suspendido: suspendido !== undefined ? !!suspendido : found.suspendido
    });

    return NextResponse.json({ success: true, message: 'Usuario actualizado con éxito' });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const usuario = searchParams.get('usuario');

    if (!usuario) {
      return NextResponse.json({ success: false, message: 'Usuario es requerido' }, { status: 400 });
    }

    if (usuario.toUpperCase() === 'ADMINISTRADOR') {
      return NextResponse.json({ success: false, message: 'No se puede eliminar el usuario ADMINISTRADOR' }, { status: 400 });
    }

    await deleteUsuario(usuario);
    return NextResponse.json({ success: true, message: 'Usuario eliminado con éxito' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
