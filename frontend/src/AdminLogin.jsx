
import { useState } from 'react'
import './AdminLogin.css'

function getRoleFromToken(token) {
  try {
    const payload = token.split('.')[1]
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const decoded = JSON.parse(
      decodeURIComponent(
        atob(normalized)
          .split('')
          .map((char) =>
            `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`,
          )
          .join(''),
      ),
    )

    return (
      decoded.role ||
      decoded.Role ||
      decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
      ''
    )
  } catch {
    return ''
  }
}

function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/Auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.Message ||
            'Tên đăng nhập hoặc mật khẩu không chính xác.',
        )
      }

      const token = data.token || data.Token

      if (!token) {
        throw new Error('API đăng nhập không trả về JWT.')
      }

      const role = getRoleFromToken(token)

      if (String(role).toLowerCase() !== 'admin') {
        throw new Error(
          'Tài khoản đăng nhập thành công nhưng không có quyền Admin.',
        )
      }

      sessionStorage.setItem('adminToken', token)
      window.location.replace('/admin/visits')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Không thể đăng nhập.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="admin-login-page">
      <form className="admin-login-card" onSubmit={handleSubmit}>
        <p className="admin-login-eyebrow">TOURISM MANAGEMENT</p>
        <h1>Đăng nhập quản trị</h1>
        <p className="admin-login-description">
          Sử dụng tài khoản có quyền Admin để truy cập hệ thống.
        </p>

        <label htmlFor="admin-username">Tên đăng nhập</label>
        <input
          id="admin-username"
          type="text"
          autoComplete="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="Nhập username"
          required
        />

        <label htmlFor="admin-password">Mật khẩu</label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Nhập mật khẩu"
          required
        />

        {error && (
          <div className="admin-login-error" role="alert">
            {error}
          </div>
        )}

        <button type="submit" disabled={loading}>
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>

        <button
          type="button"
          className="admin-login-back"
          onClick={() => window.location.assign('/')}
        >
          Quay lại website tham quan
        </button>
      </form>
    </main>
  )
}

export default AdminLogin
