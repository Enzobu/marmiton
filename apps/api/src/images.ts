import { randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export const maxImageBytes = 2_000_000;
export const imageNamePattern = /^[0-9a-f-]{36}\.(jpeg|png|webp)$/;
const types = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' } as const;

export function parseImage(value: string) {
  const matched = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!matched) return null;
  const extension = matched[1] as keyof typeof types;
  const bytes = Buffer.from(matched[2], 'base64');
  if (bytes.length < 12 || bytes.length > maxImageBytes || bytes.toString('base64') !== matched[2]) return null;
  const valid = extension === 'jpeg' ? bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])) && bytes.subarray(-2).equals(Buffer.from([0xff, 0xd9]))
    : extension === 'png' ? bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))
    : bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
  return valid ? { bytes, extension } : null;
}

export function imageStore(directory = process.env.UPLOADS_DIRECTORY ?? '/app/uploads') {
  return {
    async put(image: NonNullable<ReturnType<typeof parseImage>>) {
      await mkdir(directory, { recursive: true });
      const name = `${randomUUID()}.${image.extension}`;
      await writeFile(join(directory, name), image.bytes, { flag: 'wx', mode: 0o600 });
      return '/media/' + name;
    },
    async remove(path: string | null | undefined) {
      const name = path?.startsWith('/media/') ? path.slice('/media/'.length) : '';
      if (!imageNamePattern.test(name)) return;
      await unlink(join(directory, name)).catch((error: NodeJS.ErrnoException) => {
        if (error.code !== 'ENOENT') throw error;
      });
    },
    async read(name: string) {
      if (!imageNamePattern.test(name)) return null;
      try {
        return { bytes: await readFile(join(directory, name)), type: types[name.split('.')[1] as keyof typeof types] };
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
        throw error;
      }
    },
  };
}
