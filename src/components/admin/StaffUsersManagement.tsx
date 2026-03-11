import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import {
  useAllStaffUsers,
  useInviteStaffUser,
  useUpdateStaffUser,
  useDeleteStaffUser,
  useUpdateStaffUserRole,
  type StaffUser,
} from "@/hooks/useStaffUsers";
import type { AppRole } from "@/hooks/useAuth";

const roleLabels: Record<AppRole, string> = {
  user: "Kasutaja",
  product_manager: "Tootejuht",
  admin: "Administraator",
};

export function StaffUsersManagement() {
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
        toast({ title: "Kasutaja andmed uuendatud!" });
      } else {
        const result = await inviteUser.mutateAsync({ ...userData, role: selectedRole });
        if (result.emailSent === false) {
          toast({ 
            title: "Kasutaja loodud!", 
            description: `Kutse e-kirja ei saanud saata (domeeni pole verifitseeritud). Kasutaja saab sisse logida parooli taastamise kaudu.`,
          });
        } else {
          toast({ 
            title: "Kasutaja kutsutud!", 
            description: `Kutse saadetud aadressile ${userData.email}` 
          });
        }
      }
      setDialogOpen(false);
      setEditingUser(null);
      setSelectedRole("user");
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Viga",
        description: error.message || (editingUser
          ? "Kasutaja uuendamine ebaõnnestus"
          : "Kasutaja kutsumine ebaõnnestus"),
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
        title: user.is_active ? "Kasutaja deaktiveeritud" : "Kasutaja aktiveeritud",
      });
    } catch (error) {
      toast({
        title: "Viga",
        description: "Staatuse muutmine ebaõnnestus",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Kas oled kindel, et soovid selle kasutaja kustutada?")) return;

    try {
      await deleteUser.mutateAsync(id);
      toast({ title: "Kasutaja kustutatud!" });
    } catch (error) {
      toast({
        title: "Viga",
        description: "Kustutamine ebaõnnestus",
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
    return <div className="text-muted-foreground">Laadin kasutajaid...</div>;
  }

  const isSubmitting = inviteUser.isPending || updateUser.isPending;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Ettevõtte kasutajad</h2>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          if (!open) closeDialog();
          else setDialogOpen(true);
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => setEditingUser(null)}>
              <Plus className="h-4 w-4" />
              Lisa kasutaja
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingUser ? "Muuda kasutajat" : "Kutsu uus kasutaja"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Täisnimi</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  placeholder="Mart Tamm"
                  defaultValue={editingUser?.full_name || ""}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-posti aadress</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="mart.tamm@wihuri.ee"
                  defaultValue={editingUser?.email || ""}
                  required
                  disabled={isSubmitting || !!editingUser}
                />
                {!editingUser && (
                  <p className="text-sm text-muted-foreground">
                    Sellele aadressile saadetakse kutse parooliga sisselogimiseks
                  </p>
                )}
              </div>
              
              {!editingUser && (
                <div className="space-y-2">
                  <Label htmlFor="role">Roll</Label>
                  <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as AppRole)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Vali roll" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Kasutaja</SelectItem>
                      <SelectItem value="product_manager">Tootejuht</SelectItem>
                      <SelectItem value="admin">Administraator</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    {selectedRole === "admin" && "Täielik ligipääs, sh kasutajate haldus"}
                    {selectedRole === "product_manager" && "Tehnika ja müügiandmete muutmine"}
                    {selectedRole === "user" && "Põhiligipääs ja PDF-ide allalaadimine"}
                  </p>
                </div>
              )}
              
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={closeDialog} disabled={isSubmitting}>
                  Tühista
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {editingUser ? "Salvestab..." : "Saadab kutset..."}
                    </>
                  ) : (
                    <>
                      {!editingUser && <Mail className="mr-2 h-4 w-4" />}
                      {editingUser ? "Salvesta" : "Saada kutse"}
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
          <h3 className="mt-4 text-lg font-semibold">Kasutajaid pole lisatud</h3>
          <p className="mt-2 text-muted-foreground">
            Lisa esimene kasutaja, kes saab e-mailiga kutse
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nimi</TableHead>
                  <TableHead>E-post</TableHead>
                  <TableHead className="w-40">Roll</TableHead>
                  <TableHead className="w-24">Staatus</TableHead>
                  <TableHead className="w-32 text-right">Tegevused</TableHead>
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
                              toast({ title: "Roll uuendatud!" });
                            } catch {
                              toast({
                                title: "Viga",
                                description: "Rolli muutmine ebaõnnestus",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          <SelectTrigger className="h-8 w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">Kasutaja</SelectItem>
                            <SelectItem value="product_manager">Tootejuht</SelectItem>
                            <SelectItem value="admin">Administraator</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="outline" className="text-xs">Ootel</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={user.is_active}
                          onCheckedChange={() => handleToggleActive(user)}
                        />
                        <Badge variant={user.is_active ? "default" : "secondary"}>
                          {user.is_active ? "Aktiivne" : "Mitteaktiivne"}
                        </Badge>
                      </div>
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
                            toast({ title: "Roll uuendatud!" });
                          } catch {
                            toast({
                              title: "Viga",
                              description: "Rolli muutmine ebaõnnestus",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        <SelectTrigger className="h-7 text-xs w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">Kasutaja</SelectItem>
                          <SelectItem value="product_manager">Tootejuht</SelectItem>
                          <SelectItem value="admin">Administraator</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline" className="text-xs">Ootel</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Switch
                      checked={user.is_active}
                      onCheckedChange={() => handleToggleActive(user)}
                      className="scale-90"
                    />
                    <span className="text-xs text-muted-foreground">
                      {user.is_active ? "Aktiivne" : "Mitteakt."}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
