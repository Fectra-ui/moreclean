// ============================================================
// E-MAIL LAYOUT
// Alle transactionele e-mails gebruiken dezelfde wrapper zodat
// branding consistent blijft. Wissel de inhoud per template.
// ============================================================

export function emailLayout(content: string, previewText = ""): string {
  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>More Clean</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background:#F3F5F7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  ${previewText ? `<div style="display:none;max-height:0;overflow:hidden;color:#F3F5F7">${previewText}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>` : ""}
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#F3F5F7;padding:40px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%">

        <!-- Header -->
        <tr>
          <td style="background:#101536;border-radius:16px 16px 0 0;padding:28px 40px;text-align:center">
            <img src="https://moreclean.nl/images/logo-wit.png" alt="More Clean" width="140" height="auto"
              style="display:inline-block;height:auto;border:0" onerror="this.style.display='none'" />
            <div style="color:#95AEC1;font-size:13px;margin-top:4px;letter-spacing:.5px">Professionele schoonmaak</div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#fff;padding:40px;border-left:1px solid #E8ECF0;border-right:1px solid #E8ECF0">
            ${content}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#F8F9FB;border:1px solid #E8ECF0;border-top:none;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center">
            <p style="margin:0 0 8px;font-size:13px;color:#606774">
              More Clean · Schoonmaakbedrijf Limburg
            </p>
            <p style="margin:0;font-size:12px;color:#95AEC1">
              Vragen? Bel ons op <a href="tel:+31612345678" style="color:#4D7EBA;text-decoration:none">+31 6 12 34 56 78</a>
              of mail naar <a href="mailto:info@moreclean.nl" style="color:#4D7EBA;text-decoration:none">info@moreclean.nl</a>
            </p>
            <p style="margin:12px 0 0;font-size:11px;color:#95AEC1">
              © ${new Date().getFullYear()} More Clean. Alle rechten voorbehouden.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// Herbruikbare HTML-componenten
export const btn = (href: string, label: string, color = "#4D7EBA") =>
  `<p style="margin:24px 0 0;text-align:center">
    <a href="${href}" style="display:inline-block;background:${color};color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px">${label}</a>
  </p>`;

export const divider = `<hr style="border:none;border-top:1px solid #E8ECF0;margin:24px 0" />`;

export const infoRow = (label: string, value: string) =>
  `<tr>
    <td style="padding:8px 0;color:#606774;font-size:14px;width:40%">${label}</td>
    <td style="padding:8px 0;color:#101536;font-size:14px;font-weight:500">${value}</td>
  </tr>`;

export const infoTable = (rows: string) =>
  `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse">${rows}</table>`;

export const h1 = (text: string) =>
  `<h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#101536">${text}</h1>`;

export const p = (text: string) =>
  `<p style="margin:16px 0 0;font-size:15px;line-height:1.6;color:#333">${text}</p>`;

export const small = (text: string) =>
  `<p style="margin:8px 0 0;font-size:13px;color:#606774">${text}</p>`;
