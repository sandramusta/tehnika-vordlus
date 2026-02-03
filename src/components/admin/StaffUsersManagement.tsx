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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  useAllStaffUsers,
  useCreateStaffUser,
  useUpdateStaffUser,
  useDeleteStaffUser,
  type StaffUser,
} from "@/hooks/useStaffUsers";

export function StaffUsersManagement() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null);

  const { data: staffUsers = [], isLoading } = useAllStaffUsers();
  const createUser = useCreateStaffUser();
  const updateUser = useUpdateStaffUser();
  const deleteUser = useDeleteStaffUser();

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
        toast({ title: "Kasutaja uuendatud!" });
      } else {
        await createUser.mutateAsync(userData);
        toast({ title: "Kasutaja lisatud!" });
      }
      setDialogOpen(false);
      setEditingUser(null);
    } catch (error) {
      toast({
        title: "Viga",
        description: editingUser
          ? "Kasutaja uuendamine ebaõnnestus"
          : "Kasutaja lisamine ebaõnnestus",
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
  };

  if (isLoading) {
    return <div className="text-muted-foreground">Laadin kasutajaid...</div>;
  }

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
                {editingUser ? "Muuda kasutajat" : "Lisa uus kasutaja"}
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
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Tühista
                </Button>
                <Button type="submit">
                  {editingUser ? "Salvesta" : "Lisa"}
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
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nimi</TableHead>
                <TableHead>E-post</TableHead>
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
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(user)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(user.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
