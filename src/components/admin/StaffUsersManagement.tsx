import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, User, Mail, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import {
  useAllStaffUsers,
  useInviteStaffUser,
  useUpdateStaffUser,
  useDeleteStaffUser,
  useUpdateStaffUserRole,
  type StaffUser,
} from "@/hooks/useStaffUsers";
import type { AppRole } from "@/hooks/useAuth";

export function StaffUsersManagement() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole>("user");

  const { data: staffUsers = [], isLoading } = useAllStaffUsers();
  const inviteUser = useInviteStaffUser();
  const updateUser = useUpdateStaffUser();
  const deleteUser = useDeleteStaffUser();
  const updateRole = useUpdateStaffUserRole();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const userData = {
      full_name: formData.get("full_name") as string,
      email: formData.get("email") as string,
    };

    try {
      if (editingUser) {
        await updateUser.mutateAsync({ id: editingUser.id, ...userData });
        toast({ title: t("staffUsers.successUpdate") });
      } else {
        const result = await inviteUser.mutateAsync({ ...userData, role: selectedRole });
        if (result.emailSent === false) {
          toast({
            title: t("staffUsers.successCreateNoEmail"),
            description: t("staffUsers.successCreateNoEmailDesc"),
          });
        } else {
          toast({
            title: t("staffUsers.successCreate"),
            description: t("staffUsers.successCreateEmail", { email: userData.email })
          });
        }
      }
      setDialogOpen(false);
      setEditingUser(null);
      setSelectedRole("user");
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: t("staffUsers.errorViga"),
        description: error.message || (editingUser
          ? t("staffUsers.errorUpdate")
          : t("staffUsers.errorInvite")),
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (user: StaffUser) => {
    try {
      await updateUser.mutateAsync({
        id: user.id,
        is_active: !user.is_active,
      });
      toast({
        title: user.is_active ? t("staffUsers.successToggleDeactivated") : t("staffUsers.successToggleActivated"),
      });
    } catch (error) {
      toast({
        title: t("staffUsers.errorViga"),
        description: t("staffUsers.errorToggle"),
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("staffUsers.deleteConfirm"))) return;

    try {
      await deleteUser.mutateAsync(id);
      toast({ title: t("staffUsers.successDelete") });
    } catch (error) {
      toast({
        title: t("staffUsers.errorViga"),
        description: t("staffUsers.errorDelete"),
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (user: StaffUser) => {
    setEditingUser(user);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingUser(null);
    setSelectedRole("user");
  };

  if (isLoading) {
    return <div className="text-muted-foreground">{t("staffUsers.loading")}</div>;
  }

  const isSubmitting = inviteUser.isPending || updateUser.isPending;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">{t("staffUsers.title")}</h2>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          if (!open) closeDialog();
          else setDialogOpen(true);
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => setEditingUser(null)}>
              <Plus className="h-4 w-4" />
              {t("staffUsers.addButton")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingUser ? t("staffUsers.dialogEditTitle") : t("staffUsers.dialogNewTitle")}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">{t("staffUsers.nameLabel")}</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  placeholder={t("staffUsers.namePlaceholder")}
                  defaultValue={editingUser?.full_name || ""}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t("staffUsers.emailLabel")}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={t("staffUsers.emailPlaceholder")}
                  defaultValue={editingUser?.email || ""}
                  required
                  disabled={isSubmitting || !!editingUser}
                />
                {!editingUser && (
                  <p className="text-sm text-muted-foreground">
                    {t("staffUsers.emailHint")}
                  </p>
                )}
              </div>

              {!editingUser && (
                <div className="space-y-2">
                  <Label htmlFor="role">{t("staffUsers.roleLabel")}</Label>
                  <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as AppRole)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("staffUsers.roleSelectPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">{t("staffUsers.roleUser")}</SelectItem>
                      <SelectItem value="product_manager">{t("staffUsers.roleProductManager")}</SelectItem>
                      <SelectItem value="admin">{t("staffUsers.roleAdmin")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    {selectedRole === "admin" && t("staffUsers.roleAdminDescription")}
                    {selectedRole === "product_manager" && t("staffUsers.roleManagerDescription")}
                    {selectedRole === "user" && t("staffUsers.roleUserDescription")}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={closeDialog} disabled={isSubmitting}>
                  {t("staffUsers.cancelButton")}
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {editingUser ? t("staffUsers.savingButton") : t("staffUsers.sendingButton")}
                    </>
                  ) : (
                    <>
                      {!editingUser && <Mail className="mr-2 h-4 w-4" />}
                      {editingUser ? t("staffUsers.submitEditButton") : t("staffUsers.submitButton")}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {staffUsers.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <User className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">{t("staffUsers.emptyTitle")}</h3>
          <p className="mt-2 text-muted-foreground">
            {t("staffUsers.emptyDescription")}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("staffUsers.tableHeaderName")}</TableHead>
                  <TableHead>{t("staffUsers.tableHeaderEmail")}</TableHead>
                  <TableHead className="w-40">{t("staffUsers.tableHeaderRole")}</TableHead>
                  <TableHead className="w-24">{t("staffUsers.tableHeaderStatus")}</TableHead>
                  <TableHead className="w-32 text-right">{t("staffUsers.tableHeaderActions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {user.auth_user_id ? (
                        <Select
                          value={user.role || "user"}
                          onValueChange={async (value) => {
                            try {
                              await updateRole.mutateAsync({
                                authUserId: user.auth_user_id!,
                                role: value as AppRole,
                              });
                              toast({ title: t("staffUsers.successRoleUpdate") });
                            } catch {
                              toast({
                                title: t("staffUsers.errorViga"),
                                description: t("staffUsers.errorRoleUpdate"),
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          <SelectTrigger className="h-8 w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">{t("staffUsers.roleUser")}</SelectItem>
                            <SelectItem value="product_manager">{t("staffUsers.roleProductManager")}</SelectItem>
                            <SelectItem value="admin">{t("staffUsers.roleAdmin")}</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="outline" className="text-xs">{t("staffUsers.statusPending")}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.has_logged_in ? "default" : "outline"}>
                        {user.has_logged_in ? t("staffUsers.statusActive") : t("staffUsers.statusPending")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(user)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(user.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {staffUsers.map((user) => (
              <div key={user.id} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{user.full_name}</div>
                    <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(user)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(user.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    {user.auth_user_id ? (
                      <Select
                        value={user.role || "user"}
                        onValueChange={async (value) => {
                          try {
                            await updateRole.mutateAsync({
                              authUserId: user.auth_user_id!,
                              role: value as AppRole,
                            });
                            toast({ title: t("staffUsers.successRoleUpdate") });
                          } catch {
                            toast({
                              title: t("staffUsers.errorViga"),
                              description: t("staffUsers.errorRoleUpdate"),
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        <SelectTrigger className="h-7 text-xs w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">{t("staffUsers.roleUser")}</SelectItem>
                          <SelectItem value="product_manager">{t("staffUsers.roleProductManager")}</SelectItem>
                          <SelectItem value="admin">{t("staffUsers.roleAdmin")}</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline" className="text-xs">{t("staffUsers.statusPending")}</Badge>
                    )}
                  </div>
                  <Badge variant={user.has_logged_in ? "default" : "outline"} className="text-xs">
                    {user.has_logged_in ? t("staffUsers.statusActive") : t("staffUsers.statusPending")}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
