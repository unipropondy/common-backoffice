export const getLoggedInUserId = () => {
  try {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    return storedUser?.UserId || localStorage.getItem('userId') || null;
  } catch {
    return localStorage.getItem('userId') || null;
  }
};

export const buildAuditPayload = (method, payload, userId = getLoggedInUserId()) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return payload;
  }

  if (!userId) {
    return payload;
  }

  const next = { ...payload };
  const now = new Date();
  const normalizedMethod = (method || '').toLowerCase();

  if (normalizedMethod === 'post') {
    next.CreatedBy = next.CreatedBy || userId;
    next.CreatedOn = next.CreatedOn || now;
    next.ModifiedBy = next.ModifiedBy || userId;
    next.ModifiedOn = next.ModifiedOn || now;
  }

  if (normalizedMethod === 'put' || normalizedMethod === 'patch') {
    next.ModifiedBy = next.ModifiedBy || userId;
    next.ModifiedOn = next.ModifiedOn || now;
  }

  return next;
};

export const applyAuditToFormData = (formData, method, userId = getLoggedInUserId()) => {
  if (!(formData instanceof FormData) || !userId) {
    return formData;
  }

  const normalizedMethod = (method || '').toLowerCase();
  const now = new Date();
  const result = new FormData();
  const keysToSkip = new Set(['CreatedBy', 'CreatedOn', 'ModifiedBy', 'ModifiedOn']);

  for (const [key, value] of formData.entries()) {
    if (!keysToSkip.has(key)) {
      result.append(key, value);
    }
  }

  if (normalizedMethod === 'post') {
    result.append('CreatedBy', formData.get('CreatedBy') || userId);
    result.append('CreatedOn', formData.get('CreatedOn') || now.toISOString());
    result.append('ModifiedBy', formData.get('ModifiedBy') || userId);
    result.append('ModifiedOn', formData.get('ModifiedOn') || now.toISOString());
  }

  if (normalizedMethod === 'put' || normalizedMethod === 'patch') {
    result.append('ModifiedBy', formData.get('ModifiedBy') || userId);
    result.append('ModifiedOn', formData.get('ModifiedOn') || now.toISOString());
  }

  return result;
};

export const withAuditHeaders = (config = {}, userId = getLoggedInUserId()) => {
  if (!userId) {
    return config;
  }

  return {
    ...config,
    headers: {
      ...(config.headers || {}),
      'x-user-id': userId,
    },
  };
};
