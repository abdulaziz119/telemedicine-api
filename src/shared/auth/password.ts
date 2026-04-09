import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto"
import { promisify } from "node:util"

const scrypt = promisify(scryptCallback)
const passwordKeyLength = 64

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex")
  const hash = await scrypt(password, salt, passwordKeyLength) as Buffer

  return `${salt}:${hash.toString("hex")}`
}

export async function verifyPassword(password: string, storedHash: string) {
  const [salt, expectedHashHex] = storedHash.split(":")

  if (!salt || !expectedHashHex) {
    return false
  }

  const expectedHash = Buffer.from(expectedHashHex, "hex")
  const actualHash = await scrypt(password, salt, expectedHash.length) as Buffer

  return expectedHash.length === actualHash.length && timingSafeEqual(expectedHash, actualHash)
}
