interface DetectionResult {
  framework: string | null;
  buildCommand?: string;
  outputDirectory?: string;
}

export const detectFramework = (
  files: string[],
  packageJson?: Record<string, unknown>,
): DetectionResult => {
  const deps = {
    ...(packageJson?.dependencies as Record<string, string> | undefined),
    ...(packageJson?.devDependencies as Record<string, string> | undefined),
  };

  if (
    files.some(
      (f) => f === 'next.config.js' || f === 'next.config.ts' || f === 'next.config.mjs',
    ) ||
    deps?.['next']
  ) {
    return { framework: 'nextjs', buildCommand: 'next build', outputDirectory: '.next' };
  }

  if (
    files.some((f) => f === 'vite.config.ts' || f === 'vite.config.js' || f === 'vite.config.mjs')
  ) {
    if (deps?.['@sveltejs/kit']) {
      return { framework: 'sveltekit', buildCommand: 'vite build', outputDirectory: '.svelte-kit' };
    }
    if (deps?.['nuxt'] || deps?.['nuxt3']) {
      return { framework: 'nuxt', buildCommand: 'nuxt build', outputDirectory: '.output' };
    }
    return { framework: 'vite', buildCommand: 'vite build', outputDirectory: 'dist' };
  }

  if (
    files.some((f) => f === 'remix.config.js' || f === 'remix.config.ts') ||
    deps?.['@remix-run/react']
  ) {
    return { framework: 'remix', buildCommand: 'remix build', outputDirectory: 'build' };
  }

  if (files.some((f) => f === 'astro.config.mjs' || f === 'astro.config.ts') || deps?.['astro']) {
    return { framework: 'astro', buildCommand: 'astro build', outputDirectory: 'dist' };
  }

  if (deps?.['react-scripts']) {
    return {
      framework: 'create-react-app',
      buildCommand: 'react-scripts build',
      outputDirectory: 'build',
    };
  }

  if (files.some((f) => f === 'index.html')) {
    return { framework: 'static', outputDirectory: '.' };
  }

  return { framework: null };
};
