import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

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

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
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

    // Create Supabase admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify the requesting user is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !requestingUser) {
      throw new Error("Unauthorized");
    }

    // Check if requesting user is admin
    const { data: adminRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id)
      .eq("role", "admin");

    if (!adminRoles || adminRoles.length === 0) {
      throw new Error("Only admins can invite users");
    }

    const { email, full_name, role }: InviteUserRequest = await req.json();

    if (!email || !full_name || !role) {
      throw new Error("Missing required fields: email, full_name, role");
    }

    console.log(`Inviting user: ${email} with role: ${role}`);

    // Create the user using Supabase Admin API
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true, // Mark email as confirmed
      user_metadata: {
        full_name,
      },
    });

    if (createError) {
      console.error("Error creating user:", createError);
      throw new Error("User creation failed");
    }

    console.log(`User created with ID: ${newUser.user.id}`);

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: newUser.user.id,
        full_name,
        email,
      });

    if (profileError) {
      console.error("Error creating profile:", profileError);
      // Don't throw, profile might already exist from trigger
    }

    // Assign role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: newUser.user.id,
        role,
      });

    if (roleError) {
      console.error("Error assigning role:", roleError);
      throw new Error("Role assignment failed");
    }

    // Update staff_users table to link with auth user
    const { error: staffError } = await supabaseAdmin
      .from("staff_users")
      .update({ is_active: true })
      .eq("email", email);

    if (staffError) {
      console.log("Staff user update note:", staffError.message);
    }

    // Generate password reset link for the new user to set their password
    const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: `${req.headers.get("origin") || "https://id-preview--f89c8f26-06f5-44e6-a6d8-9982bec920ca.lovable.app"}/auth`,
      },
    });

    if (resetError) {
      console.error("Error generating reset link:", resetError);
      throw new Error("Password reset link generation failed");
    }

    console.log("Reset link generated successfully");

    // Send invitation email using Resend
    const resend = new Resend(resendApiKey);

    const roleNames: Record<string, string> = {
      user: "Kasutaja",
      product_manager: "Tootejuht",
      admin: "Administraator",
    };

    const { error: emailError } = await resend.emails.send({
      from: "Wihuri Agri <noreply@resend.dev>",
      to: [email],
      subject: "Kutse Wihuri Agri rakendusse",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #367C2B 0%, #2d6a24 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Wihuri Agri rakendus</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #367C2B; margin-top: 0;">Tere, ${full_name}!</h2>
            
            <p>Oled kutsutud kasutama Wihuri Agri rakendust, kuhu on koondatud tehnika võrdlus, ROI kalkulaator, müüdid ja konkurentsieelised.</p>
            
            <p><strong>Sinu roll:</strong> ${roleNames[role] || role}</p>
            
            <p>Parooli loomiseks ja sisselogimiseks klõpsa allolevale nupule:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetData.properties.action_link}" 
                 style="background: #367C2B; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Loo parool ja logi sisse
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">See link kehtib 24 tundi.</p>
            
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
            
            <p style="color: #888; font-size: 12px; margin-bottom: 0;">
              Kui sa ei oodanud seda e-kirja, võid selle lihtsalt ignoreerida.
            </p>
          </div>
        </body>
        </html>
      `,
    });

    let emailSent = true;
    if (emailError) {
      console.error("Error sending email:", emailError);
      emailSent = false;
      // Don't throw - user was created successfully, email just couldn't be sent
    } else {
      console.log(`Invitation email sent to ${email}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "User invited successfully",
        userId: newUser.user.id 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in invite-user function:", error);
    const isAuthError = error.message?.includes("Unauthorized") || error.message?.includes("No authorization");
    return new Response(
      JSON.stringify({ error: isAuthError ? "Authentication required" : "Operation failed. Please try again." }),
      {
        status: isAuthError ? 401 : 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
