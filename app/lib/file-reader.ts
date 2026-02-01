import { shouldIgnore } from './constants';
import { isEnvFile } from './env-parser';

export interface FileEntry {
  path: string;
  content: string; // base64
}

export interface EnvFileEntry {
  path: string;
  content: string; // raw text
}

export const readFileAsBase64 = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const readFileAsText = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

export const traverseEntry = async (
  entry: FileSystemEntry,
  basePath: string = '',
  envCollector?: EnvFileEntry[],
): Promise<FileEntry[]> => {
  const files: FileEntry[] = [];
  const path = basePath ? `${basePath}/${entry.name}` : entry.name;

  // Collect env files before shouldIgnore skips them
  if (envCollector && entry.isFile && isEnvFile(entry.name)) {
    const fileEntry = entry as FileSystemFileEntry;
    const file = await new Promise<File>((resolve, reject) => {
      fileEntry.file(resolve, reject);
    });
    const content = await readFileAsText(file);
    envCollector.push({ path, content });
    return files;
  }

  if (shouldIgnore(entry.name)) return files;

  if (entry.isFile) {
    const fileEntry = entry as FileSystemFileEntry;
    const file = await new Promise<File>((resolve, reject) => {
      fileEntry.file(resolve, reject);
    });
    const content = await readFileAsBase64(file);
    files.push({ path, content });
  } else if (entry.isDirectory) {
    const dirEntry = entry as FileSystemDirectoryEntry;
    const reader = dirEntry.createReader();
    const entries = await new Promise<FileSystemEntry[]>((resolve, reject) => {
      reader.readEntries(resolve, reject);
    });
    for (const child of entries) {
      const childFiles = await traverseEntry(child, path, envCollector);
      files.push(...childFiles);
    }
  }

  return files;
};
