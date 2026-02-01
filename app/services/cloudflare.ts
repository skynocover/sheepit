const API = 'https://api.cloudflare.com/client/v4';

const headers = (token: string) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
});

export const verifyToken = async (token: string) => {
  const res = await fetch(`${API}/user/tokens/verify`, {
    headers: headers(token),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cloudflare verifyToken failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as {
    success: boolean;
    result: { status: string };
  };
  if (!data.success || data.result.status !== 'active') {
    throw new Error('Cloudflare token is not active');
  }
  return data.result;
};

export interface Zone {
  id: string;
  name: string;
  status: string;
}

export const listZones = async (token: string) => {
  const res = await fetch(`${API}/zones?status=active&per_page=50`, {
    headers: headers(token),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cloudflare listZones failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as { success: boolean; result: Zone[] };
  if (!data.success) {
    throw new Error('Cloudflare listZones returned unsuccessful response');
  }
  return data.result;
};

interface CreateDnsRecordParams {
  zoneId: string;
  name: string; // e.g. "app.example.com" or "example.com"
  content?: string;
}

export const createDnsRecord = async (token: string, params: CreateDnsRecordParams) => {
  const res = await fetch(`${API}/zones/${params.zoneId}/dns_records`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify({
      type: 'CNAME',
      name: params.name,
      content: params.content || 'cname.vercel-dns.com',
      proxied: false,
      ttl: 1, // automatic
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cloudflare createDnsRecord failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as {
    success: boolean;
    result: { id: string; name: string; type: string; content: string };
  };
  if (!data.success) {
    throw new Error('Cloudflare createDnsRecord returned unsuccessful response');
  }
  return data.result;
};
