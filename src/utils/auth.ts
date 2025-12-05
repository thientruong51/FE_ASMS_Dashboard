export interface AuthClaims {
  EmployeeCode?: string;
  EmployeeRoleId?: string | number;
}

function base64UrlDecode(input: string) {
  input = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = input.length % 4;
  if (pad === 2) input += "==";
  else if (pad === 3) input += "=";
  else if (pad !== 0) {
  }
  try {
    return decodeURIComponent(
      atob(input)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
  } catch (e) {
    return null;
  }
}

export function parseJwt(token?: string | null): AuthClaims | null {
  if (!token) return null;
  const t = token.startsWith("Bearer ") ? token.slice(7) : token;
  const parts = t.split(".");
  if (parts.length < 2) return null;
  const payload = parts[1];
  const decoded = base64UrlDecode(payload);
  if (!decoded) return null;
  try {
    const obj = JSON.parse(decoded);
    return obj as AuthClaims;
  } catch (e) {
    return null;
  }
}


export function getAuthClaimsFromStorage(tokenKey = "accessToken") {
  const token = localStorage.getItem(tokenKey);
  return parseJwt(token);
}
