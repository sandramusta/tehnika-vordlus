import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CreateFirstAdminRequest {
  email: string;
  full_name: string;
  admin_secret: string;
}

function buildAdminInviteEmail(name: string, actionLink: string): string {
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
    Oled määratud Wihuri Agri rakenduse administraatoriks. Loo parool ja alusta!
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
                Oled kutsutud kasutama <strong>Wihuri Agri rakendust</strong>, kuhu on koondatud tehnika võrdlus, ROI kalkulaator, müüdid ja konkurentsieelised.
              </p>
              
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
                <tr>
                  <td style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px 20px;">
                    <p style="color: #166534; margin: 0; font-size: 14px;">
                      <strong>Sinu roll:</strong> Administraator
                    </p>
                  </td>
                </tr>
              </table>

              <p style="color: #3f3f46; margin: 0 0 24px; font-size: 15px; line-height: 1.6;">
                Alustamiseks loo endale parool, klõpsates allolevale nupule:
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
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const expectedSecret = Deno.env.get("FIRST_ADMIN_SECRET");
    if (!expectedSecret) {
      console.error("FIRST_ADMIN_SECRET environment variable is not configured");
      return new Response(
        JSON.stringify({ error: "Operation failed. Please try again." }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { email, full_name, admin_secret }: CreateFirstAdminRequest = await req.json();

    if (!admin_secret || admin_secret !== expectedSecret) {
      return new Response(
        JSON.stringify({ error: "Operation failed. Please try again." }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!email || !full_name) {
      throw new Error("Missing required fields: email, full_name");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Check if any admin already exists
    const { data: existingAdmins } = await supabaseAdmin
      .from("user_roles")
      .select("*")
      .eq("role", "admin");

    if (existingAdmins && existingAdmins.length > 0) {
      return new Response(
        JSON.stringify({ error: "Operation failed. Please try again." }),
        { status: 409, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Creating first admin user: ${email}`);

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (createError) {
      console.error("Error creating user:", createError);
      throw new Error("User creation failed");
    }

    console.log(`User created with ID: ${newUser.user.id}`);

    // Create profile
    await supabaseAdmin.from("profiles").insert({
      id: newUser.user.id, full_name, email,
    });

    // Assign admin role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: newUser.user.id, role: "admin" });

    if (roleError) {
      console.error("Error assigning role:", roleError);
      throw new Error("Role assignment failed");
    }

    // Update staff_users
    await supabaseAdmin.from("staff_users").update({ is_active: true }).eq("email", email);

    // Generate password reset link
    const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: "https://agrifacts.app/reset-password",
      },
    });

    if (resetError) {
      console.error("Error generating reset link:", resetError);
      throw new Error("Password reset link generation failed");
    }

    // Send invitation email via Resend API
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
        headers: { "X-Entity-Ref-ID": `first-admin-${newUser.user.id}-${Date.now()}` },
        html: buildAdminInviteEmail(full_name, resetData.properties.action_link),
      }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      console.error("Email send error:", errText);
      throw new Error("Email sending failed");
    }


    console.log(`First admin invitation email sent to ${email}`);

    return new Response(
      JSON.stringify({ success: true, message: "First admin user created successfully", userId: newUser.user.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in create-first-admin function:", error);
    return new Response(
      JSON.stringify({ error: "Operation failed. Please try again." }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
