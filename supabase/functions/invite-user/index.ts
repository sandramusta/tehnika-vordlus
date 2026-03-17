import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface InviteUserRequest {
  email: string;
  full_name: string;
  role: "user" | "product_manager" | "admin";
}

const FALLBACK_APP_BASE_URL = "https://wihuriapp.lovable.app";

function resolveAppBaseUrl(req: Request): string {
  const candidates = [
    req.headers.get("origin"),
    req.headers.get("referer"),
    Deno.env.get("APP_BASE_URL"),
    FALLBACK_APP_BASE_URL,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      return new URL(candidate).origin;
    } catch {
      // ignore invalid candidate
    }
  }

  return FALLBACK_APP_BASE_URL;
}

function forcePasswordResetRedirect(actionLink: string, passwordResetUrl: string): string {
  try {
    const url = new URL(actionLink);
    url.searchParams.set("redirect_to", passwordResetUrl);
    return url.toString();
  } catch {
    return actionLink;
  }
}

function buildPasswordSetupLink(
  resetProps: { hashed_token?: string; action_link: string },
  passwordResetUrl: string,
): string {
  if (resetProps?.hashed_token) {
    return `${passwordResetUrl}?token_hash=${encodeURIComponent(resetProps.hashed_token)}&type=recovery`;
  }

  return forcePasswordResetRedirect(resetProps.action_link, passwordResetUrl);
}

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
  <!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
  <style>
    body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    a { color: #367C2B; text-decoration: none; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <!-- Preheader -->
  <div style="display: none; max-height: 0; overflow: hidden; font-size: 1px; line-height: 1px; color: #f4f4f5;">
    Oled kutsutud kasutama Wihuri Agri rakendust. Loo parool ja alusta kohe!
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #367C2B; padding: 32px 40px; border-radius: 12px 12px 0 0; text-align: center;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">
                      🌾 Wihuri Agri
                    </h1>
                    <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 14px; font-weight: 400;">
                      Tehnika võrdlus rakendus
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
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
                      <strong>Sinu roll:</strong> ${roleName}
                    </p>
                  </td>
                </tr>
              </table>

              <p style="color: #3f3f46; margin: 0 0 24px; font-size: 15px; line-height: 1.6;">
                Alustamiseks loo endale parool, klõpsates allolevale nupule:
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 8px 0 24px;">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${actionLink}" style="height:48px;v-text-anchor:middle;width:260px;" arcsize="12%" fillcolor="#367C2B" stroke="f">
                      <v:textbox inset="0,0,0,0"><center style="color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:bold;">Loo parool ja logi sisse</center></v:textbox>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-->
                    <a href="${actionLink}" style="display: inline-block; background-color: #367C2B; color: #ffffff; padding: 14px 32px; font-size: 16px; font-weight: 600; border-radius: 8px; text-decoration: none; box-shadow: 0 2px 8px rgba(54,124,43,0.3);">
                      Loo parool ja logi sisse →
                    </a>
                    <!--<![endif]-->
                  </td>
                </tr>
              </table>

              <p style="color: #a1a1aa; margin: 0; font-size: 13px; text-align: center;">
                See link kehtib 24 tundi.
              </p>
            </td>
          </tr>

          <!-- Footer -->
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

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify the requesting user is an admin
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

    const { email, full_name, role }: InviteUserRequest = await req.json();

    if (!email || !full_name || !role) {
      throw new Error("Missing required fields: email, full_name, role");
    }

    console.log(`Inviting user: ${email} with role: ${role}`);

    // Create the user or find existing one
    let userId: string;
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (createError) {
      if (createError.message?.includes("already been registered")) {
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const existing = listData?.users.find(u => u.email === email);
        if (!existing) throw new Error("User lookup failed");
        userId = existing.id;
        console.log(`User already exists with ID: ${userId}`);
      } else {
        console.error("Error creating user:", createError);
        throw new Error("User creation failed");
      }
    } else {
      userId = newUser.user.id;
      console.log(`User created with ID: ${userId}`);
    }

    // Upsert profile
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({ id: userId, full_name, email }, { onConflict: "id" });

    if (profileError) {
      console.error("Error upserting profile:", profileError);
    }

    // Upsert role
    await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role });

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
        redirectTo: PASSWORD_RESET_URL,
      },
    });

    if (resetError || !resetData?.properties?.action_link) {
      console.error("Error generating reset link:", resetError);
      throw new Error("Password reset link generation failed");
    }

    const passwordSetupLink = buildPasswordSetupLink(
      resetData.properties as { hashed_token?: string; action_link: string }
    );

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
        headers: { "X-Entity-Ref-ID": `invite-${userId}-${Date.now()}` },
        html: buildInviteEmail(full_name, role, passwordSetupLink),
      }),
    });
    const emailError = !emailRes.ok ? await emailRes.text() : null;

    let emailSent = true;
    if (emailError) {
      console.error("Error sending email:", emailError);
      emailSent = false;
    } else {
      console.log(`Invitation email sent to ${email}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: emailSent 
          ? "User invited successfully" 
          : "User created successfully, but invitation email could not be sent.",
        emailSent,
        userId 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in invite-user function:", error);
    const isAuthError = error.message?.includes("Unauthorized") || error.message?.includes("No authorization");
    return new Response(
      JSON.stringify({ error: isAuthError ? "Authentication required" : "Operation failed. Please try again." }),
      { status: isAuthError ? 401 : 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
