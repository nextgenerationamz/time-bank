/** 郵件樣式常數（React Email 使用內聯樣式，確保郵件客戶端相容） */

export const emailColors = {
  brand: "#0f766e",
  brandDark: "#115e59",
  brandLight: "#ccfbf1",
  text: "#111827",
  muted: "#6b7280",
  border: "#e5e7eb",
  surface: "#f3f4f6",
  white: "#ffffff",
  amber: "#b45309",
};

export const emailFontFamily =
  '"PingFang TC", "PingFang HK", "Hiragino Sans GB", "Microsoft JhengHei", "Noto Sans TC", sans-serif';

export const emailBody: React.CSSProperties = {
  backgroundColor: emailColors.surface,
  fontFamily: emailFontFamily,
  padding: "24px 0",
};

export const emailContainer: React.CSSProperties = {
  backgroundColor: emailColors.white,
  border: `1px solid ${emailColors.border}`,
  borderRadius: "12px",
  margin: "0 auto",
  maxWidth: "560px",
  padding: "32px",
};

export const emailButton: React.CSSProperties = {
  backgroundColor: emailColors.brand,
  borderRadius: "8px",
  color: emailColors.white,
  fontSize: "14px",
  fontWeight: 600,
  padding: "12px 20px",
  textDecoration: "none",
};

export const emailButtonOutline: React.CSSProperties = {
  backgroundColor: emailColors.white,
  border: `1px solid ${emailColors.brand}`,
  borderRadius: "8px",
  color: emailColors.brand,
  fontSize: "14px",
  fontWeight: 600,
  padding: "12px 20px",
  textDecoration: "none",
};
