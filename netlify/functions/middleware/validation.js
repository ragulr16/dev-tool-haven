export const sanitizeInput = (input, toolType) => {
  switch(toolType) {
    case 'json':
      try {
        return { valid: true, data: JSON.parse(input) }
      } catch (e) {
        return { valid: false, error: 'Invalid JSON' }
      }
    case 'csv':
      if (/(javascript|script|onload)/i.test(input)) {
        return { valid: false, error: 'XSS attempt detected' }
      }
      return { valid: true, data: input }
    default:
      return { valid: false, error: 'Invalid tool type' }
  }
} 