import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const token = cookies().get('google_token');
  console.log(token) // Extract the cookie
  return NextResponse.json({ status: 200, token: token?.value }); // Return JSON response with the token value
}


