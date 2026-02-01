import { nanoid, customAlphabet } from 'nanoid';

export const generateId = (): string => {
  return nanoid(21);
};

const subdomainAlphabet = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 8);

export const generateSubdomain = (): string => {
  return subdomainAlphabet();
};
