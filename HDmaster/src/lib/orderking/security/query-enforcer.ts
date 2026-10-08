export interface SafeQuery {
  text: string;
  values: any[];
}

export function buildSafeQuery(template: string, args: any[]): SafeQuery {
  if (!Array.isArray(args)) {
    throw new Error("Arguments must be an array for parameterized queries");
  }
  
  return {
    text: template,
    values: args,
  };
}
