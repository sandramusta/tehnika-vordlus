import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function buildInviteEmail(name: string, role: string, actionLink: string): string {
  const roleNames: Record<string, string> = {
    user: "Kasutaja",
    product_manager: "Tootejuht",
    admin: "Administraator",
  };
  const roleName = roleNames[role] || role;

  return `<!DOCTYPE html>
<html lang="et" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no">
  <title>Kutse Wihuri Agri rakendusse</title>
  <style>
    body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; }
    table { border-collapse: collapse; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    a { color: #367C2B; text-decoration: none; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <div style="display: none; max-height: 0; overflow: hidden; font-size: 1px; line-height: 1px; color: #f4f4f5;">
    Sinu kutse Wihuri Agri rakendusse on uuendatud. Loo parool ja alusta!
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
          
          <tr>
            <td style="background-color: #367C2B; padding: 32px 40px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">
                🌾 Wihuri Agri
              </h1>
              <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 14px;">
                Tehnika võrdlus & müügitugi
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color: #ffffff; padding: 40px; border-left: 1px solid #e4e4e7; border-right: 1px solid #e4e4e7;">
              <h2 style="color: #18181b; margin: 0 0 16px; font-size: 22px; font-weight: 600;">
                Tere, ${name}! 👋
              </h2>
              
              <p style="color: #3f3f46; margin: 0 0 16px; font-size: 15px; line-height: 1.6;">
                Saadame sulle uue kutselingi <strong>Wihuri Agri rakendusse</strong>. Rakenduses leiad tehnika võrdluse, ROI kalkulaatori, müüdid ja konkurentsieelised.
              </p>
              
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
                <tr>
                  <td style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px 20px;">
                    <p style="color: #166534; margin: 0; font-size: 14px;">
                      <strong>Sinu roll:</strong> ${roleName}
                    </p>
                  </td>
                </tr>
              </table>

              <p style="color: #3f3f46; margin: 0 0 24px; font-size: 15px; line-height: 1.6;">
                Parooli loomiseks klõpsa allolevale nupule:
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 8px 0 24px;">
                    <a href="${actionLink}" style="display: inline-block; background-color: #367C2B; color: #ffffff; padding: 14px 32px; font-size: 16px; font-weight: 600; border-radius: 8px; text-decoration: none; box-shadow: 0 2px 8px rgba(54,124,43,0.3);">
                      Loo parool ja logi sisse →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #a1a1aa; margin: 0; font-size: 13px; text-align: center;">
                See link kehtib 24 tundi.
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color: #fafafa; padding: 24px 40px; border: 1px solid #e4e4e7; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="color: #a1a1aa; margin: 0 0 8px; font-size: 12px; line-height: 1.5; text-align: center;">
                See e-kiri saadeti automaatselt Wihuri Agri rakenduse poolt.<br>
                Kui sa ei oodanud seda kutset, võid selle e-kirja lihtsalt ignoreerida.
              </p>
              <p style="color: #d4d4d8; margin: 0; font-size: 11px; text-align: center;">
                © ${new Date().getFullYear()} Wihuri Agri · Eesti
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify requesting user is an authenticated admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Operation failed" }), {
        status: 401, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !requestingUser) {
      return new Response(JSON.stringify({ error: "Operation failed" }), {
        status: 401, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { data: adminRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id)
      .eq("role", "admin");

    if (!adminRoles || adminRoles.length === 0) {
      return new Response(JSON.stringify({ error: "Operation failed" }), {
        status: 403, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { email } = await req.json();

    // Get user info
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const user = users?.users.find(u => u.email === email);
    
    if (!user) {
      throw new Error("User not found");
    }

    const full_name = user.user_metadata?.full_name || "Kasutaja";

    // Get user role
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    const role = roleData?.role || "user";

    // Generate new password reset link
    const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: `${req.headers.get("origin") || "https://wihuriapp.lovable.app"}/reset-password`,
      },
    });

    if (resetError) throw resetError;

    // Send email via Resend API
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Wihuri Agri <noreply@agrifacts.app>",
        reply_to: "info@agrifacts.app",
        to: [email],
        subject: "Kutse Wihuri Agri rakendusse",
        headers: { "X-Entity-Ref-ID": `resend-invite-${user.id}-${Date.now()}` },
        html: buildInviteEmail(full_name, role, resetData.properties.action_link),
      }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      console.error("Email send error:", errText);
      throw new Error("Email sending failed");
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in resend-invite function:", error);
    return new Response(JSON.stringify({ error: "Operation failed. Please try again." }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
