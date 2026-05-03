export interface PIIFlags {
  email: number
  phone: number
  aadhaar: number
  pan: number
  age: number
}

export interface RedactionResult {
  redactedText: string
  piiFlags: PIIFlags
}

const EMAIL_REGEX = /\b[\w.-]+@[\w.-]+\.\w{2,}\b/g
const PHONE_REGEX = /(?:\+91[-\s]?)?[6-9]\d{9}\b/g
const AADHAAR_REGEX = /\b\d{4}\s?\d{4}\s?\d{4}\b/g
const PAN_REGEX = /\b[A-Z]{5}\d{4}[A-Z]\b/g
const AGE_REGEX = /\b\d{1,3}\s?(?:year|yr|years|yrs)?\s?old\b/gi

export function redactPII(text: string): RedactionResult {
  const flags: PIIFlags = {
    email: 0,
    phone: 0,
    aadhaar: 0,
    pan: 0,
    age: 0
  }

  let redacted = text

  redacted = redacted.replace(EMAIL_REGEX, (match) => {
    flags.email++
    return '[EMAIL]'
  })

  redacted = redacted.replace(PHONE_REGEX, (match) => {
    flags.phone++
    return '[PHONE]'
  })

  redacted = redacted.replace(AADHAAR_REGEX, (match) => {
    if (match.replace(/\s/g, '').length === 12) {
      flags.aadhaar++
      return '[AADHAAR]'
    }
    return match
  })

  redacted = redacted.replace(PAN_REGEX, (match) => {
    flags.pan++
    return '[PAN]'
  })

  redacted = redacted.replace(AGE_REGEX, (match) => {
    flags.age++
    return '[AGE]'
  })

  return {
    redactedText: redacted,
    piiFlags: flags
  }
}
