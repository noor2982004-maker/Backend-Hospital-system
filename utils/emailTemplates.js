const BRAND = "#0d6594";
const APP_NAME = "نبضة";

export const otpEmail = ({ otp, purpose, expiresInMin }) => {
  const isVerify = purpose === "verify_email";
  const title = isVerify ? "Verify your email" : "Reset your password";
  const intro = isVerify
    ? `Welcome to ${APP_NAME}! Use the code below to verify your email address.`
    : "We received a request to reset your password. Use the code below to continue.";

  const digits = otp
    .split("")
    .map(
      (
        d,
      ) => `<td style="width:46px;height:56px;background:#f0fdfa;border:1px solid #99f6e4;border-radius:10px;text-align:center;font-size:28px;font-weight:700;color:${BRAND};font-family:'Courier New',monospace;">${d}</td>
              <td style="width:8px;"></td>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 12px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;">

        <tr><td style="background:#ffffff;border-top:5px solid ${BRAND};padding:28px;text-align:center;">
          <img src="cid:logo" alt="${APP_NAME}" width="180" style="display:inline-block;height:auto;border:0;">
        </td></tr>

        <tr><td style="padding:16px 28px 8px;text-align:center;">
          <h1 style="margin:0 0 12px;font-size:22px;color:#111827;">${title}</h1>
          <p style="margin:0;font-size:15px;line-height:1.6;color:#4b5563;">${intro}</p>
        </td></tr>

        <tr><td align="center" style="padding:24px 28px;">
          <table cellpadding="0" cellspacing="0"><tr>${digits}</tr></table>
        </td></tr>

        <tr><td style="padding:0 28px 28px;text-align:center;">
          <p style="margin:0 0 8px;font-size:14px;color:#6b7280;">
            This code expires in <b style="color:#111827;">${expiresInMin} minutes</b>.
          </p>
          <p style="margin:0;font-size:13px;color:#9ca3af;">
            Never share this code with anyone. We will never ask for it.
          </p>
        </td></tr>

        <tr><td style="background:#ffffff;border-top:5px solid ${BRAND};padding:28px;text-align:center;">
</td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
};
