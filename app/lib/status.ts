export interface StatusStyle {
  label: string;
  color: string;
  dot: string;
  glow: string;
}

export const statusConfig: Record<string, StatusStyle> = {
  created: {
    label: '已建立',
    color: 'rgba(156,163,175,1)',
    dot: '#9ca3af',
    glow: 'none',
  },
  uploading: {
    label: '上傳中',
    color: '#facc15',
    dot: '#facc15',
    glow: '0 0 8px rgba(250,204,21,0.6)',
  },
  deploying: {
    label: '部署中',
    color: '#60a5fa',
    dot: '#60a5fa',
    glow: '0 0 8px rgba(96,165,250,0.6)',
  },
  live: {
    label: '已上線',
    color: '#34d399',
    dot: '#34d399',
    glow: '0 0 8px rgba(52,211,153,0.6)',
  },
  failed: {
    label: '部署失敗',
    color: '#ef4444',
    dot: '#ef4444',
    glow: '0 0 8px rgba(239,68,68,0.6)',
  },
};

export const getStatusStyle = (status: string): StatusStyle =>
  statusConfig[status] || statusConfig.created;
