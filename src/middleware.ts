import { NextRequest, NextResponse } from 'next/server'

export const config = {
  matcher: ['/admin/:path*'],
}

function handleAdminAuth(req: NextRequest): NextResponse | null {
  const basicAuth = req.headers.get('authorization')

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1]
    const [user, pwd] = atob(authValue).split(':')

    const validUser = process.env.BASIC_AUTH_USER || 'admin'
    const validPass = process.env.BASIC_AUTH_PASS || 'password'

    if (user === validUser && pwd === validPass) {
      return null
    }
  }

  return new NextResponse('Auth Required.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Admin Area"',
    },
  })
}

export function middleware(req: NextRequest) {
  const authResponse = handleAdminAuth(req)
  if (authResponse) return authResponse
  return NextResponse.next()
}
