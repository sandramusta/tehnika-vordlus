import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  useEquipment,
  useBrands,
  usePowerClasses,
  useEquipmentTypes,
  useCompetitiveArguments,
  useCreateEquipment,
  useDeleteEquipment,
  useCreateArgument,
  useDeleteArgument,
} from "@/hooks/useEquipmentData";
import { Plus, Trash2, Tractor, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function Admin() {
  const { toast } = useToast();
  const [equipmentDialogOpen, setEquipmentDialogOpen] = useState(false);
  const [argumentDialogOpen, setArgumentDialogOpen] = useState(false);

  const { data: equipment = [] } = useEquipment();
  const { data: brands = [] } = useBrands();
  const { data: powerClasses = [] } = usePowerClasses();
  const { data: types = [] } = useEquipmentTypes();
  const { data: args = [] } = useCompetitiveArguments();

  const createEquipment = useCreateEquipment();
  const deleteEquipment = useDeleteEquipment();
  const createArgument = useCreateArgument();
  const deleteArgument = useDeleteArgument();

  const combineType = types.find((t) => t.name === "combine");

  const handleCreateEquipment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      await createEquipment.mutateAsync({
        equipment_type_id: formData.get("equipment_type_id") as string,
        brand_id: formData.get("brand_id") as string,
        power_class_id: formData.get("power_class_id") as string || null,
        model_name: formData.get("model_name") as string,
        engine_power_hp: Number(formData.get("engine_power_hp")) || null,
        grain_tank_liters: Number(formData.get("grain_tank_liters")) || null,
        header_width_m: Number(formData.get("header_width_m")) || null,
        weight_kg: Number(formData.get("weight_kg")) || null,
        fuel_consumption_lh: Number(formData.get("fuel_consumption_lh")) || null,
        price_eur: Number(formData.get("price_eur")) || null,
        annual_maintenance_eur: Number(formData.get("annual_maintenance_eur")) || null,
        expected_lifespan_years: Number(formData.get("expected_lifespan_years")) || 10,
        features: [],
        notes: formData.get("notes") as string || null,
      });
      setEquipmentDialogOpen(false);
      toast({ title: "Tehnika lisatud!" });
    } catch (error) {
      toast({ title: "Viga", description: "Tehnika lisamine ebaõnnestus", variant: "destructive" });
    }
  };

  const handleCreateArgument = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      await createArgument.mutateAsync({
        competitor_brand_id: formData.get("competitor_brand_id") as string,
        equipment_type_id: combineType?.id || "",
        argument_title: formData.get("argument_title") as string,
        argument_description: formData.get("argument_description") as string,
        category: formData.get("category") as string,
        sort_order: 0,
      });
      setArgumentDialogOpen(false);
      toast({ title: "Argument lisatud!" });
    } catch (error) {
      toast({ title: "Viga", description: "Argumendi lisamine ebaõnnestus", variant: "destructive" });
    }
  };

  const competitorBrands = brands.filter((b) => !b.is_primary);

  return (
    <Layout>
      <div className="space-y-8">
        <div className="rounded-xl bg-gradient-to-r from-primary to-primary/80 p-8 text-primary-foreground">
          <h1 className="text-3xl font-bold">Administreerimine</h1>
          <p className="mt-2 text-primary-foreground/80">
            Halda tehnikaid, võrdlusandmeid ja konkurentsieeliseid.
          </p>
        </div>

        <Tabs defaultValue="equipment" className="space-y-6">
          <TabsList>
            <TabsTrigger value="equipment" className="gap-2">
              <Tractor className="h-4 w-4" />
              Tehnika
            </TabsTrigger>
            <TabsTrigger value="arguments" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Argumendid
            </TabsTrigger>
          </TabsList>

          <TabsContent value="equipment" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Tehnika nimekiri</h2>
              <Dialog open={equipmentDialogOpen} onOpenChange={setEquipmentDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Lisa tehnika
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Lisa uus tehnika</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateEquipment} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="equipment_type_id">Tüüp</Label>
                        <Select name="equipment_type_id" defaultValue={combineType?.id}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {types.map((type) => (
                              <SelectItem key={type.id} value={type.id}>
                                {type.name_et}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="brand_id">Bränd</Label>
                        <Select name="brand_id" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Vali bränd" />
                          </SelectTrigger>
                          <SelectContent>
                            {brands.map((brand) => (
                              <SelectItem key={brand.id} value={brand.id}>
                                {brand.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="model_name">Mudeli nimi</Label>
                        <Input name="model_name" required placeholder="nt. S780" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="power_class_id">Jõuklass</Label>
                        <Select name="power_class_id">
                          <SelectTrigger>
                            <SelectValue placeholder="Vali jõuklass" />
                          </SelectTrigger>
                          <SelectContent>
                            {powerClasses.map((pc) => (
                              <SelectItem key={pc.id} value={pc.id}>
                                {pc.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="engine_power_hp">Võimsus (hj)</Label>
                        <Input name="engine_power_hp" type="number" placeholder="473" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="grain_tank_liters">Bunker (l)</Label>
                        <Input name="grain_tank_liters" type="number" placeholder="14100" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="header_width_m">Heedri laius (m)</Label>
                        <Input name="header_width_m" type="number" step="0.1" placeholder="10.7" />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="weight_kg">Kaal (kg)</Label>
                        <Input name="weight_kg" type="number" placeholder="18500" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fuel_consumption_lh">Kütusekulu (l/h)</Label>
                        <Input name="fuel_consumption_lh" type="number" step="0.1" placeholder="45" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="expected_lifespan_years">Eluiga (a)</Label>
                        <Input name="expected_lifespan_years" type="number" defaultValue={10} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="price_eur">Hind (€)</Label>
                        <Input name="price_eur" type="number" placeholder="450000" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="annual_maintenance_eur">Hooldus/aastas (€)</Label>
                        <Input name="annual_maintenance_eur" type="number" placeholder="12000" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Märkused</Label>
                      <Textarea name="notes" placeholder="Lisamärkused..." />
                    </div>

                    <Button type="submit" className="w-full" disabled={createEquipment.isPending}>
                      {createEquipment.isPending ? "Salvestan..." : "Salvesta"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="rounded-lg border border-border overflow-hidden">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Mudel</th>
                    <th>Bränd</th>
                    <th>Tüüp</th>
                    <th>Võimsus</th>
                    <th>Hind</th>
                    <th className="w-20">Tegevused</th>
                  </tr>
                </thead>
                <tbody>
                  {equipment.map((item) => (
                    <tr key={item.id}>
                      <td className="font-medium">{item.model_name}</td>
                      <td>
                        <Badge variant={item.brand?.is_primary ? "default" : "secondary"}>
                          {item.brand?.name}
                        </Badge>
                      </td>
                      <td>{item.equipment_type?.name_et}</td>
                      <td>{item.engine_power_hp ? `${item.engine_power_hp} hj` : "—"}</td>
                      <td>
                        {item.price_eur
                          ? new Intl.NumberFormat("et-EE", {
                              style: "currency",
                              currency: "EUR",
                              maximumFractionDigits: 0,
                            }).format(item.price_eur)
                          : "—"}
                      </td>
                      <td>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteEquipment.mutate(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {equipment.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center text-muted-foreground py-8">
                        Tehnikaid pole veel lisatud
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="arguments" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Konkurentsieelised</h2>
              <Dialog open={argumentDialogOpen} onOpenChange={setArgumentDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Lisa argument
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Lisa uus argument</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateArgument} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Konkurent</Label>
                      <Select name="competitor_brand_id" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Vali konkurent" />
                        </SelectTrigger>
                        <SelectContent>
                          {competitorBrands.map((brand) => (
                            <SelectItem key={brand.id} value={brand.id}>
                              {brand.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Kategooria</Label>
                      <Select name="category" defaultValue="general">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="technology">Tehnoloogia</SelectItem>
                          <SelectItem value="reliability">Töökindlus</SelectItem>
                          <SelectItem value="service">Teenindus</SelectItem>
                          <SelectItem value="efficiency">Efektiivsus</SelectItem>
                          <SelectItem value="value">Väärtus</SelectItem>
                          <SelectItem value="general">Üldine</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="argument_title">Pealkiri</Label>
                      <Input
                        name="argument_title"
                        required
                        placeholder="nt. Parem kütusesääst"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="argument_description">Kirjeldus</Label>
                      <Textarea
                        name="argument_description"
                        required
                        placeholder="Selgita, miks John Deere on selles aspektis parem..."
                        rows={4}
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={createArgument.isPending}>
                      {createArgument.isPending ? "Salvestan..." : "Salvesta"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {args.map((arg) => (
                <div
                  key={arg.id}
                  className="rounded-lg border border-border bg-card p-4 relative group"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => deleteArgument.mutate(arg.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                  <Badge variant="outline" className="mb-2">
                    vs {arg.competitor_brand?.name}
                  </Badge>
                  <h4 className="font-semibold mb-2">{arg.argument_title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {arg.argument_description}
                  </p>
                </div>
              ))}
              {args.length === 0 && (
                <div className="col-span-full text-center text-muted-foreground py-8">
                  Argumente pole veel lisatud
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
