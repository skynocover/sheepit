const API = 'https://api.vercel.com';

const headers = (token: string) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
});

interface CreateProjectParams {
  name: string;
  framework?: string | null;
  gitRepository?: {
    type: 'github';
    repo: string; // "owner/repo"
  };
  buildCommand?: string;
  outputDirectory?: string;
}

export const createProject = async (token: string, params: CreateProjectParams) => {
  const body: Record<string, unknown> = {
    name: params.name,
  };
  if (params.framework) {
    body.framework = params.framework;
  }
  if (params.gitRepository) {
    body.gitRepository = params.gitRepository;
  }
  if (params.buildCommand) {
    body.buildCommand = params.buildCommand;
  }
  if (params.outputDirectory) {
    body.outputDirectory = params.outputDirectory;
  }

  const res = await fetch(`${API}/v10/projects`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Vercel createProject failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<{ id: string; name: string }>;
};

interface CreateDeploymentParams {
  name: string;
  gitSource: {
    type: 'github';
    org: string;
    repo: string;
    ref: string;
  };
}

export const createDeployment = async (token: string, params: CreateDeploymentParams) => {
  const res = await fetch(`${API}/v13/deployments?skipAutoDetectionConfirmation=1`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify({
      name: params.name,
      gitSource: params.gitSource,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Vercel createDeployment failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<{ id: string; url: string; readyState: string }>;
};

export const getDeployment = async (token: string, deploymentId: string) => {
  const res = await fetch(`${API}/v13/deployments/${deploymentId}`, {
    headers: headers(token),
  });
  if (!res.ok) throw new Error(`Vercel getDeployment failed: ${res.status}`);
  return res.json() as Promise<{
    id: string;
    url: string;
    readyState: string;
    alias?: string[];
  }>;
};

export const addDomain = async (token: string, projectId: string, domain: string) => {
  const res = await fetch(`${API}/v10/projects/${projectId}/domains`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify({ name: domain }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Vercel addDomain failed: ${res.status} ${text}`);
  }
  return res.json();
};

export const setEnvVars = async (
  token: string,
  projectId: string,
  envVars: Array<{ key: string; value: string }>,
) => {
  for (const { key, value } of envVars) {
    const res = await fetch(`${API}/v10/projects/${projectId}/env`, {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify({
        key,
        value,
        type: 'encrypted',
        target: ['production', 'preview', 'development'],
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Vercel setEnvVar failed for ${key}: ${res.status} ${text}`);
    }
  }
};

interface GitNamespace {
  id: string;
  name: string;
  slug: string;
  ownerType: string;
}

/** Check which GitHub accounts/orgs have the Vercel GitHub App installed */
export const getGitNamespaces = async (token: string): Promise<GitNamespace[]> => {
  const res = await fetch(`${API}/v1/integrations/git-namespaces?provider=github`, {
    headers: headers(token),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Vercel getGitNamespaces failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<GitNamespace[]>;
};

interface DomainConfigResponse {
  configuredBy: string | null;
  misconfigured: boolean;
  recommendedCNAME: { rank: number; value: string }[];
  recommendedIPv4: { rank: number; value: string }[];
}

/** Get the recommended DNS records for a domain from Vercel */
export const getDomainConfig = async (
  token: string,
  domain: string,
): Promise<DomainConfigResponse> => {
  const res = await fetch(`${API}/v6/domains/${domain}/config`, {
    headers: headers(token),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Vercel getDomainConfig failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<DomainConfigResponse>;
};
