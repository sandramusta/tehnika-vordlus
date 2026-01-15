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
  useUpdateEquipment,
  useDeleteEquipment,
  useCreateArgument,
  useUpdateArgument,
  useDeleteArgument,
} from "@/hooks/useEquipmentData";
import { Plus, Trash2, Tractor, MessageSquare, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import type { Equipment, CompetitiveArgument } from "@/types/equipment";
import { ImageUpload } from "@/components/admin/ImageUpload";

export default function Admin() {
  const { toast } = useToast();
  const [equipmentDialogOpen, setEquipmentDialogOpen] = useState(false);
  const [argumentDialogOpen, setArgumentDialogOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [editingArgument, setEditingArgument] = useState<CompetitiveArgument | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [threshingImageUrl, setThreshingImageUrl] = useState<string>("");

  const { data: equipment = [] } = useEquipment();
  const { data: brands = [] } = useBrands();
  const { data: powerClasses = [] } = usePowerClasses();
  const { data: types = [] } = useEquipmentTypes();
  const { data: args = [] } = useCompetitiveArguments();

  const createEquipment = useCreateEquipment();
  const updateEquipment = useUpdateEquipment();
  const deleteEquipment = useDeleteEquipment();
  const createArgument = useCreateArgument();
  const updateArgument = useUpdateArgument();
  const deleteArgument = useDeleteArgument();

  const combineType = types.find((t) => t.name === "combine");

  const handleEquipmentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const equipmentData = {
      equipment_type_id: formData.get("equipment_type_id") as string,
      brand_id: formData.get("brand_id") as string,
      power_class_id: (formData.get("power_class_id") as string) || null,
      model_name: formData.get("model_name") as string,
      engine_power_hp: Number(formData.get("engine_power_hp")) || null,
      grain_tank_liters: Number(formData.get("grain_tank_liters")) || null,
      header_width_m: Number(formData.get("header_width_m")) || null,
      weight_kg: Number(formData.get("weight_kg")) || null,
      fuel_consumption_lh: Number(formData.get("fuel_consumption_lh")) || null,
      price_eur: Number(formData.get("price_eur")) || null,
      annual_maintenance_eur: Number(formData.get("annual_maintenance_eur")) || null,
      expected_lifespan_years: Number(formData.get("expected_lifespan_years")) || 10,
      notes: (formData.get("notes") as string) || null,
      image_url: imageUrl || null,
      threshing_system_image_url: threshingImageUrl || null,
      // Technical specs from brochures
      fuel_tank_liters: Number(formData.get("fuel_tank_liters")) || null,
      cleaning_area_m2: Number(formData.get("cleaning_area_m2")) || null,
      rotor_diameter_mm: Number(formData.get("rotor_diameter_mm")) || null,
      throughput_tons_h: Number(formData.get("throughput_tons_h")) || null,
      engine_displacement_liters: Number(formData.get("engine_displacement_liters")) || null,
    };

    try {
      if (editingEquipment) {
        await updateEquipment.mutateAsync({ id: editingEquipment.id, ...equipmentData });
        toast({ title: "Tehnika uuendatud!" });
      } else {
        await createEquipment.mutateAsync({ ...equipmentData, features: [] });
        toast({ title: "Tehnika lisatud!" });
      }
      setEquipmentDialogOpen(false);
      setEditingEquipment(null);
      setImageUrl("");
      setThreshingImageUrl("");
    } catch (error) {
      toast({
        title: "Viga",
        description: editingEquipment ? "Tehnika uuendamine ebaõnnestus" : "Tehnika lisamine ebaõnnestus",
        variant: "destructive",
      });
    }
  };

  const handleArgumentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const argumentData = {
      competitor_brand_id: formData.get("competitor_brand_id") as string,
      equipment_type_id: combineType?.id || "",
      argument_title: formData.get("argument_title") as string,
      argument_description: formData.get("argument_description") as string,
      category: formData.get("category") as string,
      sort_order: editingArgument?.sort_order ?? 0,
    };

    try {
      if (editingArgument) {
        await updateArgument.mutateAsync({ id: editingArgument.id, ...argumentData });
        toast({ title: "Argument uuendatud!" });
      } else {
        await createArgument.mutateAsync(argumentData);
        toast({ title: "Argument lisatud!" });
      }
      setArgumentDialogOpen(false);
      setEditingArgument(null);
    } catch (error) {
      toast({
        title: "Viga",
        description: editingArgument ? "Argumendi uuendamine ebaõnnestus" : "Argumendi lisamine ebaõnnestus",
        variant: "destructive",
      });
    }
  };

  const openEditEquipment = (item: Equipment) => {
    setEditingEquipment(item);
    setImageUrl(item.image_url || "");
    setThreshingImageUrl(item.threshing_system_image_url || "");
    setEquipmentDialogOpen(true);
  };

  const openEditArgument = (arg: CompetitiveArgument) => {
    setEditingArgument(arg);
    setArgumentDialogOpen(true);
  };

  const closeEquipmentDialog = () => {
    setEquipmentDialogOpen(false);
    setEditingEquipment(null);
    setImageUrl("");
    setThreshingImageUrl("");
  };

  const closeArgumentDialog = () => {
    setArgumentDialogOpen(false);
    setEditingArgument(null);
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
              <Dialog open={equipmentDialogOpen} onOpenChange={(open) => {
                if (!open) closeEquipmentDialog();
                else setEquipmentDialogOpen(true);
              }}>
                <DialogTrigger asChild>
                  <Button className="gap-2" onClick={() => setEditingEquipment(null)}>
                    <Plus className="h-4 w-4" />
                    Lisa tehnika
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingEquipment ? "Muuda tehnikat" : "Lisa uus tehnika"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleEquipmentSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="equipment_type_id">Tüüp</Label>
                        <Select
                          name="equipment_type_id"
                          defaultValue={editingEquipment?.equipment_type_id || combineType?.id}
                        >
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
                        <Select
                          name="brand_id"
                          required
                          defaultValue={editingEquipment?.brand_id}
                        >
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
                        <Input
                          name="model_name"
                          required
                          placeholder="nt. S780"
                          defaultValue={editingEquipment?.model_name}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="power_class_id">Jõuklass</Label>
                        <Select
                          name="power_class_id"
                          defaultValue={editingEquipment?.power_class_id || undefined}
                        >
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
                        <Input
                          name="engine_power_hp"
                          type="number"
                          placeholder="473"
                          defaultValue={editingEquipment?.engine_power_hp ?? ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="grain_tank_liters">Bunker (l)</Label>
                        <Input
                          name="grain_tank_liters"
                          type="number"
                          placeholder="14100"
                          defaultValue={editingEquipment?.grain_tank_liters ?? ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="header_width_m">Heedri laius (m)</Label>
                        <Input
                          name="header_width_m"
                          type="number"
                          step="0.1"
                          placeholder="10.7"
                          defaultValue={editingEquipment?.header_width_m ?? ""}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="weight_kg">Kaal (kg)</Label>
                        <Input
                          name="weight_kg"
                          type="number"
                          placeholder="18500"
                          defaultValue={editingEquipment?.weight_kg ?? ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fuel_consumption_lh">Kütusekulu (l/h)</Label>
                        <Input
                          name="fuel_consumption_lh"
                          type="number"
                          step="0.1"
                          placeholder="45"
                          defaultValue={editingEquipment?.fuel_consumption_lh ?? ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="expected_lifespan_years">Eluiga (a)</Label>
                        <Input
                          name="expected_lifespan_years"
                          type="number"
                          defaultValue={editingEquipment?.expected_lifespan_years ?? 10}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="price_eur">Hind (€)</Label>
                        <Input
                          name="price_eur"
                          type="number"
                          placeholder="450000"
                          defaultValue={editingEquipment?.price_eur ?? ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="annual_maintenance_eur">Hooldus/aastas (€)</Label>
                        <Input
                          name="annual_maintenance_eur"
                          type="number"
                          placeholder="12000"
                          defaultValue={editingEquipment?.annual_maintenance_eur ?? ""}
                        />
                      </div>
                    </div>

                    {/* New fields from brochures */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fuel_tank_liters">Kütusepaak (L)</Label>
                        <Input
                          name="fuel_tank_liters"
                          type="number"
                          placeholder="950"
                          defaultValue={editingEquipment?.fuel_tank_liters ?? ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cleaning_area_m2">Puhasti pindala (m²)</Label>
                        <Input
                          name="cleaning_area_m2"
                          type="number"
                          step="0.1"
                          placeholder="5.9"
                          defaultValue={editingEquipment?.cleaning_area_m2 ?? ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rotor_diameter_mm">Rootori läbimõõt (mm)</Label>
                        <Input
                          name="rotor_diameter_mm"
                          type="number"
                          placeholder="834"
                          defaultValue={editingEquipment?.rotor_diameter_mm ?? ""}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="throughput_tons_h">Läbilaskevõime (t/h)</Label>
                        <Input
                          name="throughput_tons_h"
                          type="number"
                          step="0.1"
                          placeholder="100"
                          defaultValue={editingEquipment?.throughput_tons_h ?? ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="engine_displacement_liters">Mootori töömaht (L)</Label>
                        <Input
                          name="engine_displacement_liters"
                          type="number"
                          step="0.1"
                          placeholder="13.6"
                          defaultValue={editingEquipment?.engine_displacement_liters ?? ""}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <ImageUpload
                        name="image_url"
                        label="Toote pilt"
                        currentImageUrl={editingEquipment?.image_url}
                        onImageUploaded={setImageUrl}
                        folder="equipment"
                      />
                      <ImageUpload
                        name="threshing_system_image_url"
                        label="Peksusüsteemi pilt"
                        currentImageUrl={editingEquipment?.threshing_system_image_url}
                        onImageUploaded={setThreshingImageUrl}
                        folder="threshing"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Märkused</Label>
                      <Textarea
                        name="notes"
                        placeholder="Lisamärkused..."
                        defaultValue={editingEquipment?.notes ?? ""}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={createEquipment.isPending || updateEquipment.isPending}
                    >
                      {createEquipment.isPending || updateEquipment.isPending
                        ? "Salvestan..."
                        : "Salvesta"}
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
                    <th className="w-28">Tegevused</th>
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
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditEquipment(item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteEquipment.mutate(item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
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
              <Dialog open={argumentDialogOpen} onOpenChange={(open) => {
                if (!open) closeArgumentDialog();
                else setArgumentDialogOpen(true);
              }}>
                <DialogTrigger asChild>
                  <Button className="gap-2" onClick={() => setEditingArgument(null)}>
                    <Plus className="h-4 w-4" />
                    Lisa argument
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingArgument ? "Muuda argumenti" : "Lisa uus argument"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleArgumentSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Konkurent</Label>
                      <Select
                        name="competitor_brand_id"
                        required
                        defaultValue={editingArgument?.competitor_brand_id}
                      >
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
                      <Select
                        name="category"
                        defaultValue={editingArgument?.category || "general"}
                      >
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
                        defaultValue={editingArgument?.argument_title}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="argument_description">Kirjeldus</Label>
                      <Textarea
                        name="argument_description"
                        required
                        placeholder="Selgita, miks John Deere on selles aspektis parem..."
                        rows={4}
                        defaultValue={editingArgument?.argument_description}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={createArgument.isPending || updateArgument.isPending}
                    >
                      {createArgument.isPending || updateArgument.isPending
                        ? "Salvestan..."
                        : "Salvesta"}
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
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditArgument(arg)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteArgument.mutate(arg.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
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
