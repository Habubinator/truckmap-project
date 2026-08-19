import NodeRSA from 'encrypt-rsa';
import { readFileSync } from 'fs';
import { createHash } from 'crypto';

export function hashObject(obj: object): string {
  const json = JSON.stringify(obj);
  return createHash('sha256').update(json).digest('hex');
}

const rsa = new NodeRSA();

const publicKey = readFileSync(process.env.PUBLIC_KEY_RSA_PATH, {
  encoding: 'utf8',
});

const privateKey = readFileSync(process.env.PRIVATE_KEY_RSA_PATH, {
  encoding: 'utf8',
});

export function encrypt(text: string) {
  return rsa.encrypt({ text, privateKey });
}

export function decrypt(text: string) {
  return rsa.decrypt({ text, publicKey });
}
