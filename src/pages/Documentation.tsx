import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { useWorkDocumentation, useEquipment } from "@/hooks/useEquipmentData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, FileText, Clock, Fuel, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function Documentation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: docs = [], isLoading } = useWorkDocumentation();
  const { data: equipment = [] } = useEquipment();

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      const { error } = await supabase.from("work_documentation").insert({
        equipment_id: formData.get("equipment_id") as string,
        work_date: formData.get("work_date") as string,
        work_type: formData.get("work_type") as string,
        hours_worked: Number(formData.get("hours_worked")) || null,
        area_hectares: Number(formData.get("area_hectares")) || null,
        fuel_used_liters: Number(formData.get("fuel_used_liters")) || null,
        notes: formData.get("notes") as string || null,
      });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["work-documentation"] });
      setDialogOpen(false);
      toast({ title: "Töö dokumenteeritud!" });
    } catch (error) {
      toast({
        title: "Viga",
        description: "Dokumenteerimine ebaõnnestus",
        variant: "destructive",
      });
    }
  };

  const workTypes = [
    { value: "harvest", label: "Koristus" },
    { value: "transport", label: "Transport" },
    { value: "maintenance", label: "Hooldus" },
    { value: "repair", label: "Remont" },
    { value: "testing", label: "Testimine" },
    { value: "demo", label: "Demo" },
  ];

  return (
    <Layout>
      <div className="space-y-8">
        <div className="rounded-xl bg-gradient-to-r from-primary to-primary/80 p-8 text-primary-foreground">
          <h1 className="text-3xl font-bold">Tööde dokumentatsioon</h1>
          <p className="mt-2 text-primary-foreground/80">
            Dokumenteeri tehnika kasutust ja jälgi töötunde, kütusekulu ning koristatud
            pindala.
          </p>
        </div>

        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Tööde ajalugu</h2>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Lisa töö
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dokumenteeri töö</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label>Tehnika</Label>
                  <Select name="equipment_id" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Vali tehnika" />
                    </SelectTrigger>
                    <SelectContent>
                      {equipment.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.brand?.name} {item.model_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="work_date">Kuupäev</Label>
                    <Input
                      name="work_date"
                      type="date"
                      defaultValue={new Date().toISOString().split("T")[0]}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Töö tüüp</Label>
                    <Select name="work_type" defaultValue="harvest">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {workTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hours_worked">Töötunnid</Label>
                    <Input
                      name="hours_worked"
                      type="number"
                      step="0.5"
                      placeholder="8"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="area_hectares">Pindala (ha)</Label>
                    <Input
                      name="area_hectares"
                      type="number"
                      step="0.1"
                      placeholder="45.5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fuel_used_liters">Kütus (l)</Label>
                    <Input
                      name="fuel_used_liters"
                      type="number"
                      step="0.1"
                      placeholder="360"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Märkused</Label>
                  <Textarea name="notes" placeholder="Lisamärkused..." />
                </div>

                <Button type="submit" className="w-full">
                  Salvesta
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="text-muted-foreground">Laadin...</div>
          </div>
        ) : docs.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">
              Töid pole veel dokumenteeritud.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Alusta töö lisamisega.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {docs.map((doc) => (
              <div
                key={doc.id}
                className="rounded-lg border border-border bg-card p-5 space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">
                      {doc.equipment?.brand?.name} {doc.equipment?.model_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(doc.work_date).toLocaleDateString("et-EE", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {workTypes.find((t) => t.value === doc.work_type)?.label ||
                      doc.work_type}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="rounded-lg bg-muted/50 p-3">
                    <Clock className="mx-auto h-5 w-5 text-primary mb-1" />
                    <div className="text-lg font-semibold">
                      {doc.hours_worked || "—"}
                    </div>
                    <div className="text-xs text-muted-foreground">tundi</div>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <MapPin className="mx-auto h-5 w-5 text-primary mb-1" />
                    <div className="text-lg font-semibold">
                      {doc.area_hectares || "—"}
                    </div>
                    <div className="text-xs text-muted-foreground">ha</div>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <Fuel className="mx-auto h-5 w-5 text-primary mb-1" />
                    <div className="text-lg font-semibold">
                      {doc.fuel_used_liters || "—"}
                    </div>
                    <div className="text-xs text-muted-foreground">liitrit</div>
                  </div>
                </div>

                {doc.notes && (
                  <p className="text-sm text-muted-foreground border-t border-border pt-3">
                    {doc.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
