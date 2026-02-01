import { useState, useEffect } from 'hono/jsx';
import { timeAgo } from '../lib/time';
import { statusConfig } from '../lib/status';

interface Project {
  id: string;
  name: string;
  subdomain: string;
  framework: string | null;
  status: string;
  deploymentUrl: string | null;
  customDomain: string | null;
  platform: string | null;
  createdAt: string;
}

const ProjectList = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/projects')
      .then((res) => res.json() as Promise<{ projects: Project[] }>)
      .then((data) => {
        setProjects(data.projects);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div class="text-center py-12" style="color:rgba(255,255,255,0.4)">
        <div class="text-4xl mb-4 animate-float">📦</div>
        載入專案中...
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div
        class="card-vs p-16 text-center"
        style="border:2px dashed rgba(255,255,255,0.1);cursor:default"
      >
        <div class="text-5xl mb-5">📦</div>
        <h2 class="text-xl font-bold mb-3">還沒有任何專案</h2>
        <p class="mb-6" style="color:rgba(255,255,255,0.5)">
          部署你的第一個專案，只需要三分鐘
        </p>
        <a
          href="/dashboard/new"
          class="inline-flex items-center gap-2 bg-vs-gradient-btn rounded-xl px-8 py-3 text-white font-bold no-underline"
        >
          + 新增專案
        </a>
      </div>
    );
  }

  return (
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {projects.map((project, i) => {
        const sc = statusConfig[project.status] || statusConfig.created;
        const displayUrl =
          project.customDomain ||
          project.deploymentUrl?.replace('https://', '') ||
          `${project.subdomain}.sheepit.cc`;

        return (
          <a
            key={project.id}
            href={`/dashboard/${project.id}`}
            class="card-vs p-6 block no-underline text-white"
            style={`animation:slideIn 0.4s ease ${i * 0.1}s both`}
          >
            {/* Status & Name */}
            <div class="flex items-center gap-2.5 mb-3">
              <div
                style={`width:10px;height:10px;border-radius:50%;background:${sc.dot};box-shadow:${sc.glow}`}
              />
              <h3 class="font-bold text-lg truncate">{project.name}</h3>
            </div>

            {/* URL */}
            <p
              class="font-mono text-sm mb-4 truncate"
              style={`color:${project.status === 'live' ? '#34d399' : project.status === 'failed' ? '#ef4444' : 'rgba(255,255,255,0.5)'}`}
            >
              {project.status === 'failed' ? '部署失敗' : displayUrl}
            </p>

            {/* Footer */}
            <div
              class="flex items-center justify-between pt-4"
              style="border-top:1px solid rgba(255,255,255,0.06)"
            >
              <div class="flex items-center gap-1.5">
                <span class="text-xs">{project.platform === 'cloudflare' ? '☁️' : '▲'}</span>
                <span class="text-sm" style="color:rgba(255,255,255,0.5)">
                  {timeAgo(project.createdAt)}
                </span>
              </div>
              <div class="flex gap-2">
                {project.status === 'failed' && (
                  <button
                    onClick={(e: Event) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.location.href = `/dashboard/${project.id}`;
                    }}
                    class="px-3 py-1.5 rounded-lg text-sm cursor-pointer"
                    style="background:rgba(239,68,68,0.2);border:1px solid rgba(239,68,68,0.3);color:#ef4444"
                  >
                    重試
                  </button>
                )}
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
};

export default ProjectList;
