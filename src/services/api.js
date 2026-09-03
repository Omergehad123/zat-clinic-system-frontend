const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('token');
  if (token) return token;
  try {
    const session = localStorage.getItem('clinic_auth_session');
    if (session) {
      const parsed = JSON.parse(session);
      if (parsed?.state?.token) return parsed.state.token;
    }
  } catch (e) {
    // ignore parse errors
  }
  return null;
};

export const apiFetch = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('branch');
      localStorage.removeItem('clinic_auth_session');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    throw new Error('انتهت صلاحية الجلسة، يرجى إعادة تسجيل الدخول');
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'حدث خطأ أثناء تنفيذ الطلب');
    }
    return data;
  }

  if (!response.ok) {
    throw new Error('حدث خطأ في الاتصال بالخادم');
  }

  return response;
};

export const simulateDelay = (ms = 100) =>
  new Promise((resolve) => setTimeout(resolve, ms));
