const DUONG_DAN_API = '/api/VisitSessions'

async function goiApiPhien(duongDan, tuyChon = {}) {
  const coNoiDung = tuyChon.body !== undefined
  const response = await fetch(`${DUONG_DAN_API}${duongDan}`, {
    ...tuyChon,
    headers: {
      ...(coNoiDung ? { 'Content-Type': 'application/json' } : {}),
      ...tuyChon.headers,
    },
    body: coNoiDung ? JSON.stringify(tuyChon.body) : undefined,
  })
  const duLieu = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(duLieu.message || `HTTP ${response.status}`)
  }
  return duLieu
}

export function layHoacTaoMaKhach() {
  const khoaLuuTru = 'anonymousVisitorId'
  let maKhach = localStorage.getItem(khoaLuuTru)
  if (!maKhach) {
    maKhach = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `visitor-${Date.now()}-${Math.random().toString(36).slice(2)}`
    localStorage.setItem(khoaLuuTru, maKhach)
  }
  return maKhach
}

export function taoPhienTruyCap(duLieu) {
  return goiApiPhien('/start', { method: 'POST', body: duLieu })
}

export function capNhatTrangThaiGps(maPhien, trangThai) {
  return goiApiPhien(`/${encodeURIComponent(maPhien)}/gps-status`, {
    method: 'PUT', body: { status: trangThai },
  })
}

export function capNhatViTri(maPhien, toaDo) {
  return goiApiPhien(`/${encodeURIComponent(maPhien)}/gps-status`, {
    method: 'PUT',
    body: {
      status: 'granted',
      latitude: toaDo.lat,
      longitude: toaDo.lng,
    },
  })
}

export function guiHeartbeat(maPhien) {
  return goiApiPhien(`/${encodeURIComponent(maPhien)}/heartbeat`, { method: 'POST' })
}

export function ketThucPhien(maPhien) {
  return goiApiPhien(`/${encodeURIComponent(maPhien)}/end`, {
    method: 'POST',
  })
}