const API = 'https://api.github.com';

const headers = (token: string) => ({
  Authorization: `Bearer ${token}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'SheepIt',
});

export const getUser = async (token: string) => {
  const res = await fetch(`${API}/user`, { headers: headers(token) });
  if (!res.ok) throw new Error(`GitHub getUser failed: ${res.status}`);
  return res.json() as Promise<{
    id: number;
    login: string;
    email: string | null;
    avatar_url: string;
  }>;
};

export const createRepo = async (token: string, name: string) => {
  const res = await fetch(`${API}/user/repos`, {
    method: 'POST',
    headers: { ...headers(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, private: true, auto_init: true }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub createRepo failed: ${res.status} ${body}`);
  }
  return res.json() as Promise<{
    full_name: string;
    default_branch: string;
    html_url: string;
  }>;
};

interface FileEntry {
  path: string;
  content: string; // base64 encoded
}

export const pushFiles = async (
  token: string,
  owner: string,
  repo: string,
  files: FileEntry[],
  message: string,
) => {
  const h = { ...headers(token), 'Content-Type': 'application/json' };

  // 1. Create blobs for each file
  const blobs = await Promise.all(
    files.map(async (file) => {
      const res = await fetch(`${API}/repos/${owner}/${repo}/git/blobs`, {
        method: 'POST',
        headers: h,
        body: JSON.stringify({ content: file.content, encoding: 'base64' }),
      });
      if (!res.ok) throw new Error(`GitHub createBlob failed: ${res.status}`);
      const data = (await res.json()) as { sha: string };
      return { path: file.path, sha: data.sha };
    }),
  );

  // 2. Try to get the current commit SHA, handle empty repo
  let parentSha: string | null = null;
  let baseTreeSha: string | undefined;

  try {
    const refRes = await fetch(`${API}/repos/${owner}/${repo}/git/ref/heads/main`, { headers: h });
    if (refRes.ok) {
      const refData = (await refRes.json()) as { object: { sha: string } };
      parentSha = refData.object.sha;

      const commitRes = await fetch(`${API}/repos/${owner}/${repo}/git/commits/${parentSha}`, {
        headers: h,
      });
      if (commitRes.ok) {
        const commitData = (await commitRes.json()) as {
          tree: { sha: string };
        };
        baseTreeSha = commitData.tree.sha;
      }
    }
  } catch {
    // Empty repo, no parent
  }

  // 3. Create tree
  const treePayload: Record<string, unknown> = {
    tree: blobs.map((b) => ({
      path: b.path,
      mode: '100644',
      type: 'blob',
      sha: b.sha,
    })),
  };
  if (baseTreeSha) {
    treePayload.base_tree = baseTreeSha;
  }

  const treeRes = await fetch(`${API}/repos/${owner}/${repo}/git/trees`, {
    method: 'POST',
    headers: h,
    body: JSON.stringify(treePayload),
  });
  if (!treeRes.ok) throw new Error(`GitHub createTree failed: ${treeRes.status}`);
  const treeData = (await treeRes.json()) as { sha: string };

  // 4. Create commit
  const commitPayload: Record<string, unknown> = {
    message,
    tree: treeData.sha,
  };
  if (parentSha) {
    commitPayload.parents = [parentSha];
  }

  const commitRes = await fetch(`${API}/repos/${owner}/${repo}/git/commits`, {
    method: 'POST',
    headers: h,
    body: JSON.stringify(commitPayload),
  });
  if (!commitRes.ok) throw new Error(`GitHub createCommit failed: ${commitRes.status}`);
  const commitData = (await commitRes.json()) as { sha: string };

  // 5. Create or update ref
  if (parentSha) {
    const updateRef = await fetch(`${API}/repos/${owner}/${repo}/git/refs/heads/main`, {
      method: 'PATCH',
      headers: h,
      body: JSON.stringify({ sha: commitData.sha }),
    });
    if (!updateRef.ok) throw new Error(`GitHub updateRef failed: ${updateRef.status}`);
  } else {
    const createRef = await fetch(`${API}/repos/${owner}/${repo}/git/refs`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({ ref: 'refs/heads/main', sha: commitData.sha }),
    });
    if (!createRef.ok) throw new Error(`GitHub createRef failed: ${createRef.status}`);
  }

  return { commitSha: commitData.sha };
};
